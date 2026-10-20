# Developer notes

## API response envelope

Successful responses use `{ success: true, data, error: null }`; error responses use `{ success: false, data: null, error: { code, message, details? } }`.

## Role switcher

`POST /api/v1/auth/demo/switch-role` accepts `{ "role": "finance_admin" }` while `DEMO_MODE=true`. It returns an access token for a seeded role account. This route is intentionally hidden when demo mode is disabled and is not a substitute for production identity administration.

## Test data

The UI starts with an in-memory registry. Seeded user emails follow the role name, e.g. `super_admin@mlrf.demo`, `finance_admin@mlrf.demo`, `inspector@mlrf.demo`, and `subscriber@mlrf.demo`. The demo UI lets you switch roles directly.
