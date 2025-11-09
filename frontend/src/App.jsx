import React, { useState, useEffect } from 'react';
import LoginComponent from './components/LoginComponent';
import ContentReviewDashboard from './components/ContentReviewDashboard';
import { api } from './api-config';
import { ThemeProvider } from './contexts/ThemeContext';

// Production mode - Authentication enabled
const App = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const data = await api.getCurrentUser();
          if (data && data.user) {
            setUser(data.user);
          } else {
            localStorage.removeItem('authToken');
            setToken(null);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('authToken');
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const handleLogin = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  };

  if (loading) {
    return (
      <ThemeProvider>
        <div className="min-h-screen flex items-center justify-center bg-brutal-light-bg dark:bg-brutal-dark-bg grid-brutal">
          <div className="text-center card-brutal p-8">
            <div className="w-12 h-12 border-4 border-black dark:border-white border-t-transparent animate-spin mx-auto mb-4"></div>
            <p className="text-black dark:text-white font-bold text-lg">Loading...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      {!user ? (
        <LoginComponent onLogin={handleLogin} />
      ) : (
        <ContentReviewDashboard user={user} onLogout={handleLogout} />
      )}
    </ThemeProvider>
  );
};

export default App;
