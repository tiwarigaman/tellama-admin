/**
 * Browser-side API wrapper — all calls go through Next.js BFF routes, which proxy
 * to tel-backend (`TEL_API_URL` / `api/v1`). No MongoDB or local DB.
 */

const jsonHeaders = { 'Content-Type': 'application/json' };

/** Build a readable message from tel-backend / Zod / Nest / FastAPI-style payloads. */
function formatApiErrorMessage(data, statusText) {
  const base = data?.error || data?.message || statusText || 'Request failed';

  const fieldErrors = data?.fieldErrors;
  if (fieldErrors && typeof fieldErrors === 'object' && !Array.isArray(fieldErrors)) {
    const parts = Object.entries(fieldErrors).flatMap(([k, v]) => {
      const msgs = Array.isArray(v) ? v : v != null ? [String(v)] : [];
      return msgs.map((m) => `${k}: ${m}`);
    });
    if (parts.length) return `${base} — ${parts.join('; ')}`;
  }

  const issues = data?.details ?? data?.issues ?? data?.errors;
  if (Array.isArray(issues) && issues.length) {
    const parts = issues.map((i) => {
      const p =
        i.path != null
          ? Array.isArray(i.path)
            ? i.path.filter((x) => x !== '' && x != null).join('.')
            : String(i.path)
          : i.field != null
            ? String(i.field)
            : '';
      const msg = i.message || i.msg || (typeof i === 'string' ? i : JSON.stringify(i));
      return p ? `${p}: ${msg}` : msg;
    });
    return `${base} — ${parts.join('; ')}`;
  }

  const detail = data?.detail;
  if (Array.isArray(detail) && detail.length) {
    const parts = detail.map((d) =>
      typeof d === 'string' ? d : d?.msg || d?.message || JSON.stringify(d),
    );
    return `${base} — ${parts.join('; ')}`;
  }
  if (typeof detail === 'string' && detail.trim()) {
    return `${base} — ${detail.trim()}`;
  }

  return base;
}

async function handle(res) {
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text || 'Invalid response' };
  }
  if (!res.ok) {
    const err = new Error(formatApiErrorMessage(data, res.statusText));
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/**
 * @param {string} username
 * @param {string} password
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function loginRequest(username, password, options = {}) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify({ username, password }),
    signal: options.signal,
  });
  return handle(res);
}

export async function logoutRequest() {
  const res = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });
  return handle(res);
}

export async function refreshSessionRequest() {
  const res = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  });
  return handle(res);
}

/** Current tel-backend session from access JWT (role, email). */
export async function getSessionRequest() {
  const res = await fetch('/api/auth/session', {
    credentials: 'include',
    cache: 'no-store',
  });
  return handle(res);
}

export async function listAdminCategories() {
  const res = await fetch('/api/admin/categories', {
    credentials: 'include',
    cache: 'no-store',
  });
  return handle(res);
}

/** Body must not include `slug` — server generates it. */
export async function createAdminCategory(body) {
  const res = await fetch('/api/admin/categories', {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify(body),
  });
  return handle(res);
}

export async function updateAdminCategory(id, body) {
  const res = await fetch(`/api/admin/categories/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify(body),
  });
  return handle(res);
}

export async function deleteAdminCategory(id) {
  const res = await fetch(`/api/admin/categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handle(res);
}

export async function listAdminUsers() {
  const res = await fetch('/api/admin/users', {
    credentials: 'include',
    cache: 'no-store',
  });
  return handle(res);
}

/** @param {{ email: string, password: string, role: string }} body */
export async function createAdminUser(body) {
  const res = await fetch('/api/admin/users', {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify(body),
  });
  return handle(res);
}

/** Set a new sign-in password for a staff user (tel-backend PATCH /admin/users/:id). */
export async function updateStaffUserPassword(id, password) {
  const res = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify({ password }),
  });
  return handle(res);
}

/** Remove a staff user (tel-backend DELETE /admin/users/:id). */
export async function deleteStaffUser(id) {
  const res = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handle(res);
}

/** @param {string} [categoryId] - optional UUID filter */
export async function listAdminPackages(categoryId) {
  const q = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : '';
  const res = await fetch(`/api/admin/packages${q}`, {
    credentials: 'include',
    cache: 'no-store',
  });
  return handle(res);
}

