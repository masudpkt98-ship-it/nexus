"use client";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, SectionTitle, Badge, ProgressBar, Avatar } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { competencies as mockCompetencies, developmentPlans as mockDevelopmentPlans } from "@/lib/data";
import { useApiData } from "@/lib/useApi";
import { LiveBadge } from "@/components/LiveBadge";

export default function CompetencyPage() {
  const { data, live } = useApiData("/competency", {
    competencies: mockCompetencies,
    developmentPlans: mockDevelopmentPlans,
  });
  const competencies = data.competencies;
  const developmentPlans = data.developmentPlans;

  const avgReq = competencies.reduce((s, c) => s + c.required, 0);
  const avgCur = competencies.reduce((s, c) => s + c.current, 0);
  const index = Math.round((avgCur / avgReq) * 100);
  const gaps = competencies.filter((c) => c.current < c.required);

  return (
    <>
      <PageHeader
        title="Competency Management"
        subtitle="Dictionary · Matrix · Mapping · Assessment · Gap Analysis · IDP · Career Readiness"
        actions={<><LiveBadge live={live} /><Btn variant="primary"><Icon.plus className="h-4 w-4" /> New Assessment</Btn></>}
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
          <div className="mt-1 text-[11px] text-[var(--muted)]">across {competencies.length} competencies</div>
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
            {competencies.map((c) => {
              const gap = c.required - c.current;
              return (
                <div key={c.name}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{c.name}</span>
                      <Badge tone="gray">{c.category}</Badge>
                    </span>
                    <span className="text-xs text-[var(--muted)]">
                      {c.current} / {c.required}
                      {gap > 0 && <span className="ml-2 text-rose-500">−{gap}</span>}
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
              <div key={c.name} className="rounded-xl border p-3">
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
    </>
  );
}
