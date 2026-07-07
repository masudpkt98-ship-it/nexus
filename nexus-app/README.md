# NEXUS — Competency & Performance Nexus

> **Connecting Excellence. Driving Performance.**
> The digital operating system for competency & performance management.

NEXUS is a modern enterprise web application prototype built from the project
concept (`Nexus1.docx`). It reflects the core philosophy — **People → Competency
→ Execution → Performance → Customer Value → Organizational Excellence** — where
everything is connected.

## ✨ What's included

A premium, responsive UI with **dark & light mode**, glassmorphism, soft shadows,
gold + royal-blue brand accents, and micro-animations — inspired by Fluent, Apple,
Linear, Notion and Azure Portal.

| # | Module | Highlights |
|---|--------|-----------|
| — | **Login / RBAC** | Role-based sign-in (VP · Manager · Staff), SSO/Active Directory stub |
| 1 | **Executive Dashboard** | KPI hero cards, traffic-light health gauge, trend chart, workload bars, competency heatmap, recent activity, top performers, calendar |
| 2 | **Strategic Planning** | Vision/Mission, strategy cascade, OKR & Key Results |
| 3 | **Program Management** | Program → project → milestone, budget, risk, dependency, progress |
| 4 | **Task Management** | Interactive **drag-and-drop Kanban**, List / Calendar / Gantt views, checklist, priority, approvals |
| 5 | **Competency** | Gap analysis (required vs current), AI learning recommendations, IDP & career readiness |
| 6 | **Performance** | Weighted auto-score gauge, SMART KPI scorecard, appraisal ranking, trend |
| 7 | **Development** | Development plans, readiness, training calendar |
| 8 | **Customer Request** | Service tickets, SLA status, PIC, approval |
| 9 | **Satisfaction** | NPS donut, CSAT trend, service quality index |
| 10 | **Meetings** | Agenda, minutes, action items |
| 11 | **Knowledge** | SOP / guideline / template library with filters & version control |
| 12 | **Documents** | Folders, versions, approval workflow |
| 13 | **Notifications** | Multi-channel center (In-App · Email · WhatsApp · Push) |
| 14 | **AI Assistant** | Interactive copilot chat + live risk / prediction / summary insights |
| 15 | **Analytics** | Productivity, competency, training, SLA indices; export stubs (PDF/Excel/PPT/CSV) |

## 🛠 Tech stack

- **Next.js 15** (App Router) · **React 19** · **TypeScript**
- **TailwindCSS 3** — custom NEXUS design tokens (navy / royal / gold)
- Self-contained **SVG charts** (no external chart dependency)
- Mock data layer in `lib/data.ts` (stands in for the planned Laravel REST API + PostgreSQL)

## 🚀 Run locally

```bash
cd nexus-app
npm install
npm run dev
# open http://localhost:3000  (falls back to 3001 if 3000 is busy)
```

Sign in with any of the demo roles (password field is pre-filled for the demo) and
click **Enter NEXUS**.

## 🧪 End-to-end tests (Playwright)

Browser tests live in `e2e/` and drive the real app. They require the **full
stack running** (web + API), e.g. `docker compose up -d` from the repo root, or
`npm run dev` + `php artisan serve`.

Coverage:
- **`ai-generators.spec.ts`** — KPI / IDP / Report generators, the IDP employee
  dropdown (from dev-plan data), and parameter passing (level, employee, scope).
- **`ai-chat.spec.ts`** — chat streaming + source label, the **Stop** button, and
  conversation threads (create · rename · delete · search).

> Tests run with a single worker because the dev API (`php artisan serve`) is
> single-threaded and streams responses.

```bash
npm run e2e:install   # one-time: download the Chromium browser
npm run e2e           # run the suite (headless)
npm run e2e:ui        # interactive UI mode
npm run e2e:report    # open the last HTML report
```

Point the tests at another host with `E2E_BASE_URL=https://… npm run e2e`.

## 📁 Structure

```
nexus-app/
├─ app/
│  ├─ layout.tsx            # root layout + theme provider
│  ├─ login/page.tsx        # branded RBAC login
│  └─ (app)/                # authenticated shell (sidebar + topbar)
│     ├─ layout.tsx
│     ├─ dashboard/ … analytics/   # 15 module pages
├─ components/              # Sidebar, Topbar, Logo, Icons, UI kit, charts
├─ lib/                     # data.ts (mock API), api.ts (live client), nav.ts
├─ e2e/                     # Playwright browser tests
└─ public/nexus-logo.png    # brand logo
```

## 🧭 Next steps toward production

This prototype delivers the **frontend & UX** end of the concept. To reach the
full production spec:

- Replace `lib/data.ts` with the **Laravel REST API** + **PostgreSQL** (normalized,
  soft-delete, audit trail) and **Redis** cache.
- Wire **JWT / OAuth** auth and real **RBAC** enforcement.
- Integrate real **AI features** (Generate KPI / IDP / reports, delay prediction).
- Add **MinIO** storage, notification channels (Email/WhatsApp/Push), calendar sync.
- Containerize with **Docker** + CI/CD.

---

*One Platform. One Team. One Performance.*
