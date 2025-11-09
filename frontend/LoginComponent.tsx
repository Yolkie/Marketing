import React, { useState } from 'react';
import { LogIn, AlertCircle, Loader, Moon, Sun } from 'lucide-react';
import { useTheme } from './src/contexts/ThemeContext.jsx';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const LoginComponent = ({ onLogin }) => {
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Authentication failed');
      }

      // Store token
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Call onLogin callback
      onLogin(data.user, data.token);
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brutal-light-bg dark:bg-brutal-dark-bg grid-brutal flex items-center justify-center p-4">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 btn-brutal p-3 z-50"
        aria-label="Toggle theme"
      >
        {theme === 'light' ? (
          <Moon className="w-5 h-5" />
        ) : (
          <Sun className="w-5 h-5" />
        )}
      </button>

      <div className="w-full max-w-md">
        {/* Main Card */}
        <div className="card-brutal p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-block mb-6">
              <div className="border-4 border-black dark:border-white bg-black dark:bg-white p-4 shadow-brutal-lg">
                <LogIn className="w-10 h-10 text-white dark:text-black" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-black dark:text-white mb-3 tracking-tight">
              WELCOME BACK
            </h1>
            <div className="border-2 border-black dark:border-white bg-white dark:bg-black px-4 py-2 inline-block">
              <p className="text-sm font-bold text-black dark:text-white uppercase tracking-wider">
                Sign in to continue
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 border-4 border-red-500 bg-red-500 p-4 shadow-brutal">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-white flex-shrink-0 mt-0.5" />
                <p className="text-sm font-bold text-white">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-black text-black dark:text-white mb-2 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="input-brutal w-full px-4 py-3 text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-black dark:text-white mb-2 uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
                className="input-brutal w-full px-4 py-3 text-lg"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-brutal-primary w-full px-6 py-4 text-lg uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>SIGNING IN...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>SIGN IN</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Decorative Elements */}
        <div className="mt-8 flex gap-4 justify-center">
          <div className="border-2 border-black dark:border-white bg-white dark:bg-black w-12 h-12 shadow-brutal-sm"></div>
          <div className="border-2 border-black dark:border-white bg-black dark:bg-white w-12 h-12 shadow-brutal-sm"></div>
          <div className="border-2 border-black dark:border-white bg-white dark:bg-black w-12 h-12 shadow-brutal-sm"></div>
        </div>
      </div>
    </div>
  );
};

export default LoginComponent;
