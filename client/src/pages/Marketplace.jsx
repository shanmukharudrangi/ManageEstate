import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import Icon from '../components/Icon';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const CATEGORIES = ['Furniture', 'Electronics', 'Appliances', 'Vehicles', 'Books', 'Other'];
const CATEGORY_ICONS = {
  Furniture: '🛋️',
  Electronics: '💻',
  Appliances: '🏠',
  Vehicles: '🚗',
  Books: '📚',
  Other: '📦',
};

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatPrice(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function StatusBadge({ status }) {
  const colors = {
    available: 'var(--success)',
    pending: 'var(--warning)',
    sold: 'var(--text-soft)',
    archived: 'var(--text-soft)',
  };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.22rem 0.7rem',
        borderRadius: 999,
        fontSize: '0.75rem',
        fontWeight: 700,
        textTransform: 'capitalize',
        letterSpacing: '0.05em',
        background: `color-mix(in srgb, ${colors[status]} 14%, transparent)`,
        color: colors[status],
        border: `1px solid color-mix(in srgb, ${colors[status]} 30%, transparent)`,
      }}
    >
      {status}
    </span>
  );
}

function ListingCard({ listing, onInterested, currentUserId }) {
  const isOwn = listing.sellerId?._id === currentUserId || listing.sellerId === currentUserId;
  const img = listing.images?.[0];
  return (
    <div className="mp-listing-card">
      <div className="mp-listing-img">
        {img ? (
          <img src={img} alt={listing.title} />
        ) : (
          <div className="mp-listing-img-placeholder">
            <span>{CATEGORY_ICONS[listing.category] || '📦'}</span>
          </div>
        )}
        <div className="mp-listing-category-badge">{listing.category}</div>
      </div>
      <div className="mp-listing-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
          <h3 className="mp-listing-title">{listing.title}</h3>
          <StatusBadge status={listing.status} />
        </div>
        <p className="mp-listing-desc">{listing.description}</p>
        <div className="mp-listing-footer">
          <span className="mp-listing-price">{formatPrice(listing.price)}</span>
          <span className="mp-listing-meta">
            {listing.sellerId?.name || 'Unknown'} · {timeAgo(listing.createdAt)}
          </span>
        </div>
        {!isOwn && listing.status === 'available' && (
          <button
            className="button-primary mp-buy-btn"
            onClick={() => onInterested(listing)}
          >
            <Icon name="team" size={16} /> I'm Interested
          </button>
        )}
        {isOwn && (
          <div style={{ marginTop: '0.6rem', fontSize: '0.82rem', color: 'var(--text-soft)', fontStyle: 'italic' }}>
            Your listing
          </div>
        )}
      </div>
    </div>
  );
}

