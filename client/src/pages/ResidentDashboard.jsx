import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import BrandLogo from '../components/BrandLogo';
import Icon from '../components/Icon';
import { askAI, getAllExpenses, getExpenseBreakdown, getTrends } from '../utils/api';
import { formatCurrency, formatMonthLabel, getCategoryMeta } from '../utils/expenseMeta';

const getCurrentMonth = () => new Date().toISOString().slice(0, 7);
const SUGGESTED_PROMPTS = [
  'Which category is highest this month?',
  'Why might total maintenance be high this month?',
  'Summarize this month in simple words.'
];

function sortExpenseHistory(expenses = []) {
  return [...expenses].sort((first, second) => second.month.localeCompare(first.month));
}

export default function ResidentDashboard({
  currentUser,
  onLogout,
  onNotify,
  theme,
  onToggleTheme
}) {
  const [month, setMonth] = useState(getCurrentMonth());
  const [expenseHistory, setExpenseHistory] = useState([]);
  const [breakdown, setBreakdown] = useState(null);
  const [breakdownError, setBreakdownError] = useState('');
  const [breakdownLoading, setBreakdownLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [trends, setTrends] = useState([]);
  const [aiMessages, setAiMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [createdBy, setCreatedBy] = useState(null);
  const navigate = useNavigate();

  // Memoized calculations
  const chartData = useMemo(() => 
    breakdown ? breakdown.map((item) => ({
      name: item.category,
      value: item.amount,
      percentage: item.percentage,
      color: getCategoryMeta(item.category).color
    })) : [], 
  [breakdown]);

  const highestCategory = useMemo(() => 
    breakdown && breakdown.length > 0 
      ? breakdown.reduce((largest, current) => (current.amount > largest.amount ? current : largest), breakdown[0])
      : null, 
  [breakdown]);

  const loadBreakdown = useCallback(async (selectedMonth) => {
    try {
      setBreakdownLoading(true);
      const response = await getExpenseBreakdown(selectedMonth);
      setBreakdown(response.data.breakdown);
      setTotalAmount(response.data.totalAmount);
      setCreatedBy(response.data.createdBy);
      setBreakdownError('');
    } catch (error) {
      setBreakdown(null);
      setTotalAmount(0);
      setCreatedBy(null);
      setBreakdownError(error.response?.data?.message || 'No expense data is available.');
    } finally {
      setBreakdownLoading(false);
    }
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const [historyResponse, trendsResponse] = await Promise.all([getAllExpenses(), getTrends()]);
      const sortedHistory = sortExpenseHistory(historyResponse.data);
      setExpenseHistory(sortedHistory);
      setTrends(trendsResponse.data);

      if (sortedHistory.length > 0 && !sortedHistory.some((record) => record.month === month)) {
        setMonth(sortedHistory[0].month);
      }
    } catch (error) {
      onNotify({
        title: 'Unable to load dashboard',
        message: error.response?.data?.message || 'Please refresh and try again.',
        tone: 'danger'
      });
    } finally {
      setHistoryLoading(false);
    }
  }, [month, onNotify]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    if (!historyLoading && month) {
      loadBreakdown(month);
    }
  }, [month, historyLoading, loadBreakdown]);

  const sendQuestion = useCallback(async (nextQuestion) => {
    const trimmedQuestion = nextQuestion.trim();
    if (!trimmedQuestion) return;

    setChatLoading(true);
    setAiMessages((prev) => [...prev, { role: 'user', content: trimmedQuestion }]);
    setQuestion('');

    try {
      const response = await askAI({ question: trimmedQuestion, month });
      setAiMessages((prev) => [...prev, { role: 'assistant', content: response.data.answer }]);
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to get an AI response.';
      setAiMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${message}` }]);
      onNotify({ title: 'AI response unavailable', message, tone: 'danger' });
    } finally {
      setChatLoading(false);
    }
  }, [month, onNotify]);

  const handleAskAI = (event) => {
    event.preventDefault();
    sendQuestion(question);
  };

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const chartData = breakdown
    ? breakdown.map((item) => ({
        name: item.category,
        value: item.amount,
        percentage: item.percentage,
        color: getCategoryMeta(item.category).color
      }))
    : [];

  const highestCategory = breakdown
    ? breakdown.reduce((largest, current) => (current.amount > largest.amount ? current : largest), breakdown[0])
    : null;

  return (
    <div className="dashboard-shell">
      <div className="page-aurora" />
      <header className="dashboard-topbar">
        <BrandLogo compact />
        <div className="dashboard-actions">
          <button
            type="button"
            className="button-secondary"
            onClick={() => navigate('/marketplace')}
          >
            <Icon name="store" size={18} />
            <span>Marketplace</span>
          </button>
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
            onClick={() => navigate('/complaints')}
          >
            <Icon name="alert" size={18} />
            <span>Complaints</span>
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
              <Icon name="chat" size={16} />
              <span>Resident transparency hub</span>
            </div>
            <h1 className="dashboard-title">Hello, {currentUser?.name || 'Resident'}.</h1>
            <p className="dashboard-subtitle">
              Explore how your maintenance fee is allocated, compare changes across months,
              and use the AI assistant when you want a quick explanation.
            </p>
          </div>
          <div className="hero-meta">
            <span className="info-chip">
              <Icon name="calendar" size={16} />
              {formatMonthLabel(month)}
            </span>
            <span className="info-chip">
              <Icon name="spark" size={16} />
              {createdBy?.name ? `Prepared by ${createdBy.name}` : 'Waiting for month data'}
            </span>
          </div>
        </section>

        <section className="summary-grid">
          <article className="metric-card">
            <span className="metric-label">Selected month total</span>
            <strong>{formatCurrency(totalAmount)}</strong>
            <p>Live total for the month you are reviewing now.</p>
          </article>
          <article className="metric-card">
            <span className="metric-label">Largest category</span>
            <strong>{highestCategory ? highestCategory.category : 'Not available'}</strong>
            <p>{highestCategory ? formatCurrency(highestCategory.amount) : 'Add expenses to view insights.'}</p>
          </article>
          <article className="metric-card">
            <span className="metric-label">Months available</span>
            <strong>{expenseHistory.length}</strong>
            <p>Past records you can revisit instantly from the selector.</p>
          </article>
          <article className="metric-card">
            <span className="metric-label">AI helper</span>
            <strong>{chatLoading ? 'Thinking...' : 'Ready'}</strong>
            <p>Ask follow-up questions about the selected month.</p>
          </article>
        </section>

        <section className="dashboard-grid resident-grid">
          <article className="glass-panel section-card">
            <div className="section-head">
              <div>
                <p className="section-kicker">Visual breakdown</p>
                <h2 className="section-heading">Where your maintenance money went</h2>
              </div>
              <label className="month-select-card">
                <span>Review month</span>
                <div className="month-select-wrap">
                  <Icon name="calendar" size={16} />
                  <select
                    className="field-input month-select"
                    value={month}
                    onChange={(event) => setMonth(event.target.value)}
                    disabled={expenseHistory.length === 0}
                  >
                    {expenseHistory.length === 0 ? (
                      <option value={month}>{formatMonthLabel(month)}</option>
                    ) : (
                      expenseHistory.map((record) => (
                        <option key={record._id || record.month} value={record.month}>
                          {formatMonthLabel(record.month)}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </label>
            </div>

            {breakdownLoading ? (
              <div className="loading-card">
                <div className="spinner-ring spinner-ring-small" />
                <p>Loading month breakdown...</p>
              </div>
            ) : breakdown ? (
              <>
                <div className="chart-summary">
                  <div>
                    <span className="chart-label">Maintenance total</span>
                    <strong>{formatCurrency(totalAmount)}</strong>
                  </div>
                  <div>
                    <span className="chart-label">Created by</span>
                    <strong>{createdBy?.name || 'Admin'}</strong>
                  </div>
                </div>

                <div className="chart-card">
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={4}
                      >
                        {chartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [formatCurrency(value), 'Amount']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="breakdown-list">
                  {breakdown.map((item, index) => {
                    const meta = getCategoryMeta(item.category);

                    return (
                      <div key={`${item.category}-${index}`} className="breakdown-item">
                        <div className="breakdown-main">
                          <div
                            className="category-badge"
                            style={{
                              '--badge-color': meta.color,
                              '--badge-soft': meta.soft
                            }}
                          >
                            <Icon name={meta.icon} size={15} />
                            <span>{item.category}</span>
                          </div>
                          <p>{item.description || 'No description provided for this category.'}</p>
                        </div>
                        <div className="breakdown-meta">
                          <strong>{formatCurrency(item.amount)}</strong>
                          <span>{item.percentage}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <Icon name="alert" size={24} />
                <strong>No breakdown available</strong>
                <p>{breakdownError}</p>
              </div>
            )}
          </article>

          <article className="glass-panel section-card chat-panel">
            <div className="section-head">
              <div>
                <p className="section-kicker">AI assistant</p>
                <h2 className="section-heading">Ask questions about this month</h2>
              </div>
            </div>

            <div className="prompt-row">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="prompt-chip"
                  onClick={() => sendQuestion(prompt)}
                  disabled={chatLoading || !breakdown}
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="chat-thread">
              {aiMessages.length === 0 ? (
                <div className="empty-state compact-empty">
                  <Icon name="chat" size={22} />
                  <strong>Start a conversation</strong>
                  <p>Questions you ask here are answered using the currently selected month.</p>
                </div>
              ) : (
                aiMessages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={message.role === 'user' ? 'chat-bubble chat-user' : 'chat-bubble chat-assistant'}
                  >
                    {message.content}
                  </div>
                ))
              )}
            </div>

            <form className="chat-form" onSubmit={handleAskAI}>
              <input
                className="field-input"
                type="text"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask about spending, trends, or category changes..."
                disabled={!breakdown}
              />
              <button type="submit" className="button-primary" disabled={chatLoading || !breakdown}>
                <Icon name="arrow-right" size={18} />
                <span>{chatLoading ? 'Sending...' : 'Ask AI'}</span>
              </button>
            </form>
          </article>
        </section>

        <section className="glass-panel section-card">
          <div className="section-head">
            <div>
              <p className="section-kicker">Historical trendline</p>
              <h2 className="section-heading">How maintenance changed over time</h2>
            </div>
          </div>

          {historyLoading ? (
            <div className="loading-card">
              <div className="spinner-ring spinner-ring-small" />
              <p>Loading trends...</p>
            </div>
          ) : trends.length > 0 ? (
            <div className="chart-card">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.18)" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="totalAmount" stroke="#6366f1" name="Total amount" strokeWidth={3} />
                  <Line type="monotone" dataKey="Staff Salary" stroke="#4f46e5" />
                  <Line type="monotone" dataKey="Utilities" stroke="#0ea5e9" />
                  <Line type="monotone" dataKey="Repairs & Maintenance" stroke="#ec4899" />
                  <Line type="monotone" dataKey="Reserve Fund" stroke="#8b5cf6" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state">
              <Icon name="trend" size={24} />
              <strong>No trend data yet</strong>
              <p>Once more months are added, trend comparisons will show up here.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
