import React from 'react'
// ... rest of imports
import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import BrandLogo from './components/BrandLogo';
import ToastStack from './components/ToastStack';
import AdminDashboard from './pages/AdminDashboard';
import AdminComplaints from './pages/AdminComplaints';
import Auth from './pages/Auth';
import Landing from './pages/Landing';
import ResidentComplaints from './pages/ResidentComplaints';
import ResidentDashboard from './pages/ResidentDashboard';
import SuperAdminPanel from './pages/SuperAdminPanel';
import Marketplace from './pages/Marketplace';
import Voting from './pages/Voting';
import Announcements from './pages/Announcements';
import Payments from './pages/Payments';

function getStoredUser() {
  try {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return null;
  }
}

function getStoredTheme() {
  const storedTheme = localStorage.getItem('theme');

  if (storedTheme === 'dark' || storedTheme === 'light') {
    return storedTheme;
  }

  return 'light';
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(getStoredTheme);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    setUser(getStoredUser());
    setLoading(false);
  }, []);

  const showToast = ({ title, message, tone = 'info' }) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    setToasts((currentToasts) => [...currentToasts, { id, title, message, tone }]);

    window.setTimeout(() => {
      setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
    }, 3200);
  };

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'));
  };

  const handleAuthSuccess = (nextUser) => {
    setUser(nextUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    showToast({
      title: 'Signed out',
      message: 'Your session has been safely closed.',
      tone: 'info'
    });
  };

  if (loading) {
    return (
      <div className="app-loading-screen">
        <div className="app-loading-card">
          <BrandLogo accent="light" />
          <div className="spinner-ring" />
          <p>Preparing your maintenance workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <ToastStack toasts={toasts} />
      <Routes>
        <Route
          path="/"
          element={
            user ? (
              user.role === 'superadmin' ? (
                <Navigate to="/superadmin" replace />
              ) : user.role === 'admin' ? (
                <Navigate to="/admin" replace />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Landing theme={theme} onToggleTheme={toggleTheme} />
            )
          }
        />

        <Route
          path="/auth"
          element={
            user ? (
              user.role === 'superadmin' ? (
                <Navigate to="/superadmin" replace />
              ) : user.role === 'admin' ? (
                <Navigate to="/admin" replace />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Auth
                onAuthSuccess={handleAuthSuccess}
                onNotify={showToast}
                theme={theme}
                onToggleTheme={toggleTheme}
              />
            )
          }
        />

        <Route
          path="/admin"
          element={
            user?.role === 'admin' || user?.role === 'superadmin' ? (
              <AdminDashboard
                currentUser={user}
                onLogout={handleLogout}
                onNotify={showToast}
                theme={theme}
                onToggleTheme={toggleTheme}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/admin/complaints"
          element={
            user?.role === 'admin' || user?.role === 'superadmin' ? (
              <AdminComplaints currentUser={user} onNotify={showToast} theme={theme} onToggleTheme={toggleTheme} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/dashboard"
          element={
            user?.role === 'resident' ? (
              <ResidentDashboard
                currentUser={user}
                onLogout={handleLogout}
                onNotify={showToast}
                theme={theme}
                onToggleTheme={toggleTheme}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/complaints"
          element={
            user?.role === 'resident' ? (
              <ResidentComplaints currentUser={user} onNotify={showToast} theme={theme} onToggleTheme={toggleTheme} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/marketplace"
          element={
            user?.role === 'resident' || user?.role === 'admin' || user?.role === 'superadmin' ? (
              <Marketplace
                currentUser={user}
                onLogout={handleLogout}
                onNotify={showToast}
                theme={theme}
                onToggleTheme={toggleTheme}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/voting"
          element={
            user ? (
              <Voting currentUser={user} onLogout={handleLogout} onNotify={showToast} theme={theme} onToggleTheme={toggleTheme} />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        <Route
          path="/announcements"
          element={
            user ? (
              <Announcements currentUser={user} onLogout={handleLogout} onNotify={showToast} theme={theme} onToggleTheme={toggleTheme} />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        <Route
          path="/payments"
          element={
            user ? (
              <Payments currentUser={user} onLogout={handleLogout} onNotify={showToast} theme={theme} onToggleTheme={toggleTheme} />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        <Route
          path="/superadmin"
          element={
            user?.role === 'superadmin' ? (
              <SuperAdminPanel
                currentUser={user}
                onLogout={handleLogout}
                onNotify={showToast}
                theme={theme}
                onToggleTheme={toggleTheme}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
