# Medical Liability Risk Fund: MERN Demo Build Prompts

A sequenced prompt pack: one global-rules prompt plus 24 feature prompts, covering Flows A, B and C and all three modules (Subscriber, Inspector, Admin).

## How to use

- Paste **Prompt 0** once as the project rules (CLAUDE.md, .cursorrules or the first message of every session).
- Run Prompts 1 to 24 in order, one per session or commit. Each states what it depends on, so it can stand alone.
- After each prompt: `npm run check` (lint, typecheck, tests) must pass before moving on.
- Fees, names and figures are placeholders. Change them freely.

---

## Prompt 0: Global rules (paste once)

You are building a demo/prototype of the **Medical Liability Risk Fund platform**: a subscriber portal (doctors, pharmacists, nurses, facilities), a field inspector mobile view, and an executive admin dashboard. The code must be demo-fast but production-shaped.

**Stack:** MongoDB + Mongoose, Express, React (Vite), Node 20, TypeScript strict everywhere, npm workspaces monorepo (`apps/api`, `apps/web`, `packages/shared`).

**Architecture rules**

- API layering: `routes -> controllers -> services -> repositories`. Controllers only parse/validate and respond. Business logic lives in services. Only repositories touch Mongoose.
- Zod schemas live in `packages/shared` and are used for request validation on the API and forms on the web.
- Response envelope: `{ success, data, error: { code, message, details } }`. Errors via `AppError` subclasses and one central handler. Base path `/api/v1`.
- Web: feature-based folders (`features/auth`, `features/payments`, ...), TanStack Query for server state, React Hook Form + Zod for forms, small Zustand store only for auth/UI state.
- External integrations (OTP, SMS, bank gateway, file storage) sit behind interfaces with mock implementations, so production swaps are one file.
- Env config validated at startup. No secrets in code. Never trust client-computed amounts or roles.

**Clean code rules:** small single-purpose functions, intention-revealing names, no magic strings (use shared enums/constants), no dead code, no commented-out code, early returns, DRY only after the third repetition, comments explain why not what. ESLint + Prettier clean, conventional commits.

**Shared enums:** roles `super_admin | finance_admin | practitioner_analyst | facility_analyst | claims_admin | inspector | subscriber`; account status `pending_verification | incomplete | pending_completion | active | expired`; payment channel `gateway | bank_bulk`; verification result `VALID | EXPIRED | INVALID`.

**UI direction (harmonic):** calm, trustworthy, official. One primary colour, one accent, neutral slate scale, consistent 8-pt spacing, generous whitespace, 12/16/24 radii, soft layered shadows, subtle motion (150 to 250 ms). Bilingual EN/AR with full RTL. Realistic Egyptian mock data (EGP, governorates, Arabic names).

For every task: state your plan briefly, implement, add tests for logic-heavy parts, and list files changed.

---

## Phase 0: Foundation

### Prompt 1: Monorepo scaffold

**Build**

- npm workspaces with `apps/api` (Express + TS), `apps/web` (Vite + React + TS) and `packages/shared` (zod schemas, enums, types, constants). Shared tsconfig base (strict), path aliases, Vitest in every package.
- Tooling: ESLint flat config, Prettier, Husky + lint-staged, commitlint, `npm run check` (lint + typecheck + test).
- API skeleton: `app.ts` separate from `server.ts`, zod-validated env config, pino logger with request IDs, helmet, cors, rate limiting, `express-mongo-sanitize`, `asyncHandler`, `AppError` classes, central error handler, `GET /api/v1/health`.
- `docker-compose.yml` with MongoDB as a single-node replica set; `.env.example`.

**Done when:** `npm run dev` starts API and web together, health returns the standard envelope, and `npm run check` passes.

### Prompt 2: Design system and app shell

**Build** (in `apps/web`)

