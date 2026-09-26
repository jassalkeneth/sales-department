# Sales Department — Workflow & Roadmap

**Repo:** https://github.com/jassalkeneth/sales-department (branch `main`)
**Deployment policy:** ⛔ No live/production deployment. Dev only, exposed via SSH on port **3005** (Vite auto-falls-back from 3004 because another dev service holds 3004 on this host).

---

## 1. Hard Rules

1. **Git remote is fixed.** Every push/commit/pull targets `github.com/jassalkeneth/sales-department` on `main`. Do not add other remotes or push to forks without explicit direction.
2. **No production deploys.** No `npm run build` + upload, no Docker deploy, no PaaS CLIs (`vercel`, `gcloud`, `fly`, `heroku`, etc.). The only running instance is the local Vite dev server on port 3005 accessed via SSH tunnel or the box's public IP.
3. **Verify before touching code.** Run the Connection Verification Checklist (§4) before any code change that could affect wiring (routing, auth, DB, CORS, ports).
4. **Env boundary.** Secrets stay in `backend/.env` and `.env.local`. Never commit them. `.env.example` files are the shared contract.

---

## 2. Codebase Topology

```
/var/www/sales-department
├── src/                    React 19 + Vite 8 + Tailwind 4 (TypeScript)
│   ├── App.tsx             Root, wires SalesWorkflowProvider
│   ├── api/salesApi.ts     Fetch client — Bearer token, base = /api (Vite proxy)
│   ├── context/            SalesWorkflowContext (loads dashboard, mutations)
│   ├── components/         Navbar, KpiOverview, LeadPipelineView,
│   │                       FinanceVerificationView, CloserPerformanceView,
│   │                       CloseStudentModal, ExportReportModal, AuthModal,
│   │                       SalesApiSimulator, ToastContainer, WorkflowVisualizer,
│   │                       StudentAttributionLedger
│   ├── types/index.ts      Domain types (Lead, StudentEnrollment, Payment, etc.)
│   └── assets/images/      saleslogo.png (transparent, trimmed), avatars
├── backend/                Laravel 13 + Sanctum (personal-access-token auth)
│   ├── app/Http/Controllers/Api/   Auth, Closer, Lead, StudentEnrollment,
│   │                                Payment, Performance
│   ├── app/Models/         Closer, Lead, StudentEnrollment, Payment,
│   │                        SyncEvent, VerificationAuditLog, User
│   ├── routes/api.php      25 endpoints, all Sanctum-guarded except /login
│   ├── database/
│   │   ├── migrations/     users (+role,closer_id,avatar_url), closers, leads,
│   │   │                    student_enrollments, payments, sync_events,
│   │   │                    verification_audit_logs, personal_access_tokens
│   │   └── seeders/        UserSeeder (admin from .env), DatabaseSeeder
│   ├── config/cors.php     Allows :3004/:3005 origins
│   ├── config/sales.php    Reads SALES_ADMIN_* from .env
│   └── .env                MySQL: tmt_sales / tmt_sales@127.0.0.1
├── vite.config.ts          Proxies /api → 127.0.0.1:8000 (override via VITE_BACKEND_URL)
└── package.json            dev = vite --port=3004 --host=0.0.0.0
```

### Connection map

```
Browser (SSH tunnel / http://<host>:3005)
   │
   ▼  Vite dev server (:3005)  ── serves React bundle
   │  proxy: /api → $VITE_BACKEND_URL or 127.0.0.1:8000
   ▼
Laravel dev server (php artisan serve)
   │
   ▼  MySQL 127.0.0.1:3306  db=tmt_sales user=tmt_sales
```

---

## 3. Run Commands

```bash
# Frontend (auto-picks 3005 if 3004 is busy on this host)
npm run dev

# Backend — pick a free port; 8000 and 8001 are already used by other services
cd backend && php artisan serve --port=8765 --host=127.0.0.1

# Point Vite proxy at your backend (put in .env.local, do NOT commit)
echo 'VITE_BACKEND_URL=http://127.0.0.1:8765' > .env.local

# Refresh domain data
cd backend && php artisan migrate:fresh --seed
```

**Admin login (dev only):** `sales@tmt.com` / `sales` (from `SALES_ADMIN_*` in `backend/.env`)

---

## 4. Connection Verification Checklist

Run this BEFORE editing any wiring code. Every step must pass.

