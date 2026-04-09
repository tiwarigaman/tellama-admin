'use client';

export function AdminLoader() {
  return (
    <div className="admin-loader-overlay" role="status" aria-label="Loading">
      <div className="admin-spinner" />
    </div>
  );
}
