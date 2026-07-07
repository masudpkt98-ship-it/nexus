"use client";
import { useEffect, useState } from "react";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, SectionTitle, Badge, ProgressBar, Avatar } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { objectives as mockObjectives } from "@/lib/data";
import { useApiData } from "@/lib/useApi";
import { apiSend, getToken } from "@/lib/api";
import { LiveBadge } from "@/components/LiveBadge";

const flow = ["Vision", "Mission", "Goals", "Annual Program (RKAP)", "Initiatives", "OKR", "Milestones"];

type KeyResult = { title: string; progress: number };
type Obj = { id: string; title: string; owner: string; progress: number; quarter: string; keyResults: KeyResult[] };

export default function StrategyPage() {
  const { data: apiObjectives, live } = useApiData("/objectives", mockObjectives);

  const [rows, setRows] = useState<Obj[]>([]);
  useEffect(() => {
    setRows(
      (apiObjectives ?? []).map((o: Partial<Obj>) => ({
        id: String(o.id),
        title: o.title ?? "",
        owner: o.owner ?? "—",
        progress: Number(o.progress ?? 0),
        quarter: o.quarter ?? "Q1",
        keyResults: o.keyResults ?? [],
      }))
    );
  }, [apiObjectives]);

  const empty = { open: false, id: null as string | null, title: "", quarter: "Q1", progress: 0 };
  const [form, setForm] = useState(empty);
  const openCreate = () => setForm({ ...empty, open: true });
  const openEdit = (o: Obj) => setForm({ open: true, id: o.id, title: o.title, quarter: o.quarter, progress: o.progress });

  const saveForm = async () => {
    const body = { title: form.title.trim(), quarter: form.quarter, progress: form.progress };
    if (!body.title) return;
    if (getToken()) {
      try {
        if (form.id == null) {
          const created = await apiSend<Obj>("POST", "/objectives", body);
          setRows((r) => [...r, created]);
        } else {
          const updated = await apiSend<Obj>("PUT", `/objectives/${form.id}`, body);
          setRows((r) => r.map((x) => (x.id === form.id ? updated : x)));
        }
      } catch {
        return;
      }
    } else if (form.id == null) {
      setRows((r) => [...r, { id: "NEW-" + r.length, owner: "You", keyResults: [], ...body }]);
    } else {
      setRows((r) => r.map((x) => (x.id === form.id ? { ...x, ...body } : x)));
    }
    setForm(empty);
  };

  const removeRow = async (o: Obj) => {
    setRows((r) => r.filter((x) => x.id !== o.id));
    if (getToken()) {
      try {
        await apiSend("DELETE", `/objectives/${o.id}`);
      } catch {
        /* ignore */
      }
    }
  };

  return (
    <>
      <PageHeader
        title="Strategic Planning"
        subtitle="Vision · Mission · Department Goals · Annual Programs · OKR · RKAP"
        actions={<><LiveBadge live={live} /><Btn variant="primary" onClick={openCreate}><Icon.plus className="h-4 w-4" /> New Objective</Btn></>}
      />

      {/* Vision / Mission */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 relative overflow-hidden">
          <div className="pointer-events-none absolute -right-8 -top-8 opacity-10">
            <Icon.strategy className="h-40 w-40" />
          </div>
          <Badge tone="gold">Vision</Badge>
          <p className="mt-3 text-xl font-semibold leading-snug">
            To become the intelligent digital ecosystem for{" "}
            <span className="gold-gradient">organizational excellence</span>.
          </p>
          <div className="mt-5">
            <Badge tone="blue">Mission</Badge>
            <p className="mt-2 text-sm text-[var(--muted)]">
              To empower organizations through integrated competency and performance management —
              connecting people, competency, execution, and value into one operating system.
            </p>
          </div>
        </Card>

        <Card>
          <SectionTitle title="Strategy Cascade" subtitle="Everything connected" />
          <div className="space-y-1.5">
            {flow.map((f, i) => (
              <div key={f} className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-royal-500/15 text-[11px] font-bold text-royal-400">
                  {i + 1}
                </div>
                <span className="text-[13px]">{f}</span>
                {i < flow.length - 1 && <Icon.chevron className="ml-auto h-4 w-4 rotate-90 text-[var(--muted)]" />}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* OKR */}
      <div className="mt-4">
        <SectionTitle title="Objectives & Key Results (OKR)" subtitle="FY26 — Department strategic objectives" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {rows.map((o) => (
            <Card key={o.id} className="group">
              <div className="flex items-center justify-between">
                <Badge tone="blue">{o.quarter}</Badge>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold gold-gradient">{o.progress}%</span>
                  <button
                    onClick={() => openEdit(o)}
                    aria-label={`Edit ${o.title}`}
                    title="Edit"
                    className="text-[11px] font-medium text-[var(--muted)] opacity-0 transition hover:text-royal-400 group-hover:opacity-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => removeRow(o)}
                    aria-label={`Delete ${o.title}`}
                    title="Delete"
                    className="text-[11px] text-[var(--muted)] opacity-0 transition hover:text-rose-400 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <h3 className="mt-2 text-[15px] font-semibold leading-snug">{o.title}</h3>
              <div className="mt-2 flex items-center gap-2 text-xs text-[var(--muted)]">
                <Avatar initials={o.owner.split(" ").map((s) => s[0]).join("")} />
                {o.owner}
              </div>
              <ProgressBar value={o.progress} tone="gold" className="mt-3" />
              <div className="mt-4 space-y-3 border-t pt-3">
                {o.keyResults.map((kr) => (
                  <div key={kr.title}>
                    <div className="flex justify-between text-[12px]">
                      <span className="text-[var(--muted)]">{kr.title}</span>
                      <span className="font-medium">{kr.progress}%</span>
                    </div>
                    <ProgressBar value={kr.progress} className="mt-1" />
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {form.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setForm(empty)} />
          <div className="relative z-10 w-full max-w-md glass card shadow-glass animate-fade-up">
            <div className="flex items-center gap-2 border-b p-4">
              <Icon.strategy className="h-4 w-4 shrink-0 text-royal-400" />
              <div className="text-sm font-semibold">{form.id == null ? "New Objective" : "Edit Objective"}</div>
              <button
                onClick={() => setForm(empty)}
                className="ml-auto rounded-lg px-2 py-1 text-[var(--muted)] transition hover:text-rose-400"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 p-5">
              <label className="block text-[11px] font-medium text-[var(--muted)]">
                Objective
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Launch Talent Marketplace"
                  className="mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] outline-none focus:border-royal-500"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-[11px] font-medium text-[var(--muted)]">
                  Quarter
                  <select
                    value={form.quarter}
                    onChange={(e) => setForm((f) => ({ ...f, quarter: e.target.value }))}
                    className="mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] text-[var(--text)] outline-none focus:border-royal-500"
                  >
                    <option>Q1</option>
                    <option>Q2</option>
                    <option>Q3</option>
                    <option>Q4</option>
                  </select>
                </label>
                <label className="block text-[11px] font-medium text-[var(--muted)]">
                  Progress (%)
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.progress}
                    onChange={(e) => setForm((f) => ({ ...f, progress: Number(e.target.value) }))}
                    className="mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] outline-none focus:border-royal-500"
                  />
                </label>
              </div>
              {form.id == null && (
                <p className="text-[11px] text-[var(--muted)]">Owner is set to you when created.</p>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t p-3">
              <Btn variant="ghost" onClick={() => setForm(empty)}>
                Cancel
              </Btn>
              <Btn variant="primary" onClick={saveForm}>
                {form.id == null ? "Create" : "Save"}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
