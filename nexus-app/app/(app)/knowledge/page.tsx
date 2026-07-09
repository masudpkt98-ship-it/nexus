"use client";

import React, { useEffect, useMemo, useState } from "react";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, Badge } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { knowledgeDocs as mockKnowledgeDocs, type KnowledgeDoc } from "@/lib/data";
import { useLocalState } from "@/lib/useLocalState";
import { useI18n } from "@/lib/i18n";
import { apiGet, apiSend, getToken } from "@/lib/api";
import { LiveBadge } from "@/components/LiveBadge";

type KType = KnowledgeDoc["type"];

const typeTone: Record<KType, "blue" | "green" | "amber" | "purple"> = {
  SOP: "blue",
  Guideline: "green",
  Template: "amber",
  Presentation: "purple",
};
const K_TYPES: KType[] = ["SOP", "Guideline", "Template", "Presentation"];
const CATEGORY_OPTIONS = ["Competency", "Performance", "Development", "Customer", "Strategy", "Programs"];

const inputCls =
  "mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] outline-none focus:border-royal-500";
const labelCls = "block text-[11px] font-medium text-[var(--muted)]";

let seq = 0;
const nextId = () => {
  try {
    return `kd-${crypto.randomUUID().slice(0, 8)}`;
  } catch {
    return `kd-${++seq}-${Date.now()}`;
  }
};
const today = () => new Date().toISOString().slice(0, 10);
const bumpVersion = (v: string) => {
  const m = v.match(/^v?(\d+)\.(\d+)$/);
  return m ? `v${m[1]}.${Number(m[2]) + 1}` : v;
};
const guessType = (filename: string): KType => {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "ppt" || ext === "pptx" || ext === "key") return "Presentation";
  if (ext === "xls" || ext === "xlsx" || ext === "csv") return "Template";
  return "SOP";
};

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
          <Icon.knowledge className="h-4 w-4 shrink-0 text-royal-400" />
          <div className="text-sm font-semibold">{title}</div>
          <button onClick={onClose} className="ml-auto rounded-lg px-2 py-1 text-[var(--muted)] transition hover:text-rose-400" aria-label="Close">
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

type Form = { open: boolean; id: string | null; title: string; type: KType; category: string; version: string };
const emptyForm: Form = { open: false, id: null, title: "", type: "SOP", category: CATEGORY_OPTIONS[0], version: "v1.0" };

