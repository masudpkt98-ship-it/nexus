"use client";

import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, SectionTitle, Badge, Avatar } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { knowledgeDocs as mockKnowledgeDocs } from "@/lib/data";
import { useApiData } from "@/lib/useApi";
import { LiveBadge } from "@/components/LiveBadge";

const typeTone: Record<string, "blue" | "green" | "amber" | "purple"> = {
  SOP: "blue",
  Guideline: "green",
  Template: "amber",
  Presentation: "purple",
};

const folders = [
  { name: "Strategy", count: 6 },
  { name: "Programs", count: 14 },
  { name: "Competency", count: 9 },
  { name: "Performance", count: 11 },
  { name: "Customer", count: 7 },
  { name: "Templates", count: 5 },
];

const owners = ["Arif Wibowo", "Rani Kusuma", "Sinta Larasati", "Dimas Prakoso", "Bagus Hartono"];
const approvals = ["Approved", "Pending", "Approved", "Pending", "Approved"];

const initials = (name: string) => name.split(" ").map((s) => s[0]).join("");

const pendingApprovals = [
  { doc: "Leadership Program Deck", requester: "Dimas Prakoso", time: "2h ago" },
  { doc: "KPI Cascade Guideline", requester: "Sinta Larasati", time: "5h ago" },
  { doc: "IDP Template 2026", requester: "Rani Kusuma", time: "1d ago" },
];

export default function DocumentsPage() {
  const { data: knowledgeDocs, live } = useApiData("/knowledge-docs", mockKnowledgeDocs);

  return (
    <>
      <PageHeader
        title="Document Management"
        subtitle="Upload · Version Control · Folder · Permission · Digital Signature · Approval Workflow"
        actions={
          <>
            <LiveBadge live={live} />
            <Btn variant="primary">
              <Icon.plus className="h-4 w-4" /> Upload
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
              {folders.map((f) => (
                <button
                  key={f.name}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[13px] transition hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon.knowledge className="h-4 w-4 text-royal-400" />
                    {f.name}
                  </span>
                  <span className="text-[11px] text-[var(--muted)]">{f.count}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle title="Approval Workflow" subtitle="Pending your review" />
            <div className="space-y-3">
              {pendingApprovals.map((a) => (
                <div key={a.doc} className="rounded-xl border border-black/5 p-3 dark:border-white/5">
                  <div className="flex items-center gap-2 text-[13px] font-medium">
                    <Icon.document className="h-4 w-4 text-royal-400" />
                    {a.doc}
                  </div>
                  <div className="mt-1 text-[11px] text-[var(--muted)]">
                    {a.requester} · {a.time}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Btn variant="ghost">
                      <Icon.check className="h-3.5 w-3.5" /> Approve
                    </Btn>
                    <Btn variant="ghost">Reject</Btn>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Document table */}
        <div className="lg:col-span-3">
          <Card>
            <SectionTitle title="Documents" subtitle="Version control · digital signature · permissions" />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-black/5 text-[11px] uppercase tracking-wide text-[var(--muted)] dark:border-white/5">
                    <th className="px-2 py-2 font-medium">Name</th>
                    <th className="px-2 py-2 font-medium">Type</th>
                    <th className="px-2 py-2 font-medium">Version</th>
                    <th className="px-2 py-2 font-medium">Owner</th>
                    <th className="px-2 py-2 font-medium">Approval</th>
                    <th className="px-2 py-2 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {knowledgeDocs.map((d, i) => {
                    const owner = owners[i % owners.length];
                    const approval = approvals[i % approvals.length];
                    return (
                      <tr
                        key={d.id}
                        className="border-b border-black/5 transition last:border-0 hover:bg-black/5 dark:border-white/5 dark:hover:bg-white/5"
                      >
                        <td className="px-2 py-3">
                          <span className="inline-flex items-center gap-2 font-medium">
                            <Icon.document className="h-4 w-4 text-royal-400" />
                            {d.title}
                          </span>
                        </td>
                        <td className="px-2 py-3">
                          <Badge tone={typeTone[d.type]}>{d.type}</Badge>
                        </td>
                        <td className="px-2 py-3 font-medium text-royal-400">{d.version}</td>
                        <td className="px-2 py-3">
                          <span className="inline-flex items-center gap-2">
                            <Avatar initials={initials(owner)} />
                            <span className="text-[12px]">{owner}</span>
                          </span>
                        </td>
                        <td className="px-2 py-3">
                          <Badge tone={approval === "Approved" ? "green" : "amber"}>{approval}</Badge>
                        </td>
                        <td className="px-2 py-3 text-[11px] text-[var(--muted)]">
                          {new Date(d.updated).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
