import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';
import { Dumbbell, Trophy, Flame, Users, Target, Clock, Zap } from 'lucide-react';
import './Profile.css';

const goalMap = { strength: '💪 Strength', muscle: '🏋️ Muscle', endurance: '🏃 Endurance', weight_loss: '🔥 Fat Loss', general: '⚡ General' };

export default function Profile() {
  const { username } = useParams();
  const { user: me, updateUser } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const targetUsername = username || me?.username;
  const isOwn = targetUsername === me?.username;

  useEffect(() => {
    if (!targetUsername) return;
    setLoading(true);
    api.get(`/users/${targetUsername}`).then(res => {
      setProfile(res.data.user);
      setWorkouts(res.data.workouts || []);
      setIsFollowing(res.data.user.followers?.some(f => f._id === me?._id || f === me?._id));
      setEditForm({ name: res.data.user.name, bio: res.data.user.bio, fitnessGoal: res.data.user.fitnessGoal });
    }).catch(() => toast.error('Profile not found'))
      .finally(() => setLoading(false));
  }, [targetUsername]);

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      await api.post(`/users/${profile._id}/follow`);
      setIsFollowing(f => !f);
      setProfile(p => ({
        ...p,
        followers: isFollowing
          ? p.followers.filter(f => f._id !== me._id)
          : [...p.followers, { _id: me._id, name: me.name, username: me.username }]
      }));
    } catch (err) { toast.error('Failed to update follow status'); }
    finally { setFollowLoading(false); }
  };

  const handleSaveProfile = async () => {
    try {
      const res = await api.patch('/users/me', editForm);
      setProfile(p => ({ ...p, ...res.data.user }));
      updateUser(res.data.user);
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) { toast.error('Failed to update profile'); }
  };

  if (loading) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  );

  if (!profile) return (
    <div className="page"><div className="page-content"><p>Profile not found.</p></div></div>
  );

  const initials = profile.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const totalVolume = workouts.reduce((s, w) => s + (w.totalVolume || 0), 0);

  return (
    <div className="page">
      <div className="page-content">
        {/* Hero */}
        <div className="profile-hero">
          <div className="profile-bg-glow" />
          <div className="profile-top">
            <div className="avatar avatar-xl" style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '4px solid var(--accent)', fontSize: '32px' }}>
              {initials}
            </div>
            <div className="profile-info">
              <h1 className="profile-name">{profile.name}</h1>
              <p className="profile-handle">@{profile.username}</p>
              {profile.bio && <p className="profile-bio">{profile.bio}</p>}
              <div className="profile-goal">
                <Target size={13} />
                <span>{goalMap[profile.fitnessGoal] || 'General Fitness'}</span>
              </div>
            </div>
            <div className="profile-actions">
              {isOwn ? (
                <button className="btn btn-secondary" onClick={() => setEditing(true)}>Edit Profile</button>
              ) : (
                <button
                  className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={handleFollow}
                  disabled={followLoading}
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </button>
              )}
            </div>
          </div>

          {/* Profile stats */}
          <div className="profile-stats">
            {[
              { label: 'Workouts', value: profile.totalWorkouts || workouts.length, icon: <Dumbbell size={16} /> },
              { label: 'Following', value: profile.following?.length || 0, icon: <Users size={16} /> },
              { label: 'Followers', value: profile.followers?.length || 0, icon: <Users size={16} /> },
              { label: 'Total Volume', value: `${Math.round(totalVolume / 1000 * 10) / 10}t`, icon: <Zap size={16} /> },
              { label: 'Best Streak', value: `${profile.longestStreak || 0}d`, icon: <Flame size={16} /> },
              { label: 'PRs', value: profile.personalRecords?.length || 0, icon: <Trophy size={16} /> },
            ].map((s, i) => (
              <div key={i} className="profile-stat">
                <div className="profile-stat-icon">{s.icon}</div>
                <div className="profile-stat-val">{s.value}</div>
                <div className="profile-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Workouts */}
        <div className="profile-section">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--text-primary)', marginBottom: '16px' }}>
            Recent Workouts
          </h2>
          {workouts.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <Dumbbell size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <p>No public workouts yet.</p>
            </div>
          ) : (
            <div className="profile-workouts">
              {workouts.map(w => (
                <div key={w._id} className="profile-workout-card">
                  <div className="profile-workout-header">
                    <h3 className="profile-workout-title">{w.title}</h3>
                    <span className="profile-workout-date">{new Date(w.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  <div className="profile-workout-meta">
                    <span><Dumbbell size={12} /> {w.exercises?.length || 0} exercises</span>
                    {w.totalVolume > 0 && <span><Zap size={12} /> {w.totalVolume.toLocaleString()}kg</span>}
                    {w.duration > 0 && <span><Clock size={12} /> {w.duration}m</span>}
                    {w.personalRecordsCount > 0 && <span className="pr-badge"><Trophy size={12} /> {w.personalRecordsCount} PR</span>}
                  </div>
                  <div className="profile-workout-exercises">
                    {w.exercises?.slice(0, 5).map((ex, i) => (
                      <span key={i} className="ex-chip">{ex.exerciseName}</span>
                    ))}
                    {w.exercises?.length > 5 && <span className="ex-chip more">+{w.exercises.length - 5}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Personal Records */}
        {profile.personalRecords?.length > 0 && (
          <div className="profile-section">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--text-primary)', marginBottom: '16px' }}>
              🏆 Personal Records
            </h2>
            <div className="grid-3">
              {profile.personalRecords.map((pr, i) => (
                <div key={i} className="pr-card">
                  <div className="pr-card-exercise">{pr.exercise}</div>
                  <div className="pr-card-weight">{pr.weight}<span>kg</span></div>
                  <div className="pr-card-reps">{pr.reps} reps</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--text-primary)' }}>Edit Profile</h3>
              <button onClick={() => setEditing(false)} className="btn btn-ghost btn-sm">✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Full Name</label>
                <input value={editForm.name || ''} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea value={editForm.bio || ''} onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))} rows={3} placeholder="Tell the community about yourself..." />
              </div>
              <div className="form-group">
                <label>Fitness Goal</label>
                <select value={editForm.fitnessGoal || 'general'} onChange={e => setEditForm(p => ({ ...p, fitnessGoal: e.target.value }))}>
                  {Object.entries(goalMap).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSaveProfile}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