- Tailwind + shadcn/ui + lucide-react + framer-motion. Design tokens as CSS variables: primary deep teal, warm gold accent for the official/sovereign feel, slate neutrals, semantic colours (valid green, expired amber, invalid red), light and dark themes.
- Typography: Inter for Latin, Cairo (or IBM Plex Sans Arabic) for Arabic; defined type scale. Use logical CSS (`ms-`, `ps-`, `start`) so RTL works by default.
- Components: Button, Input, OtpInput, Select/Combobox, Card, Badge (status variants), Stepper, ProgressRing, Dialog, Sheet, Table, Tabs, Toast, Skeleton, EmptyState, FileDropzone, KpiCard, ChartCard, PageHeader.
- Layouts: `PublicLayout`, `SubscriberLayout` (mobile-first with bottom nav), `AdminLayout` (sidebar + topbar), `InspectorLayout` (centred phone frame on desktop, full screen on mobile).
- react-i18next scaffold (en/ar) with automatic `dir` switching, and a `/dev/ui` showcase route listing every component and state.

**Done when:** showcase renders in light/dark and LTR/RTL with no layout breakage.

### Prompt 3: Data models and seed data

**Build**

- Mongoose models and repositories following the ERD: `Role`, `User`, `SpecialtyTier`, `SubscriberProfile` (with `entityType` individual/facility), `Subscription`, `Payment`, `Certificate`, `BulkBatch`, `Claim`, `AuditLog`. Add `SmsOutbox` for the mock SMS gateway.
- Indexes: unique `nationalId`, `certNumber`, `qrHash`; compound indexes that support the analytics queries (fiscalYear, tier, governorate, renewalStatus).
- Constants: the 27 Egyptian governorates (AR/EN).
- Deterministic seed (`npm run seed`, `seed:reset`) using faker with a fixed seed: 5 admin roles + demo users per role + one inspector, about 20 specialty tiers with EGP fees (GP, Surgery, Obstetrics, Orthopedics, Cosmetic Surgery, Cardiology, Pediatrics, Dentistry, Pharmacist, Nurse, Lab Technician; Hospital, Clinic, Lab, Pharmacy, Medical Center), about 2,500 subscribers across 3 fiscal years with realistic Arabic names, renewal/churn patterns with a few deliberately weak governorates and specialties, about 120 claims with full timelines, and about 300 audit entries.

**Done when:** seed runs idempotently and a script prints collection counts.

### Prompt 4: Auth and RBAC backend

**Build**

- Endpoints: `register`, `verify-otp`, `resend-otp`, `login`, `refresh`, `logout`, `me`.
- `OtpProvider` interface with `MockOtpProvider` (always `123456`) while keeping real behaviour: expiry, max attempts, resend cooldown. Verify phone and email as separate flags.
- Password hashing with argon2; JWT access token (15 min) plus rotating httpOnly refresh cookie.
- RBAC: permission constants in `packages/shared` (e.g. `users:manage`, `bulk:upload`, `payments:read`, `analytics:individuals`, `analytics:facilities`, `claims:read`, `audit:read`, `inspections:verify`, `export:run`); role-to-permission map stored in `Role.permissionsJson`; middleware `requireAuth` and `requirePermission(...)`.
- Demo only: `POST /auth/demo/switch-role` returns a real session for the seeded user of that role. It must 404 unless `DEMO_MODE=true`.
- `AuditService.record()` plus an `auditAction(action, entity)` middleware, used by every later feature.
- Supertest integration tests for the full auth lifecycle and permission denials.

---

## Phase 1: Subscriber Flow A (online)

### Prompt 5: Landing, registration, OTP and login UI

**Build**

- Landing page: hero, three-step how-it-works, trust section, CTA.
- Register (name, phone, email, password with strength meter), OTP screen (six-box input, resend countdown, separate phone and email verified indicators, wrong-OTP path leads to resend), Login.
- Egyptian phone validation (`01[0125]xxxxxxxx`), shared zod schemas, auth store, protected routes, axios interceptor with silent refresh.
- Show a small `Demo OTP: 123456` hint only when `DEMO_MODE` is on.
- Complete loading, error and success states; fully keyboard accessible; AR/EN.

**Depends on:** Prompts 2 and 4.

