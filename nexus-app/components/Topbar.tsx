"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icons";
import { useTheme } from "@/components/ThemeProvider";
import { useI18n, LANGS } from "@/lib/i18n";
import { Avatar, cn } from "@/components/ui";
import { currentUser, notifications as mockNotifications } from "@/lib/data";
import { apiGet, apiLogout, apiSend, getToken } from "@/lib/api";

type Notif = { id: string; channel: string; kind?: string; title: string; time: string; read: boolean };

export function Topbar({ onMenu }: { onMenu?: () => void }) {
  const { theme, toggle } = useTheme();
  const { t, lang, setLang } = useI18n();
  const [openNotif, setOpenNotif] = useState(false);
  const [openLang, setOpenLang] = useState(false);

  const [items, setItems] = useState<Notif[]>(
    getToken() ? [] : (mockNotifications as unknown as Notif[])
  );

  // Live notifications: poll every few seconds so new items appear on their own.
  useEffect(() => {
    if (!getToken()) return;
    let active = true;
    const load = async () => {
      try {
        const list = await apiGet<Notif[]>("/notifications");
        if (active && Array.isArray(list)) setItems(list);
      } catch {
        /* keep the last snapshot */
      }
    };
    load();
    const timer = setInterval(load, 4000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const unread = items.filter((n) => !n.read).length;

  const markAllRead = async () => {
    setItems((list) => list.map((n) => ({ ...n, read: true })));
    if (getToken()) {
      try {
        await apiSend("POST", "/notifications/read-all");
      } catch {
        /* ignore */
      }
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 glass border-b px-4 sm:px-6">
      <button
        onClick={onMenu}
        className="rounded-lg p-2 hover:bg-black/5 dark:hover:bg-white/5 lg:hidden"
        aria-label="Menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
        </svg>
      </button>

      {/* Global search */}
      <div className="relative flex-1 max-w-md">
        <Icon.search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
        <input
          placeholder={t("Search tasks, people, KPI, documents…")}
          className="w-full rounded-xl border bg-[rgb(var(--surface))]/60 py-2 pl-9 pr-16 text-sm outline-none transition focus:border-royal-500 focus:ring-2 focus:ring-royal-500/20"
        />
        <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border px-1.5 py-0.5 text-[10px] text-[var(--muted)]">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <div className="relative">
          <button
            onClick={() => setOpenLang((o) => !o)}
            className="rounded-lg px-2 py-2 text-[11px] font-semibold text-[var(--muted)] transition hover:bg-black/5 hover:text-[var(--text)] dark:hover:bg-white/5"
            aria-label="Language"
          >
            {lang.toUpperCase()}
          </button>
          {openLang && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpenLang(false)} />
              <div className="absolute right-0 top-11 z-20 max-h-80 w-44 overflow-y-auto glass card p-1 shadow-glass animate-fade-up">
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLang(l.code);
                      setOpenLang(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] transition hover:bg-black/5 dark:hover:bg-white/5",
                      lang === l.code && "font-semibold text-royal-400"
                    )}
                  >
                    <span className="w-6 text-[10px] font-semibold text-[var(--muted)]">{l.code.toUpperCase()}</span>
                    {l.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <button
          onClick={toggle}
          className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-black/5 hover:text-[var(--text)] dark:hover:bg-white/5"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Icon.sun className="h-[18px] w-[18px]" /> : <Icon.moon className="h-[18px] w-[18px]" />}
        </button>

        <div className="relative">
          <button
            onClick={() => setOpenNotif((o) => !o)}
            className="relative rounded-lg p-2 text-[var(--muted)] transition hover:bg-black/5 hover:text-[var(--text)] dark:hover:bg-white/5"
            aria-label="Notifications"
          >
            <Icon.bell className="h-[18px] w-[18px]" />
            {unread > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                {unread}
              </span>
            )}
          </button>
          {openNotif && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpenNotif(false)} />
              <div className="absolute right-0 top-11 z-20 w-80 glass card p-2 shadow-glass animate-fade-up">
                <div className="flex items-center justify-between px-2 py-1.5">
                  <span className="text-sm font-semibold">{t("Notifications")}</span>
                  <div className="flex items-center gap-3">
                    {unread > 0 && (
                      <button onClick={markAllRead} className="text-[11px] text-[var(--muted)] hover:text-royal-400">
                        {t("Mark all read")}
                      </button>
                    )}
                    <Link href="/notifications" className="text-[11px] text-royal-400" onClick={() => setOpenNotif(false)}>
                      {t("View all")}
                    </Link>
                  </div>
                </div>
                <div className="max-h-80 space-y-1 overflow-y-auto">
                  {items.length === 0 && (
                    <p className="px-2 py-6 text-center text-[11px] text-[var(--muted)]">{t("No notifications.")}</p>
                  )}
                  {items.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "rounded-lg px-2 py-2 text-xs transition hover:bg-black/5 dark:hover:bg-white/5",
                        !n.read && "bg-royal-500/5"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-royal-500/15 px-1.5 py-0.5 text-[9px] font-medium text-royal-400">
                          {n.channel}
                        </span>
                        <span className="ml-auto text-[10px] text-[var(--muted)]">{t(n.time)}</span>
                      </div>
                      <p className="mt-1 leading-snug">{n.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mx-1 h-6 w-px bg-[rgba(var(--border),1)]" />

        <div className="flex items-center gap-2.5 pl-1">
          <Avatar initials={currentUser.avatar} />
          <div className="hidden leading-tight sm:block">
            <div className="text-[13px] font-semibold">{currentUser.name}</div>
            <div className="text-[10px] text-[var(--muted)]">{currentUser.role} · {currentUser.title}</div>
          </div>
          <Link
            href="/login"
            onClick={() => apiLogout()}
            className="ml-1 rounded-lg p-2 text-[var(--muted)] transition hover:bg-black/5 hover:text-rose-400 dark:hover:bg-white/5"
            aria-label="Log out"
          >
            <Icon.logout className="h-[18px] w-[18px]" />
          </Link>
        </div>
      </div>
    </header>
  );
}
