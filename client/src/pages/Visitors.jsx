import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import Icon from '../components/Icon';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const TYPE_OPTIONS = ['Guest', 'Delivery'];
const STATUS_OPTIONS = ['All', 'Expected', 'Checked In', 'Checked Out', 'Cancelled'];

function authHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function initialExpectedAt() {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  date.setMinutes(0, 0, 0);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatDate(value) {
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit'
  });
}

function StatusBadge({ status }) {
  return <span className={`visitor-status visitor-status-${status.toLowerCase().replaceAll(' ', '-')}`}>{status}</span>;
}

export default function Visitors({ currentUser, onLogout, onNotify, theme, onToggleTheme }) {
  const navigate = useNavigate();
  const isSecurity = currentUser?.role === 'security';
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [form, setForm] = useState({
    visitorName: '', type: 'Guest', phone: '', vehicleNumber: '', purpose: '', expectedAt: initialExpectedAt()
  });

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const query = isSecurity && statusFilter !== 'All' ? `?status=${encodeURIComponent(statusFilter)}` : '';
      const path = isSecurity ? `/visitors${query}` : '/visitors/my';
      const response = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to load visitor passes.');
      setLogs(data);
    } catch (error) {
      onNotify({ title: 'Could not load visitors', message: error.message, tone: 'danger' });
    } finally {
      setLoading(false);
    }
  }, [isSecurity, onNotify, statusFilter]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  async function createPass(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/visitors`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to create visitor pass.');
      setLogs((current) => [data, ...current]);
      setForm({ visitorName: '', type: 'Guest', phone: '', vehicleNumber: '', purpose: '', expectedAt: initialExpectedAt() });
      onNotify({ title: 'Visitor pre-approved', message: `${data.visitorName} can now be verified at the gate.`, tone: 'success' });
    } catch (error) {
      onNotify({ title: 'Could not create pass', message: error.message, tone: 'danger' });
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStatus(id, action) {
    try {
      const response = await fetch(`${API_BASE}/visitors/${id}/${action}`, {
        method: 'PUT', headers: authHeaders()
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to update visitor status.');
      setLogs((current) => current.map((log) => (log._id === id ? data : log)));
      onNotify({ title: action === 'cancel' ? 'Pass cancelled' : `Visitor ${data.status.toLowerCase()}`, message: data.visitorName, tone: 'success' });
    } catch (error) {
      onNotify({ title: 'Update failed', message: error.message, tone: 'danger' });
    }
  }

  const expectedCount = logs.filter((log) => log.status === 'Expected').length;
  const insideCount = logs.filter((log) => log.status === 'Checked In').length;

  return (
    <div className="dashboard-shell">
      <div className="page-aurora" />
      <header className="dashboard-topbar">
        <BrandLogo compact />
        <div className="dashboard-actions">
          <button type="button" className="button-secondary" onClick={() => navigate(isSecurity ? '/security' : '/dashboard')}>
            <Icon name="chart" size={18} /><span>Dashboard</span>
          </button>
          <button type="button" className="button-secondary" onClick={() => navigate('/announcements')}>
            <Icon name="bell" size={18} /><span>Notices</span>
          </button>
          <button type="button" className="theme-toggle" onClick={onToggleTheme}>
            <Icon name={theme === 'light' ? 'moon' : 'sun'} size={18} /><span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
          </button>
          <button type="button" className="button-secondary" onClick={() => { onLogout(); navigate('/'); }}>
            <Icon name="logout" size={18} /><span>Logout</span>
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="hero-banner glass-panel">
          <div>
            <div className="eyebrow-pill"><Icon name="shield" size={16} /><span>{isSecurity ? 'Security desk' : 'Resident access'}</span></div>
            <h1 className="dashboard-title">Visitor & delivery management</h1>
            <p className="dashboard-subtitle">
              {isSecurity ? 'Verify pre-approved guests and keep an accurate entry and exit register.' : 'Pre-approve guests and deliveries so the security desk can verify them quickly.'}
            </p>
          </div>
        </section>

        <section className="summary-grid">
          <article className="metric-card"><span className="metric-label">Expected</span><strong>{expectedCount}</strong><p>Passes awaiting gate verification.</p></article>
          <article className="metric-card"><span className="metric-label">Currently inside</span><strong>{insideCount}</strong><p>Visitors checked in and not yet out.</p></article>
          <article className="metric-card"><span className="metric-label">Records shown</span><strong>{logs.length}</strong><p>{isSecurity ? 'Most recent security-desk records.' : 'Your visitor pass history.'}</p></article>
        </section>

        {!isSecurity && (
          <section className="glass-panel section-card visitor-form-card">
            <div className="section-head"><div><p className="section-kicker">Create access pass</p><h2 className="section-heading">Pre-approve a visitor</h2></div></div>
            <form className="visitor-form" onSubmit={createPass}>
              <label><span>Visitor name *</span><input className="field-input" required maxLength="100" value={form.visitorName} onChange={(event) => setForm({ ...form, visitorName: event.target.value })} placeholder="e.g. Ramesh Kumar" /></label>
              <label><span>Visit type *</span><select className="field-input" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>{TYPE_OPTIONS.map((type) => <option key={type}>{type}</option>)}</select></label>
              <label><span>Expected time *</span><input className="field-input" required type="datetime-local" value={form.expectedAt} onChange={(event) => setForm({ ...form, expectedAt: event.target.value })} /></label>
              <label><span>Phone number</span><input className="field-input" maxLength="20" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Optional" /></label>
              <label><span>Vehicle number</span><input className="field-input" maxLength="30" value={form.vehicleNumber} onChange={(event) => setForm({ ...form, vehicleNumber: event.target.value })} placeholder="Optional" /></label>
              <label className="visitor-form-wide"><span>Purpose / delivery details</span><input className="field-input" maxLength="250" value={form.purpose} onChange={(event) => setForm({ ...form, purpose: event.target.value })} placeholder="e.g. Home appliance delivery" /></label>
              <div className="visitor-form-wide"><button type="submit" className="button-primary" disabled={submitting}><Icon name="shield" size={18} /><span>{submitting ? 'Creating pass...' : 'Pre-approve visitor'}</span></button></div>
            </form>
          </section>
        )}

        <section className="glass-panel section-card">
          <div className="section-head">
            <div><p className="section-kicker">{isSecurity ? 'Gate register' : 'Pass history'}</p><h2 className="section-heading">{isSecurity ? 'Visitor activity' : 'Your visitor passes'}</h2></div>
            {isSecurity && <select aria-label="Filter visitor status" className="field-input visitor-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>{STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}</select>}
          </div>
          {loading ? <div className="loading-card"><div className="spinner-ring spinner-ring-small" /><p>Loading visitor records...</p></div> : logs.length === 0 ? (
            <div className="empty-state"><Icon name="team" size={26} /><strong>No visitor passes yet</strong><p>{isSecurity ? 'New resident approvals will appear here.' : 'Create a pass before your guest or delivery arrives.'}</p></div>
          ) : <div className="visitor-list">
            {logs.map((log) => <article className="visitor-card" key={log._id}>
              <div className="visitor-card-main"><div className="visitor-card-title"><div><strong>{log.visitorName}</strong><span>{log.type} · Flat {log.flatNumber}</span></div><StatusBadge status={log.status} /></div>
                <p><Icon name="clock" size={15} /> Expected {formatDate(log.expectedAt)}</p>
                {log.purpose && <p><Icon name="chat" size={15} /> {log.purpose}</p>}
                {(log.phone || log.vehicleNumber) && <p>{[log.phone, log.vehicleNumber].filter(Boolean).join(' · ')}</p>}
                {isSecurity && <p className="visitor-resident">Resident: {log.residentName}</p>}
              </div>
              <div className="visitor-actions">
                {isSecurity && log.status === 'Expected' && <button className="button-primary" type="button" onClick={() => updateStatus(log._id, 'check-in')}>Check in</button>}
                {isSecurity && log.status === 'Checked In' && <button className="button-primary" type="button" onClick={() => updateStatus(log._id, 'check-out')}>Check out</button>}
                {!isSecurity && log.status === 'Expected' && <button className="button-secondary" type="button" onClick={() => updateStatus(log._id, 'cancel')}>Cancel pass</button>}
              </div>
            </article>)}
          </div>}
        </section>
      </main>
    </div>
  );
}
