"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { cn } from "@/components/ui";
import { AuthProvider, useApiAuthed } from "@/lib/auth";
import { getStoredUser, apiListEmployees } from "@/lib/api";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const authed = useApiAuthed();

  // Force provisioned accounts to change their initial password first.
  useEffect(() => {
    const u = getStoredUser<{ must_change_password?: boolean }>();
    if (u?.must_change_password) router.replace("/change-password");
  }, [router]);

  // Hydrate the Employee Directory (PII) cache from the backend — the server
  // returns ONLY the rows in this user's scope, so pickers/dashboards that read
  // `nexus-employees` show scoped data instead of a bulk client-side import.
  useEffect(() => {
    if (!authed) return;
    let alive = true;
    apiListEmployees().then((list) => {
      if (!alive || !list.length) return;
      try { localStorage.setItem("nexus-employees", JSON.stringify(list)); } catch { /* quota */ }
    }).catch(() => { /* offline → keep local cache */ });
    return () => { alive = false; };
  }, [authed]);

  return (
    <AuthProvider>
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Suspense fallback={<aside className="h-full w-[264px] glass border-r" />}>
          <Sidebar />
        </Suspense>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden transition",
          open ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/50 transition-opacity",
            open ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setOpen(false)}
        />
        <div
          className={cn(
            "absolute left-0 top-0 h-full transition-transform duration-300",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <Suspense fallback={<aside className="h-full w-[264px] glass border-r" />}>
            <Sidebar onNavigate={() => setOpen(false)} />
          </Suspense>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenu={() => setOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1400px] animate-fade-up">{children}</div>
        </main>
      </div>
    </div>
    </AuthProvider>
  );
}
