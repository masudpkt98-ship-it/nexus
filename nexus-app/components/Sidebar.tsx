"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/Logo";
import { Icon } from "@/components/Icons";
import { navItems, navSections } from "@/lib/nav";
import { cn } from "@/components/ui";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

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
        {navSections.map((section) => (
          <div key={section}>
            <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              {section}
            </div>
            <div className="space-y-0.5">
              {navItems
                .filter((n) => n.section === section)
                .map((item) => {
                  const active = pathname === item.href;
                  const IconCmp = Icon[item.icon];
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition",
                        active
                          ? "nav-active text-royal-400"
                          : "text-[var(--text)]/80 hover:bg-black/5 dark:hover:bg-white/5"
                      )}
                    >
                      <IconCmp
                        className={cn(
                          "h-[18px] w-[18px] shrink-0",
                          active ? "text-royal-400" : "text-[var(--muted)] group-hover:text-royal-400"
                        )}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="rounded-full bg-royal-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-royal-400">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t p-3">
        <div className="glass card flex items-center gap-2 px-3 py-2.5">
          <Icon.spark className="h-4 w-4 text-gold-400" />
          <div className="flex-1">
            <div className="text-[11px] font-semibold">AI Assistant</div>
            <div className="text-[10px] text-[var(--muted)]">4 new insights</div>
          </div>
          <Link href="/ai-assistant" className="text-royal-400 hover:text-royal-500">
            <Icon.chevron className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
