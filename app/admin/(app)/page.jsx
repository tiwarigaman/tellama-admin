'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AdminLoader } from '@/components/admin/AdminLoader';
import { getAdminDashboard, getSessionRequest } from '@/lib/admin-api-client';

function StatCard({ label, value }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-card__label">{label}</div>
      <div className="admin-stat-card__value">{value ?? '—'}</div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [role, setRole] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [session, dashboard] = await Promise.all([getSessionRequest(), getAdminDashboard()]);
        if (cancelled) return;
        setRole(session?.role || null);
        setData(dashboard?.data || dashboard || null);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading && !data) return <AdminLoader />;

  const scope = data?.scope || 'own';
  const users = data?.users || {};
  const blogs = data?.blogs || {};
  const tours = data?.tours || {};
  const enquiries = data?.enquiries || {};
  const createdBy = Array.isArray(data?.createdBy) ? data.createdBy : [];

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <h1 className="admin-page-title" style={{ margin: 0, flex: '1 1 auto' }}>
          Dashboard
        </h1>
        <span className="admin-badge">{scope === 'all' ? 'ALL DATA' : 'OWN DATA'}</span>
      </div>

      <p className="admin-muted" style={{ marginBottom: '1rem' }}>
        Role: <strong>{role || '—'}</strong>. This dashboard follows your backend scope rules.
      </p>

      {error ? <div className="admin-flash admin-flash--error">{error}</div> : null}

      <div className="admin-stat-grid">
        <StatCard label="Blogs (total)" value={blogs.total ?? 0} />
        <StatCard label="Blogs (published)" value={blogs.published ?? 0} />
        <StatCard label="Blogs (draft)" value={blogs.draft ?? 0} />
        <StatCard label="Blogs (pending)" value={blogs.pending ?? 0} />
        <StatCard label="Tours (packages)" value={tours.packages ?? 0} />
        <StatCard label="Tours (categories)" value={tours.categories ?? 0} />
        <StatCard label="Enquiries" value={enquiries.total ?? 0} />
        {scope === 'all' ? <StatCard label="Users (active/total)" value={`${users.active ?? 0}/${users.total ?? 0}`} /> : null}
      </div>

      <div className="admin-card" style={{ maxWidth: 980, marginTop: '1rem' }}>
        <h2 className="admin-card__heading">Quick actions</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <Link href="/admin/categories" className="admin-btn admin-btn--ghost">Categories</Link>
          <Link href="/admin/packages" className="admin-btn admin-btn--ghost">Tours</Link>
          <Link href="/admin/blogs" className="admin-btn admin-btn--ghost">Blogs</Link>
          <Link href="/admin/enquiries" className="admin-btn admin-btn--ghost">Enquiries</Link>
          <Link href="/admin/profile" className="admin-btn admin-btn--ghost">My profile</Link>
        </div>
      </div>

      {scope === 'all' ? (
        <div className="admin-card" style={{ marginTop: '1rem' }}>
          <h2 className="admin-card__heading">Created by breakdown</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Packages</th>
                  <th>Categories</th>
                  <th>Blogs</th>
                </tr>
              </thead>
              <tbody>
                {createdBy.length === 0 ? (
                  <tr><td colSpan={6} className="admin-muted">No breakdown data.</td></tr>
                ) : createdBy.map((row) => (
                  <tr key={row.userId || row.email}>
                    <td>{row.email || row.userId || '—'}</td>
                    <td>{row.role || '—'}</td>
                    <td>{row.isActive ? 'Active' : 'Inactive'}</td>
                    <td>{row.packages ?? 0}</td>
                    <td>{row.categories ?? 0}</td>
                    <td>{row.blogs ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
