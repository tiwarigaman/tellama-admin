/**
 * Tel-backend access JWT payload checks (shared by middleware + API routes).
 * Tokens from POST /api/v1/auth/login include `role` for staff/super-admin.
 */

export const TEL_ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'SEO_EDITOR'];

/**
 * @param {Record<string, unknown>} payload - decoded JWT payload
 * @returns {boolean}
 */
export function isTelAccessTokenPayload(payload) {
  if (!payload || typeof payload !== 'object') return false;
  const typ = payload.typ ?? payload.type ?? payload.token_use;
  if (typ === 'refresh') return false;

  if (payload.sub === 'admin' && (typ === 'access' || typ === undefined)) return true;
  if (typeof payload.role === 'string' && TEL_ADMIN_ROLES.includes(payload.role)) return true;
  if (typ === 'access') return true;

  const hasIdentity =
    (typeof payload.sub === 'string' && payload.sub.length > 0) ||
    typeof payload.email === 'string' ||
    typeof payload.userId === 'string' ||
    typeof payload.id === 'string';

  return hasIdentity;
}

/**
 * @param {string | undefined} role
 */
export function canCreateTelCategory(role) {
  return role && role !== 'SEO_EDITOR';
}

/**
 * @param {string | undefined} role
 */
export function canDeleteTelCategory(role) {
  return role && role !== 'SEO_EDITOR';
}

/**
 * SUPER_ADMIN / ADMIN only — `allowsSubcategories` on top-level rows.
 * @param {string | undefined} role
 */
export function canSetAllowsSubcategories(role) {
  return role === 'SUPER_ADMIN' || role === 'ADMIN';
}

/**
 * Non-SEO field edits (name, parent, sort, image, etc.).
 * @param {string | undefined} role
 */
export function canEditTelCategoryStructure(role) {
  return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'EDITOR';
}

/** GET/POST /admin/users (tel-backend). */
export function canManageStaffUsers(role) {
  return role === 'SUPER_ADMIN' || role === 'ADMIN';
}

/** Packages / tours — same pattern as categories for SEO_EDITOR. */
export function canCreateTelPackage(role) {
  return role && role !== 'SEO_EDITOR';
}

export function canDeleteTelPackage(role) {
  return role && role !== 'SEO_EDITOR';
}

export function canEditTelPackageStructure(role) {
  return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'EDITOR';
}

export function isTelPackageSeoOnlyRole(role) {
  return role === 'SEO_EDITOR';
}

/** Blogs — same pattern as packages/categories. */
export function canCreateTelBlog(role) {
  return role && role !== 'SEO_EDITOR';
}

export function canDeleteTelBlog(role) {
  return role && role !== 'SEO_EDITOR';
}

export function canEditTelBlogStructure(role) {
  return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'EDITOR';
}

export function isTelBlogSeoOnlyRole(role) {
  return role === 'SEO_EDITOR';
}