export default function KnowledgePage() {
  const { t } = useI18n();
  const [docs, setDocs] = useLocalState<KnowledgeDoc[]>("knowledge", mockKnowledgeDocs);
  const [live, setLive] = useState(false);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<Form>(emptyForm);

  // Hybrid storage: seed from localStorage, prefer live API when signed in.
  useEffect(() => {
    if (!getToken()) return;
    let active = true;
    apiGet<KnowledgeDoc[]>("/knowledge-docs")
      .then((res) => {
        if (active && Array.isArray(res)) {
          setDocs(res);
          setLive(true);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sync = (method: "POST" | "PUT" | "DELETE", path: string, body?: unknown) => {
    if (getToken()) apiSend(method, path, body).catch(() => {});
  };

  const categories = useMemo(() => ["All", ...Array.from(new Set(docs.map((d) => d.category)))], [docs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docs.filter(
      (d) => (category === "All" || d.category === category) && (q === "" || d.title.toLowerCase().includes(q) || d.type.toLowerCase().includes(q))
    );
  }, [docs, category, query]);

  const stats = [
    { label: "Total Docs", value: docs.length, tone: "blue" },
    { label: "SOPs", value: docs.filter((d) => d.type === "SOP").length, tone: "" },
    { label: "Templates", value: docs.filter((d) => d.type === "Template").length, tone: "gold" },
    { label: "Categories", value: new Set(docs.map((d) => d.category)).size, tone: "green" },
  ] as const;

  // --- mutations ---
  const openCreate = () => setForm({ ...emptyForm, open: true });
  const openEdit = (d: KnowledgeDoc) =>
    setForm({ open: true, id: d.id, title: d.title, type: d.type, category: d.category, version: d.version });
  const close = () => setForm(emptyForm);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setForm((fm) => ({ ...fm, title: f.name.replace(/\.[^.]+$/, ""), type: guessType(f.name) }));
  };

  const save = () => {
    const title = form.title.trim();
    if (!title) return;
    const body = { title, type: form.type, category: form.category, version: form.version.trim() || "v1.0" };
    if (form.id == null) {
      const doc: KnowledgeDoc = { id: nextId(), ...body, updated: today() };
      setDocs((r) => [doc, ...r]);
      sync("POST", "/knowledge-docs", doc);
    } else {
      setDocs((r) => r.map((x) => (x.id === form.id ? { ...x, ...body, updated: today() } : x)));
      sync("PUT", `/knowledge-docs/${form.id}`, body);
    }
    close();
  };

  const newVersion = (d: KnowledgeDoc) => {
    const version = bumpVersion(d.version);
    setDocs((r) => r.map((x) => (x.id === d.id ? { ...x, version, updated: today() } : x)));
    sync("PUT", `/knowledge-docs/${d.id}`, { version });
  };
  const remove = (d: KnowledgeDoc) => {
    setDocs((r) => r.filter((x) => x.id !== d.id));
    sync("DELETE", `/knowledge-docs/${d.id}`);
  };

  return (
    <>
      <PageHeader
        title="Knowledge Management"
        subtitle="SOP · Work Instruction · Guidelines · Templates · Version Control"
        actions={
          <>
            <LiveBadge live={live} />
            <Btn variant="primary" onClick={openCreate}>
              <Icon.plus className="h-4 w-4" /> {t("Upload Document")}
            </Btn>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <div className="text-xs text-[var(--muted)]">{t(s.label)}</div>
            <div
              className={`mt-1 text-2xl font-bold ${
                s.tone === "green" ? "text-emerald-500" : s.tone === "gold" ? "gold-gradient" : s.tone === "blue" ? "text-royal-400" : ""
              }`}
            >
              {s.value}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-xl px-3.5 py-2 text-[13px] font-medium transition ${
                category === c
                  ? "bg-gradient-to-r from-royal-500 to-royal-700 text-white shadow-glow"
                  : "glass hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              {t(c)}
            </button>
          ))}
        </div>

        <div className="glass flex items-center gap-2 rounded-xl px-3 py-2">
          <Icon.search className="h-4 w-4 text-[var(--muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Search documents…")}
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[var(--muted)] lg:w-56"
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((d) => (
          <Card key={d.id} dir="auto" className="group hover:border-royal-500/40 transition">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-royal-500/12 text-royal-400">
                <Icon.document className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={typeTone[d.type]}>{t(d.type)}</Badge>
                <div className="flex items-center gap-1.5 text-[11px] opacity-0 transition group-hover:opacity-100">
                  <button onClick={() => newVersion(d)} className="font-medium text-[var(--muted)] transition hover:text-royal-400" title={t("New version")}>
                    v+
                  </button>
                  <button onClick={() => openEdit(d)} className="font-medium text-[var(--muted)] transition hover:text-royal-400" title={t("Edit")}>
                    {t("Edit")}
                  </button>
                  <button onClick={() => remove(d)} className="text-[var(--muted)] transition hover:text-rose-400" title={t("Delete")}>
                    ✕
                  </button>
                </div>
              </div>
            </div>
            <h3 className="mt-3 text-[15px] font-semibold leading-tight tracking-tight">{d.title}</h3>
            <div className="mt-1 text-xs text-[var(--muted)]">{t(d.category)}</div>
            <div className="mt-4 flex items-center justify-between text-[11px] text-[var(--muted)]">
              <span className="font-medium text-royal-400">{d.version}</span>
              <span className="inline-flex items-center gap-1">
                <Icon.clock className="h-3.5 w-3.5" />
                {t("Updated")} {new Date(d.updated).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="col-span-full text-center text-sm text-[var(--muted)]">{t("No documents match your filters.")}</Card>
        )}
      </div>

      {form.open && (
        <Modal
          title={form.id == null ? t("Upload Document") : t("Edit Document")}
          onClose={close}
          onSave={save}
          saveLabel={form.id == null ? t("Upload") : t("Save")}
        >
          {form.id == null && (
            <label className={labelCls}>
              {t("File (optional)")}
              <input type="file" onChange={onFile} className={`${inputCls} file:mr-2 file:rounded file:border-0 file:bg-royal-500/15 file:px-2 file:py-0.5 file:text-royal-400`} />
              <span className="mt-1 block text-[10px] text-[var(--muted)]">{t("Pick a file to auto-fill name & type")}</span>
            </label>
          )}
          <label className={labelCls}>
            {t("Name")}
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder={t("e.g. Competency Assessment SOP")}
              className={inputCls}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelCls}>
              {t("Type")}
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as KType }))}
                className={`${inputCls} text-[var(--text)]`}
              >
                {K_TYPES.map((tp) => (
                  <option key={tp} value={tp}>
                    {t(tp)}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelCls}>
              {t("Category")}
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className={`${inputCls} text-[var(--text)]`}
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {t(c)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className={labelCls}>
            {t("Version")}
            <input
              value={form.version}
              onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
              placeholder={t("e.g. v1.0")}
              className={inputCls}
            />
          </label>
        </Modal>
      )}
    </>
  );
}
