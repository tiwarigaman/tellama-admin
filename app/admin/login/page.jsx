'use client';

import { useState } from 'react';
import { loginRequest } from '@/lib/admin-api-client';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const ac = new AbortController();
    const timeoutMs = 30_000;
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    try {
      await loginRequest(username, password, { signal: ac.signal });

      const sessionRes = await fetch('/api/auth/session', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!sessionRes.ok) {
        setError(
          'The API accepted your password, but this app cannot verify that token. Set JWT_ACCESS_SECRET in tel-admin/.env to exactly match tel-backend/.env, restart both apps, and try again. See .env.example in this repo for details.',
        );
        return;
      }

      window.location.assign('/admin');
    } catch (err) {
      if (err?.name === 'AbortError') {
        setError(
          `No response within ${timeoutMs / 1000}s. Start tel-backend and check TEL_API_URL in .env (e.g. http://localhost:4000).`,
        );
      } else {
        setError(err?.message || 'Login failed');
      }
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  }

  return (
    <div className="admin-login">
      <div className="admin-card admin-login-card">
        <h1>India Tellama — Admin</h1>
        <p>
          Super admin: username matches <code>ADMIN_USERNAME</code> on the API. Staff: use your work email and
          password. Backend: <code>TEL_API_URL</code>.
        </p>
        {error ? <div className="admin-flash admin-flash--error">{error}</div> : null}
        <form onSubmit={onSubmit} className="admin-login-form">
          <div className="admin-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="admin-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="admin-btn admin-btn--primary admin-login__submit" disabled={loading}>
            {loading ? <span className="admin-spinner" aria-label="Loading" /> : null}
            {loading ? ' Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
