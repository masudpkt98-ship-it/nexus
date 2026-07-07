"use client";

import { useState } from "react";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, Badge } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { notifications as mockNotifications } from "@/lib/data";
import { useApiData } from "@/lib/useApi";
import { LiveBadge } from "@/components/LiveBadge";
import { apiSend, getToken } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

const channels = ["All", "In-App", "Email", "WhatsApp", "Push"] as const;

const channelTone: Record<string, "blue" | "gray" | "green" | "purple"> = {
  "In-App": "blue",
  Email: "gray",
  WhatsApp: "green",
  Push: "purple",
};

const kindIcon: Record<string, (typeof Icon)[keyof typeof Icon]> = {
  deadline: Icon.clock,
  approval: Icon.check,
  training: Icon.development,
  birthday: Icon.spark,
  system: Icon.alert,
};

export default function NotificationsPage() {
  const { t } = useI18n();
  const [channel, setChannel] = useState<(typeof channels)[number]>("All");
  const [read, setRead] = useState<Record<string, boolean>>({});
  const { data: notifications, live } = useApiData("/notifications", mockNotifications);

  const isRead = (n: { id: string; read: boolean }) => n.read || read[n.id];

  const filtered = notifications.filter((n) => channel === "All" || n.channel === channel);
  const unreadCount = notifications.filter((n) => !isRead(n)).length;

  const stats = [
    { label: "Unread", value: unreadCount, tone: "blue" },
    { label: "Total", value: notifications.length, tone: "" },
    { label: "In-App", value: notifications.filter((n) => n.channel === "In-App").length, tone: "" },
    { label: "Email", value: notifications.filter((n) => n.channel === "Email").length, tone: "" },
    { label: "WhatsApp", value: notifications.filter((n) => n.channel === "WhatsApp").length, tone: "green" },
    { label: "Push", value: notifications.filter((n) => n.channel === "Push").length, tone: "" },
  ] as const;

  const markAll = () => {
    const all: Record<string, boolean> = {};
    notifications.forEach((n) => (all[n.id] = true));
    setRead(all);
    if (getToken()) {
      apiSend("POST", "/notifications/read-all").catch(() => {});
    }
  };

  return (
    <>
      <PageHeader
        title="Notification Center"
        subtitle="Email · WhatsApp · In-App · Push · Deadline & Approval Reminders"
        actions={
          <>
            <LiveBadge live={live} />
            <Btn variant="ghost" onClick={markAll}>
              <Icon.check className="h-4 w-4" /> {t("Mark all read")}
            </Btn>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-4 lg:grid-cols-6">
        {stats.map((s) => (
          <Card key={s.label}>
            <div className="text-xs text-[var(--muted)]">{t(s.label)}</div>
            <div
              className={`mt-1 text-2xl font-bold ${
                s.tone === "green" ? "text-emerald-500" : s.tone === "blue" ? "text-royal-400" : ""
              }`}
            >
              {s.value}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {channels.map((c) => (
          <button
            key={c}
            onClick={() => setChannel(c)}
            className={`rounded-xl px-3.5 py-2 text-[13px] font-medium transition ${
              channel === c
                ? "bg-gradient-to-r from-royal-500 to-royal-700 text-white shadow-glow"
                : "glass hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            {t(c)}
          </button>
        ))}
        <button
          onClick={markAll}
          className="ml-auto rounded-xl px-3.5 py-2 text-[13px] font-medium text-[var(--muted)] transition hover:text-royal-400"
        >
          {t("Mark all read")}
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {filtered.map((n) => {
          const KindIcon = kindIcon[n.kind] ?? Icon.bell;
          const unread = !isRead(n);
          return (
            <Card
              key={n.id}
              className={`transition hover:border-royal-500/40 ${unread ? "border-royal-500/30" : ""}`}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-royal-500/12 text-royal-400">
                  <KindIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge tone={channelTone[n.channel]}>{n.channel}</Badge>
                    <span className="text-[11px] capitalize text-[var(--muted)]">{n.kind}</span>
                  </div>
                  <p className={`mt-1 text-[14px] ${unread ? "font-semibold" : "text-[var(--muted)]"}`}>{n.title}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] text-[var(--muted)]">
                    <Icon.clock className="h-3.5 w-3.5" />
                    {t(n.time)}
                  </span>
                  {unread && <span className="h-2.5 w-2.5 rounded-full bg-royal-500 shadow-glow" />}
                </div>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card className="text-center text-sm text-[var(--muted)]">{t("No notifications on this channel.")}</Card>
        )}
      </div>
    </>
  );
}
