import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import Icon from '../components/Icon';
import { addExpense, getAllExpenses } from '../utils/api';
import {
  buildDefaultExpenseList,
  buildExpenseFormRows,
  formatCurrency,
  formatMonthLabel,
  getCategoryMeta
} from '../utils/expenseMeta';

const getCurrentMonth = () => new Date().toISOString().slice(0, 7);

function sortExpenseHistory(expenses = []) {
  return [...expenses].sort((first, second) => second.month.localeCompare(first.month));
}

export default function AdminDashboard({
  currentUser,
  onLogout,
  onNotify,
  theme,
  onToggleTheme
}) {
  const [month, setMonth] = useState(getCurrentMonth());
  const [expenses, setExpenses] = useState(buildDefaultExpenseList());
  const [expenseHistory, setExpenseHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadExpenseHistory();
  }, []);

  useEffect(() => {
    const selectedRecord = expenseHistory.find((record) => record.month === month);

    if (selectedRecord) {
      setExpenses(buildExpenseFormRows(selectedRecord.expenses));
      return;
    }

    setExpenses(buildDefaultExpenseList());
  }, [expenseHistory, month]);

  const loadExpenseHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await getAllExpenses();
      const sortedHistory = sortExpenseHistory(response.data);
      setExpenseHistory(sortedHistory);

      if (sortedHistory.length > 0 && !sortedHistory.some((record) => record.month === month)) {
        setMonth(sortedHistory[0].month);
      }
    } catch (error) {
      onNotify({
        title: 'Unable to load saved months',
        message: error.response?.data?.message || 'Please refresh and try again.',
        tone: 'danger'
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleExpenseChange = (index, field, value) => {
    setExpenses((currentExpenses) =>
      currentExpenses.map((expense, expenseIndex) =>
        expenseIndex === index ? { ...expense, [field]: value } : expense
      )
    );
  };

  const handleAddCategory = () => {
    setExpenses((currentExpenses) => [
      ...currentExpenses,
      { category: 'Other', amount: '', description: '' }
    ]);
  };

  const handleRemoveCategory = (index) => {
    setExpenses((currentExpenses) =>
      currentExpenses.filter((expense, expenseIndex) => expenseIndex !== index || expense.category !== 'Other')
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const sanitizedExpenses = expenses
      .map((expense) => ({
        ...expense,
        amount: Number(expense.amount),
        description: expense.description.trim()
      }))
      .filter((expense) => Number.isFinite(expense.amount) && expense.amount > 0);

    if (!month) {
      onNotify({
        title: 'Month required',
        message: 'Select the maintenance month before saving.',
        tone: 'danger'
      });
      return;
    }

    if (sanitizedExpenses.length === 0) {
      onNotify({
        title: 'Add at least one expense',
        message: 'Every saved month needs one or more positive expense amounts.',
        tone: 'danger'
      });
      return;
    }

    setSaveLoading(true);

    try {
      const response = await addExpense({
        month,
        expenses: sanitizedExpenses,
        totalAmount: sanitizedExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      });

      const savedExpense = response.data.expense;
      const nextHistory = sortExpenseHistory([
        savedExpense,
        ...expenseHistory.filter((record) => record.month !== savedExpense.month)
      ]);

      setExpenseHistory(nextHistory);
      onNotify({
        title: savedExpense.month === month ? 'Month saved' : 'Record updated',
        message: `${formatMonthLabel(month)} is now stored in MongoDB and ready for residents.`,
        tone: 'success'
      });
    } catch (error) {
      onNotify({
        title: 'Unable to save month',
        message: error.response?.data?.message || 'Please try again in a moment.',
        tone: 'danger'
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const activeMonthRecord = expenseHistory.find((record) => record.month === month);
  const totalAmount = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const managedTotal = expenseHistory.reduce((sum, record) => sum + Number(record.totalAmount || 0), 0);
  const averageMonthly = expenseHistory.length > 0 ? managedTotal / expenseHistory.length : 0;

  return (
    <div className="dashboard-shell">
      <div className="page-aurora" />
      <header className="dashboard-topbar">
        <BrandLogo compact />
        <div className="dashboard-actions">
          <button
            type="button"
            className="button-secondary"
            onClick={() => navigate('/voting')}
          >
            <Icon name="spark" size={18} />
            <span>Votes</span>
          </button>
          <button
            type="button"
            className="button-secondary"
            onClick={() => navigate('/announcements')}
          >
            <Icon name="bell" size={18} />
            <span>Notices</span>
          </button>
          <button
            type="button"
            className="button-secondary"
            onClick={() => navigate('/payments')}
          >
            <Icon name="wallet" size={18} />
            <span>Payments</span>
          </button>
          <button
            type="button"
            className="button-secondary"
            onClick={() => navigate('/admin/complaints')}
          >
            <Icon name="alert" size={18} />
            <span>Complaints</span>
          </button>
          <button
            type="button"
            className="button-secondary"
            onClick={() => navigate('/marketplace')}
          >
            <Icon name="store" size={18} />
            <span>Marketplace</span>
          </button>
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
              <span>Admin control center</span>
            </div>
            <h1 className="dashboard-title">Welcome back, {currentUser?.name || 'Admin'}.</h1>
            <p className="dashboard-subtitle">
              Save monthly maintenance breakdowns, revisit historical records, and keep
              residents informed with consistent, well-structured data.
            </p>
          </div>
          <div className="hero-meta">
            <span className="info-chip">
              <Icon name="clock" size={16} />
              {activeMonthRecord ? 'Editing saved month' : 'Creating a new month'}
            </span>
            <span className="info-chip">
              <Icon name="calendar" size={16} />
              {formatMonthLabel(month)}
            </span>
          </div>
        </section>

        <section className="summary-grid">
          <article className="metric-card">
            <span className="metric-label">Tracked months</span>
            <strong>{expenseHistory.length}</strong>
            <p>Historical records available for quick reload.</p>
          </article>
          <article className="metric-card">
            <span className="metric-label">Managed total</span>
            <strong>{formatCurrency(managedTotal)}</strong>
            <p>Total maintenance budget captured so far.</p>
          </article>
          <article className="metric-card">
            <span className="metric-label">Average month</span>
            <strong>{formatCurrency(averageMonthly)}</strong>
            <p>Helpful baseline for spotting unusual jumps.</p>
          </article>
          <article className="metric-card">
            <span className="metric-label">Current draft</span>
            <strong>{formatCurrency(totalAmount)}</strong>
            <p>{activeMonthRecord ? 'Loaded from saved data.' : 'Ready to save when complete.'}</p>
          </article>
        </section>

        <section className="dashboard-grid admin-grid">
          <article className="glass-panel section-card">
            <div className="section-head">
              <div>
                <p className="section-kicker">Monthly editor</p>
                <h2 className="section-heading">Build or update a breakdown</h2>
              </div>
              <button type="button" className="button-secondary" onClick={handleAddCategory}>
                <Icon name="plus" size={18} />
                <span>Add category</span>
              </button>
            </div>

            <form className="expense-form" onSubmit={handleSubmit}>
              <label className="field-block">
                <span className="field-label">Maintenance month</span>
                <div className="month-input-wrap">
                  <Icon name="calendar" size={18} />
                  <input
                    className="field-input month-input"
                    type="month"
                    value={month}
                    onChange={(event) => setMonth(event.target.value)}
                  />
                </div>
                <span className="field-hint">
                  Choosing an existing month automatically loads its saved values.
                </span>
              </label>

              <div className="category-legend">
                {expenses.map((expense, index) => {
                  const meta = getCategoryMeta(expense.category);

                  return (
                    <div
                      key={`${expense.category}-legend-${index}`}
                      className="category-badge"
                      style={{
                        '--badge-color': meta.color,
                        '--badge-soft': meta.soft
                      }}
                    >
                      <Icon name={meta.icon} size={15} />
                      <span>{expense.category}</span>
                    </div>
                  );
                })}
              </div>

              <div className="expense-row-list">
                {expenses.map((expense, index) => {
                  const meta = getCategoryMeta(expense.category);
                  const isExtraOther = expense.category === 'Other' && index >= 4;

                  return (
                    <div
                      key={`${expense.category}-${index}`}
                      className="expense-editor-row"
                      style={{
                        '--category-color': meta.color,
                        '--category-soft': meta.soft,
                        '--category-glow': meta.glow
                      }}
                    >
                      <div className="expense-editor-head">
                        <div className="expense-editor-title">
                          <span className="category-icon-chip">
                            <Icon name={meta.icon} size={16} />
                          </span>
                          <strong>{expense.category}</strong>
                        </div>
                        {isExtraOther ? (
                          <button
                            type="button"
                            className="icon-button"
                            onClick={() => handleRemoveCategory(index)}
                            aria-label="Remove extra category"
                          >
                            <Icon name="x" size={14} />
                          </button>
                        ) : null}
                      </div>

                      <div className="form-grid two-columns">
                        <label className="field-block">
                          <span className="field-label">Category</span>
                          <select
                            className="field-input"
                            value={expense.category}
                            onChange={(event) =>
                              handleExpenseChange(index, 'category', event.target.value)
                            }
                          >
                            <option value="Staff Salary">Staff Salary</option>
                            <option value="Repairs & Maintenance">Repairs & Maintenance</option>
                            <option value="Utilities">Utilities</option>
                            <option value="Reserve Fund">Reserve Fund</option>
                            <option value="Other">Other</option>
                          </select>
                        </label>

                        <label className="field-block">
                          <span className="field-label">Amount</span>
                          <input
                            className="field-input"
                            type="number"
                            min="0"
                            step="0.01"
                            value={expense.amount}
                            placeholder="0"
                            onChange={(event) =>
                              handleExpenseChange(index, 'amount', event.target.value)
                            }
                          />
                        </label>
                      </div>

                      <label className="field-block">
                        <span className="field-label">Description</span>
                        <input
                          className="field-input"
                          type="text"
                          value={expense.description}
                          placeholder="Describe what this amount covers"
                          onChange={(event) =>
                            handleExpenseChange(index, 'description', event.target.value)
                          }
                        />
                      </label>
                    </div>
                  );
                })}
              </div>

              <div className="submit-row">
                <div className="total-preview">
                  <span>Total for {formatMonthLabel(month)}</span>
                  <strong>{formatCurrency(totalAmount)}</strong>
                </div>
                <button type="submit" className="button-primary" disabled={saveLoading}>
                  <Icon name="save" size={18} />
                  <span>{saveLoading ? 'Saving month...' : 'Save monthly breakdown'}</span>
                </button>
              </div>
            </form>
          </article>

          <aside className="sidebar-stack">
            <article className="glass-panel section-card">
              <div className="section-head">
                <div>
                  <p className="section-kicker">Saved history</p>
                  <h2 className="section-heading">Previously added months</h2>
                </div>
              </div>

              {historyLoading ? (
                <div className="loading-card">
                  <div className="spinner-ring spinner-ring-small" />
                  <p>Loading saved months...</p>
                </div>
              ) : expenseHistory.length > 0 ? (
                <div className="history-list">
                  {expenseHistory.map((record) => (
                    <button
                      key={record._id || record.month}
                      type="button"
                      className={record.month === month ? 'history-item is-active' : 'history-item'}
                      onClick={() => setMonth(record.month)}
                    >
                      <div>
                        <strong>{formatMonthLabel(record.month)}</strong>
                        <span>{record.expenses.length} categories saved</span>
                      </div>
                      <span>{formatCurrency(record.totalAmount)}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Icon name="calendar" size={24} />
                  <strong>No months saved yet</strong>
                  <p>Your first saved breakdown will appear here for quick editing.</p>
                </div>
              )}
            </article>

            <article className="glass-panel section-card">
              <div className="section-head">
                <div>
                  <p className="section-kicker">Selected month</p>
                  <h2 className="section-heading">Quick review</h2>
                </div>
              </div>

              {activeMonthRecord ? (
                <div className="month-review">
                  <div className="month-review-total">
                    <span>{formatMonthLabel(activeMonthRecord.month)}</span>
                    <strong>{formatCurrency(activeMonthRecord.totalAmount)}</strong>
                  </div>
                  <div className="review-list">
                    {activeMonthRecord.expenses.map((expense, index) => {
                      const meta = getCategoryMeta(expense.category);

                      return (
                        <div
                          key={`${expense.category}-review-${index}`}
                          className="review-row"
                          style={{
                            '--badge-color': meta.color,
                            '--badge-soft': meta.soft
                          }}
                        >
                          <div className="review-category">
                            <span className="category-dot" />
                            <span>{expense.category}</span>
                          </div>
                          <strong>{formatCurrency(expense.amount)}</strong>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <Icon name="spark" size={24} />
                  <strong>This month is a fresh draft</strong>
                  <p>Start entering categories and save to make it part of the historical record.</p>
                </div>
              )}
            </article>
          </aside>
        </section>
      </main>
    </div>
  );
}
