"use client";

import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, SectionTitle, Badge, Avatar } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { meetings as mockMeetings } from "@/lib/data";
import { useApiData } from "@/lib/useApi";
import { LiveBadge } from "@/components/LiveBadge";
import { useI18n } from "@/lib/i18n";

const agenda = [
  "Review Q3 KPI achievement vs. target",
  "Competency gap closure progress — Analytics team",
  "Leadership Development 2026 budget approval",
  "Open service requests & SLA risk review",
];

const actionItems = [
  { assignee: "SL", text: "Finalize Q3 KPI cascade for Performance team", status: "Open" },
  { assignee: "RK", text: "Submit competency gap analysis for Analytics", status: "Done" },
  { assignee: "DP", text: "Circulate Leadership curriculum module 3 draft", status: "Open" },
  { assignee: "AW", text: "Approve training budget for PRG-02", status: "Open" },
];

export default function MeetingsPage() {
  const { t } = useI18n();
  const { data: meetings, live } = useApiData("/meetings", mockMeetings);

  return (
    <>
      <PageHeader
        title="Meeting Management"
        subtitle="Agenda · Minutes · Attendance · Action Items · Task Creation"
        actions={<><LiveBadge live={live} /><Btn variant="primary"><Icon.plus className="h-4 w-4" /> {t("Schedule Meeting")}</Btn></>}
      />

      <SectionTitle title="Upcoming Meetings" subtitle="Scheduled sessions & action item load" />
      <div className="grid gap-4 md:grid-cols-3">
        {meetings.map((m) => (
          <Card key={m.id} className="hover:border-royal-500/40 transition">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-royal-500/12 text-royal-400">
                <Icon.meeting className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold leading-tight">{m.title}</div>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
                  <Icon.clock className="h-3.5 w-3.5" />
                  {m.time}
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3 text-[11px] text-[var(--muted)] dark:border-white/5">
              <span className="inline-flex items-center gap-1.5">
                <Icon.users className="h-3.5 w-3.5" />
                {m.attendees} {t("attendees")}
              </span>
              <Badge tone="amber">{m.actionItems} {t("action items")}</Badge>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Agenda" subtitle="Quarterly Performance Review · Today · 14:00" />
          <ul className="space-y-3">
            {agenda.map((a, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-royal-500/12 text-[11px] font-semibold text-royal-400">
                  {i + 1}
                </span>
                <span>{t(a)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <SectionTitle title="Minutes & Action Items" subtitle="Assigned follow-ups from this meeting" />
          <div className="space-y-3">
            {actionItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <Avatar initials={item.assignee} />
                <span className="min-w-0 flex-1 text-sm">{t(item.text)}</span>
                <Badge tone={item.status === "Done" ? "green" : "gray"}>
                  {item.status === "Done" ? (
                    <>
                      <Icon.check className="h-3 w-3" /> {t("Done")}
                    </>
                  ) : (
                    t("Open")
                  )}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
