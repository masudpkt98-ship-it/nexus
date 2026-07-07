"use client";

import { useState } from "react";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, Badge } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { knowledgeDocs as mockKnowledgeDocs } from "@/lib/data";
import { useApiData } from "@/lib/useApi";
import { LiveBadge } from "@/components/LiveBadge";
import { useI18n } from "@/lib/i18n";

const typeTone: Record<string, "blue" | "green" | "amber" | "purple"> = {
  SOP: "blue",
  Guideline: "green",
  Template: "amber",
  Presentation: "purple",
};

const categories = ["All", "Competency", "Performance", "Development", "Customer"];

export default function KnowledgePage() {
  const { t } = useI18n();
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const { data: knowledgeDocs, live } = useApiData("/knowledge-docs", mockKnowledgeDocs);

  const filtered = knowledgeDocs.filter((d) => {
    const matchCat = category === "All" || d.category === category;
    const matchQuery = d.title.toLowerCase().includes(query.toLowerCase());
    return matchCat && matchQuery;
  });

  const stats = [
    { label: "Total Docs", value: knowledgeDocs.length, tone: "blue" },
    { label: "SOPs", value: knowledgeDocs.filter((d) => d.type === "SOP").length, tone: "" },
    { label: "Templates", value: knowledgeDocs.filter((d) => d.type === "Template").length, tone: "gold" },
    { label: "Categories", value: new Set(knowledgeDocs.map((d) => d.category)).size, tone: "green" },
  ] as const;

  return (
    <>
      <PageHeader
        title="Knowledge Management"
        subtitle="SOP · Work Instruction · Guidelines · Templates · Version Control"
        actions={
          <>
            <LiveBadge live={live} />
            <Btn variant="primary">
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
                s.tone === "green"
                  ? "text-emerald-500"
                  : s.tone === "gold"
                  ? "gold-gradient"
                  : s.tone === "blue"
                  ? "text-royal-400"
                  : ""
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
          <Card key={d.id} className="hover:border-royal-500/40 transition">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-royal-500/12 text-royal-400">
                <Icon.document className="h-5 w-5" />
              </div>
              <Badge tone={typeTone[d.type]}>{d.type}</Badge>
            </div>
            <h3 className="mt-3 text-[15px] font-semibold leading-tight tracking-tight">{d.title}</h3>
            <div className="mt-1 text-xs text-[var(--muted)]">{d.category}</div>
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
    </>
  );
}
