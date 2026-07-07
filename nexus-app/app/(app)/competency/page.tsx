"use client";
import { useEffect, useState } from "react";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, SectionTitle, Badge, ProgressBar, Avatar } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { competencies as mockCompetencies, developmentPlans as mockDevelopmentPlans } from "@/lib/data";
import { useApiData } from "@/lib/useApi";
import { apiSend, apiDownload, getToken } from "@/lib/api";
import { LiveBadge } from "@/components/LiveBadge";

type Comp = { id: number; name: string; category: string; current: number; required: number };

export default function CompetencyPage() {
  const { data, live } = useApiData("/competency", {
    competencies: mockCompetencies,
    developmentPlans: mockDevelopmentPlans,
  });
  const developmentPlans = data.developmentPlans;

  const [rows, setRows] = useState<Comp[]>([]);
  useEffect(() => {
    setRows(
      (data.competencies ?? []).map(
        (c: { id?: number; name: string; category: string; current: number; required: number }, i: number) => ({
          id: c.id ?? i + 1,
          name: c.name,
          category: c.category,
          current: c.current,
          required: c.required,
        })
      )
    );
  }, [data.competencies]);

  const empty = { open: false, id: null as number | null, name: "", category: "", current: 3, required: 4 };
  const [form, setForm] = useState(empty);
  const openCreate = () => setForm({ ...empty, open: true });
  const openEdit = (c: Comp) =>
    setForm({ open: true, id: c.id, name: c.name, category: c.category, current: c.current, required: c.required });

  const saveForm = async () => {
    const body = {
      name: form.name.trim(),
      category: form.category.trim(),
      current: form.current,
      required: form.required,
    };
    if (!body.name || !body.category) return;
    if (getToken()) {
      try {
        if (form.id == null) {
          const created = await apiSend<Comp>("POST", "/competency", body);
          setRows((r) => [...r, created]);
        } else {
          const updated = await apiSend<Comp>("PUT", `/competency/${form.id}`, body);
          setRows((r) => r.map((x) => (x.id === form.id ? updated : x)));
        }
      } catch {
        return; // API rejected (e.g. no permission) — keep the form open
      }
    } else if (form.id == null) {
      setRows((r) => [...r, { id: Math.max(0, ...r.map((x) => x.id)) + 1, ...body }]);
    } else {
      setRows((r) => r.map((x) => (x.id === form.id ? { ...x, ...body } : x)));
    }
    setForm(empty);
  };

  const removeRow = async (c: Comp) => {
    setRows((r) => r.filter((x) => x.id !== c.id));
    if (getToken()) {
      try {
        await apiSend("DELETE", `/competency/${c.id}`);
      } catch {
        /* ignore */
      }
    }
  };

  const avgReq = rows.reduce((s, c) => s + c.required, 0);
  const avgCur = rows.reduce((s, c) => s + c.current, 0);
  const index = avgReq ? Math.round((avgCur / avgReq) * 100) : 0;
  const gaps = rows.filter((c) => c.current < c.required);

  return (
    <>
      <PageHeader
        title="Competency Management"
        subtitle="Dictionary · Matrix · Mapping · Assessment · Gap Analysis · IDP · Career Readiness"
        actions={
          <>
            <LiveBadge live={live} />
            {getToken() && (
              <Btn onClick={() => apiDownload("/exports/competencies", undefined, "nexus-competencies.xlsx", "GET")}>
                <Icon.document className="h-4 w-4" /> Excel
              </Btn>
            )}
            <Btn variant="primary" onClick={openCreate}>
              <Icon.plus className="h-4 w-4" /> New Competency
            </Btn>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <div className="text-xs text-[var(--muted)]">Competency Index</div>
          <div className="mt-1 text-2xl font-bold gold-gradient">{index}%</div>
          <ProgressBar value={index} tone="gold" className="mt-2" />
        </Card>
        <Card>
          <div className="text-xs text-[var(--muted)]">Critical Gaps</div>
          <div className="mt-1 text-2xl font-bold text-rose-500">{gaps.length}</div>
          <div className="mt-1 text-[11px] text-[var(--muted)]">across {rows.length} competencies</div>
        </Card>
        <Card>
          <div className="text-xs text-[var(--muted)]">Assessed Staff</div>
          <div className="mt-1 text-2xl font-bold">92%</div>
          <div className="mt-1 text-[11px] text-[var(--muted)]">of department</div>
        </Card>
        <Card>
          <div className="text-xs text-[var(--muted)]">Certifications</div>
          <div className="mt-1 text-2xl font-bold text-royal-400">42</div>
          <div className="mt-1 text-[11px] text-[var(--muted)]">active this year</div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Gap analysis */}
        <Card className="lg:col-span-2">
          <SectionTitle title="Competency Gap Analysis" subtitle="Required vs current proficiency (level 1–5)" />
          <div className="space-y-4">
            {rows.map((c) => {
              const gap = c.required - c.current;
              return (
                <div key={c.id} className="group">
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{c.name}</span>
                      <Badge tone="gray">{c.category}</Badge>
                    </span>
                    <span className="flex items-center gap-2 text-xs text-[var(--muted)]">
                      <span>
                        {c.current} / {c.required}
                        {gap > 0 && <span className="ml-2 text-rose-500">−{gap}</span>}
                      </span>
                      <button
                        onClick={() => openEdit(c)}
                        className="font-medium opacity-0 transition hover:text-royal-400 group-hover:opacity-100"
                        aria-label={`Edit ${c.name}`}
                        title="Edit"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => removeRow(c)}
                        className="opacity-0 transition hover:text-rose-400 group-hover:opacity-100"
                        aria-label={`Delete ${c.name}`}
                        title="Delete"
                      >
                        ✕
                      </button>
                    </span>
                  </div>
                  <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                    {/* required marker */}
                    <div
                      className="absolute inset-y-0 rounded-full bg-royal-500/25"
                      style={{ width: `${(c.required / 5) * 100}%` }}
                    />
                    <div
                      className={`absolute inset-y-0 rounded-full bg-gradient-to-r ${
                        gap > 0 ? "from-gold-400 to-gold-500" : "from-emerald-400 to-emerald-500"
                      }`}
                      style={{ width: `${(c.current / 5) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-4 text-[11px] text-[var(--muted)]">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-royal-500/40" /> Required</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-gold-400" /> Current (gap)</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-emerald-500" /> Met</span>
          </div>
        </Card>

        {/* Learning recommendation */}
        <Card>
          <SectionTitle title="AI Learning Recommendations" action={<Icon.spark className="h-4 w-4 text-gold-400" />} />
          <div className="space-y-3">
            {gaps.slice(0, 4).map((c) => (
              <div key={c.id} className="rounded-xl border p-3">
                <div className="text-[13px] font-medium">{c.name}</div>
                <div className="mt-1 text-[11px] text-[var(--muted)]">
                  Recommended: {c.category} advanced track · est. 6 weeks
                </div>
                <button className="mt-2 text-[11px] font-medium text-royal-400 hover:underline">
                  Add to IDP →
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Career readiness */}
      <div className="mt-4">
        <SectionTitle title="Career Readiness & IDP" subtitle="Individual Development Plans" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {developmentPlans.map((d) => (
            <Card key={d.employee}>
              <div className="flex items-center gap-3">
                <Avatar initials={d.avatar} tone={d.readiness >= 90 ? "gold" : "blue"} />
                <div>
                  <div className="text-[13px] font-semibold">{d.employee}</div>
                  <div className="text-[10px] text-[var(--muted)]">{d.role}</div>
                </div>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <span className="text-[11px] text-[var(--muted)]">Readiness</span>
                <span className="text-lg font-bold">{d.readiness}%</span>
              </div>
              <ProgressBar value={d.readiness} tone={d.readiness >= 90 ? "gold" : "blue"} className="mt-1" />
              <div className="mt-3 flex items-center gap-2 text-[11px]">
                <Badge tone={d.gaps === 0 ? "green" : "amber"}>{d.gaps} gap{d.gaps !== 1 ? "s" : ""}</Badge>
              </div>
              <div className="mt-2 flex items-start gap-1.5 text-[11px] text-[var(--muted)]">
                <Icon.development className="mt-0.5 h-3.5 w-3.5 shrink-0 text-royal-400" />
                {d.nextStep}
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
              <Icon.competency className="h-4 w-4 shrink-0 text-royal-400" />
              <div className="text-sm font-semibold">{form.id == null ? "New Competency" : "Edit Competency"}</div>
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
                Name
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Cloud Architecture"
                  className="mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] outline-none focus:border-royal-500"
                />
              </label>
              <label className="block text-[11px] font-medium text-[var(--muted)]">
                Category
                <input
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="e.g. Technical"
                  list="competency-categories"
                  className="mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] outline-none focus:border-royal-500"
                />
                <datalist id="competency-categories">
                  {Array.from(new Set(rows.map((c) => c.category))).map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-[11px] font-medium text-[var(--muted)]">
                  Current level
                  <select
                    value={form.current}
                    onChange={(e) => setForm((f) => ({ ...f, current: Number(e.target.value) }))}
                    className="mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] text-[var(--text)] outline-none focus:border-royal-500"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        Level {n}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-[11px] font-medium text-[var(--muted)]">
                  Required level
                  <select
                    value={form.required}
                    onChange={(e) => setForm((f) => ({ ...f, required: Number(e.target.value) }))}
                    className="mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] text-[var(--text)] outline-none focus:border-royal-500"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        Level {n}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
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
