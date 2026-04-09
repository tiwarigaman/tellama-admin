'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { getAdminBlog, getSessionRequest } from '@/lib/admin-api-client';
import { BlogForm } from '@/components/admin/BlogForm';
import { AdminLoader } from '@/components/admin/AdminLoader';

function EditBlogInner() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params?.slug != null ? String(params.slug) : '';

  const [sessionRole, setSessionRole] = useState(null);
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(searchParams.get('created') === '1');

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError('');
    try {
      const [session, row] = await Promise.all([getSessionRequest(), getAdminBlog(slug)]);
      setSessionRole(session?.role || null);
      setBlog(row?.data || null);
    } catch (e) {
      setError(e?.message || 'Failed to load blog');
      setBlog(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(false), 4000);
      return () => clearTimeout(t);
    }
  }, [success]);

  if (loading && !blog) return <AdminLoader />;

  if (!blog && error) {
    return (
      <div>
        <p className="admin-muted" style={{ marginBottom: '1rem' }}><Link href="/admin/blogs">← Blogs</Link></p>
        <h1 className="admin-page-title">Edit blog</h1>
        <div className="admin-flash admin-flash--error">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <p className="admin-muted" style={{ marginBottom: '1rem' }}><Link href="/admin/blogs">← Blogs</Link></p>
      <h1 className="admin-page-title">Edit blog</h1>
      {success ? <div className="admin-flash admin-flash--success" style={{ marginBottom: '1rem' }}>Blog saved.</div> : null}
      <BlogForm
        mode="edit"
        blogSlug={slug}
        initialBlog={blog}
        sessionRole={sessionRole}
        cancelHref="/admin/blogs"
        onSaved={(newSlug) => {
          setSuccess(true);
          const target = newSlug || slug;
          router.replace(`/admin/blogs/${encodeURIComponent(target)}/edit`, { scroll: false });
          load();
        }}
      />
    </div>
  );
}

export default function EditBlogPage() {
  return (
    <Suspense fallback={<AdminLoader />}>
      <EditBlogInner />
    </Suspense>
  );
}

