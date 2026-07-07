[![CI](https://github.com/masudpkt98-ship-it/nexus/actions/workflows/e2e.yml/badge.svg)](https://github.com/masudpkt98-ship-it/nexus/actions/workflows/e2e.yml)

# NEXUS — Competency & Performance Nexus

> **Connecting Excellence. Driving Performance.**
> The digital operating system for competency & performance management.

Full-stack enterprise application: a **Next.js** frontend, a **Laravel** REST API,
**PostgreSQL** + **Redis**, and an AI Assistant powered by **Claude Opus 4.8**
(with a deterministic, data-grounded fallback). Everything runs with one command
via Docker Compose.

## 🚀 Quick start

```bash
docker compose up -d --build
# Web:  http://localhost:3000   (login: arif.wibowo@nexus.co / nexus)
# API:  http://localhost:8000/api/health
```

To enable the real Claude-powered AI features, export a key before starting:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
docker compose up -d
```

## 🧱 Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15 · React 19 · TypeScript · TailwindCSS |
| Backend | Laravel 13 · Sanctum (RBAC) · REST API |
| Data | PostgreSQL 16 · Redis 7 |
| AI | Anthropic PHP SDK · Claude Opus 4.8 (rule-based fallback) |
| Tests | Playwright (E2E) · GitHub Actions CI |

## ✅ CI

The **CI** workflow (`.github/workflows/e2e.yml`) runs on every push and PR:

1. **web-checks** — `npm run lint` + `npm run build`
2. **api-checks** — `php -l` across the Laravel app
3. **e2e** — `docker compose up --build` → Playwright browser tests
   (runs only if the checks pass)

## 📚 Docs

- **[DEPLOY.md](DEPLOY.md)** — Docker deployment, commands, PostgreSQL/Redis config
- **[nexus-app/README.md](nexus-app/README.md)** — frontend, modules, E2E tests
- **[nexus-api/README.md](nexus-api/README.md)** — API endpoints, RBAC, AI generators

---

*One Platform. One Team. One Performance.*