### Prompt 6: Incomplete-account dashboard and professional data

**Build**

- API: `GET /subscriber/dashboard` (progress 25/50/75/100 and next step), `PUT /subscriber/profile` (validate 14-digit Egyptian national ID, syndicate ID, or facility license number, governorate), `POST /subscriber/documents` using multer (PDF/JPG/PNG up to 5 MB, validate MIME by magic bytes) behind a `StorageProvider` interface with a local-disk implementation.
- UI: 'Account Incomplete' dashboard with progress ring and a vertical stepper (Professional Info, Specialty Selection, Payment), individual vs facility form variants, document uploader with previews, progress and remove.
- Progress becomes 50% after professional data is saved.

### Prompt 7: Specialty selection and dynamic fee calculator

**Build**

- API: `GET /specialty-tiers?entityType=`, `POST /subscriber/select-tier`. The fee comes from a pure `FeeEngine` function with unit tests (base tier fee now; clean extension points for risk surcharge and late-renewal penalty). Never accept an amount from the client.
- UI: individual/facility toggle, searchable bilingual dropdown, animated fee summary card with breakdown and risk-category badge. Surgeon must visibly cost more than GP, and Hospital differs from both.
- Progress becomes 75%.

### Prompt 8: Mock bank gateway, payment and webhook

**Build**

- `POST /payments/initiate` creates a pending `Payment` and a signed session, returns a redirect URL to `/mock-bank/:sessionId`.
- Mock bank pages (fictional bank brand, realistic card form prefilled, optional 3-D Secure style step) with **Simulate Successful Payment** and **Simulate Failed Payment** buttons. The mock gateway module behaves as an independent system: it sends an HMAC-signed webhook to `POST /api/v1/webhooks/payments`.
- Webhook handler: verify signature, idempotent by `webhookReference`, update payment and subscription, set account `active`, trigger certificate issuance, write audit log.
- Failure path: payment marked failed, 'Pay Fail Alert' UI with retry. Return page awaits status (poll) and shows a success animation.
- Tests for idempotency, bad signature and double-submit.

### Prompt 9: Digital certificate with dynamic QR

**Build**

- `CertificateService`: unique number like `MLRF-2026-000123`, `qrHash` as a random 128-bit token (not guessable), issue date, one-year expiry, status valid/revoked.
- PDF via Puppeteer rendering a bilingual HTML template (reliable Arabic shaping): fund logo placeholder (SVG), subscriber details, validity dates, QR encoding `${PUBLIC_WEB_URL}/verify/{qrHash}`. Endpoints `GET /certificates/me` and `GET /certificates/:id/pdf`.
- UI: on-screen styled certificate page, Download PDF, Share; dashboard shows Active at 100%.
- Set `PUBLIC_WEB_URL` to a LAN IP or tunnel URL so a phone can really scan it in the demo.

---

## Phase 2: Bank Bulk Flow B (offline)

### Prompt 10: Bulk upload API and parser

**Build**

- `POST /admin/bulk-batches?dryRun=true|false` (multipart xlsx/csv), permissions `bulk:upload` (finance\_admin, super\_admin). Use exceljs/csv-parse; map English and Arabic headers (name, phone, national ID, specialty, amount).
- Per-row zod validation, phone normalised to +20, specialty matched to a tier, expected-fee comparison (flag mismatches), de-duplication within the file and against the DB (idempotent on nationalId + fiscalYear).
- Dry run returns the preview rows with statuses (`created | duplicate | invalid` + reason) without writing. Commit creates user (`pending_completion`), incomplete profile, subscription, a paid `bank_bulk` payment linked to the batch, and updates `BulkBatch` counts.
- `GET /admin/bulk-batches` and `/:id`. Script `npm run sample:bank-sheet` generates a demo Excel file (with a few intentional bad and duplicate rows).
- Parser unit tests.

### Prompt 11: SMS gateway and magic-link completion

**Build**

