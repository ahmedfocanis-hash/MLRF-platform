# Implementation status against the supplied prompt pack

This is a runnable-shaped prototype / implementation starter, not a claim that all detailed acceptance criteria are production complete.

| Prompt | Status in this build |
|---|---|
| 0 — Global rules | Monorepo layout, strict TS config, shared validation/constants, API envelope, role permissions and demo-oriented design established. |
| 1 — Monorepo scaffold | Workspace structure, Vite/React and Express entrypoints, scripts, env example, Docker Mongo replica-set service. Full lint/typecheck/test could not be run here because npm registry access was unavailable. |
| 2 — Design system and shell | Responsive dashboard shell, navigation, light/dark theme, English/Arabic translations scaffold, RTL document direction, mobile layouts and focus styles. Full shadcn/ui component catalogue not implemented. |
| 3 — Data models and seed data | Shared fee tiers and governorates; in-memory demo registry remains for live route handlers. Mongoose schemas for core entities, audit/subscription repositories, and an idempotent MongoDB seed script are present. Seed writes roles, 16 specialty tiers, staff users, 2,500 subscriber profiles/subscriptions, 120 payments, a certificate, 120 claims, and 300 audit logs. With `CONNECT_MONGO=true`, registration, OTP verification, login, demo role switching, subscriber dashboard/profile and tier/subscription selection now use MongoDB. Analytics aggregation and full faker variation remain. |
| 4 — Auth and RBAC backend | Demo login, OTP route, JWT access token, role switch endpoint, server-side permission middleware, audit recording. MongoDB mode now stores Argon2 password hashes and verifies them on login. Secure rotating refresh tokens, separate email verification, OTP expiry/attempt limits and full lifecycle tests are not production implemented. |
| 5 — Landing, registration, OTP and login UI | Demo login and role selection UI; register/OTP endpoints exist. Full landing/register/OTP screens and real lifecycle tests remain. |
| 6 — Incomplete-account dashboard and professional data | Subscriber profile form, profile endpoint, progress view. With `CONNECT_MONGO=true`, profile identifiers and governorate/entity type persist to SubscriberProfile. Multipart document upload accepts one PDF/JPG/PNG up to 5 MB and validates file magic bytes; metadata linking, private object storage and malware scanning remain. |
| 7 — Specialty selection and fee calculator | Shared fee tiers and server-side fee lookup; subscriber tier selection and UI. With `CONNECT_MONGO=true`, the selected tier creates/updates the current fiscal-year Subscription using the server-side fee. A pure FeeEngine returns base fee, risk surcharge, late-renewal penalty and total; full breakdown integration remains. |
| 8 — Mock bank gateway, payment and webhook | MongoDB mode persists payment initiation and success/failure settlement, checks HMAC webhook signatures, deduplicates webhook references, prevents paid-to-failed transitions, and activates subscriptions/users on success. The gateway remains simulated; no real bank integration is present. |
| 9 — Digital certificate with dynamic QR | MongoDB mode issues a unique certificate after successful payment, stores a random 128-bit QR token, lists the subscriber certificates, and supports masked public verification. PDF rendering and on-screen QR rendering remain placeholders. |
| 10 — Bulk upload API and parser | JSON row validation, dry-run preview, duplicate checks, CSV/XLS/XLSX multipart parsing and commit API are implemented; integration tests and downloadable error reports remain. |
| 11 — SMS gateway and magic-link completion | Mongo-backed mock SMS outbox and expiring, hashed, single-use completion tokens implemented; real provider delivery, retry worker and complete UI remain. |
| 12 — Admin bulk upload screen | JSON row preview/commit plus CSV/XLS/XLSX multipart parsing, validation, duplicate checks and Mongo-backed batch history implemented. Native file drag/drop and downloadable error reports remain. |
| 13 — Verification API | Protected inspector verification, inspections, notices, violations, public masked verification and history endpoints. More robust ID matching/rate-limit and integration tests remain. |
| 14 — Inspector mobile UI | Responsive inspector interface and valid/expired/invalid scenario controls. Real camera QR scanning remains. |
| 15 — Public QR landing | Public verification API and README guidance. Dedicated public verification route/screen and real QR scan validation remain. |
| 16 — Admin shell, role switcher and RBAC UI | Role-aware navigation, demo role switcher, user list and permission matrix. Full role assignment form and route-level polish remain. |
| 17 — Analytics API | Demo KPIs, cohorts, distribution, heatmap and facilities metrics. Mongo aggregation repository and cache remain. |
| 18 — Analytics UI | KPI cards, cohorts, distribution bars, heatmap, filters and scenario switch. Full Recharts charts, animated sparklines and full accessible heatmap interactions remain. |
| 19 — Export to Excel and PDF | Permission-protected export request contract and audit entry. ExcelJS/Puppeteer file generation remains a placeholder. |
| 20 — Claims and compensations dashboard | Claims list, KPIs, search and compensation amounts. Detail drawer, pagination/sorting and richer timeline charts remain. |
| 21 — Security and audit log | Audit recording, filters, periodic refresh, table and action display. Cursor pagination, full proxy-aware IP capture and pause/resume controls remain. |
| 22 — Arabic/RTL, accessibility, PWA | Arabic translation scaffold, direction switching, responsive layout, focus styles, reduced-motion CSS and manifest. Full string translation, RTL audit, service worker/installable PWA and Lighthouse validation remain. |
| 23 — Testing and CI | Shared schema/fee/permission tests and GitHub Actions workflow scaffold. Full API integration and Playwright E2E suites remain. |
| 24 — Demo hardening and handover | Demo guide UI/API, reset endpoint, Docker compose, README and env docs. Full dependency audit, persistent seed scenarios and production security review remain. |

