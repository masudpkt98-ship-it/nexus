"use client";

import { useEffect, useRef, useState } from "react";
import { PageHeader, Btn } from "@/components/PageHeader";
import { Card, Badge, cn } from "@/components/ui";
import { Markdown } from "@/components/Markdown";
import { Icon } from "@/components/Icons";
import { LiveBadge } from "@/components/LiveBadge";
import { useApiData } from "@/lib/useApi";
import { apiGet, apiSend, apiStream, getToken } from "@/lib/api";
import { aiInsights as mockAiInsights, aiSuggestions as mockAiSuggestions, type AiInsight } from "@/lib/data";

const typeMeta: Record<AiInsight["type"], { tone: "red" | "blue" | "gold" | "green"; label: string }> = {
  risk: { tone: "red", label: "Risk Detection" },
  recommendation: { tone: "blue", label: "Recommendation" },
  prediction: { tone: "gold", label: "Prediction" },
  summary: { tone: "green", label: "Summary" },
};

interface Msg {
  role: "user" | "ai";
  text: string;
  source?: "claude" | "rules" | "demo" | "stopped";
  streaming?: boolean;
}

const sourceMeta: Record<"claude" | "rules" | "demo" | "stopped", { label: string; className: string }> = {
  claude: { label: "Claude Opus 4.8", className: "gold-gradient" },
  rules: { label: "NEXUS engine · live data", className: "text-[var(--muted)]" },
  demo: { label: "Demo mode · sample data", className: "text-gold-500" },
  stopped: { label: "Stopped", className: "text-rose-400" },
};

const canned: Record<string, string> = {
  default:
    "Here's what I found across your connected NEXUS data: overall KPI is trending to 89% for Q3, one program (Project Aurora) is at schedule risk, and the Competency team is over capacity. Want me to draft an action plan?",
};

interface Thread {
  id: number;
  title: string;
  preview?: string | null;
  updatedAt?: string | null;
}

function timeAgo(iso?: string | null): string {
  if (!iso) return "";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return `${Math.floor(s / 604800)}w`;
}

