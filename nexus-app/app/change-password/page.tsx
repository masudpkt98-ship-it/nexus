"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/Logo";
import { Icon } from "@/components/Icons";
import { useI18n } from "@/lib/i18n";
import { apiChangePassword, getStoredUser, hasSession, ApiError } from "@/lib/api";

export default function ChangePasswordPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState<string>("");

  // Must be logged in (have a token) to change a password.
  useEffect(() => {
    if (!hasSession()) { router.replace("/login"); return; }
    const u = getStoredUser<{ name?: string }>();
    if (u?.name) setName(u.name);
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (next.length < 8) { setError("New password must be at least 8 characters."); return; }
    if (next !== confirm) { setError("Password confirmation does not match."); return; }
    if (next === current) { setError("New password must be different from the current one."); return; }
    setLoading(true);
    try {
      await apiChangePassword(current, next);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not change password.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6" style={{ backgroundColor: "#010414" }}>
      <div className="w-full max-w-sm animate-fade-up">
        <div className="mb-8 flex items-center gap-3">
          <LogoMark size={40} />
          <div className="text-xl font-bold tracking-[0.2em] brand-gradient">NEXUS</div>
        </div>

        <h2 className="text-2xl font-bold tracking-tight">{t("Set a new password")}</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {name ? `${t("Welcome")}, ${name}. ` : ""}{t("For security, change your initial password before continuing.")}
        </p>

        <form className="mt-8 space-y-4" onSubmit={submit}>
          <Field label={t("Current password")} value={current} onChange={setCurrent} placeholder={t("Your NPK")} />
          <Field label={t("New password")} value={next} onChange={setNext} placeholder={t("At least 8 characters")} />
          <Field label={t("Confirm new password")} value={confirm} onChange={setConfirm} />

          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-500">{t(error)}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-royal-500 to-royal-700 px-4 py-3 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-60"
          >
            {loading ? t("Saving…") : t("Change password & continue")}
            {!loading && <Icon.chevron className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">{label}</label>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border bg-[rgb(var(--surface))] px-4 py-2.5 text-sm outline-none transition focus:border-royal-500 focus:ring-2 focus:ring-royal-500/30"
      />
    </div>
  );
}
