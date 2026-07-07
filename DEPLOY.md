# NEXUS — Docker Deployment

Full-stack, one-command deployment of **NEXUS — Competency & Performance Nexus**:
Next.js frontend + Laravel API + **PostgreSQL** + **Redis**, orchestrated with
Docker Compose.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  web (Next)  │ ──▶ │  api (Laravel│ ──▶ │  db (Postgres)│
│  :3000       │     │  Sanctum)    │     │  :5432        │
└──────────────┘     │  :8000       │ ──▶ │  redis :6379  │
                     └──────────────┘     └──────────────┘
```

## 🚀 Run everything

```bash
cd Nexus
docker compose up --build -d
```

Then open:

| Service | URL |
|---------|-----|
| Web app | http://localhost:3000 |
| API | http://localhost:8000/api/health |
| PostgreSQL | localhost:5433 (`nexus` / `nexus_secret`, db `nexus`) |
| Redis | localhost:6379 |

The API container automatically waits for PostgreSQL, runs migrations, and seeds
demo data on first boot (data persists in the `db-data` volume across restarts).

**Login** (any demo account, password `nexus`): `arif.wibowo@nexus.co` (VP),
`sinta@nexus.co` (Manager), `rani@nexus.co` (Staff) — or pick a role on the
sign-in screen.

## 🧩 What's configured

- **PostgreSQL 16** — the API runs on `pgsql` (not SQLite) inside Compose; the
  local dev setup still uses SQLite, so nothing local is disturbed.
- **Redis 7** — cache, session and queue drivers all point at Redis
  (`CACHE_STORE=redis`, `SESSION_DRIVER=redis`, `QUEUE_CONNECTION=redis`,
  `REDIS_CLIENT=phpredis`).
- **API image** (`nexus-api/Dockerfile`) — PHP 8.4 with `pdo_pgsql`, `redis`,
  `mbstring`, `bcmath`, `zip`; Composer install; entrypoint migrates + seeds.
- **Web image** (`nexus-app/Dockerfile`) — multi-stage Next.js `standalone`
  build; `NEXT_PUBLIC_API_URL` baked to `http://localhost:8000/api` (the browser
  reaches the API on the host-mapped port).

## 🔧 Common commands

```bash
docker compose up --build -d      # build + start (detached)
docker compose logs -f api        # follow API logs
docker compose logs -f web        # follow web logs
docker compose ps                 # service status
docker compose down               # stop (keep data)
docker compose down -v            # stop + wipe volumes (fresh DB next boot)

# Run artisan inside the API container
docker compose exec api php artisan migrate:status
docker compose exec api php artisan tinker

# psql into the database
docker compose exec db psql -U nexus -d nexus -c "\dt"
```

## 🔁 Reseed / reset the database

```bash
docker compose exec api php artisan migrate:fresh --seed --force
# or wipe the volume entirely:
docker compose down -v && docker compose up -d
```

## 🌱 Environment overrides

All API configuration is supplied via the `api` service `environment:` block (or
a `.env` next to the compose file — see `.env.example`). Change credentials,
switch `APP_DEBUG`, point at a managed database, etc. there.

## 🏭 Production profile

`docker-compose.prod.yml` hardens the stack for production:

- API served by **nginx + PHP-FPM** with **OPcache** (not `php artisan serve`).
- `APP_ENV=production`, `APP_DEBUG=false`; **config & views cached** on boot.
- **Database and Redis are not exposed** to the host (internal network only).
- `restart: unless-stopped` on every service.

```bash
# set a stable APP_KEY (and ANTHROPIC_API_KEY) in .env first
echo "APP_KEY=base64:$(openssl rand -base64 32)" >> .env

docker compose -f docker-compose.prod.yml up -d --build
# Web: http://localhost:3000   API: http://localhost:8000/api/health
```

SSE streaming (AI chat / generators) works through nginx because the streaming
responses send `X-Accel-Buffering: no`, which disables response buffering.
Override host ports with `API_PORT` / `WEB_PORT` if 8000/3000 are taken.

## 🩺 Troubleshooting

- **Ports already in use (3000 / 8000 / 5432 / 6379)** — stop any local
  `next dev` / `php artisan serve` / Postgres before `docker compose up`.
- **Web can't reach the API** — the frontend calls the API from the *browser*,
  so `NEXT_PUBLIC_API_URL` must be `http://localhost:8000/api`. It is baked at
  build time; rebuild the web image after changing it
  (`docker compose build web`).
- **API 500 on first request** — check `docker compose logs api`; it may still be
  waiting on PostgreSQL to become healthy.
