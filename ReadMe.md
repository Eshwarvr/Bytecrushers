# AssetFlow — Project Roadmap & Backlog

This file outlines the updated future milestones and **what to work on** next to expand AssetFlow into a complete enterprise ERP, reflecting the official project phases.

---

## 📅 Roadmap & Future Phases

```mermaid
gantt
  title AssetFlow ERP Project Timeline
  dateFormat  YYYY-MM-DD
  section Completed
  Phase 1 (Foundation) : done
  section Backlog (Next to Work On)
  Phase 2 (Allocation & Booking Engine) : 
  Phase 3 (Maintenance & Audit Workflows) : 
  Phase 4 (Dashboard & Intelligence Layer) : 
```

---

## 🛠️ Backlog: What to Build Next

For full specifications and step-by-step requirements of each phase, please refer to [Phases.md](./Phases.md).

### 1. [Phase 1: Foundation (Auth, RBAC & Org Setup)](./Phases.md#assetflow--phase-1-foundation-auth-rbac--org-setup) `[COMPLETED]`
Laying the base for the entire application, including the database schema, authentication, role-based access control, and the administrator console.
* **Tech Stack**: Supabase (Postgres & Auth), Express (Node.js/TS), React (Vite/TS), TailwindCSS, shadcn/ui.
* **Key Components**:
  - Database schema (`departments`, `employees`, `asset_categories`).
  - Row-Level Security (RLS) policies and Express RBAC middleware.
  - Three-tab Admin **Org Setup Screen** (Department Management, Asset Category Custom Fields Builder, Employee Directory & Promotion).
* **Reference**: See [Documentation.md](./Documentation.md) for technical implementation details of Phase 1.

### 2. [Phase 2: Allocation & Booking Engine](./Phases.md#assetflow--phase-2-allocation--booking-engine)
Implementing the core business logic, conflicts engine, transfer workflows, and calendar-based bookings.
* **Tech Stack**: React, TailwindCSS, Express, Supabase, React Query, `qrcode.react`, Calendar component (e.g. `react-big-calendar`).
* **Key Components**:
  - **Asset Registry**: CRUD forms, incremental Asset Tags, barcode/QR generation, search/filter, and history views.
  - **Allocation & Transfer Engine**: Double-booking conflict blocking with active holder lookups and department-head transfer approval flow.
  - **Resource Booking**: Visual calendar showing availability, overlap validation logic (with back-to-back allowance), and reschedule options.

### 3. [Phase 3: Maintenance & Audit Workflows](./Phases.md#assetflow--phase-3-maintenance--audit-workflows)
Building two multi-step approval-gated state machines for asset maintenance logs and periodic structured audits.
* **Tech Stack**: React, TailwindCSS, Express, Supabase (with Storage for photo attachments).
* **Key Components**:
  - **Maintenance Lifecycle**: Request submission with image attachments, Asset Manager approval gates, technician assignment, and automatic status cascading (`Available` ⟷ `Under Maintenance`).
  - **Asset Audits**: Scheduled cycle creator, scope assignments, auditor checklist panel, auto-generated discrepancy reports, and automated status cascading to `Lost` for missing items.

### 4. [Phase 4: Dashboard, Notifications & Intelligence Layer](./Phases.md#assetflow--phase-4-dashboard-notifications--intelligence-layer)
Connecting all components with real-time feedback, statistics/reporting dashboard, unified activity logging, and AI intelligence features.
* **Tech Stack**: React, TailwindCSS, Express, Socket.io (for real-time push), Recharts, Gemini API (for summaries/risk assessment).
* **Key Components**:
  - **Live Dashboard**: Real-time KPI count card updates (Socket.io) for stock, active bookings, and overdue return warnings.
  - **Notification Center**: Bell dropdown with unread count and real-time push alerts for assignments, approvals, and discrepancies.
  - **Reports & Analytics**: Trend charts (utilization, maintenance frequency, retirement schedules), peak usage heatmaps, and CSV/PDF export.
  - **AI Intelligence**: Gemini API risk score explanations per asset, and automated plain-English summary narratives for audit discrepancy reports (with rule-based fallbacks).