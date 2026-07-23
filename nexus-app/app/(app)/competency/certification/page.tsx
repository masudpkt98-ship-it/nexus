"use client";

import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Card, Badge } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { useLocalState } from "@/lib/useLocalState";
import { certificationSeed, type CertificationRecord, type CertStatus } from "@/lib/compassSeed";
import { useI18n } from "@/lib/i18n";

const statusTone = (s: CertStatus): "green" | "amber" | "red" => (s === "Competent" ? "green" : s === "Expired" ? "red" : "amber");

export default function CertificationPage() {
  const { t } = useI18n();
  const [certs] = useLocalState<CertificationRecord[]>("compass-certifications", certificationSeed);

  return (
    <>
      <Link href="/competency" className="mb-2 inline-flex items-center gap-1 text-[12px] text-[var(--muted)] transition hover:text-royal-400">
        <Icon.chevron className="h-3.5 w-3.5 rotate-180" /> {t("Competency Management")}
      </Link>
      <PageHeader title="Certification" subtitle="COMPASS · Sertifikasi kompetensi · sertifikat digital" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {certs.map((c) => (
          <Card key={c.id} className="relative overflow-hidden">
            <div className="absolute right-3 top-3"><Icon.competency className="h-6 w-6 text-gold-400/60" /></div>
            <Badge tone={statusTone(c.status)}>{c.status}</Badge>
            <div className="mt-2 text-[15px] font-semibold leading-snug">{c.title}</div>
            <div className="mt-1 text-[12px] text-[var(--muted)]">{c.employee}</div>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-2.5 text-[12px]">
              <div><div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">{t("Level")}</div><div>{c.level}</div></div>
              <div><div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">{t("Issued")}</div><div>{c.issued}</div></div>
              {c.expires && <div><div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">{t("Expires")}</div><div>{c.expires}</div></div>}
            </div>
          </Card>
        ))}
        {certs.length === 0 && <Card className="col-span-full text-center text-[13px] text-[var(--muted)]">{t("No records yet.")}</Card>}
      </div>
    </>
  );
}
