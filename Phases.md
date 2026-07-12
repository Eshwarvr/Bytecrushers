*AssetFlow — Phase 1: Foundation (Auth, RBAC & Org Setup)*

*What this phase covers:*
You're building the base everything else sits on — database schema, authentication, role-based access, and the Organization Setup screen. If this isn't solid, nothing else works, so this is the first thing we build and everyone else's work depends on your tables/auth being ready early.

*Tech Stack:*
- Database: Supabase (Postgres) — use Supabase's built-in Auth module, don't build custom auth
- Backend: Node.js + Express + TypeScript for any custom API routes beyond Supabase's auto-generated ones
- Frontend: React + TypeScript + Vite, TailwindCSS + shadcn/ui for forms/tables
- Security: Supabase Row-Level Security (RLS) policies — this is critical, not optional

*What to build, step by step:*

1. *Schema design (do this first, day 1):*
 - departments table: id, name, code, head_id (FK to employees), parent_department_id (self-referencing FK for hierarchy), employee_count, status (Active/Inactive)
 - asset_categories table: id, name, custom_fields (jsonb for category-specific fields like warranty period)
 - employees table: id, name, email, department_id, role (enum: Employee/DepartmentHead/AssetManager/Admin), status (Active/Inactive), auth_user_id (FK to Supabase auth.users)
 - roles enum or lookup table if you want it more flexible than a plain enum

2. *Auth flow:*
 - Signup: email + password — creates a Supabase auth user AND an employees row with role hardcoded to "Employee" (no role selection UI at signup, this is a strict rule from the spec)
 - Login: email + password, Supabase session handling
 - Forgot password flow (Supabase has this built in)
 - Session validation middleware for protected routes

3. *RBAC:*
 - Write RLS policies per table: e.g. Employee can only SELECT their own allocations; Department Head can SELECT rows where department_id matches theirs; Admin has full access
 - Write an Express/API middleware that checks the logged-in user's role before allowing access to admin-only routes (Org Setup, role promotion)

4. *Org Setup screen (Admin only, 3 tabs):*
 - Tab A — Department Management: create/edit/deactivate, assign Head, set Parent Department, Status toggle
 - Tab B — Asset Category Management: create/edit categories, add optional custom fields per category
 - Tab C — Employee Directory: list all employees with search/filter, and *this is the only place in the whole app where Admin can promote an Employee to Department Head or Asset Manager* — no self-elevation anywhere else

*Workflow / cycle for this phase:*

Signup (Employee only) → Login → Admin logs in → Admin creates Departments 
→ Admin creates Asset Categories → Admin promotes 2-3 employees to 
Dept Head / Asset Manager via Employee Directory → Foundation ready for 
other phases to build on top of (they need departments, categories, 
and roles to exist before they can register assets, allocate, etc.)


*Deliverables:*
- Complete Supabase schema (departments, asset_categories, employees, roles wired to auth)
- Working signup/login/forgot-password
- RLS policies enforced (test with 2 different role logins to confirm access differs)
- Org Setup screen fully functional with all 3 tabs

*Why this matters for the demo:* This is what makes our RBAC "realistic" instead of a toy — judges specifically look for no self-assigned admin roles, so get the promotion flow crisp and demo-ready.

*AssetFlow — Phase 2: Allocation & Booking Engine*

*What this phase covers:*
This is the core business-logic phase — asset registration, the allocation conflict engine, transfer requests, and resource booking with overlap validation. This is the part judges will scrutinize most closely because it's where real "business rules" (not just CRUD) live.

*Tech Stack:*
- Backend: Node.js + Express + TypeScript, Supabase (Postgres) for data
- Frontend: React + TypeScript, TailwindCSS + shadcn/ui, a calendar component (e.g. react-big-calendar or FullCalendar) for the booking view
- State/data fetching: React Query
- QR: use a library like qrcode.react to generate scannable Asset Tags

*What to build, step by step:*

1. *Asset Registry & Directory:*
 - assets table: id, name, category_id (FK), asset_tag (auto-generated, format AF-0001), serial_number, acquisition_date, acquisition_cost, condition, location, photo_url, is_shared_bookable (boolean), status (enum: Available/Allocated/Reserved/UnderMaintenance/Lost/Retired/Disposed)
 - Registration form with auto Asset Tag generation (increment logic)
 - Search/filter by tag, serial number, QR, category, status, department, location
 - Per-asset detail page showing allocation history + maintenance history (pull from the allocations and maintenance tables built in this and phase 3)

