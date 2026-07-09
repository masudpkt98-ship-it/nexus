"use client";

import React, { useEffect, useMemo, useState } from "react";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, SectionTitle, Badge, Avatar } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { documents as mockDocs, docFolders, type DocItem, type DocType, type DocApproval } from "@/lib/data";
import { useLocalState } from "@/lib/useLocalState";
import { useI18n } from "@/lib/i18n";
import { apiGet, apiSend, getToken } from "@/lib/api";
import { LiveBadge } from "@/components/LiveBadge";

const typeTone: Record<DocType, "blue" | "green" | "amber" | "purple"> = {
  SOP: "blue",
  Guideline: "green",
  Template: "amber",
  Presentation: "purple",
};
const approvalTone: Record<DocApproval, "green" | "amber" | "red"> = {
  Approved: "green",
  Pending: "amber",
  Rejected: "red",
};
const DOC_TYPES: DocType[] = ["SOP", "Guideline", "Template", "Presentation"];

const inputCls =
  "mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] outline-none focus:border-royal-500";
const labelCls = "block text-[11px] font-medium text-[var(--muted)]";
const initials = (name: string) => name.split(" ").map((s) => s[0]).join("").slice(0, 2);

let seq = 0;
const nextId = () => {
  try {
    return `doc-${crypto.randomUUID().slice(0, 8)}`;
  } catch {
    return `doc-${++seq}-${Date.now()}`;
  }
};
const today = () => new Date().toISOString().slice(0, 10);
const bumpVersion = (v: string) => {
  const m = v.match(/^v?(\d+)\.(\d+)$/);
  return m ? `v${m[1]}.${Number(m[2]) + 1}` : v;
};
const guessType = (filename: string): DocType => {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "ppt" || ext === "pptx" || ext === "key") return "Presentation";
  if (ext === "xls" || ext === "xlsx" || ext === "csv") return "Template";
  return "SOP";
};

// Shared modal shell (mirrors the Strategic Planning modal).
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
          <Icon.document className="h-4 w-4 shrink-0 text-royal-400" />
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

type Form = {
  open: boolean;
  id: string | null;
  title: string;
  type: DocType;
  folder: string;
  owner: string;
  version: string;
};
const emptyForm: Form = { open: false, id: null, title: "", type: "SOP", folder: docFolders[0], owner: "", version: "v1.0" };