const CHAT_STORAGE_KEY = "nexus-chat-history";
const GREETING: Msg = {
  role: "ai",
  text: "Hi Arif 👋 I'm your NEXUS AI Assistant. I can summarize performance, predict delays, generate IDPs and reports, and recommend actions. What would you like to do?",
};

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [threadsOpen, setThreadsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [threadQuery, setThreadQuery] = useState("");
  const { data, live } = useApiData("/ai/insights", {
    insights: mockAiInsights,
    suggestions: mockAiSuggestions,
  });
  const aiInsights = data.insights;
  const aiSuggestions = data.suggestions;

  const lastAiSource = [...messages].reverse().find((m) => m.role === "ai")?.source;
  const poweredByClaude = lastAiSource === "claude";

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const [hydrated, setHydrated] = useState(false);

  const loadThread = async (id: number) => {
    try {
      const msgs = await apiGet<Msg[]>(`/ai/threads/${id}/messages`);
      setMessages([GREETING, ...(Array.isArray(msgs) ? msgs : [])]);
    } catch {
      setMessages([GREETING]);
    }
  };

  // On mount: load conversation threads (signed in) or the localStorage
  // conversation (demo mode).
  useEffect(() => {
    let active = true;
    (async () => {
      if (getToken()) {
        try {
          let list = await apiGet<Thread[]>("/ai/threads");
          if (!Array.isArray(list)) list = [];
          if (list.length === 0) {
            const created = await apiSend<Thread>("POST", "/ai/threads");
            list = [created];
          }
          if (!active) return;
          setThreads(list);
          setActiveThreadId(list[0].id);
          await loadThread(list[0].id);
        } catch {
          /* keep greeting */
        }
      } else {
        try {
          const raw = localStorage.getItem(CHAT_STORAGE_KEY);
          const parsed = raw ? JSON.parse(raw) : null;
          if (active && Array.isArray(parsed) && parsed.length) setMessages(parsed);
        } catch {
          /* ignore malformed storage */
        }
      }
      if (active) setHydrated(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Persist to localStorage only in demo mode (server stores turns when signed in).
  useEffect(() => {
    if (!hydrated || getToken()) return;
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* storage full / unavailable */
    }
  }, [messages, hydrated]);

  const switchThread = (id: number) => {
    setEditingId(null);
    setThreadsOpen(false);
    if (busy || id === activeThreadId) return;
    setActiveThreadId(id);
    loadThread(id);
  };

  const startRename = (t: Thread) => {
    setEditingId(t.id);
    setEditValue(t.title);
  };

  const commitRename = async () => {
    const id = editingId;
    if (id == null) return;
    const title = editValue.trim();
    setEditingId(null);
    if (!title) return;
    setThreads((ts) => ts.map((t) => (t.id === id ? { ...t, title } : t)));
    try {
      await apiSend("PUT", `/ai/threads/${id}`, { title });
    } catch {
      /* ignore */
    }
  };

  const newChat = async () => {
    if (busy) return;
    setThreadsOpen(false);
    setEditingId(null);
    if (!getToken()) {
      setMessages([GREETING]);
      try {
        localStorage.removeItem(CHAT_STORAGE_KEY);
      } catch {
        /* ignore */
      }
      return;
    }
    try {
      const created = await apiSend<Thread>("POST", "/ai/threads");
      setThreads((ts) => [created, ...ts]);
      setActiveThreadId(created.id);
      setMessages([GREETING]);
    } catch {
      /* ignore */
    }
  };

  const deleteThread = async (id: number) => {
    if (busy) return;
    try {
      await apiSend("DELETE", `/ai/threads/${id}`);
    } catch {
      /* ignore */
    }
    const next = threads.filter((t) => t.id !== id);
    setThreads(next);
    if (activeThreadId === id) {
      if (next.length) {
        setActiveThreadId(next[0].id);
        loadThread(next[0].id);
      } else {
        await newChat();
      }
    }
  };

  const refreshThreads = async () => {
    try {
      const list = await apiGet<Thread[]>("/ai/threads");
      if (Array.isArray(list)) setThreads(list);
    } catch {
      /* ignore */
    }
  };

  const filteredThreads = threadQuery.trim()
    ? threads.filter((t) => {
        const q = threadQuery.toLowerCase();
        return t.title.toLowerCase().includes(q) || (t.preview ?? "").toLowerCase().includes(q);
      })
    : threads;

  const stop = () => abortRef.current?.abort();

  // ---- AI generators (KPI / IDP / Report) ----
  type GenKind = "kpi" | "idp" | "report";
  const [gen, setGen] = useState<{
    open: boolean;
    kind: GenKind | null;
    title: string;
    loading: boolean;
    streaming: boolean;
    markdown: string;
    source?: string;
    params: { level: string; focus: string; employee: string; scope: string };
  }>({
    open: false,
    kind: null,
    title: "",
    loading: false,
    streaming: false,
    markdown: "",
    params: { level: "Department", focus: "", employee: "", scope: "" },
  });
  const genAbort = useRef<AbortController | null>(null);

  const [employees, setEmployees] = useState<{ employee: string; readiness: number }[]>([]);

  const openGenerator = (kind: GenKind, title: string) => {
    genAbort.current?.abort();
    setGen({
      open: true,
      kind,
      title,
      loading: false,
      streaming: false,
      markdown: "",
      source: undefined,
      params: { level: "Department", focus: "", employee: "", scope: "" },
    });
    if (kind === "idp" && getToken() && employees.length === 0) {
      apiGet<{ developmentPlans?: { employee: string; readiness: number }[] }>("/competency")
        .then((d) => setEmployees(d.developmentPlans ?? []))
        .catch(() => {});
    }
  };

  const setParam = (k: keyof typeof gen.params, v: string) =>
    setGen((g) => ({ ...g, params: { ...g.params, [k]: v } }));

  const runGenerator = async () => {
    if (!gen.kind) return;
    if (!getToken()) {
      setGen((g) => ({ ...g, markdown: "_Sign in to generate this artifact from live NEXUS data._" }));
      return;
    }
    const p = gen.params;
    const body: Record<string, string> = {};
    if (gen.kind === "kpi") {
      body.level = p.level;
      if (p.focus.trim()) body.focus = p.focus.trim();
    } else if (gen.kind === "idp") {
      if (p.employee.trim()) body.employee = p.employee.trim();
    } else if (p.scope.trim()) {
      body.scope = p.scope.trim();
    }

    const controller = new AbortController();
    genAbort.current = controller;
    setGen((g) => ({ ...g, loading: true, streaming: true, markdown: "", source: undefined }));
    try {
      await apiStream(
        `/ai/generate/${gen.kind}/stream`,
        body,
        (evt) => {
          if (evt.type === "delta") {
            setGen((g) => ({ ...g, loading: false, markdown: g.markdown + (evt.text ?? "") }));
          } else if (evt.type === "done") {
            setGen((g) => ({ ...g, loading: false, streaming: false, source: evt.source }));
          }
        },
        controller.signal
      );
    } catch {
      if (controller.signal.aborted) {
        setGen((g) => ({ ...g, loading: false, streaming: false, source: "stopped" }));
      } else {
        setGen((g) => ({
          ...g,
          loading: false,
          streaming: false,
          markdown: g.markdown || "_Generation failed. Please try again._",
        }));
      }
    } finally {
      if (genAbort.current === controller) genAbort.current = null;
    }
  };

  const stopGenerator = () => genAbort.current?.abort();
  const closeGenerator = () => {
    genAbort.current?.abort();
    setGen((g) => ({ ...g, open: false, streaming: false }));
  };

  const downloadArtifact = () => {
    if (!gen.markdown) return;
    const date = new Date().toISOString().slice(0, 10);
    const blob = new Blob([gen.markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexus-${gen.kind ?? "artifact"}-${date}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const send = async (text: string) => {
    if (!text.trim() || busy) return;

    // Name a brand-new thread after its first message (optimistic).
    if (getToken() && activeThreadId != null && !messages.some((m) => m.role === "user")) {
      const title = text.length > 40 ? text.slice(0, 40) + "…" : text;
      setThreads((ts) => ts.map((t) => (t.id === activeThreadId ? { ...t, title } : t)));
    }

    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setTyping(true);
    setBusy(true);

    if (getToken()) {
      const controller = new AbortController();
      abortRef.current = controller;
      let acc = "";
      let started = false;
      try {
        await apiStream(
          "/ai/chat/stream",
          { message: text, thread_id: activeThreadId },
          (evt: any) => {
            if (evt.type === "delta") {
              acc += evt.text ?? "";
              if (!started) {
                started = true;
                setTyping(false);
              }
              setMessages((m) => {
                const copy = [...m];
                const last = copy[copy.length - 1];
                if (last?.role === "ai" && last.streaming) {
                  copy[copy.length - 1] = { ...last, text: acc };
                  return copy;
                }
                return [...copy, { role: "ai", text: acc, streaming: true }];
              });
            } else if (evt.type === "done") {
              setMessages((m) => {
                const copy = [...m];
                const last = copy[copy.length - 1];
                if (last?.role === "ai" && last.streaming) {
                  copy[copy.length - 1] = { ...last, source: evt.source ?? "rules", streaming: false };
                }
                return copy;
              });
            }
          },
          controller.signal
        );
        setTyping(false);
        setBusy(false);
        refreshThreads();
        return;
      } catch (e: any) {
        if (e?.name === "AbortError") {
          // Keep the partial reply, mark it stopped.
          setMessages((m) => {
            const copy = [...m];
            const last = copy[copy.length - 1];
            if (last?.role === "ai" && last.streaming) {
              if (last.text.trim() === "") copy.pop();
              else copy[copy.length - 1] = { ...last, streaming: false, source: "stopped" };
            }
            return copy;
          });
          setTyping(false);
          setBusy(false);
          return;
        }
        // Other failure — drop any partial and fall back to a canned reply.
        setMessages((m) => m.filter((mm) => !mm.streaming));
      } finally {
        abortRef.current = null;
      }
    }

    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text: canned[text.toLowerCase()] ?? `Working on "${text}". ${canned.default}`,
          source: "demo",
        },
      ]);
      setTyping(false);
      setBusy(false);
    }, 700);
  };

  return (
    <>
      <PageHeader
        title="AI Assistant"
        subtitle="Daily & Weekly Summary · Risk Detection · Delay Prediction · Executive Insight"
        actions={
          <>
            <LiveBadge live={live} />
            {poweredByClaude ? (
              <Badge tone="amber">
                <Icon.spark className="h-3 w-3" /> Powered by Claude Opus 4.8
              </Badge>
            ) : (
              <Badge tone="purple">
                <Icon.spark className="h-3 w-3" /> Powered by NEXUS Intelligence
              </Badge>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Chat */}
        <Card className="flex h-[560px] overflow-hidden p-0 lg:col-span-2">
          {getToken() && (
            <aside className="hidden w-56 shrink-0 flex-col border-r sm:flex">
              <div className="flex items-center justify-between border-b px-3 py-3">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Conversations
                </span>
                <button
                  onClick={newChat}
                  disabled={busy}
                  title="New conversation"
                  className="flex items-center gap-1 rounded-lg bg-royal-500/15 px-2 py-1 text-[11px] font-medium text-royal-400 transition hover:bg-royal-500/25 disabled:opacity-50"
                >
                  <Icon.plus className="h-3.5 w-3.5" /> New
                </button>
              </div>
              <div className="border-b px-2 py-2">
                <div className="flex items-center gap-1.5 rounded-lg border bg-[rgb(var(--surface))]/60 px-2 py-1">
                  <Icon.search className="h-3.5 w-3.5 shrink-0 text-[var(--muted)]" />
                  <input
                    value={threadQuery}
                    onChange={(e) => setThreadQuery(e.target.value)}
                    placeholder="Search…"
                    className="w-full bg-transparent text-[11px] outline-none placeholder:text-[var(--muted)]"
                  />
                  {threadQuery && (
                    <button
                      onClick={() => setThreadQuery("")}
                      className="shrink-0 text-[var(--muted)] hover:text-rose-400"
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1 space-y-0.5 overflow-y-auto p-2">
                {filteredThreads.length === 0 && (
                  <div className="px-2 py-6 text-center text-[11px] text-[var(--muted)]">
                    {threadQuery ? "No conversations match." : "No conversations yet."}
                  </div>
                )}
                {filteredThreads.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => (t.id === activeThreadId ? startRename(t) : switchThread(t.id))}
                    onDoubleClick={() => startRename(t)}
                    className={cn(
                      "group cursor-pointer rounded-lg px-2.5 py-2 transition hover:bg-black/5 dark:hover:bg-white/5",
                      t.id === activeThreadId && "bg-royal-500/10"
                    )}
                  >
                    <div className="flex items-center gap-1">
                      {editingId === t.id ? (
                        <input
                          autoFocus
                          value={editValue}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={commitRename}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitRename();
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="flex-1 rounded border bg-[rgb(var(--surface))] px-1.5 py-0.5 text-[12px] outline-none focus:border-royal-500"
                        />
                      ) : (
                        <span className="flex-1 truncate text-[12px] font-medium">{t.title}</span>
                      )}
                      {editingId !== t.id && (
                        <>
                          <span className="shrink-0 text-[10px] text-[var(--muted)]">{timeAgo(t.updatedAt)}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteThread(t.id);
                            }}
                            title="Delete conversation"
                            className="shrink-0 rounded px-0.5 text-[var(--muted)] opacity-0 transition hover:text-rose-400 group-hover:opacity-100"
                          >
                            ✕
                          </button>
                        </>
                      )}
                    </div>
                    {t.preview && editingId !== t.id && (
                      <div className="mt-0.5 truncate text-[11px] text-[var(--muted)]">{t.preview}</div>
                    )}
                  </div>
                ))}
              </div>
            </aside>
          )}

          <div className="flex min-w-0 flex-1 flex-col p-5">
          <div className="mb-3 flex items-center gap-2 border-b pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-royal-500 to-royal-700 text-white">
              <Icon.ai className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">NEXUS Copilot</div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Online · connected to your data
              </div>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              {getToken() ? (
                <button
                  onClick={newChat}
                  disabled={busy}
                  title="New conversation"
                  className="flex items-center gap-1 rounded-lg bg-royal-500/15 px-2 py-1 text-[11px] font-medium text-royal-400 transition hover:bg-royal-500/25 disabled:opacity-50 sm:hidden"
                >
                  <Icon.plus className="h-3.5 w-3.5" /> New
                </button>
              ) : (
                messages.length > 1 && (
                  <button
                    onClick={newChat}
                    className="rounded-lg px-2.5 py-1 text-[11px] font-medium text-[var(--muted)] transition hover:bg-black/5 hover:text-rose-400 dark:hover:bg-white/5"
                  >
                    Clear
                  </button>
                )
              )}
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pr-1">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex gap-2", m.role === "user" && "flex-row-reverse")}>
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white",
                    m.role === "ai" ? "bg-gradient-to-br from-royal-500 to-royal-700" : "bg-gradient-to-br from-gold-400 to-gold-600"
                  )}
                >
                  {m.role === "ai" ? <Icon.ai className="h-4 w-4" /> : "AW"}
                </div>
                <div className={cn("flex max-w-[75%] flex-col gap-1", m.role === "user" && "items-end")}>
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed",
                      m.role === "ai"
                        ? "glass rounded-tl-sm"
                        : "rounded-tr-sm bg-gradient-to-br from-royal-500 to-royal-700 text-white"
                    )}
                  >
                    {m.text}
                    {m.streaming && (
                      <span className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse rounded-sm bg-royal-400 align-middle" />
                    )}
                  </div>
                  {m.role === "ai" && m.source && (
                    <div className="flex items-center gap-1 px-1 text-[10px] font-medium">
                      <Icon.spark
                        className={cn("h-3 w-3", m.source === "claude" ? "text-gold-400" : "text-[var(--muted)]")}
                      />
                      <span className={sourceMeta[m.source].className}>{sourceMeta[m.source].label}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-royal-500 to-royal-700 text-white">
                  <Icon.ai className="h-4 w-4" />
                </div>
                <div className="glass flex items-center gap-1.5 rounded-2xl rounded-tl-sm px-4 py-3.5">
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-royal-400" style={{ animationDelay: "0ms" }} />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-royal-400" style={{ animationDelay: "150ms" }} />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-royal-400" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {aiSuggestions.slice(0, 4).map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border px-3 py-1 text-[11px] text-[var(--muted)] transition hover:border-royal-500/50 hover:text-royal-400"
              >
                {s}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="mt-3 flex items-center gap-2 rounded-xl border bg-[rgb(var(--surface))]/60 px-3 py-2"
          >
            <Icon.spark className="h-4 w-4 text-gold-400" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={busy ? "NEXUS is thinking…" : "Ask NEXUS anything…"}
              disabled={busy}
              className="flex-1 bg-transparent text-sm outline-none disabled:opacity-60"
            />
            {busy && getToken() ? (
              <button
                type="button"
                onClick={stop}
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-rose-500 to-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110"
              >
                <span className="h-2 w-2 rounded-[2px] bg-white" /> Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-gradient-to-r from-royal-500 to-royal-700 px-3 py-1.5 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send
              </button>
            )}
          </form>
          </div>
        </Card>

        {/* Insights */}
        <div className="space-y-4">
          <Card>
            <div className="mb-3 text-sm font-semibold">Live Insights</div>
            <div className="space-y-3">
              {aiInsights.map((ins) => (
                <div key={ins.id} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between">
                    <Badge tone={typeMeta[ins.type].tone}>{typeMeta[ins.type].label}</Badge>
                    <span className="text-[10px] text-[var(--muted)]">{ins.confidence}% conf.</span>
                  </div>
                  <div className="mt-2 text-[13px] font-medium leading-snug">{ins.title}</div>
                  <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted)]">{ins.body}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Icon.spark className="h-4 w-4 text-gold-400" /> AI Generators
            </div>
            <div className="space-y-2">
              {[
                { kind: "kpi" as const, label: "SMART KPI Set", icon: Icon.performance, desc: "Weighted, data-driven KPIs" },
                { kind: "idp" as const, label: "Individual Development Plan", icon: Icon.development, desc: "IDP from competency gaps" },
                { kind: "report" as const, label: "Executive Report", icon: Icon.document, desc: "Narrative status report" },
              ].map((g) => {
                const IconCmp = g.icon;
                return (
                  <button
                    key={g.kind}
                    onClick={() => openGenerator(g.kind, g.label)}
                    className="flex w-full items-center gap-3 rounded-xl border p-3 text-left transition hover:border-royal-500/40 hover:bg-royal-500/5"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-royal-500/12 text-royal-400">
                      <IconCmp className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium">Generate {g.label}</div>
                      <div className="truncate text-[11px] text-[var(--muted)]">{g.desc}</div>
                    </div>
                    <Icon.spark className="h-3.5 w-3.5 shrink-0 text-gold-400" />
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {gen.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeGenerator}
          />
          <div className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col glass card shadow-glass animate-fade-up">
            <div className="flex items-center gap-2 border-b p-4">
              <Icon.spark className="h-4 w-4 shrink-0 text-gold-400" />
              <div className="text-sm font-semibold">{gen.title}</div>
              {gen.source && (
                <Badge tone={gen.source === "claude" ? "amber" : "gray"}>
                  {gen.source === "claude"
                    ? "Claude Opus 4.8"
                    : gen.source === "stopped"
                      ? "Stopped"
                      : "NEXUS engine"}
                </Badge>
              )}
              <button
                onClick={closeGenerator}
                className="ml-auto rounded-lg px-2 py-1 text-[var(--muted)] transition hover:text-rose-400"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {getToken() && (
                <div className="rounded-xl border p-3">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Options
                  </div>
                  {gen.kind === "kpi" && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="block text-[11px] font-medium text-[var(--muted)]">
                        Level
                        <select
                          value={gen.params.level}
                          onChange={(e) => setParam("level", e.target.value)}
                          className="mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] text-[var(--text)] outline-none focus:border-royal-500"
                        >
                          <option>Corporate</option>
                          <option>Department</option>
                          <option>Individual</option>
                        </select>
                      </label>
                      <label className="block text-[11px] font-medium text-[var(--muted)]">
                        Focus (optional)
                        <input
                          value={gen.params.focus}
                          onChange={(e) => setParam("focus", e.target.value)}
                          placeholder="e.g. SLA & competency"
                          className="mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] outline-none focus:border-royal-500"
                        />
                      </label>
                    </div>
                  )}
                  {gen.kind === "idp" && (
                    <label className="block text-[11px] font-medium text-[var(--muted)]">
                      Employee
                      <select
                        value={gen.params.employee}
                        onChange={(e) => setParam("employee", e.target.value)}
                        className="mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] text-[var(--text)] outline-none focus:border-royal-500"
                      >
                        <option value="">Auto — lowest readiness</option>
                        {employees.map((e) => (
                          <option key={e.employee} value={e.employee}>
                            {e.employee} · {e.readiness}% ready
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  {gen.kind === "report" && (
                    <label className="block text-[11px] font-medium text-[var(--muted)]">
                      Scope (optional)
                      <input
                        value={gen.params.scope}
                        onChange={(e) => setParam("scope", e.target.value)}
                        placeholder="e.g. Q3 Board Review"
                        className="mt-1 w-full rounded-lg border bg-[rgb(var(--surface))] px-2.5 py-1.5 text-[13px] outline-none focus:border-royal-500"
                      />
                    </label>
                  )}
                  <div className="mt-3">
                    {gen.streaming ? (
                      <Btn variant="ghost" onClick={stopGenerator}>
                        <span className="h-2 w-2 rounded-[2px] bg-rose-500" /> Stop
                      </Btn>
                    ) : (
                      <Btn variant="primary" onClick={runGenerator}>
                        <Icon.spark className="h-4 w-4" /> {gen.markdown ? "Regenerate" : "Generate"}
                      </Btn>
                    )}
                  </div>
                </div>
              )}

              {gen.loading ? (
                <div className="flex items-center gap-1.5 text-sm text-[var(--muted)]">
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-royal-400" style={{ animationDelay: "0ms" }} />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-royal-400" style={{ animationDelay: "150ms" }} />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-royal-400" style={{ animationDelay: "300ms" }} />
                  <span className="ml-1">Generating from live data…</span>
                </div>
              ) : gen.markdown ? (
                <Markdown text={gen.markdown} />
              ) : (
                <div className="text-[13px] text-[var(--muted)]">
                  {getToken()
                    ? "Set the options above and click Generate."
                    : "Sign in to generate this artifact from live NEXUS data."}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t p-3">
              {gen.markdown && !gen.streaming && (
                <>
                  <Btn variant="ghost" onClick={() => navigator.clipboard?.writeText(gen.markdown)}>
                    Copy Markdown
                  </Btn>
                  <Btn variant="ghost" onClick={downloadArtifact}>
                    <Icon.document className="h-4 w-4" /> Download .md
                  </Btn>
                </>
              )}
              <Btn variant="ghost" onClick={closeGenerator}>
                Close
              </Btn>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
