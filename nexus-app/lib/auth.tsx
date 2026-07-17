"use client";
// -----------------------------------------------------------------------------
// Lightweight RBAC (demo). A session carries an identity + a data scope by unit
// kerja / directorate. "View as" a Nexian (KPI Partner) restricts the app to
// that person's scope; Admin sees everything. All client-side (localStorage).
// -----------------------------------------------------------------------------
import React, { createContext, useContext, useEffect, useState } from "react";
import type { Employee } from "./data";
import type { Nexian } from "./nexian";

export type AccessRole = "Admin" | "KPI Partner Manajemen" | "KPI Partner";

export interface Scope {
  all: boolean; // full access
  directorates: string[]; // scoped to whole directorate(s)
  units: string[]; // scoped to specific unit kerja
}

export interface Session {
  name: string;
  npk: string; // "" for Admin
  role: AccessRole;
  scope: Scope;
}

const KEY = "nexus-session";
export const ADMIN: Session = { name: "Administrator", npk: "", role: "Admin", scope: { all: true, directorates: [], units: [] } };

// Nav hrefs a non-admin (KPI Partner / Manajemen) may open. Admin sees all.
export const PARTNER_NAV = new Set<string>([
  "/dashboard", "/dashboard/performance", "/dashboard/competency", "/dashboard/eligibility",
  "/people", "/competency", "/competency/dictionary", "/competency/matrix",
  "/performance", "/performance/dictionary", "/performance/planning",
  "/development", "/nexian", "/notifications",
]);

export function scopeAllows(s: Session, directorate?: string, unit?: string): boolean {
  if (s.scope.all) return true;
  if (directorate && s.scope.directorates.includes(directorate)) return true;
  if (unit && s.scope.units.includes(unit)) return true;
  return false;
}

export const navAllowed = (s: Session, href: string) => s.role === "Admin" || PARTNER_NAV.has(href);

// Build a scoped session from a Nexian. Scope follows the Nexian's ASSIGNED unit
// kerja (their KPI-Partner posting), which matches the Directory's Unit Kerja.
// Manajemen → the whole directorate of that unit; Partner → just that unit.
export function sessionFromNexian(n: Nexian, directory: Employee[]): Session {
  const byNpk = directory.find((e) => String(e.npk) === String(n.npk));
  const unit = (n.unit || byNpk?.unit || "").trim();
  // Directorate that owns this unit (from any employee in it), else the person's own.
  const inUnit = directory.find((e) => String(e.unit ?? "").trim() === unit);
  const directorate = (inUnit?.directorate || byNpk?.directorate || "").trim();
  const isMgmt = /manajemen/i.test(n.role);
  return {
    name: n.name || "Nexian",
    npk: n.npk,
    role: isMgmt ? "KPI Partner Manajemen" : "KPI Partner",
    scope: isMgmt
      ? { all: false, directorates: directorate ? [directorate] : [], units: unit ? [unit] : [] }
      : { all: false, directorates: [], units: unit ? [unit] : [] },
  };
}

export function scopeLabel(s: Session): string {
  if (s.scope.all) return "All units";
  const parts = [...s.scope.directorates, ...s.scope.units];
  return parts.length ? parts.join(" · ") : "—";
}

interface Ctx {
  session: Session;
  setSession: (s: Session) => void;
  resetAdmin: () => void;
}
const AuthContext = createContext<Ctx>({ session: ADMIN, setSession: () => {}, resetAdmin: () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<Session>(ADMIN);
  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setSessionState(JSON.parse(raw) as Session); } catch { /* keep default */ }
  }, []);
  const setSession = (s: Session) => {
    setSessionState(s);
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
  };
  const resetAdmin = () => setSession(ADMIN);
  return <AuthContext.Provider value={{ session, setSession, resetAdmin }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
