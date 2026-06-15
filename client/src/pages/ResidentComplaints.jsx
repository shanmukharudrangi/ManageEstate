import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import Icon from '../components/Icon';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const CATEGORY_OPTIONS = [
  'Lift',
  'Water',
  'Electricity',
  'Parking',
  'Cleanliness',
  'Security',
  'Other'
];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High'];
const ACTIVE_STATUSES = ['Open', 'In Progress'];
const RESOLVED_STATUSES = ['Resolved', 'Closed'];

const INITIAL_FORM = {
  category: 'Lift',
  priority: 'Medium',
  title: '',
  description: ''
};

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

export default function ResidentComplaints({ currentUser, onNotify, theme, onToggleTheme }) {
  const [complaints, setComplaints] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadComplaints(true);

    const intervalId = window.setInterval(() => {
      loadComplaints(false);
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, []);

  const loadComplaints = async (showLoader = false) => {
    const token = localStorage.getItem('token');

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      if (showLoader) {
        setLoading(true);
      }

      const response = await fetch(`${API_BASE_URL}/complaints/my`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load complaints.');
      }

      setComplaints(data);
    } catch (error) {
      onNotify?.({
        title: 'Unable to load complaints',
        message: error.message || 'Please refresh and try again.',
        tone: 'danger'
      });
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem('token');

    if (!token) {
      onNotify?.({
        title: 'Session expired',
        message: 'Please sign in again to submit a complaint.',
        tone: 'danger'
      });
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`${API_BASE_URL}/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to submit complaint.');
      }

      setComplaints((current) => [data, ...current]);
      setFormData(INITIAL_FORM);
      setActiveTab('active');
      onNotify?.({
        title: 'Complaint submitted',
        message: 'Your issue has been recorded and shared with the management team.',
        tone: 'success'
      });
    } catch (error) {
      onNotify?.({
        title: 'Submission failed',
        message: error.message || 'Please review the form and try again.',
        tone: 'danger'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (complaintId) => {
    const token = localStorage.getItem('token');

    if (!token) {
      return;
    }

    try {
      setDeletingId(complaintId);

      const response = await fetch(`${API_BASE_URL}/complaints/${complaintId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to delete complaint.');
      }

      setComplaints((current) => current.filter((complaint) => complaint._id !== complaintId));
      onNotify?.({
        title: 'Complaint deleted',
        message: 'The open complaint has been removed.',
        tone: 'success'
      });
    } catch (error) {
      onNotify?.({
        title: 'Delete failed',
        message: error.message || 'Only open complaints can be removed.',
        tone: 'danger'
      });
    } finally {
      setDeletingId('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.assign('/auth');
  };

  const activeComplaints = complaints.filter((complaint) =>
    ACTIVE_STATUSES.includes(complaint.status)
  );
  const resolvedComplaints = complaints.filter((complaint) =>
    RESOLVED_STATUSES.includes(complaint.status)
  );
  const visibleComplaints = activeTab === 'active' ? activeComplaints : resolvedComplaints;

  return (
    <div className="dashboard-shell">
      <div className="page-aurora" />
      <header className="dashboard-topbar">
        <BrandLogo compact />
        <div className="dashboard-actions">
          <span className="info-chip">
            <Icon name="team" size={16} />
            {currentUser?.name || 'Resident'}
          </span>
          <button type="button" className="theme-toggle" onClick={onToggleTheme}>
            <Icon name={theme === 'light' ? 'moon' : 'sun'} size={18} />
            <span>{theme === 'light' ? 'Dark theme' : 'Light theme'}</span>
          </button>
          <button
            type="button"
            className="button-secondary"
            onClick={() => navigate('/dashboard')}
          >
            <Icon name="arrow-left" size={18} />
            <span>Back to Dashboard</span>
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
              <Icon name="alert" size={16} />
              <span>Complaint management</span>
            </div>
            <h1 className="dashboard-title">Resident complaints center</h1>
            <p className="dashboard-subtitle">
              Track building issues, raise new requests, and keep an eye on what is still active
              versus what has already been resolved for your flat.
            </p>
          </div>
          <div className="hero-meta" />
        </section>

        <section className="summary-grid">
          <article className="metric-card">
            <span className="metric-label">Total complaints</span>
            <strong>{complaints.length}</strong>
            <p>Every issue you have reported in one place.</p>
          </article>
          <article className="metric-card">
            <span className="metric-label">Active issues</span>
            <strong>{activeComplaints.length}</strong>
            <p>Open or in-progress items still needing attention.</p>
          </article>
          <article className="metric-card">
            <span className="metric-label">Resolved history</span>
            <strong>{resolvedComplaints.length}</strong>
            <p>Finished or closed issues for future reference.</p>
          </article>
          <article className="metric-card">
            <span className="metric-label">Priority focus</span>
            <strong>
              {complaints.find((complaint) => complaint.priority === 'High' && ACTIVE_STATUSES.includes(complaint.status))
                ? 'High priority'
                : 'Stable'}
            </strong>
            <p>Highlights whether any urgent active complaint is on your list.</p>
          </article>
        </section>

        <section className="dashboard-grid resident-grid">
          <article className="glass-panel section-card">
            <div className="section-head">
              <div>
                <p className="section-kicker">Raise an issue</p>
                <h2 className="section-heading">Submit a new complaint</h2>
              </div>
            </div>

            <form className="expense-form" onSubmit={handleSubmit}>
              <div className="form-grid two-columns">
                <label className="field-block">
                  <span className="field-label">Category</span>
                  <select
                    name="category"
                    className="field-input"
                    value={formData.category}
                    onChange={handleChange}
                    disabled={submitting}
                  >
                    {CATEGORY_OPTIONS.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field-block">
                  <span className="field-label">Priority</span>
                  <select
                    name="priority"
                    className="field-input"
                    value={formData.priority}
                    onChange={handleChange}
                    disabled={submitting}
                  >
                    {PRIORITY_OPTIONS.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="field-block">
                <span className="field-label">Title</span>
                <input
                  type="text"
                  name="title"
                  className="field-input"
                  value={formData.title}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder="Example: Lift not working on Block B"
                  disabled={submitting}
                  required
                />
              </label>

              <label className="field-block">
                <span className="field-label">Description</span>
                <textarea
                  name="description"
                  className="field-input"
                  value={formData.description}
                  onChange={handleChange}
                  maxLength={500}
                  placeholder="Share the issue details, when it started, and anything the team should know."
                  disabled={submitting}
                  rows={5}
                  required
                />
              </label>

              <div className="submit-row">
                <div className="total-preview">
                  <span>Resident</span>
                  <strong>{currentUser?.name || 'Current user'}</strong>
                </div>
                <button type="submit" className="button-primary" disabled={submitting}>
                  <Icon name="plus" size={18} />
                  <span>{submitting ? 'Submitting...' : 'Submit complaint'}</span>
                </button>
              </div>
            </form>
          </article>

          <article className="glass-panel section-card">
            <div className="section-head">
              <div>
                <p className="section-kicker">My complaints</p>
                <h2 className="section-heading">Track active and resolved items</h2>
              </div>
              <div className="segmented-control" role="tablist" aria-label="Complaint views">
                <button
                  type="button"
                  className={activeTab === 'active' ? 'is-active' : ''}
                  onClick={() => setActiveTab('active')}
                >
                  Active Issues
                </button>
                <button
                  type="button"
                  className={activeTab === 'resolved' ? 'is-active' : ''}
                  onClick={() => setActiveTab('resolved')}
                >
                  Resolved History
                </button>
              </div>
            </div>

            {loading ? (
              <div className="loading-card">
                <div className="spinner-ring spinner-ring-small" />
                <p>Loading your complaints...</p>
              </div>
            ) : visibleComplaints.length === 0 ? (
              <div className="empty-state">
                <Icon name={activeTab === 'active' ? 'clock' : 'check'} size={24} />
                <strong>{activeTab === 'active' ? 'No active complaints' : 'No resolved complaints yet'}</strong>
                <p>
                  {activeTab === 'active'
                    ? 'Open or in-progress issues will appear here as soon as you submit them.'
                    : 'Resolved and closed complaints will move here automatically when admins update them.'}
                </p>
              </div>
            ) : (
              <div className="history-list">
                {visibleComplaints.map((complaint) => (
                  <div key={complaint._id} className="history-item">
                    <div>
                      <strong>{complaint.title}</strong>
                      <span>
                        {complaint.category} · {complaint.priority} priority · {complaint.flatNumber}
                      </span>
                      <span>{complaint.description}</span>
                      <span>
                        Updated {formatDate(complaint.updatedAt)}
                        {complaint.resolvedAt ? ` · Resolved ${formatDate(complaint.resolvedAt)}` : ''}
                      </span>
                      {complaint.adminNote ? <span>Admin note: {complaint.adminNote}</span> : null}
                    </div>
                    <div style={{ display: 'grid', gap: '0.75rem', justifyItems: 'end' }}>
                      <span
                        className="category-badge"
                        style={{
                          '--badge-color': getStatusTone(complaint.status),
                          '--badge-soft':
                            complaint.status === 'Resolved' || complaint.status === 'Closed'
                              ? 'rgba(15, 159, 119, 0.12)'
                              : complaint.status === 'In Progress'
                                ? 'rgba(245, 158, 11, 0.12)'
                                : 'rgba(99, 102, 241, 0.12)'
                        }}
                      >
                        <Icon
                          name={
                            complaint.status === 'Resolved' || complaint.status === 'Closed'
                              ? 'check'
                              : complaint.status === 'In Progress'
                                ? 'tools'
                                : 'clock'
                          }
                          size={15}
                        />
                        <span>{complaint.status}</span>
                      </span>

                      {complaint.status === 'Open' ? (
                        <button
                          type="button"
                          className="button-secondary"
                          onClick={() => handleDelete(complaint._id)}
                          disabled={deletingId === complaint._id}
                        >
                          <Icon name="x" size={16} />
                          <span>{deletingId === complaint._id ? 'Deleting...' : 'Delete'}</span>
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      </main>
    </div>
  );
}
