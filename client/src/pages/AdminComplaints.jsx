import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import Icon from '../components/Icon';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const STATUS_OPTIONS = ['All', 'Open', 'In Progress', 'Resolved', 'Closed'];
const CATEGORY_OPTIONS = [
  'All',
  'Lift',
  'Water',
  'Electricity',
  'Parking',
  'Cleanliness',
  'Security',
  'Other'
];
const PENDING_STATUSES = ['Open', 'In Progress'];
const ARCHIVE_STATUSES = ['Resolved', 'Closed'];

function formatDate(value) {
  if (!value) {
    return 'Not updated yet';
  }

  return new Date(value).toLocaleString();
}

function getStatusTone(status) {
  if (status === 'Resolved' || status === 'Closed') {
    return 'var(--success)';
  }

  if (status === 'In Progress') {
    return 'var(--warning)';
  }

  return 'var(--brand)';
}

export default function AdminComplaints({ currentUser, onNotify, theme, onToggleTheme }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/complaints/all`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load complaints.');
      }

      setComplaints(data);
      setDrafts(
        data.reduce((nextDrafts, complaint) => {
          nextDrafts[complaint._id] = {
            status: complaint.status,
            adminNote: complaint.adminNote || ''
          };
          return nextDrafts;
        }, {})
      );
    } catch (error) {
      onNotify?.({
        title: 'Unable to load complaints',
        message: error.message || 'Please refresh and try again.',
        tone: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDraftChange = (complaintId, field, value) => {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [complaintId]: {
        ...currentDrafts[complaintId],
        [field]: value
      }
    }));
  };

  const handleUpdate = async (complaintId) => {
    const token = localStorage.getItem('token');
    const draft = drafts[complaintId];

    if (!token || !draft) {
      return;
    }

    try {
      setSavingId(complaintId);

      const response = await fetch(`${API_BASE_URL}/complaints/${complaintId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: draft.status,
          adminNote: draft.adminNote
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update complaint.');
      }

      await loadComplaints();
      onNotify?.({
        title: 'Complaint updated',
        message: 'The complaint status and admin note were saved.',
        tone: 'success'
      });
    } catch (error) {
      onNotify?.({
        title: 'Update failed',
        message: error.message || 'Please try again.',
        tone: 'danger'
      });
    } finally {
      setSavingId('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.assign('/auth');
  };

  const filteredComplaints = complaints.filter((complaint) => {
    const matchesStatus = statusFilter === 'All' || complaint.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || complaint.category === categoryFilter;
    return matchesStatus && matchesCategory;
  });

  const pendingComplaints = filteredComplaints.filter((complaint) =>
    PENDING_STATUSES.includes(complaint.status)
  );
  const archivedComplaints = filteredComplaints.filter((complaint) =>
    ARCHIVE_STATUSES.includes(complaint.status)
  );

  const totalCount = complaints.length;
  const openCount = complaints.filter((complaint) => complaint.status === 'Open').length;
  const inProgressCount = complaints.filter((complaint) => complaint.status === 'In Progress').length;
  const resolvedCount = complaints.filter((complaint) => complaint.status === 'Resolved').length;

  return (
    <div className="dashboard-shell">
      <div className="page-aurora" />
      <header className="dashboard-topbar">
        <BrandLogo compact />
        <div className="dashboard-actions">
          <span className="info-chip">
            <Icon name="team" size={16} />
            {currentUser?.name || 'Admin'}
          </span>
          <button type="button" className="theme-toggle" onClick={onToggleTheme}>
            <Icon name={theme === 'light' ? 'moon' : 'sun'} size={18} />
            <span>{theme === 'light' ? 'Dark theme' : 'Light theme'}</span>
          </button>
          <button
            type="button"
            className="button-secondary"
            onClick={() => navigate('/admin')}
          >
            <Icon name="arrow-left" size={18} />
            <span>Back to Admin Panel</span>
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
              <Icon name="tools" size={16} />
              <span>Admin complaints desk</span>
            </div>
            <h1 className="dashboard-title">Complaint operations</h1>
            <p className="dashboard-subtitle">
              Review incoming issues, update progress, add internal notes, and keep active
              complaints moving toward closure without losing the full history.
            </p>
          </div>
          <div className="hero-meta" />
        </section>

        <section className="summary-grid">
          <article className="metric-card">
            <span className="metric-label">Total</span>
            <strong>{totalCount}</strong>
            <p>All complaints currently stored in the system.</p>
          </article>
          <article className="metric-card">
            <span className="metric-label">Open</span>
            <strong>{openCount}</strong>
            <p>Fresh issues waiting for the first admin action.</p>
          </article>
          <article className="metric-card">
            <span className="metric-label">In progress</span>
            <strong>{inProgressCount}</strong>
            <p>Complaints actively being worked on right now.</p>
          </article>
          <article className="metric-card">
            <span className="metric-label">Resolved</span>
            <strong>{resolvedCount}</strong>
            <p>Items already marked resolved by the admin team.</p>
          </article>
        </section>

        <section className="glass-panel section-card">
          <div className="section-head">
            <div>
              <p className="section-kicker">Filters</p>
              <h2 className="section-heading">Narrow the complaint queue</h2>
            </div>
          </div>

          <div className="form-grid two-columns">
            <label className="field-block">
              <span className="field-label">Status</span>
              <select
                className="field-input"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-block">
              <span className="field-label">Category</span>
              <select
                className="field-input"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="dashboard-grid admin-grid">
          <article className="glass-panel section-card">
            <div className="section-head">
              <div>
                <p className="section-kicker">Section A</p>
                <h2 className="section-heading">Pending Action</h2>
              </div>
            </div>

            {loading ? (
              <div className="loading-card">
                <div className="spinner-ring spinner-ring-small" />
                <p>Loading complaints...</p>
              </div>
            ) : pendingComplaints.length === 0 ? (
              <div className="empty-state">
                <Icon name="check" size={24} />
                <strong>No pending complaints</strong>
                <p>Open and in-progress complaints matching your filters will appear here.</p>
              </div>
            ) : (
              <div className="history-list">
                {pendingComplaints.map((complaint) => {
                  const draft = drafts[complaint._id] || {
                    status: complaint.status,
                    adminNote: complaint.adminNote || ''
                  };

                  return (
                    <div key={complaint._id} className="glass-panel section-card">
                      <div className="section-head">
                        <div>
                          <p className="section-kicker">
                            {complaint.category} · {complaint.priority} priority
                          </p>
                          <h3 className="section-heading">{complaint.title}</h3>
                        </div>
                        <span
                          className="category-badge"
                          style={{
                            '--badge-color': getStatusTone(complaint.status),
                            '--badge-soft':
                              complaint.status === 'In Progress'
                                ? 'rgba(245, 158, 11, 0.12)'
                                : 'rgba(99, 102, 241, 0.12)'
                          }}
                        >
                          <Icon
                            name={complaint.status === 'In Progress' ? 'tools' : 'clock'}
                            size={15}
                          />
                          <span>{complaint.status}</span>
                        </span>
                      </div>

                      <div className="summary-grid">
                        <article className="metric-card metric-card-compact">
                          <span className="metric-label">Resident</span>
                          <strong>{complaint.residentName}</strong>
                          <p>{complaint.flatNumber}</p>
                        </article>
                        <article className="metric-card metric-card-compact">
                          <span className="metric-label">Created</span>
                          <strong>{formatDate(complaint.createdAt)}</strong>
                          <p>Last updated {formatDate(complaint.updatedAt)}</p>
                        </article>
                      </div>

                      <div className="month-review-total">
                        <span>Issue details</span>
                        <strong>{complaint.description}</strong>
                      </div>

                      <div className="form-grid">
                        <label className="field-block">
                          <span className="field-label">Admin note</span>
                          <input
                            type="text"
                            className="field-input"
                            value={draft.adminNote}
                            onChange={(event) =>
                              handleDraftChange(complaint._id, 'adminNote', event.target.value)
                            }
                            placeholder="Add internal progress notes or resolution details"
                          />
                        </label>

                        <label className="field-block">
                          <span className="field-label">Update status</span>
                          <select
                            className="field-input"
                            value={draft.status}
                            onChange={(event) =>
                              handleDraftChange(complaint._id, 'status', event.target.value)
                            }
                          >
                            {STATUS_OPTIONS.filter((status) => status !== 'All').map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <div className="submit-row">
                        <div className="total-preview">
                          <span>Resident reference</span>
                          <strong>{complaint._id}</strong>
                        </div>
                        <button
                          type="button"
                          className="button-primary"
                          onClick={() => handleUpdate(complaint._id)}
                          disabled={savingId === complaint._id}
                        >
                          <Icon name="save" size={18} />
                          <span>{savingId === complaint._id ? 'Updating...' : 'Update'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </article>

          <article className="glass-panel section-card">
            <div className="section-head">
              <div>
                <p className="section-kicker">Section B</p>
                <h2 className="section-heading">Archive & History</h2>
              </div>
            </div>

            {loading ? (
              <div className="loading-card">
                <div className="spinner-ring spinner-ring-small" />
                <p>Loading archive...</p>
              </div>
            ) : archivedComplaints.length === 0 ? (
              <div className="empty-state">
                <Icon name="calendar" size={24} />
                <strong>No archived complaints</strong>
                <p>Resolved and closed complaints matching your filters will appear here.</p>
              </div>
            ) : (
              <div className="history-list">
                {archivedComplaints.map((complaint) => {
                  const draft = drafts[complaint._id] || {
                    status: complaint.status,
                    adminNote: complaint.adminNote || ''
                  };

                  return (
                    <div key={complaint._id} className="glass-panel section-card">
                      <div className="section-head">
                        <div>
                          <p className="section-kicker">
                            {complaint.category} · {complaint.priority} priority
                          </p>
                          <h3 className="section-heading">{complaint.title}</h3>
                        </div>
                        <span
                          className="category-badge"
                          style={{
                            '--badge-color': getStatusTone(complaint.status),
                            '--badge-soft': 'rgba(15, 159, 119, 0.12)'
                          }}
                        >
                          <Icon
                            name={complaint.status === 'Closed' ? 'shield' : 'check'}
                            size={15}
                          />
                          <span>{complaint.status}</span>
                        </span>
                      </div>

                      <div className="summary-grid">
                        <article className="metric-card metric-card-compact">
                          <span className="metric-label">Resident</span>
                          <strong>{complaint.residentName}</strong>
                          <p>{complaint.flatNumber}</p>
                        </article>
                        <article className="metric-card metric-card-compact">
                          <span className="metric-label">Resolved at</span>
                          <strong>{formatDate(complaint.resolvedAt || complaint.updatedAt)}</strong>
                          <p>Created {formatDate(complaint.createdAt)}</p>
                        </article>
                      </div>

                      <div className="month-review-total">
                        <span>Issue details</span>
                        <strong>{complaint.description}</strong>
                      </div>

                      <div className="form-grid">
                        <label className="field-block">
                          <span className="field-label">Admin note</span>
                          <input
                            type="text"
                            className="field-input"
                            value={draft.adminNote}
                            onChange={(event) =>
                              handleDraftChange(complaint._id, 'adminNote', event.target.value)
                            }
                            placeholder="Add closing notes or follow-up details"
                          />
                        </label>

                        <label className="field-block">
                          <span className="field-label">Update status</span>
                          <select
                            className="field-input"
                            value={draft.status}
                            onChange={(event) =>
                              handleDraftChange(complaint._id, 'status', event.target.value)
                            }
                          >
                            {STATUS_OPTIONS.filter((status) => status !== 'All').map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <div className="submit-row">
                        <div className="total-preview">
                          <span>Complaint record</span>
                          <strong>{complaint._id}</strong>
                        </div>
                        <button
                          type="button"
                          className="button-primary"
                          onClick={() => handleUpdate(complaint._id)}
                          disabled={savingId === complaint._id}
                        >
                          <Icon name="save" size={18} />
                          <span>{savingId === complaint._id ? 'Updating...' : 'Update'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </article>
        </section>
      </main>
    </div>
  );
}