## Latest development pass

- Migrated auth registration, OTP verification, login, demo role switching, subscriber dashboard, profile save, and specialty/subscription selection to Mongoose when `CONNECT_MONGO=true`.
- MongoDB mode checks email/phone uniqueness, hashes passwords with Argon2, verifies hashes at login, records login timestamps, validates required professional identifiers, and writes audit records.
- The default in-memory demo mode remains available for a quick UI-only run. Payment/certificate/claims/bulk/analytics workflows are not yet fully migrated.

## Verification performed

- TypeScript/TSX source syntax transpilation check passed using the TypeScript compiler's transpile API. A subsequent full typecheck could not start because this runtime lacks installed Node type definitions; npm registry access remains unavailable.
- `npm install` could not complete because this environment could not access the npm registry. Therefore package typechecking, linting, tests and production builds were not executed here.

## Before production

Do not expose this demo publicly or use real subscriber, national ID, patient, payment, or claims data. Replace in-memory state, permissive demo auth, mock payment/SMS/storage, and placeholder PDF/export integrations; add integration/E2E tests; then run `npm run check` and `npm run build` in an environment with npm registry access.


## Latest development pass — payment and certificate lifecycle

- Added MongoDB-backed payment initiation tied to the subscriber's pending subscription; the server derives the amount from `Subscription.amountDue`.
- Added a shared settlement service for success/failure outcomes. Success activates the subscription and user, records payment time, and issues one certificate per subscription. Failure marks the payment failed.
- Added HMAC-SHA256 signature verification for webhook payloads, webhook-reference idempotency, and conflict handling for invalid state transitions.
- Migrated certificate listing and public QR-token verification to MongoDB mode; PDF generation is still explicitly a placeholder.
- Added unit tests for valid, tampered, malformed and wrong-length webhook signatures. Tests and full typecheck have not been run because project dependencies are not installed in this runtime.


## Latest development pass — bulk upload and completion flow

- Added XLS/XLSX/CSV file parsing via the `xlsx` dependency and a 5 MB / 5,000-row upload limit.
- Mongo mode persists bulk batch records, subscriber users/profiles, active subscriptions, paid bank-bulk payment records and queued SMS outbox messages.
- Completion links use cryptographically random URL-safe tokens; only SHA-256 token hashes are stored in the completion-token collection. Tokens expire after 72 hours. Mongo completion now atomically claims an unused, unexpired token to prevent two concurrent requests from consuming it, and releases the claim if user activation fails.
- Bulk-import failure handling now attempts compensating cleanup of newly created users, profiles, subscriptions, payments, completion tokens and outbox records before marking the batch failed. This reduces partial data but is not a substitute for a MongoDB transaction.
- The SMS inbox now requires authentication and bulk-upload permission in both database-backed and in-memory demo modes, avoiding public exposure of completion links. SMS delivery remains mocked; no provider worker is configured.
- Added unit tests for token format, hashing and 72-hour expiry alongside webhook signature tests. TypeScript syntax parsing and ZIP integrity are checked here; dependency-backed typecheck/build/tests still require installing dependencies.


## Latest development pass — transactional payment settlement

- Refactored Mongo-backed payment settlement to run payment, subscription, user activation, certificate issuance, and audit writes inside one MongoDB transaction. Errors roll back the entire settlement instead of leaving partially activated accounts.
- Kept duplicate webhook handling and unique certificate issuance inside the transaction boundary. HMAC signature validation now rejects malformed non-hex input before constant-time comparison.
- Added opt-in MongoDB integration tests for successful/idempotent settlement and rollback on payment-amount mismatch. Set `MONGO_TEST_URI` to an isolated MongoDB replica-set test database to run them; they skip when that variable is absent.
- Source syntax and ZIP integrity are checked locally. Dependency-backed typecheck/build/test execution remains unavailable until dependencies are installed; integration tests have not been executed in this environment.


## Latest development pass — API end-to-end test coverage

- Added a Supertest/Vitest API-level flow covering health and 404 response envelopes, authentication requirements, registration, OTP verification, login/session identity, professional profile save, specialty selection, payment initiation and successful settlement, certificate listing, and public certificate verification.
- Added a role-permission regression check proving a subscriber cannot access the protected SMS inbox.
- The new suite uses unique test email/phone values and the in-memory demo mode; MongoDB payment lifecycle integration tests remain separately gated by `MONGO_TEST_URI`.
- All 29 TypeScript/TSX files passed syntax transpilation. Runtime tests and full typecheck/build were not executed because workspace dependencies are not installed in this environment.
