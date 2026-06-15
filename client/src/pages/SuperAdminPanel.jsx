import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import Icon from '../components/Icon';

const API_BASE = '/api/superadmin';

function authHeaders() {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export default function SuperAdminPanel({ currentUser, onLogout, onNotify, theme, onToggleTheme }) {
  const navigate = useNavigate();

  const [pendingRequests, setPendingRequests] = useState([]);
  const [allAdmins, setAllAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingUserId, setRejectingUserId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [pending, admins] = await Promise.all([
        apiFetch('/pending'),
        apiFetch('/all-admins')
      ]);
      setPendingRequests(pending);
      setAllAdmins(admins);
    } catch (error) {
      onNotify({ title: 'Load failed', message: error.message, tone: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (userId, name) => {
    setActionLoading(true);
    try {
      await apiFetch(`/approve/${userId}`, { method: 'PUT' });
      onNotify({ title: 'Approved', message: `${name} is now an active admin.`, tone: 'success' });
      await loadData();
    } catch (error) {
      onNotify({ title: 'Approval failed', message: error.message, tone: 'danger' });
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (userId) => {
    setRejectingUserId(userId);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const closeRejectModal = () => {
    setRejectModalOpen(false);
    setRejectingUserId(null);
    setRejectReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectingUserId) return;
    setActionLoading(true);
    try {
      await apiFetch(`/reject/${rejectingUserId}`, {
        method: 'PUT',
        body: JSON.stringify({ reason: rejectReason.trim() || 'Request denied by super admin' })
      });
      onNotify({ title: 'Rejected', message: 'Admin request has been rejected.', tone: 'info' });
      closeRejectModal();
      await loadData();
    } catch (error) {
      onNotify({ title: 'Rejection failed', message: error.message, tone: 'danger' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="dashboard-shell">
      <div className="page-aurora" />

      <header className="dashboard-topbar">
        <BrandLogo compact />
        <div className="dashboard-actions">
          <button type="button" className="theme-toggle" onClick={onToggleTheme}>
            <Icon name={theme === 'light' ? 'moon' : 'sun'} size={18} />
            <span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
          </button>
          <button type="button" className="button-secondary" onClick={handleLogout}>
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
              <span>Super Admin</span>
            </div>
            <h1 className="dashboard-title">Admin Request Management</h1>
            <p className="dashboard-subtitle">
              Review and approve admin access requests for ManageEstate.
            </p>
          </div>
          <div className="hero-meta">
            <span className="info-chip">
              <Icon name="clock" size={16} />
              Logged in as {currentUser?.name || 'Super Admin'}
            </span>
          </div>
        </section>

        <section className="summary-grid">
          <article className="metric-card">
            <span className="metric-label">Pending requests</span>
            <strong>{loading ? '—' : pendingRequests.length}</strong>
            <p>Admin accounts awaiting your review.</p>
          </article>
          <article className="metric-card">
            <span className="metric-label">Active admins</span>
            <strong>{loading ? '—' : allAdmins.length}</strong>
            <p>Approved admin accounts currently active.</p>
          </article>
        </section>

        <section className="dashboard-grid">
          <article className="glass-panel section-card">
            <div className="section-head">
              <div>
                <p className="section-kicker">Approval queue</p>
                <h2 className="section-heading">Pending Requests</h2>
              </div>
            </div>

            {loading ? (
              <div className="superadmin-empty">
                <div className="spinner-ring" />
                <p>Loading requests…</p>
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="superadmin-empty">
                <Icon name="spark" size={28} />
                <p>No pending requests. You are all caught up.</p>
              </div>
            ) : (
              <div className="superadmin-request-list">
                {pendingRequests.map((req) => (
                  <div key={req._id} className="superadmin-request-card glass-panel">
                    <div className="superadmin-request-info">
                      <div className="superadmin-request-name">
                        <strong>{req.name}</strong>
                        <span className="superadmin-badge superadmin-badge-pending">Pending</span>
                      </div>
                      <p className="superadmin-request-email">{req.email}</p>
                      {req.apartment && (
                        <p className="superadmin-request-meta">
                          <Icon name="calendar" size={14} /> Apartment: {req.apartment}
                        </p>
                      )}
                      {req.adminRequestNote && (
                        <p className="superadmin-request-note">
                          &ldquo;{req.adminRequestNote}&rdquo;
                        </p>
                      )}
                      <p className="superadmin-request-meta">
                        Requested: {new Date(req.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="superadmin-request-actions">
                      <button
                        type="button"
                        className="button-primary"
                        disabled={actionLoading}
                        onClick={() => handleApprove(req._id, req.name)}
                      >
                        <Icon name="spark" size={16} />
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        className="button-secondary"
                        disabled={actionLoading}
                        onClick={() => openRejectModal(req._id)}
                      >
                        <Icon name="logout" size={16} />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="glass-panel section-card">
            <div className="section-head">
              <div>
                <p className="section-kicker">Approved accounts</p>
                <h2 className="section-heading">Active Admins</h2>
              </div>
            </div>

            {loading ? (
              <div className="superadmin-empty">
                <div className="spinner-ring" />
                <p>Loading admins…</p>
              </div>
            ) : allAdmins.length === 0 ? (
              <div className="superadmin-empty">
                <p>No active admins yet.</p>
              </div>
            ) : (
              <div className="superadmin-admin-list">
                {allAdmins.map((admin) => (
                  <div key={admin._id} className="superadmin-admin-row glass-panel">
                    <div className="superadmin-request-info">
                      <div className="superadmin-request-name">
                        <strong>{admin.name}</strong>
                        <span className="superadmin-badge superadmin-badge-active">Active</span>
                      </div>
                      <p className="superadmin-request-email">{admin.email}</p>
                      {admin.apartment && (
                        <p className="superadmin-request-meta">Apartment: {admin.apartment}</p>
                      )}
                      <p className="superadmin-request-meta">
                        Since: {new Date(admin.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      </main>

      {rejectModalOpen && (
        <div className="superadmin-modal-overlay" onClick={closeRejectModal}>
          <div className="superadmin-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="superadmin-modal-title">Reject Admin Request</h3>
            <p className="superadmin-modal-sub">
              Provide a reason so the applicant understands why their request was denied.
            </p>
            <textarea
              className="superadmin-modal-textarea field-input"
              placeholder="Enter rejection reason (optional)…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
            <div className="superadmin-modal-actions">
              <button
                type="button"
                className="button-primary"
                disabled={actionLoading}
                onClick={handleConfirmReject}
              >
                {actionLoading ? 'Rejecting…' : 'Confirm Reject'}
              </button>
              <button
                type="button"
                className="button-secondary"
                onClick={closeRejectModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
