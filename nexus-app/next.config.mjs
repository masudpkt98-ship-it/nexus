/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== "production";

// API origin(s) the browser is allowed to call (connect-src). Derived from the
// configured API URL so a deployed backend host is whitelisted automatically.
function apiOrigins() {
  const set = new Set(["http://127.0.0.1:8000", "http://localhost:8000"]);
  try {
    const raw = process.env.NEXT_PUBLIC_API_URL;
    if (raw) set.add(new URL(raw).origin);
  } catch {
    /* ignore malformed URL */
  }
  return [...set];
}

// Content-Security-Policy. 'unsafe-inline' is kept for script/style because the
// app relies on React inline styles + Next's inline hydration/runtime; 'unsafe-eval'
// is dev-only (HMR). Even so, connect/img/frame/object restrictions add real
// protection. Tighten to nonces once the runtime allows.
function csp() {
  const connect = ["'self'", ...apiOrigins(), ...(isDev ? ["ws:", "wss:"] : [])].join(" ");
  const script = ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : [])].join(" ");
  return [
    "default-src 'self'",
    `script-src ${script}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${connect}`,
    "frame-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp() },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  // Only honored over HTTPS; harmless on HTTP. 2 years + preload once TLS is live.
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  poweredByHeader: false, // drop the X-Powered-By: Next.js fingerprint
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Same-origin API proxy for production (esp. PaaS where separate subdomains are
  // cross-site and would drop the httpOnly auth cookie). Set API_PROXY_TARGET to
  // the backend's URL and NEXT_PUBLIC_API_URL=/api — the browser then talks only
  // to the frontend origin (cookie stays same-site) and Next proxies to Laravel.
  // Unset in dev → no rewrite, so the existing localhost:8000 flow is untouched.
  async rewrites() {
    const target = process.env.API_PROXY_TARGET;
    if (!target) return [];
    return [{ source: "/api/:path*", destination: `${target.replace(/\/$/, "")}/api/:path*` }];
  },
};

export default nextConfig;
