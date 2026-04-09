'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSessionRequest, logoutRequest } from '@/lib/admin-api-client';
import { canManageStaffUsers } from '@/lib/tel-access-payload';

function IconDashboard() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 13h6V4H4v9zm0 7h6v-5H4v5zm8 0h10v-9H12v9zm0-17v5h10V4H12z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

function IconCategories() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6h7v7H4V6zm0 9h7v7H4v-7zm9-9h7v4h-7V6zm0 6h7v10h-7V12z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

function IconTours() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 8h-3V5H7v3H4l-2 9v2h20v-2l-2-9zm-5-3H9V6h6v1zM4.22 18L5.63 9H18.37l1.41 9H4.22z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

function IconEnquiries() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 2 4-2h4c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H15.53L12 19.76 8.47 18H4V6h16v12z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

function IconBlogs() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M19 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM8 16V4h11v12H8zM4 6H2v14c0 1.1.9 2 2 2h13v-2H4V6z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

function IconProfile() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 12c2.76 0 5-2.24 5-5S14.76 2 12 2 7 4.24 7 7s2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

function IconBell() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
        fill="currentColor"
        opacity="0.5"
      />
    </svg>
  );
}

const ICONS = {
  Dashboard: IconDashboard,
  Categories: IconCategories,
  Tours: IconTours,
  Enquiries: IconEnquiries,
  Blogs: IconBlogs,
  Profile: IconProfile,
  Staff: IconUsers,
};

function SidebarLink({ href, label, active, icon: Icon }) {
  return (
    <Link
      href={href}
      className={`admin-sidebar-link${active ? ' admin-sidebar-link--active' : ''}`}
      aria-current={active ? 'page' : undefined}
    >
      <span className="admin-sidebar-link__icon">
        <Icon />
      </span>
      <span className="admin-sidebar-link__text">{label}</span>
    </Link>
  );
}

function userInitials(email, sub) {
  if (email && typeof email === 'string') {
    const part = email.split('@')[0] || email;
    const bits = part.split(/[.\s_-]+/).filter(Boolean);
    if (bits.length >= 2) return (bits[0][0] + bits[1][0]).toUpperCase().slice(0, 2);
    return part.slice(0, 2).toUpperCase();
  }
  if (sub && typeof sub === 'string') return sub.slice(0, 2).toUpperCase();
  return 'A';
}

export function AdminChrome({ children }) {
  const pathname = usePathname() || '';
  const [session, setSession] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getSessionRequest()
      .then((s) => {
        if (!cancelled) setSession(s);
      })
      .catch(() => {
        if (!cancelled) setSession({});
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const role = session?.role;
  const showStaff = canManageStaffUsers(role);

  const tabs = useMemo(() => {
    const list = [
      {
        href: '/admin',
        label: 'Dashboard',
        key: 'Dashboard',
        active: pathname === '/admin' || pathname === '/admin/',
      },
      {
        href: '/admin/categories',
        label: 'Categories',
        key: 'Categories',
        active: pathname.startsWith('/admin/categories'),
      },
      {
        href: '/admin/packages',
        label: 'Tours',
        key: 'Tours',
        active: pathname.startsWith('/admin/packages'),
      },
      {
        href: '/admin/enquiries',
        label: 'Enquiries',
        key: 'Enquiries',
        active: pathname.startsWith('/admin/enquiries'),
      },
      {
        href: '/admin/blogs',
        label: 'Blogs',
        key: 'Blogs',
        active: pathname.startsWith('/admin/blogs'),
      },
      {
        href: '/admin/profile',
        label: 'Profile',
        key: 'Profile',
        active: pathname.startsWith('/admin/profile'),
      },
    ];
    if (showStaff) {
      list.push({
        href: '/admin/users',
        label: 'Staff',
        key: 'Staff',
        active: pathname.startsWith('/admin/users'),
      });
    }
    return list;
  }, [pathname, showStaff]);

  const handleLogout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      /* cookies may still clear */
    }
    window.location.assign('/admin/login');
  }, []);

  const initials = userInitials(session?.email, session?.sub);
  const displayName = session?.email || session?.sub || 'Admin';

  return (
    <div className="admin-pro-shell">
      <aside className="admin-pro-sidebar" aria-label="Main navigation">
        <div className="admin-pro-sidebar__logo">
          <span className="admin-pro-sidebar__logo-mark">T</span>
          <span className="admin-pro-sidebar__logo-text">India Tellama</span>
        </div>

        <nav className="admin-pro-sidebar__nav" aria-label="Sections">
          {tabs.map((t) => (
            <SidebarLink
              key={t.href}
              href={t.href}
              label={t.label}
              active={t.active}
              icon={ICONS[t.key]}
            />
          ))}
        </nav>

        <div className="admin-pro-sidebar__profile">
          <div className="admin-pro-sidebar__profile-row">
            <div className="admin-pro-sidebar__avatar" aria-hidden>
              {initials}
            </div>
            <div className="admin-pro-sidebar__profile-text">
              <div className="admin-pro-sidebar__profile-name" title={displayName}>
                {displayName}
              </div>
              {role ? (
                <div className="admin-pro-sidebar__profile-role">{String(role).replace(/_/g, ' ')}</div>
              ) : null}
            </div>
          </div>
          <button type="button" className="admin-pro-sidebar__logout" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>

      <div className="admin-pro-maincol">
        <header className="admin-pro-header">
          <div className="admin-pro-header__search" role="search">
            <span className="admin-pro-header__search-icon">
              <IconSearch />
            </span>
            <input
              type="search"
              className="admin-pro-header__search-input"
              placeholder="Search…"
              aria-label="Search"
              disabled
            />
          </div>
          <div className="admin-pro-header__actions">
            <button type="button" className="admin-pro-header__icon-btn" aria-label="Notifications" disabled>
              <IconBell />
            </button>
            <div className="admin-pro-header__avatar" aria-hidden>
              {initials}
            </div>
          </div>
        </header>

        <div className="admin-pro-scroll">{children}</div>
      </div>
    </div>
  );
}
