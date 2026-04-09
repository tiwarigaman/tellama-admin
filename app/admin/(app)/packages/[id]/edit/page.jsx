'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { getAdminPackage, getSessionRequest, listAdminCategories } from '@/lib/admin-api-client';
import { PackageForm } from '@/components/admin/PackageForm';
import { AdminLoader } from '@/components/admin/AdminLoader';

function EditPackageInner() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params?.id != null ? String(params.id) : '';

  const [sessionRole, setSessionRole] = useState(null);
  const [categories, setCategories] = useState([]);
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(searchParams.get('created') === '1');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [session, cats, row] = await Promise.all([
        getSessionRequest(),
        listAdminCategories(),
        getAdminPackage(id),
      ]);
      setSessionRole(session?.role || null);
      setCategories(Array.isArray(cats?.data) ? cats.data : []);
      const data = row?.data;
      if (!data) {
        setError('Tour not found.');
        setPkg(null);
      } else {
        setPkg(data);
      }
    } catch (e) {
      setError(e?.message || 'Failed to load');
      setPkg(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(false), 5000);
      return () => clearTimeout(t);
    }
  }, [success]);

  if (loading && !pkg) {
    return <AdminLoader />;
  }

  if (error && !pkg) {
    return (
      <div>
        <div style={{ marginBottom: '1rem' }}>
          <Link href="/admin/packages" className="admin-muted" style={{ fontSize: '0.875rem' }}>
            ← Tours
          </Link>
        </div>
        <h1 className="admin-page-title">Edit tour</h1>
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
      <h1 className="admin-page-title">Edit tour</h1>
      {success ? (
        <div className="admin-flash admin-flash--success" style={{ marginBottom: '1rem' }}>
          Tour saved. Slug and other fields follow the rules on the server.
        </div>
      ) : null}
      <PackageForm
        mode="edit"
        packageId={id}
        initialPackage={pkg}
        categories={categories}
        sessionRole={sessionRole}
        cancelHref="/admin/packages"
        onSaved={() => {
          setSuccess(true);
          router.replace(`/admin/packages/${encodeURIComponent(id)}/edit`, { scroll: false });
          load();
        }}
      />
    </div>
  );
}

export default function EditPackagePage() {
  return (
    <Suspense fallback={<AdminLoader />}>
      <EditPackageInner />
    </Suspense>
  );
}
