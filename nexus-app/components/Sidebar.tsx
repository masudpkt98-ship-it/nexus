"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/Logo";
import { Icon } from "@/components/Icons";
import { navItems, navSections, type NavItem } from "@/lib/nav";
import { cn } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useAuth, navAllowed } from "@/lib/auth";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const { session } = useAuth();
  // RBAC: keep only nav the current role may open (Admin sees everything).
  const visibleChildren = (item: NavItem) => item.children?.filter((c) => navAllowed(session, c.href)) ?? [];
  const itemVisible = (item: NavItem) => navAllowed(session, item.href) || visibleChildren(item).length > 0;

  // Which submodule groups are expanded. Auto-open the group whose parent or a
  // child matches the current route, so the active submodule is always visible.
  const [open, setOpen] = useState<Record<string, boolean>>({});
  useEffect(() => {
    setOpen((prev) => {
      const next = { ...prev };
      for (const item of navItems) {
        if (!item.children) continue;
        const onGroup =
          pathname === item.href ||
          pathname.startsWith(item.href + "/") ||
          item.children.some((c) => pathname === c.href);
        if (onGroup) next[item.href] = true;
      }
      return next;
    });
  }, [pathname]);

  const toggle = (href: string) => setOpen((o) => ({ ...o, [href]: !o[href] }));

  const renderItem = (item: NavItem) => {
    const IconCmp = Icon[item.icon];
    const kids = visibleChildren(item);
    const hasChildren = kids.length > 0;
    // A parent is highlighted when you're on its page; a child route highlights
    // the child instead (parent stays in a softer "within this group" state).
    const exact = pathname === item.href;
    const withinGroup = hasChildren && (pathname === item.href || pathname.startsWith(item.href + "/"));
    const expanded = hasChildren && !!open[item.href];

    if (!hasChildren) {
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={cn(
            "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition",
            exact ? "nav-active text-royal-400" : "text-[var(--text)]/80 hover:bg-black/5 dark:hover:bg-white/5"
          )}
        >
          <IconCmp
            className={cn(
              "h-[18px] w-[18px] shrink-0",
              exact ? "text-royal-400" : "text-[var(--muted)] group-hover:text-royal-400"
            )}
          />
          <span className="flex-1">{t(item.label)}</span>
          {item.badge && (
            <span className="rounded-full bg-royal-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-royal-400">
              {item.badge}
            </span>
          )}
        </Link>
      );
    }

    return (
      <div key={item.href}>
        <div
          className={cn(
            "group flex items-center gap-3 rounded-lg pl-3 pr-1.5 py-2 text-[13px] font-medium transition",
            withinGroup ? "nav-active text-royal-400" : "text-[var(--text)]/80 hover:bg-black/5 dark:hover:bg-white/5"
          )}
        >
          <Link href={item.href} onClick={onNavigate} className="flex flex-1 items-center gap-3 min-w-0">
            <IconCmp
              className={cn(
                "h-[18px] w-[18px] shrink-0",
                withinGroup ? "text-royal-400" : "text-[var(--muted)] group-hover:text-royal-400"
              )}
            />
            <span className="flex-1 truncate">{t(item.label)}</span>
          </Link>
          <button
            type="button"
            onClick={() => toggle(item.href)}
            aria-label={expanded ? "Collapse" : "Expand"}
            aria-expanded={expanded}
            className="shrink-0 rounded-md p-1 text-[var(--muted)] transition hover:bg-black/10 hover:text-royal-400 dark:hover:bg-white/10"
          >
            <Icon.chevron className={cn("h-4 w-4 transition-transform", expanded ? "rotate-90" : "")} />
          </button>
        </div>

        {expanded && (
          <div className="mt-0.5 space-y-0.5 pl-[26px]">
            {kids.map((child) => {
              const childActive = pathname === child.href;
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[12.5px] transition",
                    childActive
                      ? "nav-active font-medium text-royal-400"
                      : "text-[var(--text)]/70 hover:bg-black/5 dark:hover:bg-white/5"
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      childActive ? "bg-royal-400" : "bg-[var(--muted)]/50"
                    )}
                  />
                  <span className="flex-1 truncate">{t(child.label)}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="flex h-full w-[264px] flex-col glass border-r">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <LogoMark size={34} />
        <div className="leading-none">
          <div className="text-[15px] font-bold tracking-[0.2em] brand-gradient">NEXUS</div>
          <div className="mt-0.5 text-[9px] tracking-[0.15em] text-[var(--muted)]">
            PERFORMANCE OS
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-4">
        {navSections.map((section) => {
          const items = navItems.filter((n) => n.section === section && itemVisible(n));
          if (items.length === 0) return null; // hide sections the role can't access
          return (
            <div key={section}>
              <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                {t(section)}
              </div>
              <div className="space-y-0.5">{items.map(renderItem)}</div>
            </div>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <div className="glass card flex items-center gap-2 px-3 py-2.5">
          <Icon.spark className="h-4 w-4 text-gold-400" />
          <div className="flex-1">
            <div className="text-[11px] font-semibold">{t("AI Assistant")}</div>
            <div className="text-[10px] text-[var(--muted)]">{t("4 new insights")}</div>
          </div>
          <Link href="/ai-assistant" className="text-royal-400 hover:text-royal-500">
            <Icon.chevron className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
