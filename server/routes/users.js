const express = require('express');
const User = require('../models/User');
const Workout = require('../models/Workout');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/search
router.get('/search', protect, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ users: [] });

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
      ],
      _id: { $ne: req.user._id },
    }).select('name username avatar fitnessGoal totalWorkouts followers').limit(10);

    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/:username
router.get('/:username', protect, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password')
      .populate('following', 'name username avatar')
      .populate('followers', 'name username avatar');

    if (!user) return res.status(404).json({ message: 'User not found' });

    const workouts = await Workout.find({ user: user._id, isPublic: true })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ user, workouts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users/:id/follow
router.post('/:id/follow', protect, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "You can't follow yourself" });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    const isFollowing = req.user.following.includes(req.params.id);

    if (isFollowing) {
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: req.params.id } });
      await User.findByIdAndUpdate(req.params.id, { $pull: { followers: req.user._id } });
    } else {
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { following: req.params.id } });
      await User.findByIdAndUpdate(req.params.id, { $addToSet: { followers: req.user._id } });
    }

    res.json({ following: !isFollowing });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/users/me
router.patch('/me', protect, async (req, res) => {
  try {
    const allowedUpdates = ['name', 'bio', 'fitnessGoal', 'avatar'];
    const updates = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
