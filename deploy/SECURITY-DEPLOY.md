# NEXUS — Secure Deployment (HTTPS · DDoS · WAF)

These three protections live at the **edge**, not in the app. This folder makes
them turn-key when you deploy. Recommended layout:

```
Internet → Cloudflare (DDoS + WAF + rate rules, TLS)
         → Caddy      (automatic HTTPS at the origin, reverse proxy)
         → Next.js (web:3000)  +  Laravel (api:9000, same-origin /api)
         → Postgres
```

You do **not** need both Cloudflare and Caddy, but together they give the
strongest posture: Cloudflare absorbs volumetric/L7 attacks and filters bad
requests; Caddy guarantees the origin hop is also encrypted.

---

## 1. HTTPS — automatic

**Option A · Caddy (included).** Point an A/AAAA record at your server, set your
domain in `Caddyfile` and `docker-compose.yml`, then:

```bash
cd deploy
cp api.env.production.example api.env.production   # fill in secrets
export DB_PASSWORD='<same as in api.env.production>'
docker compose --env-file api.env.production up -d --build
```

Caddy fetches a Let's Encrypt certificate on first boot and **auto-renews** it.
Certificates persist in the `caddy_data` volume — don't delete it.

**Option B · Managed platform.** Vercel (frontend) / Railway / Render / Fly.io
terminate TLS automatically — no Caddy needed. Deploy `nexus-app` (Next.js
standalone) and `nexus-api` (Laravel) as separate services and set
`NEXT_PUBLIC_API_URL` to the API's HTTPS URL.

> HTTP→HTTPS redirect and HSTS are already handled (Caddy + our headers). HSTS
> only activates once real HTTPS is live — expected.

## 2. DDoS protection — Cloudflare

App-level rate limiting (already added: login 5/min, API 120/min) is **not**
DDoS mitigation. For that, put the domain behind Cloudflare:

1. Add the site to Cloudflare; set your registrar's nameservers to Cloudflare's.
2. Make the DNS record **Proxied** (orange cloud) — traffic now flows through
   Cloudflare's edge, which absorbs L3/L4/L7 floods automatically.
3. SSL/TLS mode → **Full (strict)** (Cloudflare↔origin stays encrypted; Caddy
   provides a valid origin cert).
4. Enable **Bot Fight Mode** (Security → Bots) and **Under Attack Mode** on demand.
5. Free plan already includes unmetered DDoS protection.

## 3. WAF — Cloudflare

1. Security → WAF → **Managed rules**: enable the *Cloudflare Managed Ruleset*
   and *OWASP Core Ruleset* (SQLi, XSS, RCE, path traversal, common CVEs).
2. **Rate limiting rules** (defence-in-depth on top of Laravel):
   - `/api/auth/login` → 10 requests / 1 min per IP → Block 10 min.
   - `/api/*` → 200 requests / 1 min per IP → Managed challenge.
3. Optional custom rules: block/challenge requests missing a browser UA, or from
   countries you don't operate in.

## 4. Laravel hardening (already in the codebase)

- ✅ `APP_DEBUG=false`, `APP_ENV=production` (see `api.env.production.example`).
- ✅ Trusted proxies configured (`bootstrap/app.php`) → detects HTTPS, sets Secure
  cookies, logs real client IP.
- ✅ `URL::forceScheme('https')` in production (`AppServiceProvider`).
- ✅ Rate limiters: `login`, `sensitive`, `api` (`AppServiceProvider` + routes).
- ✅ Server-side, unit-scoped authz for `/api/appraisals` and `/api/realizations`.
- Set `SESSION_SECURE_COOKIE=true`, `CACHE_STORE=database` (or redis).
- Build caches on deploy: `php artisan config:cache route:cache` (Docker entrypoint does this).

## 5. Next.js hardening (already in the codebase)

- ✅ Security headers + CSP (`next.config.mjs`) — `connect-src` auto-whitelists
  `NEXT_PUBLIC_API_URL`. Same-origin `/api` keeps it `'self'`.
- Set `NEXT_PUBLIC_API_URL` to your HTTPS API URL at **build** time (it's inlined).

## 6. Verify after deploy

```bash
# HTTPS + headers present
curl -sI https://nexus.example.com | grep -iE 'strict-transport|content-security|x-frame|x-content-type'

# Login brute-force lockout returns 429 after 5 tries
for i in $(seq 1 7); do curl -s -o /dev/null -w "%{http_code} " \
  -X POST https://nexus.example.com/api/auth/login \
  -H 'Content-Type: application/json' -d '{"email":"x@x.co","password":"y"}'; done; echo

# Grade the TLS config: https://www.ssllabs.com/ssltest/
```

## 7. Ongoing

- Certificates renew automatically (Caddy). Keep the `caddy_data` volume.
- Encrypted, off-site DB backups (see the app's backup routine).
- Patch regularly: `composer audit`, `npm audit`, base image updates.
- Rotate `APP_KEY`/DB creds on any suspected exposure; never commit secrets.

## Checklist

- [ ] DNS → server, domain set in `Caddyfile` + compose + `NEXT_PUBLIC_API_URL`
- [ ] `api.env.production` filled (APP_KEY, DB_PASSWORD, APP_DEBUG=false)
- [ ] `docker compose up -d --build` → HTTPS live
- [ ] Cloudflare proxied, SSL Full (strict), Bot Fight Mode
- [ ] WAF managed rules + login/API rate-limit rules
- [ ] Post-deploy verification passes (headers, 429, SSL Labs ≥ A)
