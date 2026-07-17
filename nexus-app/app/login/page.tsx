"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogoMark } from "@/components/Logo";
import { Icon } from "@/components/Icons";
import { cn } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { apiLogin, ApiError } from "@/lib/api";
import { persistSession, sessionFromApiUser } from "@/lib/auth";

const roles = [
  { role: "Administrator", email: "admin@nexus.co", label: "Full access — all units" },
  { role: "KPI Partner", email: "kharisma@nexus.co", label: "Scoped to Departemen Audit Bisnis & Keuangan" },
  { role: "KPI Partner Manajemen", email: "rahmadian@nexus.co", label: "Scoped to Direktorat Utama" },
];

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [selected, setSelected] = useState("Administrator");
  const [email, setEmail] = useState("admin@nexus.co");
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
      const data = await apiLogin(email, password);
      // Derive the client access scope (unit kerja) from the authenticated user.
      if (data?.user) persistSession(sessionFromApiUser(data.user));
      // First login (provisioned account) → force a password change.
      router.push(data?.user?.must_change_password ? "/change-password" : "/dashboard");
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
      {/* Brand panel — the full NEXUS artwork, shown complete (no crop).
          Background matches the poster's own dark navy so the letterbox
          bands from object-contain blend in seamlessly. */}
      <div
        className="relative hidden overflow-hidden lg:block"
        style={{ backgroundColor: "#010414" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/nexus_login.png"
          alt="NEXUS — Competency & Performance Nexus. Connecting Excellence. Driving Performance."
          className="h-full w-full select-none object-contain"
          draggable={false}
        />
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <LogoMark size={40} />
            <div className="text-xl font-bold tracking-[0.2em] brand-gradient">NEXUS</div>
          </div>

          <h2 className="text-2xl font-bold tracking-tight">{t("Welcome back")}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {t("Sign in to your workspace to continue.")}
          </p>

          <form className="mt-8 space-y-4" onSubmit={submit}>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">
                {t("Work email")}
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
                {t("Password")}
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
                {t("Sign in as (RBAC demo)")}
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
                      <span className="ml-2 text-xs text-[var(--muted)]">{t(r.label)}</span>
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
                {t(error)}
              </div>
            )}
            {note && (
              <div className="rounded-lg border border-gold-500/30 bg-gold-400/10 px-3 py-2 text-xs text-gold-500">
                {t(note)}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-royal-500 to-royal-700 px-4 py-3 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? t("Signing in…") : t("Enter NEXUS")}
              {!loading && <Icon.chevron className="h-4 w-4" />}
            </button>

            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-[rgba(var(--border),1)]" />
              <span className="text-[11px] text-[var(--muted)]">{t("or")}</span>
              <div className="h-px flex-1 bg-[rgba(var(--border),1)]" />
            </div>

            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition hover:bg-black/5 dark:hover:bg-white/5"
            >
              <Icon.users className="h-4 w-4" />
              {t("Single Sign-On (Active Directory)")}
            </button>
          </form>

          <p className="mt-8 text-center text-[11px] text-[var(--muted)]">
            {t("One Platform. One Team. One Performance.")}
          </p>
        </div>
      </div>
    </div>
  );
}
