"use client";

import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, Badge, Avatar } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { serviceRequests as mockServiceRequests } from "@/lib/data";
import { useApiData } from "@/lib/useApi";
import { LiveBadge } from "@/components/LiveBadge";

const priorityTone: Record<string, "red" | "amber" | "blue" | "gray"> = {
  Critical: "red",
  High: "amber",
  Medium: "blue",
  Low: "gray",
};
const slaTone: Record<string, "green" | "amber" | "red"> = {
  "Within SLA": "green",
  "At Risk": "amber",
  Breached: "red",
};

function initials(name: string) {
  return name
    .replace(/\./g, "")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function RequestsPage() {
  const { data: serviceRequests, live } = useApiData("/service-requests", mockServiceRequests);

  const summary = [
    { label: "New", value: serviceRequests.filter((r) => r.status === "New").length, tone: "blue" },
    { label: "In Progress", value: serviceRequests.filter((r) => r.status === "In Progress").length, tone: "blue" },
    { label: "Waiting Approval", value: serviceRequests.filter((r) => r.status === "Waiting Approval").length, tone: "gold" },
    { label: "Breached SLA", value: serviceRequests.filter((r) => r.sla === "Breached").length, tone: "red" },
  ] as const;

  return (
    <>
      <PageHeader
        title="Customer Request"
        subtitle="Internal Service Request · Ticket · SLA · PIC · Approval"
        actions={<><LiveBadge live={live} /><Btn variant="primary"><Icon.plus className="h-4 w-4" /> New Request</Btn></>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summary.map((s) => (
          <Card key={s.label}>
            <div className="text-xs text-[var(--muted)]">{s.label}</div>
            <div
              className={`mt-1 text-2xl font-bold ${
                s.tone === "red" ? "text-rose-500" : s.tone === "gold" ? "gold-gradient" : ""
              }`}
            >
              {s.value}
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-6 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-[11px] uppercase tracking-wide text-[var(--muted)] dark:border-white/10">
                <th className="px-5 py-3 font-medium">Ticket</th>
                <th className="px-5 py-3 font-medium">Requester</th>
                <th className="px-5 py-3 font-medium">Priority</th>
                <th className="px-5 py-3 font-medium">SLA</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">PIC</th>
                <th className="px-5 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {serviceRequests.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-black/5 transition last:border-0 hover:bg-black/[0.03] dark:border-white/5 dark:hover:bg-white/[0.03]"
                >
                  <td className="px-5 py-3">
                    <div className="font-medium">{r.title}</div>
                    <div className="text-[11px] text-[var(--muted)]">{r.id}</div>
                  </td>
                  <td className="px-5 py-3 text-[var(--muted)]">{r.requester}</td>
                  <td className="px-5 py-3">
                    <Badge tone={priorityTone[r.priority]}>{r.priority}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={slaTone[r.sla]}>{r.sla}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone="blue">{r.status}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar initials={initials(r.pic)} />
                      <span className="text-[12px] text-[var(--muted)]">{r.pic}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[12px] text-[var(--muted)]">
                    {new Date(r.created).toLocaleDateString("en", { month: "short", day: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
