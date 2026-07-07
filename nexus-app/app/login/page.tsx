"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogoMark } from "@/components/Logo";
import { Icon } from "@/components/Icons";
import { cn } from "@/components/ui";
import { apiLogin, ApiError } from "@/lib/api";

const roles = [
  { role: "VP", email: "arif.wibowo@nexus.co", label: "Executive access — full visibility" },
  { role: "Manager", email: "sinta@nexus.co", label: "Manage programs, teams & KPI" },
  { role: "Staff", email: "rani@nexus.co", label: "Execute tasks & development" },
];

const pillars = [
  { k: "Connect", d: "People, process & data as one." },
  { k: "Develop", d: "Grow competency & capability." },
  { k: "Execute", d: "Deliver with discipline." },
  { k: "Excel", d: "Achieve organizational excellence." },
];

export default function LoginPage() {
  const router = useRouter();
  const [selected, setSelected] = useState("VP");
  const [email, setEmail] = useState("arif.wibowo@nexus.co");
  const [password, setPassword] = useState("nexus");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const pickRole = (role: string, roleEmail: string) => {
    setSelected(role);
    setEmail(roleEmail);
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNote(null);
    try {
      await apiLogin(email, password);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setError("Invalid credentials. Try the demo password: nexus");
        setLoading(false);
      } else {
        // API unreachable → continue in standalone demo mode
        setNote("API offline — entering demo mode with sample data.");
        setTimeout(() => router.push("/dashboard"), 700);
      }
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between p-12 bg-navy-950">
        <div className="pointer-events-none absolute inset-0 bg-nexus-radial" />
        <div
          className="pointer-events-none absolute inset-0 grid-fade opacity-[0.15]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.4) 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative flex items-center gap-3">
          <LogoMark size={44} />
          <div>
            <div className="text-lg font-bold tracking-[0.2em] brand-gradient">NEXUS</div>
            <div className="text-[10px] tracking-[0.15em] text-slate-400">
              COMPETENCY &amp; PERFORMANCE NEXUS
            </div>
          </div>
        </div>

        <div className="relative floaty">
          <LogoMark size={150} />
        </div>

        <div className="relative">
          <h1 className="max-w-md text-3xl font-bold leading-tight text-white">
            The digital operating system for{" "}
            <span className="gold-gradient">organizational excellence</span>.
          </h1>
          <p className="mt-3 max-w-md text-sm text-slate-400">
            Connecting Excellence. Driving Performance.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {pillars.map((p) => (
              <div key={p.k} className="glass card px-4 py-3">
                <div className="text-sm font-semibold text-white">{p.k}</div>
                <div className="text-[11px] text-slate-400">{p.d}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-[11px] tracking-widest text-slate-500">
            PEOPLE • COMPETENCY • EXECUTION • PERFORMANCE • EXCELLENCE
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <LogoMark size={40} />
            <div className="text-xl font-bold tracking-[0.2em] brand-gradient">NEXUS</div>
          </div>

          <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Sign in to your workspace to continue.
          </p>

          <form className="mt-8 space-y-4" onSubmit={submit}>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">
                Work email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border bg-[rgb(var(--surface))] px-4 py-2.5 text-sm outline-none transition focus:border-royal-500 focus:ring-2 focus:ring-royal-500/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border bg-[rgb(var(--surface))] px-4 py-2.5 text-sm outline-none transition focus:border-royal-500 focus:ring-2 focus:ring-royal-500/30"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">
                Sign in as (RBAC demo)
              </label>
              <div className="grid gap-2">
                {roles.map((r) => (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => pickRole(r.role, r.email)}
                    className={cn(
                      "flex items-center justify-between rounded-xl border px-4 py-2.5 text-left text-sm transition",
                      selected === r.role
                        ? "border-royal-500 bg-royal-500/10"
                        : "hover:border-royal-500/50"
                    )}
                  >
                    <span>
                      <span className="font-medium">{r.role}</span>
                      <span className="ml-2 text-xs text-[var(--muted)]">{r.label}</span>
                    </span>
                    {selected === r.role && (
                      <Icon.check className="h-4 w-4 text-royal-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-500">
                {error}
              </div>
            )}
            {note && (
              <div className="rounded-lg border border-gold-500/30 bg-gold-400/10 px-3 py-2 text-xs text-gold-500">
                {note}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-royal-500 to-royal-700 px-4 py-3 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Enter NEXUS"}
              {!loading && <Icon.chevron className="h-4 w-4" />}
            </button>

            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-[rgba(var(--border),1)]" />
              <span className="text-[11px] text-[var(--muted)]">or</span>
              <div className="h-px flex-1 bg-[rgba(var(--border),1)]" />
            </div>

            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition hover:bg-black/5 dark:hover:bg-white/5"
            >
              <Icon.users className="h-4 w-4" />
              Single Sign-On (Active Directory)
            </button>
          </form>

          <p className="mt-8 text-center text-[11px] text-[var(--muted)]">
            One Platform. One Team. One Performance.
          </p>
        </div>
      </div>
    </div>
  );
}
