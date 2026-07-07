import type { FullConfig } from "@playwright/test";

/**
 * Warms the API once before the suite. The dev API (`php artisan serve`) is
 * single-threaded, so the very first authenticated streaming request after a
 * cold boot is slow (cold opcache + first DB connection). Priming the slow
 * paths here removes that first-request flakiness from the actual tests.
 *
 * Best-effort: any failure is ignored — the tests still run.
 */
async function globalSetup(_config: FullConfig) {
  const api = process.env.E2E_API_URL ?? "http://localhost:8000/api";

  try {
    const login = await fetch(`${api}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email: "arif.wibowo@nexus.co", password: "nexus" }),
    });
    if (!login.ok) return;
    const token: string = (await login.json()).token;
    const auth = { Authorization: `Bearer ${token}`, Accept: "application/json" };
    const json = { ...auth, "Content-Type": "application/json" };

    // Warm the streaming chat path (create a throwaway thread, stream a reply).
    const threadRes = await fetch(`${api}/ai/threads`, { method: "POST", headers: auth });
    const threadId: number | undefined = threadRes.ok ? (await threadRes.json()).id : undefined;
    if (threadId != null) {
      const stream = await fetch(`${api}/ai/chat/stream`, {
        method: "POST",
        headers: json,
        body: JSON.stringify({ message: "warm up", thread_id: threadId }),
      });
      await stream.text(); // drain the SSE stream
      await fetch(`${api}/ai/threads/${threadId}`, { method: "DELETE", headers: auth }).catch(() => {});
    }

    // Warm the generators and the competency lookup used by the IDP dropdown.
    await Promise.allSettled([
      fetch(`${api}/ai/generate/report`, { method: "POST", headers: json, body: "{}" }),
      fetch(`${api}/competency`, { headers: auth }),
    ]);
  } catch {
    // Ignore — warm-up is best-effort.
  }
}

export default globalSetup;
