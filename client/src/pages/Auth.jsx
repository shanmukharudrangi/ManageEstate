import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
// Instead of: <img src={communityImg} />
// Use:
<img src="/assets/login_page_1780062410462.png" alt="..." />
import BrandLogo from '../components/BrandLogo';
import Icon from '../components/Icon';
import { login, signup } from '../utils/api';
import {
  evaluatePassword,
  getPasswordStrengthMeta,
  PASSWORD_RULES
} from '../utils/passwordValidation';

const INITIAL_FORM_DATA = {
  name: '',
  email: '',
  password: '',
  apartment: '',
  role: 'resident'
};

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function Auth({ onAuthSuccess, onNotify, theme, onToggleTheme }) {
  const [searchParams] = useSearchParams();
  const [isSignup, setIsSignup] = useState(searchParams.get('mode') === 'signup');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [formErrors, setFormErrors] = useState({});
  const [adminRequestNote, setAdminRequestNote] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [pendingSuccess, setPendingSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const passwordEvaluation = evaluatePassword(formData.password);
  const passwordStrength = getPasswordStrengthMeta(passwordEvaluation.score);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value
    }));

    setFormErrors((currentErrors) => ({
      ...currentErrors,
      [name]: ''
    }));
  };

  const handleRoleChange = (role) => {
    setFormData((currentData) => ({
      ...currentData,
      role
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (isSignup && !formData.name.trim()) {
      errors.name = 'Enter the resident or admin name.';
    }

    if (!isValidEmail(formData.email)) {
      errors.email = 'Enter a valid email address.';
    }

    if (!formData.password) {
      errors.password = 'Enter your password.';
    } else if (isSignup && !passwordEvaluation.isValid) {
      errors.password =
        'Use 8+ characters with uppercase, lowercase, a number, and a special character.';
    }

    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateForm();

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      onNotify({
        title: 'Check your details',
        message: 'A few fields still need attention before we can continue.',
        tone: 'danger'
      });
      return;
    }

    setLoading(true);

    try {
      const response = isSignup
        ? await signup({
            ...formData,
            name: formData.name.trim(),
            email: formData.email.trim(),
            adminRequestNote: formData.role === 'admin' ? adminRequestNote.trim() : '',
            joinCode: formData.role === 'resident' ? joinCode.trim() : ''
          })
        : await login({
            email: formData.email.trim(),
            password: formData.password
          });

      if (response.data.pendingApproval) {
        setPendingSuccess(true);
        return;
      }

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onAuthSuccess(response.data.user);
      onNotify({
        title: isSignup ? 'Account ready' : 'Welcome back',
        message: isSignup
          ? 'Your account has been created successfully.'
          : 'You are signed in and ready to go.',
        tone: 'success'
      });

      const { role } = response.data.user;
      if (role === 'superadmin') {
        navigate('/superadmin');
      } else if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to continue. Please try again.';
      setFormErrors((currentErrors) => ({
        ...currentErrors,
        password: error.response?.data?.passwordRules ? message : currentErrors.password
      }));
      onNotify({
        title: error.response?.status === 403 ? 'Access denied' : 'Authentication failed',
        message,
        tone: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="page-aurora" />
      <div className="auth-topbar">
        <Link to="/" className="auth-back-home">
          <BrandLogo compact />
        </Link>
        <div className="auth-topbar-right">
          <Link to="/" className="auth-home-btn">
            <Icon name="arrow-left" size={16} />
            <span>Back to home</span>
          </Link>
          <button type="button" className="theme-toggle" onClick={onToggleTheme}>
            <Icon name={theme === 'light' ? 'moon' : 'sun'} size={18} />
            <span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
          </button>
        </div>
      </div>

      <div className="auth-layout">
        <section className="auth-photo-panel">
          <img src={communityImg} alt="ManageEstate residential community" className="auth-photo-bg" />
          <div className="auth-photo-overlay">
            <div className="auth-photo-top">
              <div className="eyebrow-pill auth-photo-pill">
                <Icon name="spark" size={15} />
                <span>Estate Management Platform</span>
              </div>
            </div>
            <div className="auth-photo-bottom">
              <h2 className="auth-photo-heading">
                Transparent maintenance,<br />for every resident.
              </h2>
              <p className="auth-photo-sub">
                Every rupee accounted for. Every month, clearly broken down.
              </p>
              <div className="auth-photo-stats">
                <div className="auth-photo-stat">
                  <strong>100%</strong>
                  <span>Fee transparency</span>
                </div>
                <div className="auth-photo-stat-divider" />
                <div className="auth-photo-stat">
                  <strong>AI</strong>
                  <span>Expense assistant</span>
                </div>
                <div className="auth-photo-stat-divider" />
                <div className="auth-photo-stat">
                  <strong>JWT</strong>
                  <span>Secure sessions</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="auth-panel glass-panel">
          <div className="auth-panel-head">
            <div>
              <p className="section-kicker">{isSignup ? 'Create account' : 'Welcome back'}</p>
              <h2 className="section-heading">
                {isSignup ? 'Set up your workspace' : 'Sign in to continue'}
              </h2>
            </div>
            <div className="segmented-control">
              <button
                type="button"
                className={!isSignup ? 'is-active' : ''}
                onClick={() => {
                  setIsSignup(false);
                  setFormErrors({});
                }}
              >
                Login
              </button>
              <button
                type="button"
                className={isSignup ? 'is-active' : ''}
                onClick={() => {
                  setIsSignup(true);
                  setFormErrors({});
                }}
              >
                Sign up
              </button>
            </div>
          </div>

          {pendingSuccess ? (
            <div className="pending-success-screen">
              <div className="pending-success-icon">✓</div>
              <h3 className="pending-success-title">Request Submitted!</h3>
              <p className="pending-success-text">
                Your request has been sent to the Super Admin for review.
                You will be able to log in once it is approved.
              </p>
              <button
                type="button"
                className="button-primary auth-submit"
                onClick={() => {
                  setPendingSuccess(false);
                  setIsSignup(false);
                  setFormData(INITIAL_FORM_DATA);
                  setAdminRequestNote('');
                  setFormErrors({});
                }}
              >
                Back to Login
              </button>
            </div>
          ) : null}

          <form
            className="auth-form"
            onSubmit={handleSubmit}
            style={pendingSuccess ? { display: 'none' } : undefined}
          >
            {isSignup ? (
              <>
                <div className="form-grid two-columns">
                  <label className="field-block">
                    <span className="field-label">Full name</span>
                    <input
                      className={`field-input ${formErrors.name ? 'field-input-error' : ''}`}
                      type="text"
                      name="name"
                      placeholder="e.g. Priya Nair"
                      value={formData.name}
                      onChange={handleChange}
                    />
                    {formErrors.name ? <span className="field-error">{formErrors.name}</span> : null}
                  </label>

                  <label className="field-block">
                    <span className="field-label">Apartment</span>
                    <input
                      className="field-input"
                      type="text"
                      name="apartment"
                      placeholder="e.g. B-503"
                      value={formData.apartment}
                      onChange={handleChange}
                    />
                  </label>
                </div>

                <div className="field-block">
                  <span className="field-label">Choose role</span>
                  <div className="role-toggle">
                    {['resident', 'admin'].map((role) => (
                      <button
                        key={role}
                        type="button"
                        className={formData.role === role ? 'role-card role-card-active' : 'role-card'}
                        onClick={() => handleRoleChange(role)}
                      >
                        <strong>{role === 'resident' ? 'Resident' : 'Admin'}</strong>
                        <span>
                          {role === 'resident'
                            ? 'View breakdowns, trends, and AI help'
                            : 'Add monthly expenses and manage records'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {formData.role === 'resident' && (
                  <div className="field-block">
                    <span className="field-label">Society Join Code *</span>
                    <input
                      className="field-input"
                      type="password"
                      placeholder="Ask your society admin"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                    />
                    <span className="field-hint">Residents must enter the society join code to register.</span>
                  </div>
                )}

                {formData.role === 'admin' && (
                  <>
                    <div className="field-block">
                      <span className="field-label">Why do you need admin access?</span>
                      <textarea
                        className="field-input admin-note-textarea"
                        placeholder="e.g. I am the treasurer of Sunshine Apartments"
                        maxLength={200}
                        value={adminRequestNote}
                        onChange={(e) => setAdminRequestNote(e.target.value)}
                        rows={3}
                      />
                      <span className="field-hint admin-note-count">
                        {adminRequestNote.length} / 200
                      </span>
                    </div>
                    <div className="admin-approval-info">
                      <span>ℹ️</span>
                      <p>
                        Admin access requires Super Admin approval. You can only login after
                        your request is approved.
                      </p>
                    </div>
                  </>
                )}
              </>
            ) : null}

            <label className="field-block">
              <span className="field-label">Email address</span>
              <input
                className={`field-input ${formErrors.email ? 'field-input-error' : ''}`}
                type="email"
                name="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
              />
              {formErrors.email ? <span className="field-error">{formErrors.email}</span> : null}
            </label>

            <label className="field-block">
              <span className="field-label">Password</span>
              <div className="password-input-wrap">
                <input
                  className={`field-input ${formErrors.password ? 'field-input-error' : ''}`}
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder={isSignup ? 'Create a strong password' : 'Enter your password'}
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="password-eye-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {formErrors.password ? (
                <span className="field-error">{formErrors.password}</span>
              ) : (
                <span className="field-hint">
                  {isSignup
                    ? 'Use a password that is hard to guess and easy for you to remember.'
                    : 'Your password is compared securely on the server.'}
                </span>
              )}
            </label>

            {isSignup ? (
              <div className="password-panel">
                <div className="password-meter-head">
                  <strong>Password strength</strong>
                  <span className={`strength-badge tone-${passwordStrength.tone}`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="strength-bars">
                  {PASSWORD_RULES.map((rule) => {
                    const ruleState = passwordEvaluation.rules.find((item) => item.id === rule.id);

                    return (
                      <span
                        key={rule.id}
                        className={ruleState?.passed ? 'strength-bar is-filled' : 'strength-bar'}
                      />
                    );
                  })}
                </div>
                <div className="requirement-list">
                  {passwordEvaluation.rules.map((rule) => (
                    <div key={rule.id} className={rule.passed ? 'requirement is-met' : 'requirement'}>
                      <Icon name={rule.passed ? 'check' : 'alert'} size={14} />
                      <span>{rule.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <button type="submit" className="button-primary auth-submit" disabled={loading}>
              {loading
                ? 'Please wait...'
                : isSignup
                  ? formData.role === 'admin'
                    ? 'Submit Admin Request'
                    : 'Create account'
                  : 'Login →'}
              {!loading && <Icon name="arrow-right" size={18} />}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