export default function Marketplace({ currentUser, onLogout, onNotify, theme, onToggleTheme }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState('browse');

  // Browse state
  const [listings, setListings] = useState([]);
  const [browseLoading, setBrowseLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [filters, setFilters] = useState({ category: '', search: '', minPrice: '', maxPrice: '', sortBy: 'createdAt', order: 'desc' });
  const [interestedListing, setInterestedListing] = useState(null);
  const [markingSold, setMarkingSold] = useState('');

  // Create listing state
  const [form, setForm] = useState({ title: '', description: '', price: '', category: 'Furniture' });
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  // Profile state
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => { loadListings(1); }, [filters]);
  useEffect(() => { if (tab === 'profile') loadProfile(); }, [tab]);

  const loadListings = async (page = 1) => {
    setBrowseLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12, sortBy: filters.sortBy, order: filters.order });
      if (filters.category) params.set('category', filters.category);
      if (filters.search.trim()) params.set('search', filters.search.trim());
      if (filters.minPrice) params.set('minPrice', filters.minPrice);
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
      const res = await fetch(`${API_BASE}/marketplace/listings?${params}`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setListings(data.listings);
      setPagination(data.pagination);
    } catch (err) {
      onNotify({ title: 'Failed to load listings', message: err.message, tone: 'danger' });
    } finally {
      setBrowseLoading(false);
    }
  };

  const loadProfile = async () => {
    setProfileLoading(true);
    try {
      const res = await fetch(`${API_BASE}/marketplace/profile/me`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setProfile(data);
    } catch (err) {
      onNotify({ title: 'Failed to load profile', message: err.message, tone: 'danger' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files).slice(0, 5);
    setFiles(selected);
    setPreviews(selected.map((f) => URL.createObjectURL(f)));
  };

  const removeFile = (idx) => {
    const nextFiles = files.filter((_, i) => i !== idx);
    const nextPreviews = previews.filter((_, i) => i !== idx);
    setFiles(nextFiles);
    setPreviews(nextPreviews);
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.price) {
      onNotify({ title: 'Validation error', message: 'Please fill in all required fields.', tone: 'danger' });
      return;
    }
    setSubmitting(true);
    try {
      const body = new FormData();
      body.append('title', form.title.trim());
      body.append('description', form.description.trim());
      body.append('price', form.price);
      body.append('category', form.category);
      files.forEach((f) => body.append('images', f));

      const res = await fetch(`${API_BASE}/marketplace/listings`, {
        method: 'POST',
        headers: authHeaders(),
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.errors?.join(', ') || data.message);
      onNotify({ title: 'Listing created!', message: `"${data.listing.title}" is now live.`, tone: 'success' });
      setForm({ title: '', description: '', price: '', category: 'Furniture' });
      setFiles([]);
      setPreviews([]);
      setTab('browse');
      loadListings(1);
    } catch (err) {
      onNotify({ title: 'Failed to create listing', message: err.message, tone: 'danger' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInterested = (listing) => {
    setInterestedListing(listing);
  };

  const handleMarkSold = async (listingId) => {
    setMarkingSold(listingId);
    try {
      const res = await fetch(`${API_BASE}/marketplace/listings/${listingId}`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'sold' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onNotify({ title: 'Marked as sold!', message: 'The listing has been moved to your sales history.', tone: 'success' });
      loadProfile();
    } catch (err) {
      onNotify({ title: 'Error', message: err.message, tone: 'danger' });
    } finally {
      setMarkingSold('');
    }
  };

  const handleLogout = () => { onLogout(); navigate('/'); };

  return (
    <div className="dashboard-shell">
      <div className="page-aurora" />

      <header className="dashboard-topbar">
        <BrandLogo compact />
        <div className="dashboard-actions">
          <button className="button-secondary" onClick={() => navigate('/dashboard')}>
            <Icon name="trend" size={18} /> <span>Dashboard</span>
          </button>
          <button className="button-secondary" onClick={() => navigate('/complaints')}>
            <Icon name="alert" size={18} /> <span>Complaints</span>
          </button>
          <button className="theme-toggle" onClick={onToggleTheme}>
            <Icon name={theme === 'light' ? 'moon' : 'sun'} size={18} />
            <span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
          </button>
          <button className="button-secondary" onClick={handleLogout}>
            <Icon name="logout" size={18} /> <span>Logout</span>
          </button>
        </div>
      </header>

      {interestedListing && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
          onClick={() => setInterestedListing(null)}
        >
          <div
            className="glass-panel"
            style={{ maxWidth: 440, width: '100%', padding: '2rem', borderRadius: 16 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.35rem' }}>{interestedListing.title}</h2>
            <p style={{ color: 'var(--text-soft)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>{interestedListing.description}</p>
            <div style={{ background: 'color-mix(in srgb, var(--accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-soft)', marginBottom: '0.6rem' }}>Seller Contact</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Icon name="team" size={16} />
                  <strong>{interestedListing.sellerId?.name || 'Unknown'}</strong>
                </div>
                {interestedListing.sellerId?.apartment && (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.9rem', color: 'var(--text-soft)' }}>
                    <Icon name="home" size={16} />
                    <span>Apt {interestedListing.sellerId.apartment}</span>
                  </div>
                )}
                {interestedListing.sellerId?.email && (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.9rem', color: 'var(--text-soft)' }}>
                    <Icon name="alert" size={16} />
                    <span>{interestedListing.sellerId.email}</span>
                  </div>
                )}
              </div>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-soft)', marginBottom: '1rem' }}>
              Contact the seller directly to arrange viewing and payment. The seller will mark the item as sold once the deal is done.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--brand)' }}>{formatPrice(interestedListing.price)}</span>
              <button className="button-secondary" onClick={() => setInterestedListing(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <main className="dashboard-content" style={{ paddingBottom: '3rem' }}>
        <div className="mp-hero glass-panel" style={{ marginBottom: '1.5rem' }}>
          <div>
            <div className="eyebrow-pill">
              <Icon name="store" size={16} />
              <span>Community Marketplace</span>
            </div>
            <h1 className="dashboard-title" style={{ marginTop: '0.75rem' }}>Buy &amp; Sell<br />with Neighbours</h1>
            <p className="dashboard-subtitle" style={{ marginTop: '0.6rem' }}>
              A trusted space for society residents to exchange goods — no middleman, no fees.
            </p>
          </div>
          <div className="mp-hero-stats">
            <div className="metric-card metric-card-compact">
              <span className="metric-label">Active Listings</span>
              <strong>{browseLoading ? '—' : pagination.total}</strong>
            </div>
            <div className="metric-card metric-card-compact">
              <span className="metric-label">Categories</span>
              <strong>{CATEGORIES.length}</strong>
            </div>
            <div className="metric-card metric-card-compact">
              <span className="metric-label">Your Apartment</span>
              <strong>{currentUser?.apartment || '—'}</strong>
            </div>
          </div>
        </div>

        <div className="segmented-control" style={{ marginBottom: '1.5rem' }}>
          {[
            { key: 'browse', icon: 'store', label: 'Browse' },
            { key: 'sell', icon: 'plus', label: 'Sell an Item' },
            { key: 'profile', icon: 'team', label: 'My Listings' },
          ].map(({ key, icon, label }) => (
            <button key={key} className={tab === key ? 'is-active' : ''} onClick={() => setTab(key)}>
              <Icon name={icon} size={16} /> {label}
            </button>
          ))}
        </div>

        {tab === 'browse' && (
          <div>
            <div className="mp-filters glass-panel">
              <div className="mp-filter-row">
                <div className="field-block" style={{ flex: 2 }}>
                  <label className="field-label">Search</label>
                  <input
                    className="field-input"
                    placeholder="Search listings…"
                    value={filters.search}
                    onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                  />
                </div>
                <div className="field-block" style={{ flex: 1 }}>
                  <label className="field-label">Category</label>
                  <select
                    className="field-input"
                    value={filters.category}
                    onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
                  >
                    <option value="">All categories</option>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="field-block" style={{ flex: 1 }}>
                  <label className="field-label">Min Price (₹)</label>
                  <input
                    className="field-input"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={filters.minPrice}
                    onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))}
                  />
                </div>
                <div className="field-block" style={{ flex: 1 }}>
                  <label className="field-label">Max Price (₹)</label>
                  <input
                    className="field-input"
                    type="number"
                    min="0"
                    placeholder="Any"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))}
                  />
                </div>
                <div className="field-block" style={{ flex: 1 }}>
                  <label className="field-label">Sort By</label>
                  <select
                    className="field-input"
                    value={`${filters.sortBy}-${filters.order}`}
                    onChange={(e) => {
                      const [sortBy, order] = e.target.value.split('-');
                      setFilters((f) => ({ ...f, sortBy, order }));
                    }}
                  >
                    <option value="createdAt-desc">Newest first</option>
                    <option value="createdAt-asc">Oldest first</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </div>

            {browseLoading ? (
              <div className="mp-empty-state">
                <div className="spinner-ring" />
                <p>Loading listings…</p>
              </div>
            ) : listings.length === 0 ? (
              <div className="mp-empty-state glass-panel">
                <span style={{ fontSize: '2.5rem' }}>🛍️</span>
                <strong>No listings found</strong>
                <p>Try adjusting your filters or be the first to sell something!</p>
                <button className="button-primary" onClick={() => setTab('sell')}>
                  <Icon name="plus" size={18} /> Create a Listing
                </button>
              </div>
            ) : (
              <>
                <div className="mp-listings-grid">
                  {listings.map((l) => (
                    <ListingCard
                      key={l._id}
                      listing={l}
                      onInterested={handleInterested}
                      currentUserId={currentUser?._id || currentUser?.id}
                    />
                  ))}
                </div>
                {pagination.totalPages > 1 && (
                  <div className="mp-pagination">
                    <button
                      className="button-secondary"
                      disabled={pagination.page <= 1}
                      onClick={() => loadListings(pagination.page - 1)}
                    >
                      <Icon name="arrow-left" size={16} /> Prev
                    </button>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      className="button-secondary"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => loadListings(pagination.page + 1)}
                    >
                      Next <Icon name="arrow-right" size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === 'sell' && (
          <div className="glass-panel mp-form-panel">
            <div className="section-head">
              <div>
                <p className="section-kicker">New Listing</p>
                <h2 className="section-heading">List an Item for Sale</h2>
              </div>
            </div>
            <form className="form-grid" onSubmit={handleCreateListing} style={{ marginTop: '1.5rem' }}>
              <div className="two-columns form-grid">
                <div className="field-block">
                  <label className="field-label">Title *</label>
                  <input
                    className="field-input"
                    placeholder="e.g. Wooden bookshelf, barely used"
                    maxLength={120}
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="field-block">
                  <label className="field-label">Category *</label>
                  <select
                    className="field-input"
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  >
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="field-block">
                <label className="field-label">Description *</label>
                <textarea
                  className="field-input"
                  rows={4}
                  placeholder="Describe the item — condition, dimensions, reason for selling…"
                  maxLength={2000}
                  style={{ resize: 'vertical', lineHeight: 1.6 }}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  required
                />
              </div>

              <div className="field-block" style={{ maxWidth: 240 }}>
                <label className="field-label">Asking Price (₹) *</label>
                <input
                  className="field-input"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  required
                />
              </div>

              <div className="field-block">
                <label className="field-label">Photos (up to 5)</label>
                <div
                  className="mp-upload-zone"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); handleFileChange({ files: e.dataTransfer.files }); }}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <Icon name="image" size={28} />
                  <span>Click or drag &amp; drop images here</span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-soft)' }}>JPG, PNG, WebP · max 5MB each · up to 5 files</span>
                </div>
                {previews.length > 0 && (
                  <div className="mp-image-previews">
                    {previews.map((src, i) => (
                      <div key={i} className="mp-image-thumb">
                        <img src={src} alt={`Preview ${i + 1}`} />
                        <button type="button" className="mp-image-remove" onClick={() => removeFile(i)}>
                          <Icon name="x" size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="button-secondary" onClick={() => setTab('browse')}>
                  Cancel
                </button>
                <button type="submit" className="button-primary" disabled={submitting}>
                  {submitting ? (
                    <><div className="spinner-ring" style={{ width: 18, height: 18, borderWidth: 2 }} /> Publishing…</>
                  ) : (
                    <><Icon name="plus" size={18} /> Publish Listing</>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {tab === 'profile' && (
          <div>
            {profileLoading ? (
              <div className="mp-empty-state">
                <div className="spinner-ring" />
                <p>Loading your profile…</p>
              </div>
            ) : profile ? (
              <>
                <div className="summary-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1.5rem' }}>
                  <div className="metric-card">
                    <span className="metric-label">Active Listings</span>
                    <strong style={{ fontSize: '2rem' }}>{profile.summary.activeCount}</strong>
                    <p>Items currently for sale</p>
                  </div>
                  <div className="metric-card">
                    <span className="metric-label">Items Sold</span>
                    <strong style={{ fontSize: '2rem', color: 'var(--success)' }}>{profile.summary.soldCount}</strong>
                    <p>Completed transactions</p>
                  </div>
                  <div className="metric-card">
                    <span className="metric-label">Total Revenue</span>
                    <strong style={{ fontSize: '2rem', color: 'var(--brand)' }}>
                      {formatPrice(profile.summary.totalRevenue)}
                    </strong>
                    <p>Earned from sales</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: '1fr 1fr' }}>
                  <div className="glass-panel mp-profile-section">
                    <div className="section-head" style={{ marginBottom: '1rem' }}>
                      <div>
                        <p className="section-kicker">Active</p>
                        <h3 className="section-heading" style={{ fontSize: '1.2rem' }}>Your Listings</h3>
                      </div>
                      <button className="button-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }} onClick={() => setTab('sell')}>
                        <Icon name="plus" size={16} /> Add New
                      </button>
                    </div>
                    {profile.activeListings.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-soft)' }}>
                        <span style={{ fontSize: '2rem' }}>📭</span>
                        <p style={{ marginTop: '0.5rem' }}>No active listings yet</p>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {profile.activeListings.map((l) => (
                          <div key={l._id} className="mp-profile-listing-row" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div className="mp-profile-listing-icon">{CATEGORY_ICONS[l.category] || '📦'}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</div>
                              <div style={{ fontSize: '0.82rem', color: 'var(--text-soft)', marginTop: '0.15rem' }}>{timeAgo(l.createdAt)}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 800, color: 'var(--brand)' }}>{formatPrice(l.price)}</div>
                                <StatusBadge status={l.status} />
                              </div>
                              <button
                                className="button-secondary"
                                style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', color: 'var(--success)' }}
                                disabled={markingSold === l._id}
                                onClick={() => handleMarkSold(l._id)}
                              >
                                {markingSold === l._id ? 'Saving…' : 'Mark Sold'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="glass-panel mp-profile-section">
                    <div style={{ marginBottom: '1rem' }}>
                      <p className="section-kicker">History</p>
                      <h3 className="section-heading" style={{ fontSize: '1.2rem' }}>Sales Record</h3>
                    </div>
                    {profile.salesHistory.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-soft)' }}>
                        <span style={{ fontSize: '2rem' }}>🏷️</span>
                        <p style={{ marginTop: '0.5rem' }}>No sales yet — keep listing!</p>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {profile.salesHistory.map((t) => (
                          <div key={t._id} className="mp-profile-listing-row">
                            <div className="mp-profile-listing-icon">{CATEGORY_ICONS[t.listingId?.category] || '📦'}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {t.listingId?.title || 'Deleted listing'}
                              </div>
                              <div style={{ fontSize: '0.82rem', color: 'var(--text-soft)', marginTop: '0.15rem' }}>
                                Sold to {t.buyerId?.name || 'Unknown'} · {t.buyerId?.apartment || ''} · {timeAgo(t.createdAt)}
                              </div>
                            </div>
                            <div style={{ fontWeight: 800, color: 'var(--success)', flexShrink: 0 }}>{formatPrice(t.purchasePrice)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="mp-empty-state glass-panel">
                <span style={{ fontSize: '2rem' }}>⚠️</span>
                <p>Could not load your profile. Please try again.</p>
                <button className="button-secondary" onClick={loadProfile}>Retry</button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