| # | Check | Command | Pass criteria |
|---|-------|---------|---------------|
| 1 | Git remote correct | `git remote -v` | Both fetch/push = `github.com/jassalkeneth/sales-department` |
| 2 | Vite serving | `curl -sI http://127.0.0.1:3005/` | `HTTP/1.1 200 OK` |
| 3 | Backend routes registered | `cd backend && php artisan route:list --path=api` | 25 routes, `/login` public, rest under `auth:sanctum` |
| 4 | MySQL reachable | `cd backend && php artisan db:show` | Shows `tmt_sales`, table count > 0 |
| 5 | Migrations current | `cd backend && php artisan migrate:status` | No pending |
| 6 | Admin user exists | `cd backend && php artisan tinker --execute='echo User::where("email",config("sales.admin.email"))->exists() ? "OK":"MISSING";'` | `OK` |
| 7 | Sanctum + CORS | `php artisan tinker --execute='echo config("auth.guards.sanctum.driver");'` and `... config("cors.paths");'` | `sanctum`, `["api/*"]` |
| 8 | Backend health | `curl -s http://127.0.0.1:<backend-port>/up` | `<html>...OK` |
| 9 | Bearer auth flow | POST `/api/login` → get token → GET `/api/user` with `Authorization: Bearer <token>` | `200` with user JSON |
| 10 | Vite → backend proxy | `curl -sI http://127.0.0.1:3005/api/user` | Proxied hit reaches Laravel (401 without token is expected) |
| 11 | Port 3004 vs 3005 | `lsof -i :3005` | Node/Vite is the listener |
| 12 | No live-deploy artefacts | `git status`, look for `dist/`, `.output/`, deploy scripts | None staged |

If any step fails, **stop and diagnose** — do not code around it. Fix the wiring first, then rerun the checklist.

---

## 5. Known Wiring Gaps (as of last verify)

- ⚠️ `vite.config.ts` proxies `/api` → `http://127.0.0.1:8000` — port 8000 is held by a different Laravel install (`php8.3` as www-data). Until this is resolved, set `VITE_BACKEND_URL` in `.env.local` to point at our backend's port (e.g. `http://127.0.0.1:8765`).
- ⚠️ Domain tables (`closers`, `leads`, `student_enrollments`, `payments`) are empty after the last `migrate:fresh`. `DatabaseSeeder` currently only calls `UserSeeder`. Restore domain seeders or accept the empty-start UX.

---

## 6. Roadmap

### Phase A — Baseline Wired (in progress)
- [x] Laravel 13 scaffold, Sanctum token auth, MySQL, migrations
- [x] Domain models + REST controllers + `/verify` action + performance aggregate
- [x] React `salesApi` client with Bearer token + typed mappers
- [x] Vite dev server exposed via SSH on :3005
- [x] Logo integrated (Navbar + favicon + OG/Twitter)
- [ ] Fix Vite proxy → own backend (§5 gap #1)
- [ ] Restore domain seeders OR create admin UI to bootstrap data

### Phase B — Feature completeness
- [ ] Lead pipeline: drag-between-stages persistence via `PATCH /api/leads/{id}`
- [ ] Close-a-Student modal fully wired to `POST /api/students` with `initial_payment`
- [ ] Finance verification queue: batch verify/reject with reason codes
- [ ] Closer performance view: real KPI numbers from `/api/performance` (currently returns array — verify shape matches `CloserPerformance` type)
- [ ] Attribution ledger export → CSV/Excel using `write-excel-file` (client-side is fine)
- [ ] Auth modal: real login form calling `salesApi.login` (currently a role-switcher)

### Phase C — Hardening
- [ ] Request/response validation via Form Requests (extract from inline `$request->validate`)
- [ ] API resource classes (`JsonResource`) to lock output shape
- [ ] Rate limiting on write endpoints (already applied to `/login`)
- [ ] Frontend error boundary + toast surface for `ApiError`
- [ ] Feature tests for verify flow (audit log written, sync event created, finance_status recomputed)
- [ ] Seed helper: `php artisan sales:demo` command that populates a realistic scenario for showing off the dashboard

### Phase D — Nice-to-haves
- [ ] Websocket/SSE for live sync-event feed (currently polling)
- [ ] Role-based route gates (`sales_manager` sees quotas, `finance_officer` sees verify queue, `closer` sees own leads/students only)
- [ ] Multi-tenancy scaffolding (if the ecosystem asks)

---

## 7. Git Workflow

```bash
git status                 # always inspect first
git add <specific files>   # never `git add .`
git commit -m "..."        # HEREDOC for multi-line
git push origin main       # target the fixed remote (§1 rule 1)
```

Before pushing:
1. Run the Connection Verification Checklist (§4).
2. `npm run lint` (tsc no-emit).
3. Confirm no `.env` file is staged.
4. If touching backend: `cd backend && php artisan test` (once test suite exists).

---

## 8. When Something Breaks

- **Login returns 401 with correct creds** → check `SALES_ADMIN_*` in `backend/.env` matches what you're posting; check `php artisan config:clear`.
- **API returns 404 for known route** → `php artisan route:clear`.
- **Frontend hits `/api/*` and gets HTML** → Vite proxy is pointing at the wrong backend (see §5 gap #1). Set `VITE_BACKEND_URL` and restart Vite.
- **CORS error in browser** → `backend/config/cors.php` origins must include the browser origin (`http://<host>:3005`). Add it, `php artisan config:clear`.
- **`Access denied for user 'root'@'localhost'`** → the `tmt_sales` user is required for TCP auth; root is socket-only on this host.
- **Port already in use** on 3004/8000 → they're held by other dev services on this shared box; use the fallback (3005) or a different backend port.
