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
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysAgo(d) {
  const diff = (Date.now() - new Date(d)) / (1000 * 60 * 60 * 24);
  if (diff < 1) return 'Today';
  if (diff < 2) return 'Yesterday';
  return `${Math.floor(diff)}d ago`;
}

const CATEGORY_COLORS = {
  Emergency: { bg: 'color-mix(in srgb, #ef4444 14%, transparent)', text: '#ef4444' },
  Meeting: { bg: 'color-mix(in srgb, #3b82f6 14%, transparent)', text: '#3b82f6' },
  Maintenance: { bg: 'color-mix(in srgb, #f59e0b 14%, transparent)', text: '#f59e0b' },
  Event: { bg: 'color-mix(in srgb, #22c55e 14%, transparent)', text: '#22c55e' },
  General: { bg: 'color-mix(in srgb, var(--text-soft) 14%, transparent)', text: 'var(--text-soft)' },
};

const CATEGORIES = ['General', 'Maintenance', 'Meeting', 'Emergency', 'Event'];

function CategoryBadge({ category }) {
  const c = CATEGORY_COLORS[category] || CATEGORY_COLORS.General;
  return (
    <span style={{ padding: '0.2rem 0.65rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, background: c.bg, color: c.text, border: `1px solid ${c.text}33` }}>
      {category}
    </span>
  );
}

function daysUntilExpiry(d) {
  const diff = (new Date(d) - Date.now()) / (1000 * 60 * 60 * 24);
  return Math.ceil(diff);
}

export default function Announcements({ currentUser, onLogout, onNotify, theme, onToggleTheme }) {
  const navigate = useNavigate();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'General', isPinned: false, expiresAt: '' });

  useEffect(() => { loadAnnouncements(); }, []);

  async function loadAnnouncements() {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/announcements`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setAnnouncements(data);
    } catch (err) {
      onNotify({ title: 'Failed to load announcements', message: err.message, tone: 'danger' });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/announcements`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ...form, expiresAt: form.expiresAt || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onNotify({ title: 'Announcement posted', message: data.title, tone: 'success' });
      setShowForm(false);
      setForm({ title: '', content: '', category: 'General', isPinned: false, expiresAt: '' });
      await loadAnnouncements();
    } catch (err) {
      onNotify({ title: 'Error', message: err.message, tone: 'danger' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePin(id) {
    try {
      const res = await fetch(`${API_BASE}/announcements/${id}/pin`, { method: 'PUT', headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setAnnouncements((prev) => {
        const updated = prev.map((a) => (a._id === id ? data : a));
        return [...updated].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || new Date(b.createdAt) - new Date(a.createdAt));
      });
      onNotify({ title: data.isPinned ? 'Pinned' : 'Unpinned', message: data.title, tone: 'info' });
    } catch (err) {
      onNotify({ title: 'Error', message: err.message, tone: 'danger' });
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      const res = await fetch(`${API_BASE}/announcements/${id}`, { method: 'DELETE', headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));
      onNotify({ title: 'Deleted', message: '', tone: 'info' });
    } catch (err) {
      onNotify({ title: 'Error', message: err.message, tone: 'danger' });
    }
  }

  const now = new Date();
  const thisWeek = announcements.filter((a) => (now - new Date(a.createdAt)) < 7 * 86400000).length;
  const pinned = announcements.filter((a) => a.isPinned).length;
  const emergency = announcements.filter((a) => a.category === 'Emergency').length;

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
          <button type="button" className="button-secondary" onClick={() => navigate('/voting')}>
            <Icon name="spark" size={18} />
            <span>Votes</span>
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
              <Icon name="bell" size={16} />
              <span>Notice Board</span>
            </div>
            <h1 className="dashboard-title">Society Announcements</h1>
            <p className="dashboard-subtitle">Stay updated with society notices, meetings, and events.</p>
          </div>
          {isAdmin && (
            <div className="hero-meta">
              <button type="button" className="button-primary" onClick={() => setShowForm((v) => !v)}>
                <Icon name="plus" size={16} />
                <span>{showForm ? 'Cancel' : 'Post Announcement'}</span>
              </button>
            </div>
          )}
        </section>

        <section className="summary-grid">
          {[
            { label: 'Total', value: announcements.length, icon: 'list', color: 'var(--accent)' },
            { label: 'Pinned', value: pinned, icon: 'spark', color: 'var(--warning)' },
            { label: 'Emergency', value: emergency, icon: 'alert', color: '#ef4444' },
            { label: 'This Week', value: thisWeek, icon: 'calendar', color: 'var(--success)' },
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

        {showForm && isAdmin && (
          <section className="glass-panel section-card">
            <h2 className="section-title" style={{ marginBottom: '1.5rem' }}>Post New Announcement</h2>
            <form onSubmit={handleCreate}>
              <div className="field-block">
                <label className="field-label">Title *</label>
                <input className="field-input" required maxLength={100} placeholder="Short, descriptive title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="field-block">
                <label className="field-label">Content *</label>
                <textarea className="field-input" required rows={4} maxLength={1000} placeholder="Full announcement details…" value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} style={{ resize: 'vertical' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-soft)' }}>{form.content.length}/1000</span>
              </div>
              <div className="field-block">
                <label className="field-label">Category</label>
                <select className="field-input" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="field-block">
                <label className="field-label">Expires on (optional)</label>
                <input className="field-input" type="date" value={form.expiresAt} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))} />
              </div>
              <div className="field-block" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <input type="checkbox" id="pin" checked={form.isPinned} onChange={(e) => setForm((f) => ({ ...f, isPinned: e.target.checked }))} style={{ width: 16, height: 16 }} />
                <label htmlFor="pin" className="field-label" style={{ margin: 0, cursor: 'pointer' }}>📌 Pin this announcement to the top</label>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="submit" className="button-primary" disabled={submitting}>{submitting ? 'Posting…' : 'Post Announcement'}</button>
                <button type="button" className="button-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </section>
        )}

        <section className="section-card">
          <h2 className="section-title" style={{ marginBottom: '1.25rem' }}>Announcements</h2>
          {loading ? (
            <div className="empty-state"><div className="spinner-ring" /></div>
          ) : announcements.length === 0 ? (
            <div className="empty-state">
              <Icon name="bell" size={36} />
              <p>No announcements yet.{isAdmin ? ' Post one above.' : ''}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {announcements.map((a) => (
                <div key={a._id} className="glass-panel" style={{ padding: '1.1rem 1.4rem', borderLeft: a.category === 'Emergency' ? '3px solid #ef4444' : a.isPinned ? '3px solid var(--warning)' : '3px solid transparent' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {a.isPinned && <span title="Pinned">📌</span>}
                      <CategoryBadge category={a.category} />
                    </div>
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="button-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }} onClick={() => handlePin(a._id)}>
                          {a.isPinned ? 'Unpin' : 'Pin'}
                        </button>
                        <button className="button-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', color: '#ef4444' }} onClick={() => handleDelete(a._id)}>Delete</button>
                      </div>
                    )}
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: '0 0 0.4rem' }}>{a.title}</h3>
                  <p style={{ color: 'var(--text-soft)', fontSize: '0.9rem', margin: '0 0 0.6rem', whiteSpace: 'pre-wrap' }}>{a.content}</p>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-soft)', flexWrap: 'wrap' }}>
                    <span>Posted by {a.createdBy?.name || 'Admin'} · {daysAgo(a.createdAt)}</span>
                    {a.expiresAt && (() => {
                      const days = daysUntilExpiry(a.expiresAt);
                      return days <= 2 && days >= 0 ? (
                        <span style={{ color: '#f59e0b', fontWeight: 700 }}>
                          ⚠️ {days === 0 ? 'Expires today!' : `Expires in ${days} day${days === 1 ? '' : 's'}`}
                        </span>
                      ) : (
                        <span>Expires: {fmtDate(a.expiresAt)}</span>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