2. *Allocation & Transfer Engine (the important part):*
 - allocations table: id, asset_id, held_by_type (employee/department), held_by_id, allocated_date, expected_return_date, returned_date (nullable), status
 - Allocation logic: before creating a new allocation, check if the asset already has an active (non-returned) allocation. If yes — BLOCK it, return the current holder's name, and surface a "Request Transfer" option instead of just failing
 - transfer_requests table: id, asset_id, requested_by, current_holder, status (Requested/Approved/Rejected), approved_by
 - Transfer workflow: Requested → Approved (by Asset Manager or Dept Head) → old allocation closed, new allocation created automatically, history preserved (don't overwrite — append)
 - Return flow: mark returned, capture condition check-in notes, asset status reverts to Available
 - Overdue detection: flag any allocation past its expected_return_date (feeds Phase 4's dashboard/notifications)
 - Bonus if time allows: "Smart Transfer Suggestion" — when blocked, query for other Available assets in the same category and location, suggest as alternative

3. *Resource Booking:*
 - bookings table: id, resource_asset_id, booked_by, start_time, end_time, status (Upcoming/Ongoing/Completed/Cancelled)
 - Overlap validation logic (core algorithm): a new booking is rejected if new_start < existing_end AND new_end > existing_start for any existing booking on that resource. Back-to-back bookings (new_start == existing_end) must be ALLOWED
 - Calendar view showing existing bookings per resource
 - Cancel/reschedule actions
 - Reminder notification trigger before slot starts (hook into Phase 4's notification system)

*Workflow / cycle for this phase:*

Asset Manager registers asset → status = Available → 
Employee A allocates it → status = Allocated, held_by = A → 
Employee B tries to allocate same asset → BLOCKED, shown "held by A", 
offered Transfer Request → B requests transfer → Asset Manager approves 
→ old allocation closed, new one created, held_by = B

Separately: Employee books Room B2 9:00-10:00 → succeeds → 
Another employee tries 9:30-10:30 → rejected (overlap) → 
tries 10:00-11:00 → succeeds (back-to-back is fine)


*Deliverables:*
- Asset registration + search/filter working end to end
- Allocation conflict blocking working with clear error/holder display
- Transfer request workflow complete (Requested → Approved → Re-allocated)
- Booking calendar with overlap validation tested against the exact edge case above

*Why this matters for the demo:* This is the single most "testable" logic live in front of judges — have this rock solid, since it's likely what they'll poke at first.

*AssetFlow — Phase 3: Maintenance & Audit Workflows*

*What this phase covers:*
You're building the two approval-gated workflows in the system: maintenance requests (repair approval before work starts) and audit cycles (structured verification with auto-generated discrepancy reports). Both are multi-step state machines, not simple forms.

*Tech Stack:*
- Backend: Node.js + Express + TypeScript, Supabase (Postgres)
- Frontend: React + TypeScript, TailwindCSS + shadcn/ui
- File upload: Supabase Storage for photo attachments (maintenance issue photos, audit proof)

*What to build, step by step:*

1. *Maintenance Management:*
 - maintenance_requests table: id, asset_id, raised_by, issue_description, priority, photo_url, status (enum: Pending/Approved/Rejected/TechnicianAssigned/InProgress/Resolved), approved_by, technician_id (nullable), created_at, resolved_at
 - Raise request form: select asset, describe issue, set priority, attach photo
 - Approval action (Asset Manager only): Approve or Reject with optional reason
 - *On Approve: asset status auto-updates to "Under Maintenance"* (this must cascade to the assets table, not just be a status label on the maintenance record)
 - Technician assignment step (simple dropdown/field, doesn't need a full technician management system unless you have spare time)
 - Progress tracking: In Progress → Resolved
 - *On Resolved: asset status auto-reverts to "Available"*
 - Maintenance history retained per asset (feeds Phase 2's per-asset history view)

2. *Asset Audit Cycles:*
 - audit_cycles table: id, scope_type (department/location), scope_value, date_range_start, date_range_end, status (Open/Closed), created_by
 - audit_cycle_auditors table: cycle_id, auditor_id (many-to-many, since a cycle can have multiple auditors)
 - audit_items table: id, cycle_id, asset_id, verification_status (Verified/Missing/Damaged), notes, verified_by, verified_at
 - Create Audit Cycle form: set scope (dept or location), date range, assign one or more auditors
 - Auditor's working view: list of assets in scope, mark each Verified/Missing/Damaged
 - *Auto-generate discrepancy report:* any item marked Missing or Damaged gets pulled into a discrepancy report automatically — don't make this a manual compilation step
 - *Close Audit Cycle action:* locks the cycle (no further edits), and cascades status updates — confirmed-missing assets get their status auto-changed to "Lost" in the assets table
 - Audit history retained per cycle (list of past cycles with their discrepancy reports)
 - Bonus if time allows: flag suspicious patterns, e.g. the same auditor marking unusually high "Verified" rates with no supporting notes

*Workflow / cycle for this phase:*

MAINTENANCE:
Employee raises request (asset + issue + priority + photo) → 
Asset Manager reviews → Approves → asset status = Under Maintenance → 
Technician assigned → In Progress → Resolved → asset status = Available

AUDIT:
Admin creates Audit Cycle (scope: Marketing dept, date range) → 
assigns 2 auditors → auditors go through each asset in scope, mark 
Verified/Missing/Damaged → system auto-compiles discrepancy report from 
Missing/Damaged items → Admin reviews → closes cycle → 
confirmed-missing assets auto-flip to Lost status


*Deliverables:*
- Maintenance request full lifecycle working, with the two auto status-cascades (Approved→Under Maintenance, Resolved→Available) actually enforced in the backend, not just UI
- Audit cycle creation, auditor assignment, and item-marking flow complete
- Discrepancy report auto-generated from Missing/Damaged items, not manually built
- Cycle close correctly locks the cycle and cascades the Lost status update

*Why this matters for the demo:* The audit-cycle-to-discrepancy-report pipeline is the most "enterprise" looking feature in the whole app — if you can demo create cycle → mark asset missing → close cycle → see it auto-flip to Lost, that's a strong moment.

*AssetFlow — Phase 4: Dashboard, Notifications & Intelligence Layer*

*What this phase covers:*
This is the layer that ties everyone else's work together into something visible and impressive — the live dashboard, the notification system, reports/analytics, and the AI features that make this project stand out from a plain CRUD submission. This depends on the other 3 phases having their tables in place, so early on I'll work with mock/sample data and wire in real data as it becomes available.

*Tech Stack:*
- Backend: Node.js + Express + TypeScript, Socket.io for real-time push
- Frontend: React + TypeScript, TailwindCSS + shadcn/ui, Recharts for charts/heatmaps
- AI: Gemini API for risk scoring narrative + discrepancy summaries, with a rule-based fallback so the demo never breaks if the API is slow/down
- Realtime: Socket.io server broadcasting on data changes (or Supabase Realtime subscriptions as an alternative — pick one)

*What to build, step by step:*

1. *Dashboard / Home Screen:*
 - KPI cards: Assets Available, Assets Allocated, Maintenance Today, Active Bookings, Pending Transfers, Upcoming Returns (pulled live from Phase 2 and 3's tables)
 - Overdue returns shown in a separate highlighted section (past Expected Return Date)
 - Quick action buttons: Register Asset, Book Resource, Raise Maintenance Request (these just route to the relevant Phase 2/3 screens)
 - Wire Socket.io so KPI cards update live without refresh when another user allocates/books/resolves something

2. *Notification System:*
 - notifications table: id, user_id, type, message, related_entity_id, read_status, created_at
 - Trigger notifications for: Asset Assigned, Maintenance Approved/Rejected, Booking Confirmed/Cancelled/Reminder, Transfer Approved, Overdue Return Alert, Audit Discrepancy Flagged
 - In-app notification bell/dropdown with unread count
 - Push new notifications via Socket.io so they appear instantly

3. *Activity Logs:*
 - activity_logs table: id, actor_id, action, entity_type, entity_id, timestamp, details (jsonb)
 - Log every meaningful action across the app (you'll need small logging calls added at the end of each Phase 1-3 action — coordinate with them to insert a log entry after their key actions)
 - Simple filterable log viewer screen (by user, action type, date)

4. *Reports & Analytics:*
 - Asset utilization trends (most-used vs idle, based on allocation/booking frequency)
 - Maintenance frequency by asset/category (pull from Phase 3's maintenance_requests)
 - Assets due for maintenance or nearing retirement (age-based heuristic)
 - Department-wise allocation summary
 - Resource booking heatmap (peak usage windows, from Phase 2's bookings table)
 - Export to CSV/PDF

5. *AI Intelligence Layer (our differentiator):*
 - *Maintenance Risk Score:* simple rule-based score (asset age + maintenance frequency + category) sent to Gemini/Claude to generate a plain-English risk explanation per asset ("This asset has had 3 repairs in 6 months and is past typical service life — recommend inspection")
 - *AI Discrepancy Summary:* when an audit cycle closes with missing/damaged items, send the list to the AI API and get back a short plain-English summary for non-technical managers, shown at the top of the discrepancy report
 - Both features MUST have a rule-based fallback (e.g., a template sentence built from the numbers) in case the API call fails or is slow — never let the demo depend on a live API call working

*Workflow / cycle for this phase:*

Any action in Phase 1-3 (allocate, book, approve maintenance, close audit) 
→ triggers a notification row + activity log entry → 
Socket.io broadcasts the change → Dashboard KPI cards and notification 
bell update live for all logged-in users without refresh → 
Reports screen aggregates historical data for trend charts → 
AI layer runs on-demand (risk score on asset detail view, summary on 
audit cycle close) with instant fallback if the API is slow


*Deliverables:*
- Live dashboard with real KPI data + Socket.io real-time updates
- Full notification system (all required event types) with live push
- Activity log viewer
- Reports & Analytics screen with at least 3 of the 5 report types + export
- AI Maintenance Risk Score and AI Discrepancy Summary, both with working fallbacks

*Why this matters for the demo:* This is the phase that makes the demo feel alive — live updates across tabs plus the AI narrative are what separate us from a static CRUD submission. Save 30-45 min before the deadline purely for polishing this screen since it's the first thing judges see.