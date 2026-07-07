"use client";
import React, { useEffect, useState } from "react";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, SectionTitle, Badge, ProgressBar, Avatar } from "@/components/ui";
import { Icon } from "@/components/Icons";
import {
  objectives as mockObjectives,
  strategyStatement as mockStatement,
  coreValues as mockValues,
  strategicGoals as mockGoals,
  swotItems as mockSwot,
  type SwotType,
} from "@/lib/data";
import { useApiData } from "@/lib/useApi";
import { useLocalState } from "@/lib/useLocalState";
import { useI18n } from "@/lib/i18n";
import { apiSend, getToken } from "@/lib/api";
import { LiveBadge } from "@/components/LiveBadge";

const flow = ["Vision", "Mission", "Core Values", "Strategic Goals", "SWOT", "OKR", "Milestones"];

const inputCls =
  "mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] outline-none focus:border-royal-500";
const labelCls = "block text-[11px] font-medium text-[var(--muted)]";

// Collision-safe id generator — data persists across refreshes, so a plain
// session counter could clash with previously-stored ids.
let seq = 0;
const nextId = (prefix: string) => {
  try {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  } catch {
    return `${prefix}-new-${++seq}-${Date.now()}`;
  }
};

// ---------------------------------------------------------------------------
// Shared modal shell — mirrors the existing OKR modal styling.
// ---------------------------------------------------------------------------
function Modal({
  title,
  onClose,
  onSave,
  saveLabel,
  children,
}: {
  title: string;
  onClose: () => void;
  onSave: () => void;
  saveLabel: string;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md glass card shadow-glass animate-fade-up">
        <div className="flex items-center gap-2 border-b p-4">
          <Icon.strategy className="h-4 w-4 shrink-0 text-royal-400" />
          <div className="text-sm font-semibold">{title}</div>
          <button
            onClick={onClose}
            className="ml-auto rounded-lg px-2 py-1 text-[var(--muted)] transition hover:text-rose-400"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="space-y-3 p-5">{children}</div>
        <div className="flex justify-end gap-2 border-t p-3">
          <Btn variant="ghost" onClick={onClose}>
            {t("Cancel")}
          </Btn>
          <Btn variant="primary" onClick={onSave}>
            {saveLabel}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// Hover-reveal edit / delete controls shared by every CRUD row.
function RowActions({ onEdit, onDelete, label }: { onEdit: () => void; onDelete: () => void; label: string }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onEdit}
        aria-label={`Edit ${label}`}
        title={t("Edit")}
        className="text-[11px] font-medium text-[var(--muted)] opacity-0 transition hover:text-royal-400 group-hover:opacity-100"
      >
        {t("Edit")}
      </button>
      <button
        onClick={onDelete}
        aria-label={`Delete ${label}`}
        title={t("Delete")}
        className="text-[11px] text-[var(--muted)] opacity-0 transition hover:text-rose-400 group-hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Vision & Mission — editable statement.
// ---------------------------------------------------------------------------
function VisionMission() {
  const { t } = useI18n();
  const [statement, setStatement] = useLocalState("strategy-statement", mockStatement);
  const [form, setForm] = useState<{ open: boolean; vision: string; mission: string }>({
    open: false,
    vision: "",
    mission: "",
  });

  const open = () => setForm({ open: true, vision: statement.vision, mission: statement.mission });
  const close = () => setForm((f) => ({ ...f, open: false }));
  const save = () => {
    setStatement({ vision: form.vision.trim(), mission: form.mission.trim() });
    close();
  };

  return (
    <Card className="lg:col-span-2 relative overflow-hidden group">
      <div className="pointer-events-none absolute -right-8 -top-8 opacity-10">
        <Icon.strategy className="h-40 w-40" />
      </div>
      <div className="flex items-start justify-between">
        <Badge tone="amber">{t("Vision")}</Badge>
        <button
          onClick={open}
          className="text-[11px] font-medium text-[var(--muted)] opacity-0 transition hover:text-royal-400 group-hover:opacity-100"
          aria-label="Edit vision and mission"
        >
          {t("Edit")}
        </button>
      </div>
      <p className="mt-3 text-xl font-semibold leading-snug">{statement.vision}</p>
      <div className="mt-5">
        <Badge tone="blue">{t("Mission")}</Badge>
        <p className="mt-2 text-sm text-[var(--muted)]">{statement.mission}</p>
      </div>

      {form.open && (
        <Modal title={t("Edit Vision & Mission")} onClose={close} onSave={save} saveLabel={t("Save")}>
          <label className={labelCls}>
            {t("Vision")}
            <textarea
              value={form.vision}
              onChange={(e) => setForm((f) => ({ ...f, vision: e.target.value }))}
              rows={3}
              placeholder={t("Where the organization aspires to be…")}
              className={inputCls}
            />
          </label>
          <label className={labelCls}>
            {t("Mission")}
            <textarea
              value={form.mission}
              onChange={(e) => setForm((f) => ({ ...f, mission: e.target.value }))}
              rows={4}
              placeholder={t("How the organization will get there…")}
              className={inputCls}
            />
          </label>
        </Modal>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Core Values — CRUD list.
// ---------------------------------------------------------------------------
type Value = { id: string; title: string; description: string };
const emptyValue = { open: false, id: null as string | null, title: "", description: "" };

function CoreValues() {
  const { t } = useI18n();
  const [rows, setRows] = useLocalState<Value[]>("strategy-values", mockValues);
  const [form, setForm] = useState(emptyValue);

  const openCreate = () => setForm({ ...emptyValue, open: true });
  const openEdit = (v: Value) => setForm({ open: true, id: v.id, title: v.title, description: v.description });
  const close = () => setForm(emptyValue);
  const save = () => {
    const title = form.title.trim();
    if (!title) return;
    const description = form.description.trim();
    if (form.id == null) {
      setRows((r) => [...r, { id: nextId("cv"), title, description }]);
    } else {
      setRows((r) => r.map((x) => (x.id === form.id ? { ...x, title, description } : x)));
    }
    close();
  };
  const remove = (v: Value) => setRows((r) => r.filter((x) => x.id !== v.id));

  return (
    <Card>
      <SectionTitle
        title="Core Values"
        subtitle="What we stand for"
        action={
          <button onClick={openCreate} className="text-royal-400 transition hover:text-royal-300" aria-label="Add core value" title={t("Add")}>
            <Icon.plus className="h-4 w-4" />
          </button>
        }
      />
      <div className="space-y-2.5">
        {rows.map((v) => (
          <div key={v.id} dir="auto" className="group flex items-start gap-3 rounded-lg border p-2.5">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gold-400/15 text-gold-500">
              <Icon.check className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold">{v.title}</span>
                <RowActions onEdit={() => openEdit(v)} onDelete={() => remove(v)} label={v.title} />
              </div>
              {v.description && <p className="mt-0.5 text-[12px] text-[var(--muted)]">{v.description}</p>}
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="py-4 text-center text-[12px] text-[var(--muted)]">{t("No core values yet. Add one.")}</p>}
      </div>

      {form.open && (
        <Modal title={form.id == null ? t("New Core Value") : t("Edit Core Value")} onClose={close} onSave={save} saveLabel={form.id == null ? t("Create") : t("Save")}>
          <label className={labelCls}>
            {t("Value")}
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder={t("e.g. Integrity")}
              className={inputCls}
            />
          </label>
          <label className={labelCls}>
            {t("Description")}
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder={t("What this value means in practice…")}
              className={inputCls}
            />
          </label>
        </Modal>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Strategic Goals — CRUD list.
// ---------------------------------------------------------------------------
type Goal = { id: string; title: string; description: string; target: string; owner: string };
const emptyGoal = { open: false, id: null as string | null, title: "", description: "", target: "FY26", owner: "" };

function StrategicGoals() {
  const { t } = useI18n();
  const [rows, setRows] = useLocalState<Goal[]>("strategy-goals", mockGoals);
  const [form, setForm] = useState(emptyGoal);

  const openCreate = () => setForm({ ...emptyGoal, open: true });
  const openEdit = (g: Goal) =>
    setForm({ open: true, id: g.id, title: g.title, description: g.description, target: g.target, owner: g.owner });
  const close = () => setForm(emptyGoal);
  const save = () => {
    const title = form.title.trim();
    if (!title) return;
    const body = {
      title,
      description: form.description.trim(),
      target: form.target,
      owner: form.owner.trim() || "You",
    };
    if (form.id == null) {
      setRows((r) => [...r, { id: nextId("sg"), ...body }]);
    } else {
      setRows((r) => r.map((x) => (x.id === form.id ? { ...x, ...body } : x)));
    }
    close();
  };
  const remove = (g: Goal) => setRows((r) => r.filter((x) => x.id !== g.id));

  return (
    <div className="mt-4">
      <SectionTitle
        title="Strategic Goals"
        subtitle="Department-level goals that cascade into OKR"
        action={
          <Btn variant="ghost" onClick={openCreate}>
            <Icon.plus className="h-4 w-4" /> {t("New Goal")}
          </Btn>
        }
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {rows.map((g) => (
          <Card key={g.id} dir="auto" className="group">
            <div className="flex items-center justify-between">
              <Badge tone="blue">{g.target}</Badge>
              <RowActions onEdit={() => openEdit(g)} onDelete={() => remove(g)} label={g.title} />
            </div>
            <h3 className="mt-2 text-[15px] font-semibold leading-snug">{g.title}</h3>
            {g.description && <p className="mt-1 text-[12px] text-[var(--muted)]">{g.description}</p>}
            <div className="mt-3 flex items-center gap-2 text-xs text-[var(--muted)]">
              <Avatar initials={g.owner.split(" ").map((s) => s[0]).join("").slice(0, 2) || "?"} />
              {t(g.owner)}
            </div>
          </Card>
        ))}
        {rows.length === 0 && (
          <Card className="text-center text-[12px] text-[var(--muted)]">{t("No strategic goals yet. Add one.")}</Card>
        )}
      </div>

      {form.open && (
        <Modal title={form.id == null ? t("New Strategic Goal") : t("Edit Strategic Goal")} onClose={close} onSave={save} saveLabel={form.id == null ? t("Create") : t("Save")}>
          <label className={labelCls}>
            {t("Goal")}
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder={t("e.g. Build a competency-driven culture")}
              className={inputCls}
            />
          </label>
          <label className={labelCls}>
            {t("Description")}
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder={t("What this goal aims to achieve…")}
              className={inputCls}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelCls}>
              {t("Target")}
              <select
                value={form.target}
                onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
                className={`${inputCls} text-[var(--text)]`}
              >
                <option>FY26</option>
                <option>FY27</option>
                <option>FY28</option>
              </select>
            </label>
            <label className={labelCls}>
              {t("Owner")}
              <input
                value={form.owner}
                onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
                placeholder={t("e.g. Arif Wibowo")}
                className={inputCls}
              />
            </label>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SWOT Analysis — CRUD across four quadrants.
// ---------------------------------------------------------------------------
type Swot = { id: string; type: SwotType; text: string };
const swotMeta: Record<SwotType, { tone: "green" | "red" | "blue" | "amber"; plural: string; hint: string }> = {
  Strength: { tone: "green", plural: "Strengths", hint: "Internal · positive" },
  Weakness: { tone: "red", plural: "Weaknesses", hint: "Internal · negative" },
  Opportunity: { tone: "blue", plural: "Opportunities", hint: "External · positive" },
  Threat: { tone: "amber", plural: "Threats", hint: "External · negative" },
};
const swotOrder: SwotType[] = ["Strength", "Weakness", "Opportunity", "Threat"];
const emptySwot = { open: false, id: null as string | null, type: "Strength" as SwotType, text: "" };

function Swot() {
  const { t } = useI18n();
  const [rows, setRows] = useLocalState<Swot[]>("strategy-swot", mockSwot);
  const [form, setForm] = useState(emptySwot);

  const openCreate = (type: SwotType) => setForm({ ...emptySwot, open: true, type });
  const openEdit = (s: Swot) => setForm({ open: true, id: s.id, type: s.type, text: s.text });
  const close = () => setForm(emptySwot);
  const save = () => {
    const text = form.text.trim();
    if (!text) return;
    if (form.id == null) {
      setRows((r) => [...r, { id: nextId("sw"), type: form.type, text }]);
    } else {
      setRows((r) => r.map((x) => (x.id === form.id ? { ...x, type: form.type, text } : x)));
    }
    close();
  };
  const remove = (s: Swot) => setRows((r) => r.filter((x) => x.id !== s.id));

  return (
    <div className="mt-4">
      <SectionTitle title="SWOT Analysis" subtitle="Strengths · Weaknesses · Opportunities · Threats" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {swotOrder.map((type) => {
          const meta = swotMeta[type];
          const items = rows.filter((s) => s.type === type);
          return (
            <Card key={type}>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge tone={meta.tone}>{t(meta.plural)}</Badge>
                  <span className="text-[11px] text-[var(--muted)]">{t(meta.hint)}</span>
                </div>
                <button
                  onClick={() => openCreate(type)}
                  className="text-royal-400 transition hover:text-royal-300"
                  aria-label={`Add ${type}`}
                  title={t("Add")}
                >
                  <Icon.plus className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-1.5">
                {items.map((s) => (
                  <div key={s.id} dir="auto" className="group flex items-start gap-2 rounded-lg border p-2 text-[13px]">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--muted)]" />
                    <span className="min-w-0 flex-1">{s.text}</span>
                    <RowActions onEdit={() => openEdit(s)} onDelete={() => remove(s)} label={s.text} />
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="py-2 text-center text-[12px] text-[var(--muted)]">{t("No items yet.")}</p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {form.open && (
        <Modal title={form.id == null ? t("New SWOT Item") : t("Edit SWOT Item")} onClose={close} onSave={save} saveLabel={form.id == null ? t("Create") : t("Save")}>
          <label className={labelCls}>
            {t("Category")}
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as SwotType }))}
              className={`${inputCls} text-[var(--text)]`}
            >
              {swotOrder.map((tp) => (
                <option key={tp} value={tp}>{t(tp)}</option>
              ))}
            </select>
          </label>
          <label className={labelCls}>
            {t("Item")}
            <textarea
              value={form.text}
              onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
              rows={3}
              placeholder={t("Describe the factor…")}
              className={inputCls}
            />
          </label>
        </Modal>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// OKR — kept as-is (already wired to the live Laravel API with demo fallback).
// ---------------------------------------------------------------------------
type KeyResult = { title: string; progress: number };
type Obj = { id: string; title: string; owner: string; progress: number; quarter: string; keyResults: KeyResult[] };
const emptyObj = { open: false, id: null as string | null, title: "", quarter: "Q1", progress: 0 };

function Okr() {
  const { t } = useI18n();
  const { data: apiObjectives } = useApiData("/objectives", mockObjectives);

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

  const [form, setForm] = useState(emptyObj);
  const openCreate = () => setForm({ ...emptyObj, open: true });
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
    setForm(emptyObj);
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
    <div className="mt-4">
      <SectionTitle
        title="Objectives & Key Results (OKR)"
        subtitle="FY26 — Department strategic objectives"
        action={
          <Btn variant="ghost" onClick={openCreate}>
            <Icon.plus className="h-4 w-4" /> {t("New Objective")}
          </Btn>
        }
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {rows.map((o) => (
          <Card key={o.id} dir="auto" className="group">
            <div className="flex items-center justify-between">
              <Badge tone="blue">{o.quarter}</Badge>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold gold-gradient">{o.progress}%</span>
                <RowActions onEdit={() => openEdit(o)} onDelete={() => removeRow(o)} label={o.title} />
              </div>
            </div>
            <h3 className="mt-2 text-[15px] font-semibold leading-snug">{o.title}</h3>
            <div className="mt-2 flex items-center gap-2 text-xs text-[var(--muted)]">
              <Avatar initials={o.owner.split(" ").map((s) => s[0]).join("")} />
              {t(o.owner)}
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

      {form.open && (
        <Modal title={form.id == null ? t("New Objective") : t("Edit Objective")} onClose={() => setForm(emptyObj)} onSave={saveForm} saveLabel={form.id == null ? t("Create") : t("Save")}>
          <label className={labelCls}>
            {t("Objective")}
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder={t("e.g. Launch Talent Marketplace")}
              className={inputCls}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelCls}>
              {t("Quarter")}
              <select
                value={form.quarter}
                onChange={(e) => setForm((f) => ({ ...f, quarter: e.target.value }))}
                className={`${inputCls} text-[var(--text)]`}
              >
                <option>Q1</option>
                <option>Q2</option>
                <option>Q3</option>
                <option>Q4</option>
              </select>
            </label>
            <label className={labelCls}>
              {t("Progress (%)")}
              <input
                type="number"
                min={0}
                max={100}
                value={form.progress}
                onChange={(e) => setForm((f) => ({ ...f, progress: Number(e.target.value) }))}
                className={inputCls}
              />
            </label>
          </div>
          {form.id == null && <p className="text-[11px] text-[var(--muted)]">{t("Owner is set to you when created.")}</p>}
        </Modal>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function StrategyPage() {
  const { t } = useI18n();
  const { live } = useApiData("/objectives", mockObjectives);

  return (
    <>
      <PageHeader
        title="Strategic Planning"
        subtitle="Vision · Mission · Core Values · Strategic Goals · SWOT · OKR"
        actions={<LiveBadge live={live} />}
      />

      {/* Vision / Mission + Strategy cascade */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <VisionMission />
        <Card>
          <SectionTitle title="Strategy Cascade" subtitle="Everything connected" />
          <div className="space-y-1.5">
            {flow.map((f, i) => (
              <div key={f} className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-royal-500/15 text-[11px] font-bold text-royal-400">
                  {i + 1}
                </div>
                <span className="text-[13px]">{t(f)}</span>
                {i < flow.length - 1 && <Icon.chevron className="ml-auto h-4 w-4 rotate-90 text-[var(--muted)]" />}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Core Values */}
      <div className="mt-4">
        <CoreValues />
      </div>

      <StrategicGoals />
      <Swot />
      <Okr />
    </>
  );
}
