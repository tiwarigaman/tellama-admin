'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSessionRequest } from '@/lib/admin-api-client';
import { isTelBlogSeoOnlyRole } from '@/lib/tel-access-payload';
import { AdminLoader } from '@/components/admin/AdminLoader';
import { BlogForm } from '@/components/admin/BlogForm';

export default function NewBlogPage() {
  const router = useRouter();
  const [sessionRole, setSessionRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await getSessionRequest();
        if (cancelled) return;
        const role = session?.role || null;
        setSessionRole(role);
        if (isTelBlogSeoOnlyRole(role)) {
          router.replace('/admin/blogs');
          return;
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) return <AdminLoader />;

  if (error) {
    return (
      <div>
        <h1 className="admin-page-title">New blog</h1>
        <div className="admin-flash admin-flash--error">{error}</div>
        <Link href="/admin/blogs" className="admin-btn admin-btn--ghost">Back to blogs</Link>
      </div>
    );
  }

  return (
    <div>
      <p className="admin-muted" style={{ marginBottom: '1rem' }}>
        <Link href="/admin/blogs">← Blogs</Link>
      </p>
      <h1 className="admin-page-title">New blog</h1>
      <BlogForm
        mode="create"
        sessionRole={sessionRole}
        cancelHref="/admin/blogs"
        onSaved={(slug) => {
          if (slug) router.push(`/admin/blogs/${encodeURIComponent(slug)}/edit?created=1`);
          else router.push('/admin/blogs');
        }}
      />
    </div>
  );
}

