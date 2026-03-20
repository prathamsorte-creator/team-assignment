const express = require('express');
const Workout = require('../models/Workout');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /api/workouts - Log a new workout
router.post('/', protect, async (req, res) => {
  try {
    const { title, exercises, duration, notes, isPublic } = req.body;

    const workout = await Workout.create({
      user: req.user._id,
      title: title || `Workout - ${new Date().toLocaleDateString()}`,
      exercises,
      duration,
      notes,
      isPublic: isPublic !== undefined ? isPublic : true,
    });

    // Check for personal records
    const user = await User.findById(req.user._id);
    let newPRs = [];

    for (const ex of exercises) {
      const maxWeight = Math.max(
        ...ex.sets.map((s) => (s.weight || 0) * (s.reps || 1)),
        0
      );
      if (maxWeight > 0) {
        const existingPR = user.personalRecords.find(
          (pr) => pr.exercise === ex.exerciseName
        );
        if (!existingPR || existingPR.weight * existingPR.reps < maxWeight) {
          const bestSet = ex.sets.reduce((best, s) =>
            (s.weight || 0) * (s.reps || 1) > (best.weight || 0) * (best.reps || 1) ? s : best
          );
          if (existingPR) {
            existingPR.weight = bestSet.weight;
            existingPR.reps = bestSet.reps;
            existingPR.date = new Date();
          } else {
            user.personalRecords.push({
              exercise: ex.exerciseName,
              weight: bestSet.weight,
              reps: bestSet.reps,
              date: new Date(),
            });
          }
          newPRs.push(ex.exerciseName);
        }
      }
    }

    // Update streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastDate = user.lastWorkoutDate ? new Date(user.lastWorkoutDate) : null;
    if (lastDate) lastDate.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (!lastDate || lastDate < yesterday) {
      user.currentStreak = 1;
    } else if (lastDate.getTime() === yesterday.getTime()) {
      user.currentStreak += 1;
    }
    // Same day - don't change streak

    if (user.currentStreak > user.longestStreak) {
      user.longestStreak = user.currentStreak;
    }

    user.totalWorkouts += 1;
    user.lastWorkoutDate = new Date();
    await user.save();

    const populatedWorkout = await Workout.findById(workout._id).populate('user', 'name username avatar');

    res.status(201).json({ workout: populatedWorkout, newPRs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/workouts/my - Get user's workouts
router.get('/my', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const workouts = await Workout.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'name username avatar');

    const total = await Workout.countDocuments({ user: req.user._id });

    res.json({ workouts, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/workouts/stats - Get user stats
router.get('/stats', protect, async (req, res) => {
  try {
    const workouts = await Workout.find({ user: req.user._id });

    const totalVolume = workouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);
    const totalDuration = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);

    // Volume per week for the last 8 weeks
    const now = new Date();
    const weeklyVolume = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - i * 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const weekWorkouts = workouts.filter(
        (w) => new Date(w.createdAt) >= weekStart && new Date(w.createdAt) < weekEnd
      );
      const vol = weekWorkouts.reduce((s, w) => s + (w.totalVolume || 0), 0);
      weeklyVolume.push({
        week: `W${8 - i}`,
        volume: vol,
        workouts: weekWorkouts.length,
      });
    }

    res.json({
      totalWorkouts: workouts.length,
      totalVolume,
      totalDuration,
      weeklyVolume,
      personalRecords: req.user.personalRecords,
      currentStreak: req.user.currentStreak,
      longestStreak: req.user.longestStreak,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/workouts/:id - Get single workout
router.get('/:id', protect, async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id).populate('user', 'name username avatar');
    if (!workout) return res.status(404).json({ message: 'Workout not found' });
    res.json({ workout });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/workouts/:id/like - Like/unlike a workout
router.post('/:id/like', protect, async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);
    if (!workout) return res.status(404).json({ message: 'Workout not found' });

    const alreadyLiked = workout.likes.includes(req.user._id);
    if (alreadyLiked) {
      workout.likes = workout.likes.filter((id) => id.toString() !== req.user._id.toString());
    } else {
      workout.likes.push(req.user._id);
    }
    await workout.save();

    res.json({ likes: workout.likes.length, liked: !alreadyLiked });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/workouts/:id/comment
router.post('/:id/comment', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Comment text required' });

    const workout = await Workout.findById(req.params.id);
    if (!workout) return res.status(404).json({ message: 'Workout not found' });

    workout.comments.push({
      user: req.user._id,
      username: req.user.username,
      text,
    });
    await workout.save();

    res.json({ comments: workout.comments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/workouts/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);
    if (!workout) return res.status(404).json({ message: 'Workout not found' });
    if (workout.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await workout.deleteOne();
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalWorkouts: -1 } });
    res.json({ message: 'Workout deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
