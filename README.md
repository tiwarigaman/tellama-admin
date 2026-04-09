# tel-admin — India Tellama (Next.js)

Browser UI for **tel-backend** only. This app does **not** use MongoDB or any local database: it proxies authenticated requests to **`TEL_API_URL`** (e.g. `http://localhost:4000`).

## API surface (tel-backend)

Base: **`{TEL_API_URL}/api/v1`**

| This app route | Tel-backend |
|----------------|-------------|
| `POST /api/auth/login` | `POST /auth/login` (sets HttpOnly cookies) |
| `POST /api/auth/refresh` | `POST /auth/refresh` |
| `POST /api/auth/logout` | `POST /auth/logout` |
| `GET /api/auth/session` | JWT from cookie (verified with `JWT_ACCESS_SECRET`) |
| `GET/POST /api/admin/categories` | `GET/POST /admin/categories` |
| `PATCH/DELETE /api/admin/categories/:id` | `PATCH/DELETE /admin/categories/:id` |
| `GET/POST /api/admin/users` | `GET/POST /admin/users` (ADMIN+) |
| `PATCH/DELETE /api/admin/users/:id` | `PATCH/DELETE /admin/users/:id` — PATCH body `{ "password": "…" }` to reset login password |
| `GET/POST /api/admin/packages` | `GET/POST /admin/packages` (optional `?categoryId=`) |
| `GET/PATCH/DELETE /api/admin/packages/:id` | `GET/PATCH/DELETE /admin/packages/:id` — do not send `slug`; server derives from `title` |
| `POST/DELETE /api/admin/uploads` | `POST/DELETE /admin/uploads` — multipart field `file`; DELETE body `{ "url": "/uploads/…" }` |

All admin mutations forward **`Authorization: Bearer <accessToken>`** from the cookie.

### Categories (contract)

- **Do not send `slug`** on create/update; the server generates it. (Proxies strip `slug` if present.)
- RBAC, subcategories under `allowsSubcategories` parents, SEO-only edits for `SEO_EDITOR`, etc. are enforced by **tel-backend**.

### Packages & uploads

- Tour **slugs** are server-generated from **title** (same as categories + `name`).
- **`NEXT_PUBLIC_TEL_API_URL`** should match the host that serves **`GET /uploads/*`** (usually the tel-backend origin) so image previews resolve in the admin UI.

### Environment

| Variable | Purpose |
|----------|---------|
| `TEL_API_URL` | Tel-backend origin, no `/api` suffix (e.g. `http://localhost:4000`) |
| `NEXT_PUBLIC_TEL_API_URL` | Same origin for browser-side `/uploads/…` URLs (defaults to relative paths if unset) |
| `JWT_ACCESS_SECRET` | Must match tel-backend secret used to sign **access** tokens |

## Run

```bash
npm install
npm run dev
```

Open `/admin/login`. Ensure tel-backend is running and env vars match.

```bash
npm run build && npm start
```

## Layout

- **`app/admin/login`** — public, no sidebar.
- **`app/admin/(app)/*`** — authenticated shell (sidebar + header); dashboard, categories, tours (packages), staff.
# tellama-admin
