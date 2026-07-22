# NEXUS — Deploy on a Managed PaaS (Railway) — HTTPS now, WAF later

Your choices: **Managed PaaS · no domain yet · deploy without PII first.**

What you get on day one: **HTTPS (auto, on the PaaS subdomain) + the platform's
built-in DDoS protection.** Full **Cloudflare WAF/DDoS needs a domain** — add it
in ~15 min once you have one (§6). No PII is imported until you verify everything (§5).

```
Browser ──HTTPS──▶ Web service (Next.js, *.up.railway.app)
                     │  Next proxies /api/* ──▶ API service (Laravel)
                     └────────────────────────▶ Postgres (managed)
```
The Web service proxies `/api` to the API so the browser sees **one origin** — the
httpOnly auth cookie stays same-site (separate PaaS subdomains would be cross-site
and drop it). This is why we set `API_PROXY_TARGET` + `NEXT_PUBLIC_API_URL=/api`.

> Railway is used below (easiest for a Laravel + Next monorepo). Render works the
> same way — create two Web Services + a Postgres, use the same env vars & commands.

---

## 1. Create the project
1. Repo is already on GitHub. In **railway.app** → **New Project → Deploy from GitHub repo** → pick `nexus`.
2. **Add a database:** New → **Database → PostgreSQL**. Note its connection vars (Railway exposes `PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD`).

## 2. API service (Laravel — `nexus-api`)
- New service from the same repo → **Settings → Root Directory = `nexus-api`**.
- **Variables** (Settings → Variables):
  ```
  APP_NAME=NEXUS
  APP_ENV=production
  APP_DEBUG=false
  APP_KEY=base64:__PASTE_YOUR_KEY__   # generate: (cd nexus-api && php artisan key:generate --show) — never commit it
  ADMIN_PASSWORD=__a-strong-initial-admin-password__   # for admin@nexus.co (forced change on first login)
  APP_URL=https://<will-be-your-web-url>
  FRONTEND_URL=https://<will-be-your-web-url>
  DB_CONNECTION=pgsql
  DB_HOST=${{Postgres.PGHOST}}
  DB_PORT=${{Postgres.PGPORT}}
  DB_DATABASE=${{Postgres.PGDATABASE}}
  DB_USERNAME=${{Postgres.PGUSER}}
  DB_PASSWORD=${{Postgres.PGPASSWORD}}
  SESSION_DRIVER=database
  SESSION_SECURE_COOKIE=true
  CACHE_STORE=database
  LOG_LEVEL=warning
  ```
- **Start command** (Settings → Deploy → Custom Start Command):
  ```
  php artisan migrate --force && php artisan db:seed --class=ProductionSeeder --force && php artisan config:cache && php artisan serve --host 0.0.0.0 --port $PORT
  ```
  (`ProductionSeeder` creates ONLY the admin account — idempotent, safe on every
  redeploy. No demo data. Set `ADMIN_PASSWORD` below for a strong initial password.)
  (`php artisan serve` is fine for initial low traffic. For scale, switch to
  FrankenPHP/Octane later — the app code doesn't change.)
- Deploy, then **Settings → Networking → Generate Domain** → copy the API URL,
  e.g. `https://nexus-api-production.up.railway.app`.

## 3. Web service (Next.js — `nexus-app`)
- New service from the same repo → **Root Directory = `nexus-app`**.
- **Variables:**
  ```
  NODE_ENV=production
  API_PROXY_TARGET=https://nexus-api-production.up.railway.app   # the API URL from §2
  NEXT_PUBLIC_API_URL=/api                                       # same-origin (built into the bundle)
  ```
- Build/Start are auto-detected (Nixpacks: `npm run build` / `npm start`). Deploy.
- **Generate Domain** → this is your app URL, e.g. `https://nexus-production.up.railway.app`.
- Go back to the **API service** and set `APP_URL` and `FRONTEND_URL` to this Web URL; redeploy the API.

## 4. Verify (HTTPS + security)
```bash
WEB=https://nexus-production.up.railway.app
curl -sI $WEB/login | grep -iE 'strict-transport|content-security|x-frame'   # headers present, HTTPS
```
Then in a browser: open $WEB → log in `admin@nexus.co` / `nexus` → confirm the app
loads, **/audit** shows your login, and DevTools ▸ Application ▸ Cookies shows
`nexus_token` as **HttpOnly + Secure**. (Change the admin password immediately.)

## 5. PII — import only after verification
The database starts **empty** (no employees). Once §4 passes, an admin imports the
directory the normal way: **Employee Directory → Import** (the xlsx is parsed in the
browser and pushed to the server; it's never committed to git). Reads stay unit-scoped.

## 6. Add Cloudflare WAF + full DDoS (when you have a domain)
1. Buy a domain; add the site to **Cloudflare** (free plan).
2. In Railway (Web service) → **Custom Domain** → add `app.yourdomain.com`; Railway shows a CNAME target.
3. In Cloudflare DNS → add that CNAME, **Proxied (orange cloud)**. SSL/TLS mode **Full (strict)**.
4. **Security → WAF → Managed rules:** enable Cloudflare Managed + OWASP Core rulesets.
5. **Rate limiting rules:** `/api/auth/login` → 10/min per IP → block; `/api/*` → 200/min → challenge.
6. Enable **Bot Fight Mode**. Update the API's `APP_URL`/`FRONTEND_URL` to the custom domain.
   → HTTPS + DDoS + **WAF** all live.

## Checklist
- [ ] Postgres added; API vars set (APP_KEY, APP_DEBUG=false, DB_*, SESSION_SECURE_COOKIE=true)
- [ ] API start command migrates + serves on `$PORT`; API domain generated
- [ ] Web `API_PROXY_TARGET` = API URL, `NEXT_PUBLIC_API_URL=/api`; Web domain generated
- [ ] API `APP_URL`/`FRONTEND_URL` = Web URL (redeploy)
- [ ] Verify: HTTPS + headers, login, httpOnly+Secure cookie, /audit
- [ ] Change admin password; import PII only after verification
- [ ] Later: custom domain → Cloudflare proxied → WAF + rate rules