- `SmsProvider` interface with `MockSmsProvider` that writes to `SmsOutbox`, plus a dev page `/dev/sms-inbox` styled like a phone so the presenter can show the SMS arriving.
- After commit, enqueue SMS jobs (simple in-process queue with retries) and update `smsSentCount`.
- Magic link: single-use signed token (stored hashed), 7-day expiry, bound to the user.
- UI `/complete/:token`: OTP verification (`123456`), missing professional data and documents, payment step shown as 'Paid via bank', then status Active and certificate download. Handle expired, used and invalid links with a 'request a new link' action.

### Prompt 12: Admin bulk upload screen

**Build**

- Drag-and-drop zone with client-side file checks and upload progress, then a preview table with row status chips ('Paid - SMS Sent for Profile Completion', Duplicate, Invalid with reason), summary KPIs, filters, an explicit Confirm step (dry run, then commit), batch history table, downloadable error report.
- Gated by `bulk:upload`.

---

## Phase 3: Inspector Flow C

### Prompt 13: Verification API

**Build**

- `POST /inspector/verify` accepts `qrHash | certificateNumber | nationalId | syndicateId` (permission `inspections:verify`). Returns `VALID | EXPIRED | INVALID` with name, specialty, facility name, expiry and last renewal date. Rate-limited; timing-safe comparisons.
- `POST /inspector/inspections` (log outcome), `POST /inspector/notices` (renewal notice), `POST /inspector/violations` (notes, optional photo, optional GPS), `GET /inspector/history`. All audit logged.
- Public `GET /public/verify/:qrHash` returns minimal, masked data (privacy).
- Seed an inspector user; integration tests for the three outcomes.

### Prompt 14: Inspector mobile UI

**Build**

- Phone-framed layout on desktop. Login, then Verification Hub: camera viewfinder (html5-qrcode or similar) with animated scan frame, camera-denied fallback, quick search bar for certificate #, national ID or syndicate ID, recent inspections.
- Result bottom sheet: **green** (details, expiry, Log Compliant Visit), **orange** ('Expired on \[date\]', Issue Renewal Notice), **red** ('No Active Record', Log Violation Report form).
- Demo toolbar (only when `DEMO_MODE`): **Simulate Valid / Expired / Unregistered Scan**. These call the real verify endpoint with seeded identifiers so the real code path is exercised.
- Large touch targets, instant feedback, AR/EN.

### Prompt 15: Public QR landing

**Build**

- Route `/verify/:qrHash`: scanning a certificate with any phone camera opens the green 'Verified' screen (masked data, expiry, validity). Expired and invalid states mirror Prompt 14. If an inspector is logged in, offer 'Open in Inspector tools'.
- Document in the README how to run the demo with a tunnel/LAN IP so the QR is truly scannable (camera access needs HTTPS except on localhost).

---

## Phase 4: Executive Admin Dashboard

### Prompt 16: Admin shell, role switcher and RBAC UI

**Build**

- Sidebar tabs: Subscriptions & Growth, Bank Bulk Upload, Claims & Compensations, Security & Audit Log, Users & Roles (Super Admin).
- Demo role switcher in the topbar for all five admin roles. It calls the demo endpoint (real session, backend still enforces RBAC) with a smooth transition. Forbidden tabs hide or show a locked state; a `usePermission` hook and `<Can>` component; route guards.
- Users & Roles page: list users, assign role, plus a read-only permission matrix.

### Prompt 17: Analytics API

**Build** (`/admin/analytics`, filters: `fiscalYear`, `scenario=year1|year2_3`, `entityType`, `governorate`)

- `GET /kpis`: total active, total revenue (EGP), YoY renewal rate, unrenewed/churned.
- `GET /cohorts`: Year 1 signups vs Year 2 renewals vs Year 2 new signups.
- `GET /distribution`: revenue and subscribers by specialty and by facility type.
- `GET /heatmap`: renewal rate by governorate x specialty, with the weakest cells flagged.
- Facilities analytics: hospitals, pharmacies, revenue tiers, geographical coverage.
- Aggregation pipelines in a dedicated analytics repository, short-TTL cache, and permission scoping (`analytics:individuals` vs `analytics:facilities`). Unit tests against a small fixture dataset.