/**
 * Load one package. Uses GET /admin/packages/:id; if the server returns 404, falls back to scanning the full list.
 */
export async function getAdminPackage(id) {
  const res = await fetch(`/api/admin/packages/${encodeURIComponent(id)}`, {
    credentials: 'include',
    cache: 'no-store',
  });
  if (res.ok) return handle(res);
  if (res.status === 404) {
    const list = await listAdminPackages();
    const row = Array.isArray(list?.data) ? list.data.find((p) => p.id === id) : null;
    if (row) return { data: row };
  }
  return handle(res);
}

/** Body must not include `slug` — server generates from title. */
export async function createAdminPackage(body) {
  const res = await fetch('/api/admin/packages', {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify(body),
  });
  return handle(res);
}

export async function updateAdminPackage(id, body) {
  const res = await fetch(`/api/admin/packages/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify(body),
  });
  return handle(res);
}

export async function deleteAdminPackage(id) {
  const res = await fetch(`/api/admin/packages/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handle(res);
}

/** @param {File} file */
export async function uploadAdminFile(file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/admin/uploads', {
    method: 'POST',
    body: fd,
    credentials: 'include',
  });
  return handle(res);
}

export async function deleteAdminUpload(url) {
  const res = await fetch('/api/admin/uploads', {
    method: 'DELETE',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify({ url }),
  });
  if (res.status === 204 || res.status === 404) return null;
  return handle(res);
}

/**
 * Admin enquiries
 * @param {{ source?: string, packageId?: string, q?: string, limit?: number, offset?: number }} [params]
 */
export async function listAdminEnquiries(params = {}) {
  const qs = new URLSearchParams();
  if (params.source) qs.set('source', String(params.source));
  if (params.packageId) qs.set('packageId', String(params.packageId));
  if (params.q) qs.set('q', String(params.q));
  if (params.limit != null) qs.set('limit', String(params.limit));
  if (params.offset != null) qs.set('offset', String(params.offset));
  const q = qs.toString() ? `?${qs.toString()}` : '';

  const res = await fetch(`/api/admin/enquiries${q}`, {
    credentials: 'include',
    cache: 'no-store',
  });
  return handle(res);
}

export async function getAdminEnquiry(id) {
  const res = await fetch(`/api/admin/enquiries/${encodeURIComponent(id)}`, {
    credentials: 'include',
    cache: 'no-store',
  });
  return handle(res);
}

/**
 * Blogs
 * @param {{ status?: string, q?: string, limit?: number, offset?: number }} [params]
 */
export async function listAdminBlogs(params = {}) {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', String(params.status));
  if (params.q) qs.set('q', String(params.q));
  if (params.limit != null) qs.set('limit', String(params.limit));
  if (params.offset != null) qs.set('offset', String(params.offset));
  const q = qs.toString() ? `?${qs.toString()}` : '';

  const res = await fetch(`/api/admin/blogs${q}`, {
    credentials: 'include',
    cache: 'no-store',
  });
  return handle(res);
}

export async function getAdminBlog(slug) {
  const res = await fetch(`/api/admin/blogs/${encodeURIComponent(slug)}`, {
    credentials: 'include',
    cache: 'no-store',
  });
  return handle(res);
}

export async function createAdminBlog(body) {
  const res = await fetch('/api/admin/blogs', {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify(body),
  });
  return handle(res);
}

export async function updateAdminBlog(slug, body) {
  const res = await fetch(`/api/admin/blogs/${encodeURIComponent(slug)}`, {
    method: 'PATCH',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify(body),
  });
  return handle(res);
}

export async function deleteAdminBlog(slug) {
  const res = await fetch(`/api/admin/blogs/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handle(res);
}

/** Own profile */
export async function getAdminProfile() {
  const res = await fetch('/api/admin/profile', {
    credentials: 'include',
    cache: 'no-store',
  });
  return handle(res);
}

export async function updateAdminProfile(body) {
  const res = await fetch('/api/admin/profile', {
    method: 'PATCH',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify(body),
  });
  return handle(res);
}

/** Role-aware dashboard data */
export async function getAdminDashboard() {
  const res = await fetch('/api/admin/dashboard', {
    credentials: 'include',
    cache: 'no-store',
  });
  return handle(res);
}
