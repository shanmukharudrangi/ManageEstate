import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import Icon from '../components/Icon';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function isPast(d) {
  return new Date(d) < new Date();
}

const BAR_COLORS = ['var(--accent)', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Voting({ currentUser, onLogout, onNotify, theme, onToggleTheme }) {
  const navigate = useNavigate();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [voting, setVoting] = useState(null);
  const [form, setForm] = useState({
    question: '',
    description: '',
    options: ['', ''],
    deadline: '',
    isAnonymous: false,
  });

  useEffect(() => { loadPolls(); }, []);

  async function loadPolls() {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/polls`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPolls(data);
    } catch (err) {
      onNotify({ title: 'Failed to load polls', message: err.message, tone: 'danger' });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    const validOptions = form.options.filter((o) => o.trim());
    if (validOptions.length < 2) {
      onNotify({ title: 'Need at least 2 options', message: 'Fill in at least 2 option fields.', tone: 'danger' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/polls`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ...form, options: validOptions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onNotify({ title: 'Poll created', message: 'Residents can now vote.', tone: 'success' });
      setShowCreateForm(false);
      setForm({ question: '', description: '', options: ['', ''], deadline: '', isAnonymous: false });
      await loadPolls();
    } catch (err) {
      onNotify({ title: 'Error', message: err.message, tone: 'danger' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVote(pollId, optionIndex) {
    setVoting(pollId);
    try {
      const res = await fetch(`${API_BASE}/polls/${pollId}/vote`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ optionIndex }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onNotify({ title: 'Vote recorded!', message: 'Your vote has been submitted.', tone: 'success' });
      await loadPolls();
    } catch (err) {
      onNotify({ title: 'Could not vote', message: err.message, tone: 'danger' });
    } finally {
      setVoting(null);
    }
  }

  async function handleClose(pollId) {
    try {
      const res = await fetch(`${API_BASE}/polls/${pollId}/close`, { method: 'PUT', headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onNotify({ title: 'Poll closed', message: 'Voting has ended.', tone: 'info' });
      await loadPolls();
    } catch (err) {
      onNotify({ title: 'Error', message: err.message, tone: 'danger' });
    }
  }

  async function handleDelete(pollId) {
    if (!window.confirm('Delete this poll permanently?')) return;
    try {
      const res = await fetch(`${API_BASE}/polls/${pollId}`, { method: 'DELETE', headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onNotify({ title: 'Poll deleted', message: '', tone: 'info' });
      setPolls((p) => p.filter((x) => x._id !== pollId));
    } catch (err) {
      onNotify({ title: 'Error', message: err.message, tone: 'danger' });
    }
  }

  const active = polls.filter((p) => p.status === 'Active').length;
  const closed = polls.filter((p) => p.status === 'Closed').length;
  const voted = polls.filter((p) => p.hasVoted).length;

  const updateOption = (i, val) => {
    const next = [...form.options];
    next[i] = val;
    setForm((f) => ({ ...f, options: next }));
  };

  return (
    <div className="dashboard-shell">
      <div className="page-aurora" />
      <header className="dashboard-topbar">
        <BrandLogo compact />
        <div className="dashboard-actions">
          <button type="button" className="button-secondary" onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}>
            <Icon name="chart" size={18} />
            <span>Dashboard</span>
          </button>
          <button type="button" className="button-secondary" onClick={() => navigate('/announcements')}>
            <Icon name="bell" size={18} />
            <span>Notices</span>
          </button>
          <button type="button" className="button-secondary" onClick={() => navigate('/payments')}>
            <Icon name="wallet" size={18} />
            <span>Payments</span>
          </button>
          {!isAdmin && (
            <button type="button" className="button-secondary" onClick={() => navigate('/complaints')}>
              <Icon name="alert" size={18} />
              <span>Complaints</span>
            </button>
          )}
          <button type="button" className="theme-toggle" onClick={onToggleTheme}>
            <Icon name={theme === 'light' ? 'moon' : 'sun'} size={18} />
            <span>{theme === 'light' ? 'Dark theme' : 'Light theme'}</span>
          </button>
          <button type="button" className="button-secondary" onClick={() => { onLogout(); navigate('/'); }}>
            <Icon name="logout" size={18} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="hero-banner glass-panel">
          <div>
            <div className="eyebrow-pill">
              <Icon name="spark" size={16} />
              <span>Society Democracy</span>
            </div>
            <h1 className="dashboard-title">Community Voting</h1>
            <p className="dashboard-subtitle">Vote on society decisions transparently and anonymously.</p>
          </div>
          {isAdmin && (
            <div className="hero-meta">
              <button type="button" className="button-primary" onClick={() => setShowCreateForm((v) => !v)}>
                <Icon name="plus" size={16} />
                <span>{showCreateForm ? 'Cancel' : 'Create Poll'}</span>
              </button>
            </div>
          )}
        </section>

        <section className="summary-grid">
          {[
            { label: 'Active Polls', value: active, icon: 'spark', color: 'var(--success)' },
            { label: 'Closed Polls', value: closed, icon: 'chart', color: 'var(--text-soft)' },
            { label: 'Your Votes Cast', value: voted, icon: 'check', color: 'var(--accent)' },
            { label: 'Total Polls', value: polls.length, icon: 'list', color: 'var(--warning)' },
          ].map((m) => (
            <article key={m.label} className="metric-card">
              <div className="metric-icon" style={{ background: `color-mix(in srgb, ${m.color} 15%, transparent)`, color: m.color }}>
                <Icon name={m.icon} size={20} />
              </div>
              <div>
                <div className="metric-value">{m.value}</div>
                <div className="metric-label">{m.label}</div>
              </div>
            </article>
          ))}
        </section>

        {showCreateForm && isAdmin && (
          <section className="glass-panel section-card">
            <h2 className="section-title" style={{ marginBottom: '1.5rem' }}>Create New Poll</h2>
            <form onSubmit={handleCreate}>
              <div className="field-block">
                <label className="field-label">Question *</label>
                <input className="field-input" required placeholder="e.g. Should we install solar panels?" value={form.question} onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))} />
              </div>
              <div className="field-block">
                <label className="field-label">Description (optional)</label>
                <textarea className="field-input" rows={2} placeholder="Additional context for voters…" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} />
              </div>
              <div className="field-block">
                <label className="field-label">Options (min 2, max 6)</label>
                {form.options.map((opt, i) => (
                  <input key={i} className="field-input" style={{ marginBottom: '0.5rem' }} placeholder={`Option ${i + 1}`} value={opt} onChange={(e) => updateOption(i, e.target.value)} />
                ))}
                {form.options.length < 6 && (
                  <button type="button" className="button-secondary" style={{ marginTop: '0.25rem' }} onClick={() => setForm((f) => ({ ...f, options: [...f.options, ''] }))}>
                    + Add Option
                  </button>
                )}
              </div>
              <div className="field-block">
                <label className="field-label">Voting Deadline *</label>
                <input className="field-input" type="date" required value={form.deadline} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
              </div>
              <div className="field-block" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <input type="checkbox" id="anon" checked={form.isAnonymous} onChange={(e) => setForm((f) => ({ ...f, isAnonymous: e.target.checked }))} style={{ width: 16, height: 16 }} />
                <label htmlFor="anon" className="field-label" style={{ margin: 0, cursor: 'pointer' }}>Anonymous voting (hide who voted for what)</label>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="submit" className="button-primary" disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create Poll'}
                </button>
                <button type="button" className="button-secondary" onClick={() => setShowCreateForm(false)}>Cancel</button>
              </div>
            </form>
          </section>
        )}

        <section className="section-card">
          <h2 className="section-title" style={{ marginBottom: '1.25rem' }}>All Polls</h2>
          {loading ? (
            <div className="empty-state"><div className="spinner-ring" /></div>
          ) : polls.length === 0 ? (
            <div className="empty-state">
              <Icon name="spark" size={36} />
              <p>No polls yet.{isAdmin ? ' Create the first one above.' : ''}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {polls.map((poll) => {
                const closed = poll.status === 'Closed' || isPast(poll.deadline);
                const canVote = !closed && !poll.hasVoted && !isAdmin;
                return (
                  <div key={poll._id} className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>{poll.question}</h3>
                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, background: poll.status === 'Active' && !isPast(poll.deadline) ? 'color-mix(in srgb, var(--success) 15%, transparent)' : 'color-mix(in srgb, var(--text-soft) 15%, transparent)', color: poll.status === 'Active' && !isPast(poll.deadline) ? 'var(--success)' : 'var(--text-soft)' }}>
                          {poll.status === 'Active' && !isPast(poll.deadline) ? 'Active' : 'Closed'}
                        </span>
                        {poll.isAnonymous && (
                          <span style={{ padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}>Anonymous</span>
                        )}
                      </div>
                      {isAdmin && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {poll.status === 'Active' && !isPast(poll.deadline) && (
                            <button className="button-secondary" style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem' }} onClick={() => handleClose(poll._id)}>Close Poll</button>
                          )}
                          <button className="button-secondary" style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem', color: 'var(--danger, #ef4444)' }} onClick={() => handleDelete(poll._id)}>Delete</button>
                        </div>
                      )}
                    </div>
                    {poll.description && <p style={{ color: 'var(--text-soft)', fontSize: '0.88rem', marginBottom: '0.6rem' }}>{poll.description}</p>}
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-soft)', marginBottom: '1rem' }}>
                      {isPast(poll.deadline) ? `Voting ended ${fmtDate(poll.deadline)}` : `Voting ends: ${fmtDate(poll.deadline)}`}
                      {' · '}{poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {poll.options.map((opt, i) => (
                        <div key={i}>
                          {canVote ? (
                            <button
                              type="button"
                              disabled={voting === poll._id}
                              onClick={() => handleVote(poll._id, i)}
                              style={{ width: '100%', textAlign: 'left', background: 'color-mix(in srgb, var(--accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)', borderRadius: 10, padding: '0.55rem 0.9rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)', transition: 'background 0.15s' }}
                            >
                              {opt.text}
                            </button>
                          ) : (
                            <div style={{ marginBottom: '0.1rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '0.25rem' }}>
                                <span style={{ fontWeight: opt.votedByMe ? 700 : 500, color: opt.votedByMe ? 'var(--accent)' : 'var(--text)' }}>
                                  {opt.votedByMe ? '✓ ' : ''}{opt.text}
                                </span>
                                <span style={{ color: 'var(--text-soft)', fontWeight: 600 }}>{opt.percentage}% ({opt.voteCount})</span>
                              </div>
                              <div style={{ height: 8, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', borderRadius: 999, width: `${opt.percentage}%`, background: BAR_COLORS[i % BAR_COLORS.length], transition: 'width 0.4s' }} />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {poll.hasVoted && !canVote && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--success)', marginTop: '0.6rem', fontWeight: 600 }}>✓ You voted</p>
                    )}
                    {!poll.hasVoted && closed && !isAdmin && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-soft)', marginTop: '0.6rem' }}>Voting closed — you did not vote.</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
