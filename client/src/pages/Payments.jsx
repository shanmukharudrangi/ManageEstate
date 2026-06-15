import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import Icon from '../components/Icon';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

function fmtCurrency(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN');
}

function fmtMonth(m) {
  if (!m) return '';
  const [y, mo] = m.split('-');
  return new Date(+y, +mo - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

const STATUS_COLORS = {
  Paid: { bg: 'color-mix(in srgb, var(--success) 14%, transparent)', text: 'var(--success)' },
  Pending: { bg: 'color-mix(in srgb, #f59e0b 14%, transparent)', text: '#f59e0b' },
  Overdue: { bg: 'color-mix(in srgb, #ef4444 14%, transparent)', text: '#ef4444' },
};

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.Pending;
  return (
    <span style={{ padding: '0.2rem 0.65rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, background: c.bg, color: c.text }}>
      {status}
    </span>
  );
}

const getCurrentMonth = () => new Date().toISOString().slice(0, 7);

export default function Payments({ currentUser, onLogout, onNotify, theme, onToggleTheme }) {
  const navigate = useNavigate();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ status: 'Pending', method: 'Cash', note: '' });
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ residentId: '', residentName: '', flatNumber: '', amount: '', status: 'Pending', method: 'Cash', note: '' });
  const [residents, setResidents] = useState([]);

  useEffect(() => {
    if (isAdmin) {
      loadAdminData(selectedMonth);
      loadResidents();
    } else {
      loadMyPayments();
    }
  }, [selectedMonth]);

  async function loadResidents() {
    try {
      const res = await fetch(`${API_BASE}/users/residents`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setResidents(data);
    } catch (err) {
      onNotify({ title: 'Could not load residents', message: err.message, tone: 'danger' });
    }
  }

  async function loadAdminData(month) {
    try {
      setLoading(true);
      const [payRes, sumRes] = await Promise.all([
        fetch(`${API_BASE}/payments/all?month=${month}`, { headers: authHeaders() }),
        fetch(`${API_BASE}/payments/summary/${month}`, { headers: authHeaders() }),
      ]);
      const payData = await payRes.json();
      const sumData = await sumRes.json();
      if (!payRes.ok) throw new Error(payData.message);
      setPayments(payData.payments || []);
      setSummary(sumData);
    } catch (err) {
      onNotify({ title: 'Failed to load payments', message: err.message, tone: 'danger' });
    } finally {
      setLoading(false);
    }
  }

  async function loadMyPayments() {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/payments/my`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPayments(data);
    } catch (err) {
      onNotify({ title: 'Failed to load payments', message: err.message, tone: 'danger' });
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(payment) {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/payments/mark`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          residentId: payment.residentId?._id || payment.residentId,
          residentName: payment.residentName,
          flatNumber: payment.flatNumber,
          month: payment.month,
          amount: payment.amount,
          ...editForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onNotify({ title: 'Payment updated', message: `${payment.residentName} — ${editForm.status}`, tone: 'success' });
      setEditId(null);
      await loadAdminData(selectedMonth);
    } catch (err) {
      onNotify({ title: 'Error', message: err.message, tone: 'danger' });
    } finally {
      setSaving(false);
    }
  }

  function handleResidentSelect(e) {
    const selected = residents.find((r) => r._id === e.target.value);
    if (selected) {
      setAddForm((f) => ({
        ...f,
        residentId: selected._id,
        residentName: selected.name,
        flatNumber: selected.apartment,
      }));
    } else {
      setAddForm((f) => ({ ...f, residentId: '', residentName: '', flatNumber: '' }));
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!addForm.residentId) {
      onNotify({ title: 'Select a resident', message: 'Please choose a resident from the dropdown.', tone: 'danger' });
      return;
    }
    if (!addForm.amount || Number(addForm.amount) <= 0) {
      onNotify({ title: 'Enter an amount', message: 'Amount must be greater than zero.', tone: 'danger' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/payments/mark`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          residentId: addForm.residentId,
          residentName: addForm.residentName,
          flatNumber: addForm.flatNumber,
          month: selectedMonth,
          amount: Number(addForm.amount),
          status: addForm.status,
          method: addForm.method,
          note: addForm.note,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onNotify({ title: 'Record added', message: `${addForm.residentName} for ${fmtMonth(selectedMonth)}`, tone: 'success' });
      setShowAddForm(false);
      setAddForm({ residentId: '', residentName: '', flatNumber: '', amount: '', status: 'Pending', method: 'Cash', note: '' });
      await loadAdminData(selectedMonth);
    } catch (err) {
      onNotify({ title: 'Error', message: err.message, tone: 'danger' });
    } finally {
      setSaving(false);
    }
  }

  const myPaid = payments.filter((p) => p.status === 'Paid').length;
  const myPending = payments.filter((p) => p.status === 'Pending').length;
  const myTotal = payments.filter((p) => p.status === 'Paid').reduce((s, p) => s + p.amount, 0);

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
          <button type="button" className="button-secondary" onClick={() => navigate('/announcements')}>
            <Icon name="bell" size={18} />
            <span>Notices</span>
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
              <Icon name="wallet" size={16} />
              <span>{isAdmin ? 'Financial Management' : 'My Account'}</span>
            </div>
            <h1 className="dashboard-title">{isAdmin ? 'Payment Tracking' : 'My Payment History'}</h1>
            <p className="dashboard-subtitle">
              {isAdmin
                ? 'Track monthly maintenance fee collection across all residents.'
                : 'View your maintenance payment records and status.'}
            </p>
          </div>
          {isAdmin && (
            <div className="hero-meta" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input
                type="month"
                className="field-input"
                style={{ minWidth: 160 }}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
              <button type="button" className="button-primary" onClick={() => setShowAddForm((v) => !v)}>
                <Icon name="plus" size={16} />
                <span>Add Record</span>
              </button>
            </div>
          )}
        </section>

        {isAdmin ? (
          <>
            <section className="summary-grid">
              {[
                { label: 'Total Collected', value: fmtCurrency(summary?.totalCollected), icon: 'wallet', color: 'var(--success)' },
                { label: 'Paid', value: summary?.paid ?? '—', icon: 'check', color: 'var(--success)' },
                { label: 'Pending', value: summary?.pending ?? '—', icon: 'alert', color: '#f59e0b' },
                { label: 'Overdue', value: summary?.overdue ?? '—', icon: 'alert', color: '#ef4444' },
              ].map((m) => (
                <article key={m.label} className="metric-card">
                  <div className="metric-icon" style={{ background: `color-mix(in srgb, ${m.color} 15%, transparent)`, color: m.color }}>
                    <Icon name={m.icon} size={20} />
                  </div>
                  <div>
                    <div className="metric-value" style={{ fontSize: typeof m.value === 'string' && m.value.startsWith('₹') ? '1.3rem' : undefined }}>{m.value}</div>
                    <div className="metric-label">{m.label}</div>
                  </div>
                </article>
              ))}
            </section>

            {showAddForm && (
              <section className="glass-panel section-card">
                <h2 className="section-title" style={{ marginBottom: '1.25rem' }}>Add Payment Record — {fmtMonth(selectedMonth)}</h2>
                <form onSubmit={handleAdd}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    <div className="field-block" style={{ gridColumn: '1 / -1' }}>
                      <label className="field-label">Resident *</label>
                      <select
                        className="field-input"
                        value={addForm.residentId}
                        onChange={handleResidentSelect}
                      >
                        <option value="">— Select resident —</option>
                        {residents.map((r) => (
                          <option key={r._id} value={r._id}>
                            {r.name} — {r.apartment}
                          </option>
                        ))}
                      </select>
                      {addForm.residentId && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-soft)', marginTop: '0.25rem', display: 'block' }}>
                          Flat: {addForm.flatNumber}
                        </span>
                      )}
                    </div>
                    <div className="field-block">
                      <label className="field-label">Amount (₹) *</label>
                      <input className="field-input" type="number" required min={1} value={addForm.amount} onChange={(e) => setAddForm((f) => ({ ...f, amount: e.target.value }))} placeholder="e.g. 2500" />
                    </div>
                    <div className="field-block">
                      <label className="field-label">Status</label>
                      <select className="field-input" value={addForm.status} onChange={(e) => setAddForm((f) => ({ ...f, status: e.target.value }))}>
                        <option>Pending</option><option>Paid</option><option>Overdue</option>
                      </select>
                    </div>
                    <div className="field-block">
                      <label className="field-label">Method</label>
                      <select className="field-input" value={addForm.method} onChange={(e) => setAddForm((f) => ({ ...f, method: e.target.value }))}>
                        <option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Cheque</option>
                      </select>
                    </div>
                    <div className="field-block">
                      <label className="field-label">Note</label>
                      <input className="field-input" value={addForm.note} onChange={(e) => setAddForm((f) => ({ ...f, note: e.target.value }))} placeholder="Optional note" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                    <button type="submit" className="button-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Record'}</button>
                    <button type="button" className="button-secondary" onClick={() => { setShowAddForm(false); setAddForm({ residentId: '', residentName: '', flatNumber: '', amount: '', status: 'Pending', method: 'Cash', note: '' }); }}>Cancel</button>
                  </div>
                </form>
              </section>
            )}

            <section className="section-card">
              <h2 className="section-title" style={{ marginBottom: '1.25rem' }}>
                Records — {fmtMonth(selectedMonth)} ({payments.length})
              </h2>
              {loading ? (
                <div className="empty-state"><div className="spinner-ring" /></div>
              ) : payments.length === 0 ? (
                <div className="empty-state">
                  <Icon name="wallet" size={36} />
                  <p>No payment records for {fmtMonth(selectedMonth)}. Add one above.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {payments.map((p) => (
                    <div key={p._id} className="glass-panel" style={{ padding: '1rem 1.25rem' }}>
                      {editId === p._id ? (
                        <div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.6rem', marginBottom: '0.75rem' }}>
                            <div className="field-block">
                              <label className="field-label">Status</label>
                              <select className="field-input" value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}>
                                <option>Pending</option><option>Paid</option><option>Overdue</option>
                              </select>
                            </div>
                            <div className="field-block">
                              <label className="field-label">Method</label>
                              <select className="field-input" value={editForm.method} onChange={(e) => setEditForm((f) => ({ ...f, method: e.target.value }))}>
                                <option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Cheque</option>
                              </select>
                            </div>
                            <div className="field-block">
                              <label className="field-label">Note</label>
                              <input className="field-input" value={editForm.note} onChange={(e) => setEditForm((f) => ({ ...f, note: e.target.value }))} />
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="button-primary" style={{ fontSize: '0.82rem' }} onClick={() => handleUpdate(p)} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                            <button className="button-secondary" style={{ fontSize: '0.82rem' }} onClick={() => setEditId(null)}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem', minWidth: 60 }}>{p.flatNumber}</span>
                            <span style={{ color: 'var(--text-soft)', fontSize: '0.9rem' }}>{p.residentName}</span>
                            <StatusBadge status={p.status} />
                            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{fmtCurrency(p.amount)}</span>
                            {p.method && <span style={{ fontSize: '0.8rem', color: 'var(--text-soft)' }}>{p.method}</span>}
                            {p.paidOn && <span style={{ fontSize: '0.78rem', color: 'var(--text-soft)' }}>Paid: {new Date(p.paidOn).toLocaleDateString('en-IN')}</span>}
                            {p.note && <span style={{ fontSize: '0.78rem', color: 'var(--text-soft)', fontStyle: 'italic' }}>{p.note}</span>}
                          </div>
                          <button className="button-secondary" style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }} onClick={() => { setEditId(p._id); setEditForm({ status: p.status, method: p.method || 'Cash', note: p.note || '' }); }}>
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          <>
            <section className="summary-grid">
              {[
                { label: 'Total Paid', value: myPaid, icon: 'check', color: 'var(--success)' },
                { label: 'Pending', value: myPending, icon: 'alert', color: '#f59e0b' },
                { label: 'Amount Paid', value: fmtCurrency(myTotal), icon: 'wallet', color: 'var(--accent)' },
              ].map((m) => (
                <article key={m.label} className="metric-card">
                  <div className="metric-icon" style={{ background: `color-mix(in srgb, ${m.color} 15%, transparent)`, color: m.color }}>
                    <Icon name={m.icon} size={20} />
                  </div>
                  <div>
                    <div className="metric-value" style={{ fontSize: typeof m.value === 'string' && m.value.startsWith('₹') ? '1.3rem' : undefined }}>{m.value}</div>
                    <div className="metric-label">{m.label}</div>
                  </div>
                </article>
              ))}
            </section>

            <section className="section-card">
              <h2 className="section-title" style={{ marginBottom: '1.25rem' }}>Payment History</h2>
              {loading ? (
                <div className="empty-state"><div className="spinner-ring" /></div>
              ) : payments.length === 0 ? (
                <div className="empty-state">
                  <Icon name="wallet" size={36} />
                  <p>No payment records yet. Contact the society admin.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {payments.map((p) => (
                    <div key={p._id} className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{fmtMonth(p.month)}</span>
                        {p.paidOn && <span style={{ fontSize: '0.78rem', color: 'var(--text-soft)' }}>Paid on {new Date(p.paidOn).toLocaleDateString('en-IN')}</span>}
                        {p.method && <span style={{ fontSize: '0.78rem', color: 'var(--text-soft)' }}>{p.method}</span>}
                        {p.note && <span style={{ fontSize: '0.78rem', color: 'var(--text-soft)', fontStyle: 'italic' }}>{p.note}</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '1rem' }}>{fmtCurrency(p.amount)}</span>
                        <StatusBadge status={p.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