### Prompt 18: Analytics UI

**Build**

- Filter bar, a segmented **\[Simulate Year 1\] / \[Simulate Year 2 & 3\]** toggle, count-up numbers and animated chart transitions.
- Four KPI cards with sparkline and delta. Recharts: grouped bar for cohorts; donut with toggles (revenue vs subscribers, specialty vs facility type); custom accessible heatmap (governorate x specialty, tooltip, 'weakest 5' callout list).
- Facilities view for the facility analyst role. EGP formatting with `Intl` (ar-EG / en-EG), skeletons, empty states, responsive layout, all inside the reusable `ChartCard`.

### Prompt 19: Export to Excel and PDF

**Build**

- `GET /admin/export/:view?format=xlsx|pdf` (permission `export:run`) honouring current filters. Excel via exceljs with formatted KPI and data sheets. PDF via Puppeteer printing a print-optimised route of the same dashboard, so charts match the screen.
- Audit log every export. UI: export dropdown with loading state and toast.

### Prompt 20: Claims and compensations dashboard

**Build**

- API (`claims:read`): list with filters, sorting and pagination; KPIs (total filed, under legal review, approved compensations, disbursed vs reserved); top specialties by volume and value; top facilities with incidents; average days per stage (Incident -> Claim Filed -> Court Verdict -> Payout).
- UI tab with a 'Future-ready' tag: KPI cards, dual-metric bar chart, horizontal facilities chart, timeline tracker, and a ledger table (Doctor, Hospital, Specialty, Claim Start, Verdict Date, Awarded, Paid, Beneficiary) with search, sort, pagination, detail drawer and export.

### Prompt 21: Security and audit log

**Build**

- API: filters (user, role, action, date range), cursor pagination, IP capture that is proxy-aware. Audit that every feature from Prompts 4 to 20 writes entries.
- UI (`audit:read`): live-looking table `[Timestamp] - [User/Role] - [Action] - [IP]` that polls every 5 s, highlights new rows, has a pulsing Live indicator, pause/resume, action badges (Viewed / Exported / Updated / Login / Upload), monospace timestamps and IPs, filter chips.

---

## Phase 5: Polish and delivery

### Prompt 22: Arabic/RTL, accessibility, PWA

**Build**

- Complete Arabic translation of every string, RTL audit of every screen, Arabic-Indic numeral option.
- Installable PWA for the subscriber portal (`vite-plugin-pwa`).
- Accessibility: keyboard navigation, focus rings, `prefers-reduced-motion`, AA contrast, Lighthouse accessibility 95+. Consistent 404, error and empty states and micro-interactions.

### Prompt 23: Testing and CI

**Build**

- Unit tests: fee engine, OTP, tokens, parsers, permission map. Integration (Supertest + mongodb-memory-server) for Flows A, B and C. Playwright end-to-end for the three flows plus the role switcher.
- Coverage threshold on services; GitHub Actions running `npm run check` and e2e.

### Prompt 24: Demo hardening and handover

**Build**

- 'Reset demo data' action (DEMO\_MODE only) and named seed scenarios.
- `/dev/demo-guide` presenter page: checklist following the spec's script (Year 1 vs Year 2 toggle, live QR scan to green screen, bulk upload to SMS to completion, role switching).
- Full `docker-compose` stack, README, env documentation, health checks.
- Security pass: helmet, rate limits, mongo sanitisation, secrets, dependency audit. Final cleanup of dead code and TODOs.

---

## Assumptions to confirm

1. The admin diagram shows an 'Expired' badge on the Finance and Claims modules, which contradicts the spec (Finance is core, Claims is 'future-ready'). Prompts treat both as fully working, with Claims tagged 'Future-ready'.
2. The spec's role switcher lists three roles, but RBAC defines five. Prompt 16 includes all five.
3. The onboarding diagram omits the password; the spec includes it. The prompts follow the spec.
4. Fee amounts are mock values to be replaced by the fund's real tariff.
