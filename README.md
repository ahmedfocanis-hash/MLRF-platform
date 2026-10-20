# Medical Liability Risk Fund (MLRF) — MERN Demo

A bilingual-ready demonstration monorepo for the Medical Liability Risk Fund subscriber portal, inspector tools, and executive administration dashboard. It follows the supplied prompt pack's feature areas and role boundaries. **This is a demo/prototype, not production-ready insurance or payment software.** Fees, subscribers, claims, and certificates are fictional.

## Stack

- Node.js 20+ / npm workspaces / TypeScript strict mode
- Express API, Zod validation, JWT demo sessions, permission middleware
- React + Vite, TanStack Query, React Hook Form dependencies, Zustand-compatible architecture, Recharts-compatible dashboard
- Shared Zod schemas, roles, permission map, fee tiers, Egyptian governorates; Mongoose models, audit/subscription repository starters, and a durable MongoDB seed script
- Optional MongoDB replica-set Docker service; authentication, subscriber profile, specialty selection, and subscription handlers use MongoDB when `CONNECT_MONGO=true`, while other demo workflows still use in-memory state

## Quick start

```bash
cp .env.example .env
npm install
npm run dev
```

- Web: http://localhost:5173
- API health: http://localhost:4000/api/v1/health
- Demo guide API: http://localhost:4000/api/v1/dev/demo-guide
- Mock SMS inbox API: http://localhost:4000/api/v1/dev/sms-inbox

Use the role buttons on the login screen to create a demo session. In in-memory mode, demo login is intentionally permissive. With MongoDB enabled, seeded users use password `Demo123!` and Argon2 verification. Demo OTP is `123456`. Seeded staff emails include `super_admin@mlrf.demo`, `finance_admin@mlrf.demo`, `practitioner_analyst@mlrf.demo`, `facility_analyst@mlrf.demo`, `claims_admin@mlrf.demo`, and `inspector@mlrf.demo`.

## Docker MongoDB

```bash
docker compose up -d
```

This starts MongoDB as a single-node replica set. The API uses the in-memory demo registry by default. To enable database-backed auth, profiles, subscriptions, payments and certificates, set `CONNECT_MONGO=true` in `.env`, then restart the API. Run `npm run seed` once to create demo records. Payment initiation and simulated settlement use MongoDB; signed webhook events are checked with HMAC and idempotency references, and a successful payment activates the subscription and issues one certificate per subscription. Bank bulk batches, paid bank-bulk payment records, queued mock SMS messages and hashed, expiring, single-use profile-completion tokens are also Mongo-backed. Completion token claiming is atomic, and bulk-import errors trigger compensating cleanup; payment settlement uses MongoDB transactions when running against a replica set; integration tests are available when `MONGO_TEST_URI` points to an isolated replica-set test database. PDF rendering remains a placeholder; claims and analytics are not yet fully persistent.

## Available commands

```bash
npm run dev             # API + web concurrently
npm run build           # build all workspaces
npm run check           # lint + typecheck + tests
npm run seed            # deterministic-style local demo data seed
npm run seed:reset      # reset in-memory demo collections and seed again
npm run sample:bank-sheet # writes sample-bank-sheet.csv
```

The seed command connects directly to `MONGODB_URI` and upserts role permissions, specialty tiers, six staff/demo users, 2,500 subscriber users and profiles, 2,500 fiscal-year subscriptions, 120 payments, one certificate, 120 claims, and 300 audit entries. It is idempotent by stable identifiers. `seed:reset` clears the modeled collections before reseeding. With `CONNECT_MONGO=true`, registration, OTP verification, login, role switching, subscriber dashboard, profile save, tier/subscription selection, payment initiation/settlement, webhook processing, certificate listing and public certificate verification use MongoDB-backed models. Other routes still use demoStore or placeholders.

## Implemented demo workflows

