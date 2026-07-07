# NEXUS API — Laravel Backend

Real REST API for the **NEXUS — Competency & Performance Nexus** platform.
Built with **Laravel 13 + Sanctum** (bearer-token auth), **SQLite** by default
(PostgreSQL-ready), role-based access control, soft deletes and an audit trail.

## 🚀 Run

```bash
cd nexus-api
composer install          # if vendor/ is missing
php artisan migrate:fresh --seed
php artisan serve --host=127.0.0.1 --port=8000
# API base: http://127.0.0.1:8000/api
```

Health check: `GET http://127.0.0.1:8000/api/health`

## 🔐 Demo accounts (password: `nexus`)

| Email | Role | Access |
|-------|------|--------|
| `arif.wibowo@nexus.co` | VP | Full visibility + approvals |
| `sinta@nexus.co` | Manager | Manage programs, tasks, KPI |
| `dimas@nexus.co` | Supervisor | Manage tasks, view teams |
| `rani@nexus.co` | Staff | Tasks, competency, knowledge |
| `bagus@nexus.co` | Executive | Read-only executive + approve requests |
| `admin@nexus.co` | Administrator | Everything (`*`) |

## 📡 Endpoints

All protected routes require `Authorization: Bearer <token>` and are gated by
the `permission:` middleware (RBAC).

### Auth
- `POST /api/auth/login` → `{ token, user }`
- `GET  /api/auth/me`
- `POST /api/auth/logout`

### Dashboard & analytics
- `GET /api/dashboard` — aggregate: live widgets (open/overdue/approvals/requests
  computed from the DB), executive KPIs, program health, trends, heatmap,
  top performers, recent activity, meetings, programs.
- `GET /api/activities`

### Modules
- `GET|POST|PUT|DELETE /api/programs` · `GET /api/programs/{id}`
- `GET|POST|PUT|DELETE /api/tasks` · `PATCH /api/tasks/{id}/status` (Kanban move)
- `GET /api/objectives` (OKR + key results)
- `GET /api/competency` (competencies + development plans)
- `GET /api/performance-kpis`
- `GET|POST /api/service-requests` · `PUT /api/service-requests/{id}`
- `GET /api/meetings` · `GET /api/knowledge-docs`
- `GET /api/notifications` · `POST /api/notifications/read-all`
- `GET /api/satisfaction` — NPS (computed from raw survey responses), CSAT trend, service scores
- `GET /api/analytics` — indices (from metric series), task-completion (live), trends
- `GET /api/ai/insights` — AI insights + suggestions
- `POST /api/ai/chat` — assistant reply grounded in live NEXUS data. Uses the
  **real Claude API** (Anthropic PHP SDK, model `claude-opus-4-8`) when
  `ANTHROPIC_API_KEY` is set; otherwise falls back to a deterministic rule-based
  reply. Response includes `"source": "claude" | "rules"`.

## 🤖 Enabling the real Claude AI Assistant

Set an Anthropic API key and the `/ai/chat` endpoint answers via Claude Opus 4.8,
grounded in the live department snapshot (open/overdue tasks, at-risk programs,
SLA breaches, KPI, competency gaps):

```bash
# Docker: export before `docker compose up` (passed through to the api service)
export ANTHROPIC_API_KEY=sk-ant-...
docker compose up -d

# Local dev: add to nexus-api/.env
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-opus-4-8   # optional, this is the default
```

Without a key everything still works — the assistant uses the rule-based fallback.

### Example

```bash
# Login
curl -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" -H "Accept: application/json" \
  -d '{"email":"arif.wibowo@nexus.co","password":"nexus"}'

# Move a task on the Kanban board
curl -X PATCH http://127.0.0.1:8000/api/tasks/1/status \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -H "Accept: application/json" -d '{"status":"In Progress"}'
```

## 🧱 Architecture

```
app/
├─ Models/            # Program, Task, Objective, KeyResult, Competency,
│                     # DevelopmentPlan, PerformanceKpi, ServiceRequest,
│                     # Meeting, KnowledgeDoc, NotificationItem, Activity, User
├─ Http/
│  ├─ Controllers/Api/  # Auth, Dashboard, Program, Task, Objective, Competency,
│  │                    # PerformanceKpi, ServiceRequest, Workspace
│  ├─ Middleware/EnsurePermission.php   # RBAC gate (permission:<name>)
│  └─ Resources/        # camelCase JSON matching the Next.js frontend
database/
├─ migrations/        # 8 domain migrations + soft deletes + audit
└─ seeders/DatabaseSeeder.php   # demo data mirroring the frontend
routes/api.php
config/cors.php        # allows http://localhost:3000 (the Next.js app)
```

**RBAC** is defined in `User::ROLE_PERMISSIONS` and enforced per-route via the
`permission:` middleware. Unauthorized → `403` with the required permission named.

**Audit trail**: task create/move actions are logged to the `activities` table
and surface in the dashboard "Recent Activity" feed.

## 🐘 Switching to PostgreSQL

Edit `.env`:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=nexus
DB_USERNAME=postgres
DB_PASSWORD=secret
```

Then `php artisan migrate:fresh --seed`. (Requires the `pdo_pgsql` PHP extension.)

## 🔗 Frontend integration

The Next.js app (`../nexus-app`) reads `NEXT_PUBLIC_API_URL` from `.env.local`
(default `http://127.0.0.1:8000/api`). Login, the executive dashboard and the
Kanban board consume this API live; other module screens can be migrated using
the same `lib/api.ts` client.