export default function DocumentsPage() {
  const { t } = useI18n();
  const [docs, setDocs] = useLocalState<DocItem[]>("documents", mockDocs);
  const [live, setLive] = useState(false);
  const [folder, setFolder] = useState("All");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<Form>(emptyForm);

  // Hybrid storage: seed from localStorage, then prefer the live API when signed in.
  useEffect(() => {
    if (!getToken()) return;
    let active = true;
    apiGet<DocItem[]>("/documents")
      .then((res) => {
        if (active && Array.isArray(res)) {
          setDocs(res);
          setLive(true);
        }
      })
      .catch(() => {
        /* API offline → keep localStorage */
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Best-effort sync to the API (fire-and-forget) when signed in.
  const sync = (method: "POST" | "PUT" | "DELETE", path: string, body?: unknown) => {
    if (getToken()) apiSend(method, path, body).catch(() => {});
  };

  const folderCount = (name: string) => (name === "All" ? docs.length : docs.filter((d) => d.folder === name).length);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docs.filter(
      (d) =>
        (folder === "All" || d.folder === folder) &&
        (q === "" || d.title.toLowerCase().includes(q) || d.type.toLowerCase().includes(q))
    );
  }, [docs, folder, query]);

  const pending = docs.filter((d) => d.approval === "Pending");

  // --- mutations ---
  const openCreate = () => setForm({ ...emptyForm, open: true });
  const openEdit = (d: DocItem) =>
    setForm({ open: true, id: d.id, title: d.title, type: d.type, folder: d.folder, owner: d.owner, version: d.version });
  const close = () => setForm(emptyForm);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setForm((fm) => ({ ...fm, title: f.name.replace(/\.[^.]+$/, ""), type: guessType(f.name) }));
  };

  const save = () => {
    const title = form.title.trim();
    if (!title) return;
    const body = {
      title,
      type: form.type,
      folder: form.folder,
      owner: form.owner.trim() || "You",
      version: form.version.trim() || "v1.0",
    };
    if (form.id == null) {
      const doc: DocItem = { id: nextId(), ...body, approval: "Pending", updated: today(), signed: false };
      setDocs((r) => [doc, ...r]);
      sync("POST", "/documents", doc);
    } else {
      setDocs((r) => r.map((x) => (x.id === form.id ? { ...x, ...body, updated: today() } : x)));
      sync("PUT", `/documents/${form.id}`, body);
    }
    close();
  };

  const patch = (d: DocItem, changes: Partial<DocItem>) => {
    setDocs((r) => r.map((x) => (x.id === d.id ? { ...x, ...changes } : x)));
    sync("PUT", `/documents/${d.id}`, changes);
  };
  const setApproval = (d: DocItem, approval: DocApproval) => patch(d, { approval });
  const sign = (d: DocItem) => patch(d, { signed: true });
  const newVersion = (d: DocItem) => patch(d, { version: bumpVersion(d.version), updated: today() });
  const remove = (d: DocItem) => {
    setDocs((r) => r.filter((x) => x.id !== d.id));
    sync("DELETE", `/documents/${d.id}`);
  };

  return (
    <>
      <PageHeader
        title="Document Management"
        subtitle="Upload · Version Control · Folder · Permission · Digital Signature · Approval Workflow"
        actions={
          <>
            <LiveBadge live={live} />
            <Btn variant="primary" onClick={openCreate}>
              <Icon.plus className="h-4 w-4" /> {t("Upload")}
            </Btn>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Folder sidebar */}
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <SectionTitle title="Folders" subtitle="Organized library" />
            <div className="space-y-1">
              {["All", ...docFolders].map((name) => {
                const active = folder === name;
                return (
                  <button
                    key={name}
                    onClick={() => setFolder(name)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[13px] transition ${
                      active ? "bg-royal-500/12 text-royal-400" : "hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icon.knowledge className={`h-4 w-4 ${active ? "text-royal-400" : "text-[var(--muted)]"}`} />
                      {t(name)}
                    </span>
                    <span className="text-[11px] text-[var(--muted)]">{folderCount(name)}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card>
            <SectionTitle title="Approval Workflow" subtitle="Pending your review" />
            <div className="space-y-3">
              {pending.map((d) => (
                <div key={d.id} dir="auto" className="rounded-xl border border-black/5 p-3 dark:border-white/5">
                  <div className="flex items-center gap-2 text-[13px] font-medium">
                    <Icon.document className="h-4 w-4 shrink-0 text-royal-400" />
                    {d.title}
                  </div>
                  <div className="mt-1 text-[11px] text-[var(--muted)]">
                    {t(d.owner)} · {d.version}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Btn variant="ghost" onClick={() => setApproval(d, "Approved")}>
                      <Icon.check className="h-3.5 w-3.5" /> {t("Approve")}
                    </Btn>
                    <Btn variant="ghost" onClick={() => setApproval(d, "Rejected")}>
                      {t("Reject")}
                    </Btn>
                  </div>
                </div>
              ))}
              {pending.length === 0 && (
                <p className="py-3 text-center text-[12px] text-[var(--muted)]">{t("Pending your review")} — 0</p>
              )}
            </div>
          </Card>
        </div>

        {/* Document table */}
        <div className="lg:col-span-3">
          <Card>
            <SectionTitle
              title="Documents"
              subtitle="Version control · digital signature · permissions"
              action={
                <div className="relative">
                  <Icon.search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted)]" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("Search documents…")}
                    className="w-48 rounded-lg border bg-[rgb(var(--surface))] py-1.5 pl-8 pr-2.5 text-[12px] outline-none focus:border-royal-500"
                  />
                </div>
              }
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-black/5 text-[11px] uppercase tracking-wide text-[var(--muted)] dark:border-white/5">
                    <th className="px-2 py-2 font-medium">{t("Name")}</th>
                    <th className="px-2 py-2 font-medium">{t("Type")}</th>
                    <th className="px-2 py-2 font-medium">{t("Folder")}</th>
                    <th className="px-2 py-2 font-medium">{t("Version")}</th>
                    <th className="px-2 py-2 font-medium">{t("Owner")}</th>
                    <th className="px-2 py-2 font-medium">{t("Approval")}</th>
                    <th className="px-2 py-2 font-medium">{t("Updated")}</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d) => (
                    <tr
                      key={d.id}
                      className="group border-b border-black/5 transition last:border-0 hover:bg-black/5 dark:border-white/5 dark:hover:bg-white/5"
                    >
                      <td className="px-2 py-3">
                        <span dir="auto" className="inline-flex items-center gap-2 font-medium">
                          <Icon.document className="h-4 w-4 shrink-0 text-royal-400" />
                          {d.title}
                          {d.signed && (
                            <span title={t("Signed")} className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/12 px-1.5 py-0.5 text-[10px] font-medium text-emerald-500">
                              <Icon.check className="h-3 w-3" /> {t("Signed")}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-2 py-3">
                        <Badge tone={typeTone[d.type]}>{t(d.type)}</Badge>
                      </td>
                      <td className="px-2 py-3 text-[12px] text-[var(--muted)]">{t(d.folder)}</td>
                      <td className="px-2 py-3 font-medium text-royal-400">{d.version}</td>
                      <td className="px-2 py-3">
                        <span className="inline-flex items-center gap-2">
                          <Avatar initials={initials(d.owner)} />
                          <span className="text-[12px]">{t(d.owner)}</span>
                        </span>
                      </td>
                      <td className="px-2 py-3">
                        <Badge tone={approvalTone[d.approval]}>{t(d.approval)}</Badge>
                      </td>
                      <td className="px-2 py-3 text-[11px] text-[var(--muted)]">
                        {new Date(d.updated).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center justify-end gap-2 text-[11px] opacity-0 transition group-hover:opacity-100">
                          {!d.signed && (
                            <button onClick={() => sign(d)} className="font-medium text-[var(--muted)] transition hover:text-emerald-500" title={t("Sign")}>
                              {t("Sign")}
                            </button>
                          )}
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
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-2 py-8 text-center text-[12px] text-[var(--muted)]">
                        {t("No documents match your filters.")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
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
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as DocType }))}
                className={`${inputCls} text-[var(--text)]`}
              >
                {DOC_TYPES.map((tp) => (
                  <option key={tp} value={tp}>
                    {t(tp)}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelCls}>
              {t("Folder")}
              <select
                value={form.folder}
                onChange={(e) => setForm((f) => ({ ...f, folder: e.target.value }))}
                className={`${inputCls} text-[var(--text)]`}
              >
                {docFolders.map((f) => (
                  <option key={f} value={f}>
                    {t(f)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelCls}>
              {t("Owner")}
              <input
                value={form.owner}
                onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
                placeholder={t("e.g. Arif Wibowo")}
                className={inputCls}
              />
            </label>
            <label className={labelCls}>
              {t("Version")}
              <input
                value={form.version}
                onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
                placeholder={t("e.g. v1.0")}
                className={inputCls}
              />
            </label>
          </div>
        </Modal>
      )}
    </>
  );
}
