'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSessionRequest, listAdminCategories } from '@/lib/admin-api-client';
import { PackageForm } from '@/components/admin/PackageForm';
import { AdminLoader } from '@/components/admin/AdminLoader';
import { isTelPackageSeoOnlyRole } from '@/lib/tel-access-payload';

export default function NewPackagePage() {
  const router = useRouter();
  const [sessionRole, setSessionRole] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let skipLoadingOff = false;
    (async () => {
      try {
        const [session, data] = await Promise.all([getSessionRequest(), listAdminCategories()]);
        if (cancelled) return;
        const role = session?.role || null;
        setSessionRole(role);
        if (isTelPackageSeoOnlyRole(role)) {
          skipLoadingOff = true;
          router.replace('/admin/packages');
          return;
        }
        setCategories(Array.isArray(data?.data) ? data.data : []);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load');
      } finally {
        if (!cancelled && !skipLoadingOff) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) {
    return <AdminLoader />;
  }

  if (error) {
    return (
      <div>
        <h1 className="admin-page-title">New tour</h1>
        <div className="admin-flash admin-flash--error">{error}</div>
        <Link href="/admin/packages" className="admin-btn admin-btn--ghost">
          Back to tours
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <Link href="/admin/packages" className="admin-muted" style={{ fontSize: '0.875rem' }}>
          ← Tours
        </Link>
      </div>
      <h1 className="admin-page-title">New tour</h1>
      <PackageForm
        mode="create"
        categories={categories}
        sessionRole={sessionRole}
        cancelHref="/admin/packages"
        onSaved={(id) => {
          if (id) router.push(`/admin/packages/${encodeURIComponent(id)}/edit?created=1`);
          else router.push('/admin/packages');
        }}
      />
    </div>
  );
}
