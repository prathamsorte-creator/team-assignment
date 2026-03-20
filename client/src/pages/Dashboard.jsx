import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import {
  Dumbbell, TrendingUp, Flame, Trophy, Plus, Clock, Target, Zap, Award
} from 'lucide-react';
import './Dashboard.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px' }}>{label}</p>
        <p style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '14px' }}>{payload[0].value?.toLocaleString()} kg</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/workouts/stats'),
      api.get('/workouts/my?limit=5'),
    ]).then(([statsRes, workoutsRes]) => {
      setStats(statsRes.data);
      setRecentWorkouts(workoutsRes.data.workouts || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  const goalMap = { strength: 'Strength', muscle: 'Muscle Building', endurance: 'Endurance', weight_loss: 'Fat Loss', general: 'General Fitness' };

  if (loading) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  );

  const statCards = [
    { label: 'Total Workouts', value: stats?.totalWorkouts || 0, icon: <Dumbbell size={20} />, color: 'var(--accent)' },
    { label: 'Total Volume', value: `${((stats?.totalVolume || 0) / 1000).toFixed(1)}t`, icon: <TrendingUp size={20} />, color: 'var(--blue)' },
    { label: 'Current Streak', value: `${stats?.currentStreak || 0}d`, icon: <Flame size={20} />, color: 'var(--gold)' },
    { label: 'Personal Records', value: stats?.personalRecords?.length || 0, icon: <Trophy size={20} />, color: 'var(--green)' },
  ];

  return (
    <div className="page">
      <div className="page-content">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="page-title">DASHBOARD</h1>
            <p className="page-subtitle">Your fitness command center</p>
          </div>
          <Link to="/log" className="btn btn-primary btn-lg">
            <Plus size={18} />
            Log Workout
          </Link>
        </div>

        {/* Hero card */}
        <div className="dashboard-hero">
          <div className="hero-user">
            <div className="avatar avatar-xl" style={{ background: 'var(--accent-dim)', color: 'var(--accent)', fontSize: '32px', border: '3px solid var(--accent)' }}>
              {initials}
            </div>
            <div>
              <h2 className="hero-name">{user?.name}</h2>
              <p className="hero-handle">@{user?.username}</p>
              <div className="hero-goal">
                <Target size={13} />
                <span>{goalMap[user?.fitnessGoal] || 'General Fitness'}</span>
              </div>
            </div>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-val">{user?.following?.length || 0}</span>
              <span className="hero-stat-label">Following</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-val">{user?.followers?.length || 0}</span>
              <span className="hero-stat-label">Followers</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-val">{stats?.longestStreak || 0}d</span>
              <span className="hero-stat-label">Best Streak</span>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid-4" style={{ marginBottom: '24px' }}>
          {statCards.map((s, i) => (
            <div key={i} className="stat-card" style={{ animationDelay: `${i * 60}ms`, animation: 'fadeIn 0.4s ease forwards', opacity: 0 }}>
              <div className="stat-card-icon" style={{ color: s.color, background: s.color + '22' }}>
                {s.icon}
              </div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="dashboard-charts">
          {/* Volume chart */}
          <div className="card" style={{ flex: 2 }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', color: 'var(--text-primary)' }}>Volume Over Time</h3>
              <span className="badge badge-accent"><Zap size={11} /> Weekly</span>
            </div>
            {stats?.weeklyVolume?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={stats.weeklyVolume}>
                  <defs>
                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="week" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="volume" stroke="var(--accent)" strokeWidth={2} fill="url(#volGrad)" dot={{ fill: 'var(--accent)', r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">
                <TrendingUp size={32} color="var(--text-muted)" />
                <p>Log workouts to see your volume chart</p>
              </div>
            )}
          </div>

          {/* Weekly workouts bar */}
          <div className="card" style={{ flex: 1 }}>
            <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '20px' }}>Workouts / Week</h3>
            {stats?.weeklyVolume?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.weeklyVolume} barSize={20}>
                  <XAxis dataKey="week" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                  <Bar dataKey="workouts" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">
                <Dumbbell size={32} color="var(--text-muted)" />
                <p>No data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom row */}
        <div className="dashboard-bottom">
          {/* Recent workouts */}
          <div className="card" style={{ flex: 2 }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', color: 'var(--text-primary)' }}>Recent Workouts</h3>
              <Link to="/feed" className="btn btn-ghost btn-sm">View all →</Link>
            </div>
            {recentWorkouts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <Dumbbell size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                <p style={{ marginBottom: '16px' }}>No workouts yet. Start your journey!</p>
                <Link to="/log" className="btn btn-primary">Log First Workout</Link>
              </div>
            ) : (
              <div className="recent-list">
                {recentWorkouts.map(w => (
                  <div key={w._id} className="recent-item">
                    <div className="recent-icon">
                      <Dumbbell size={16} />
                    </div>
                    <div className="recent-info">
                      <span className="recent-title">{w.title}</span>
                      <span className="recent-meta">
                        {w.exercises?.length || 0} exercises · {w.totalVolume ? `${w.totalVolume}kg total` : ''}
                      </span>
                    </div>
                    <div className="recent-right">
                      <div className="flex gap-2 items-center">
                        {w.duration > 0 && <span className="recent-tag"><Clock size={10} /> {w.duration}m</span>}
                        {w.personalRecordsCount > 0 && <span className="recent-tag pr"><Trophy size={10} /> {w.personalRecordsCount} PR</span>}
                      </div>
                      <span className="recent-date">{new Date(w.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PRs */}
          <div className="card" style={{ flex: 1 }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', color: 'var(--text-primary)' }}>Personal Records</h3>
              <Award size={18} color="var(--gold)" />
            </div>
            {!stats?.personalRecords?.length ? (
              <div style={{ textAlign: 'center', padding: '32px 20px' }}>
                <Trophy size={32} color="var(--text-muted)" style={{ margin: '0 auto 10px' }} />
                <p style={{ fontSize: '13px' }}>Break some records!</p>
              </div>
            ) : (
              <div className="pr-list">
                {stats.personalRecords.slice(0, 6).map((pr, i) => (
                  <div key={i} className="pr-item">
                    <div>
                      <div className="pr-exercise">{pr.exercise}</div>
                      <div className="pr-date">{new Date(pr.date).toLocaleDateString()}</div>
                    </div>
                    <div className="pr-weight">
                      <span>{pr.weight}kg</span>
                      <span className="pr-reps">×{pr.reps}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
