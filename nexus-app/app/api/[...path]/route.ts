// Runtime proxy: forwards /api/* to the Laravel backend. Reads API_PROXY_TARGET
// at REQUEST time (not build time), so it works on PaaS where build-time env is
// unreliable — unlike the next.config rewrite. Keeps the app same-origin so the
// httpOnly auth cookie stays same-site (Set-Cookie flows back through here).
import { type NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function backendBase(): string {
  return (process.env.API_PROXY_TARGET || "http://127.0.0.1:8000").replace(/\/$/, "");
}

async function handle(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  const search = new URL(req.url).search;
  const target = `${backendBase()}/api/${path.map(encodeURIComponent).join("/")}${search}`;

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const init: RequestInit & { duplex?: "half" } = {
    method: req.method,
    headers,
    redirect: "manual",
  };
  if (hasBody) {
    init.body = await req.arrayBuffer();
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch {
    return new Response(JSON.stringify({ status: "error", message: "Upstream API unreachable" }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }

  // Copy headers except hop-by-hop / encoding; forward Set-Cookie individually.
  const out = new Headers();
  upstream.headers.forEach((value, key) => {
    if (["content-encoding", "content-length", "transfer-encoding", "connection", "set-cookie"].includes(key.toLowerCase())) return;
    out.set(key, value);
  });
  const cookies = (upstream.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.() ?? [];
  for (const c of cookies) out.append("set-cookie", c);

  return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers: out });
}

export {
  handle as GET,
  handle as POST,
  handle as PUT,
  handle as PATCH,
  handle as DELETE,
  handle as OPTIONS,
  handle as HEAD,
};
