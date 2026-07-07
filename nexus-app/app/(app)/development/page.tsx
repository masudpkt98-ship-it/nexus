"use client";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, SectionTitle, Badge, ProgressBar, Avatar } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { developmentPlans as mockDevelopmentPlans } from "@/lib/data";
import { useApiData } from "@/lib/useApi";
import { LiveBadge } from "@/components/LiveBadge";
import { useI18n } from "@/lib/i18n";

const summary = [
  { label: "Active Programs", value: 6, tone: "blue" },
  { label: "Enrolled", value: 128, tone: "blue" },
  { label: "Avg Effectiveness", value: "88%", tone: "gold" },
  { label: "Certifications", value: 42, tone: "green" },
] as const;

const trainingCalendar = [
  { name: "Leadership Simulation Lab", date: "Mon · Jul 13 · 09:00", seats: "12 / 20" },
  { name: "Advanced Analytics Certification", date: "Wed · Jul 15 · 13:30", seats: "18 / 25" },
  { name: "Supervisor Coaching Clinic", date: "Fri · Jul 17 · 10:00", seats: "9 / 15" },
  { name: "Executive Presence Workshop", date: "Tue · Jul 21 · 14:00", seats: "6 / 12" },
];

export default function DevelopmentPage() {
  const { t } = useI18n();
  const { data, live } = useApiData("/competency", { developmentPlans: mockDevelopmentPlans });
  const developmentPlans = data.developmentPlans;

  return (
    <>
      <PageHeader
        title="Development Program"
        subtitle="Operator · Supervisor · Leadership Development · Training Calendar · Learning Journey"
        actions={<><LiveBadge live={live} /><Btn variant="primary"><Icon.plus className="h-4 w-4" /> {t("New Plan")}</Btn></>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summary.map((s) => (
          <Card key={s.label}>
            <div className="text-xs text-[var(--muted)]">{t(s.label)}</div>
            <div
              className={`mt-1 text-2xl font-bold ${
                s.tone === "green" ? "text-emerald-500" : s.tone === "gold" ? "gold-gradient" : ""
              }`}
            >
              {s.value}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionTitle title="Development Plans" subtitle="Individual readiness & next learning step" />
          <div className="space-y-3">
            {developmentPlans.map((p) => (
              <Card key={p.employee} className="hover:border-royal-500/40 transition">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex min-w-[200px] flex-1 items-center gap-3">
                    <Avatar initials={p.avatar} tone="gold" />
                    <div>
                      <div className="font-semibold">{p.employee}</div>
                      <div className="text-[11px] text-[var(--muted)]">{p.role}</div>
                    </div>
                  </div>

                  <div className="w-44">
                    <div className="mb-1 flex justify-between text-[11px]">
                      <span className="text-[var(--muted)]">{t("Readiness")}</span>
                      <span className="font-semibold">{p.readiness}%</span>
                    </div>
                    <ProgressBar value={p.readiness} tone="gold" />
                  </div>

                  <div className="text-center">
                    <div className="text-[10px] text-[var(--muted)]">{t("Gaps")}</div>
                    <Badge tone={p.gaps === 0 ? "green" : p.gaps > 1 ? "amber" : "blue"}>{p.gaps}</Badge>
                  </div>

                  <div className="flex min-w-[200px] flex-1 items-center gap-2 text-[12px]">
                    <Icon.development className="h-4 w-4 text-royal-400" />
                    <div>
                      <div className="text-[10px] text-[var(--muted)]">{t("Next Step")}</div>
                      <div className="font-medium">{p.nextStep}</div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle title="Training Calendar" subtitle="Upcoming sessions" />
          <Card>
            <div className="space-y-4">
              {trainingCalendar.map((tItem) => (
                <div key={tItem.name} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-royal-500/12 text-royal-400">
                    <Icon.meeting className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{tItem.name}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[var(--muted)]">
                      <span>{tItem.date}</span>
                      <span>·</span>
                      <span>{tItem.seats} {t("seats")}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