- Subscriber: professional profile, entity type, governorate, specialty fee selection (server-side fee lookup), mock payment success/failure, certificate record and QR verification endpoint.
- Inspector: protected verification API, compliant visit, renewal notice, violation report, and audit history endpoints; responsive inspector UI with scenario shortcuts.
- Bank bulk: JSON row preview/commit plus multipart CSV/XLS/XLSX upload (`POST /api/v1/admin/bulk-batches/upload`, file field `file`), row validation, duplicate checks, persistent batch history, paid bank-bulk payment records, and queued mock SMS messages. Uploads are limited to 5 MB and 5,000 rows.
- Admin: role-aware navigation, API-side RBAC, KPI/cohort/distribution/heatmap data, claims ledger, audit stream polling, users and permission matrix, export request contract, reset/demo guide endpoints.
- Arabic translations scaffold, RTL document direction, light/dark themes, responsive layouts, keyboard focus states and reduced-motion handling.

## Important demo limitations

This build is a functional prototype and a foundation for the full spec, not a claim that every production integration is complete. In particular:

- Inspector, claims and analytics still use process memory or placeholders. Database-backed authentication, subscriber profile, subscription selection, payment settlement, webhook handling, certificates, bank bulk batches, completion tokens and SMS outbox are implemented behind `CONNECT_MONGO=true`; this is a partial migration, not a complete persistence layer.
- Demo login is intentionally permissive, and refresh is not a production refresh-token rotation implementation. Do not expose demo mode publicly.
- File upload now has a local-disk adapter with PDF/JPG/PNG magic-byte checks and a 5 MB limit, but private object storage, malware scanning, and persistence of document metadata are still required. Real OTP/SMS delivery (the outbox is queued only; no worker/provider sends messages), complete bank-gateway HMAC webhook orchestration, PDF rendering (Puppeteer), Excel/PDF exports, QR camera scanning, and Playwright E2E remain incomplete.
- Bulk import supports JSON rows and multipart CSV/XLS/XLSX uploads with basic column canonicalisation and validation. Before real use, add full schema reconciliation, downloadable error reports, stronger import idempotency and transactional database writes.
- A demo payment simulation endpoint is protected by a demo session; it is not a payment gateway.
- Do not use real national IDs, patient information, payment details, or confidential claims data.

## Environment variables

See `.env.example`. In a deployed environment, replace every secret, set `DEMO_MODE=false`, configure HTTPS and a strict CORS origin, and connect the API to a persistent MongoDB replica set. Secrets should be provided by the deployment environment, not committed to source control.

## Architecture map

- `apps/api/src/app.ts` — middleware, health check, error boundary
- `apps/api/src/routes/index.ts` — API contracts and endpoint composition (split by feature before production)
- `apps/api/src/middleware/auth.ts` — session verification and permission enforcement
- `apps/api/src/services/demoStore.ts` — demo-only in-memory repository replacement
- `apps/web/src/App.tsx` — feature screens and interactive demo workflows
- `apps/web/src/styles.css` — design system, responsive layout, RTL-compatible base, dark theme
- `packages/shared/src/index.ts` — shared enums, permission map, Zod schemas, fee tiers and governorates

## Prompt-pack scope

The uploaded source includes Prompt 0 and feature Prompts 1–24. This project establishes the monorepo and demonstrates the primary user journeys and API contracts. Items explicitly listed under demo limitations require production-grade completion to satisfy every detailed acceptance criterion in the prompt pack.


### Payment lifecycle integration tests

For an isolated MongoDB replica-set test database, set `MONGO_TEST_URI` and run `npm --workspace apps/api test`. The payment lifecycle integration suite checks idempotent successful settlement and verifies that amount-mismatch failures roll back payment, subscription, user, certificate, and audit writes. The suite is skipped when `MONGO_TEST_URI` is not set. Never point it at a database containing data you need to keep.


## Test coverage

The API workspace includes unit tests, a demo-mode Supertest end-to-end flow (`apps/api/src/__tests__/api.e2e.test.ts`), and optional MongoDB payment lifecycle integration tests enabled by `MONGO_TEST_URI`. The end-to-end suite exercises registration through certificate verification and checks protected-route authorization. Run `npm test --workspace apps/api` after installing dependencies. The MongoDB integration suite requires a disposable MongoDB replica set; do not point it at production data.
