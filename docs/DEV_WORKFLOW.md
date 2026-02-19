# Development Workflow

This workflow is aligned with `docs/ARCHITECTURE.md` and intended for iterative, architecture-safe development.

## 1) Local Setup

```bash
npm install --legacy-peer-deps
npm run dev
```

Run targets:
- `i` for iOS simulator (macOS)
- `a` for Android emulator
- `w` for web

## 2) Default Engineering Loop

1. Confirm the intended change aligns with architecture/product docs.
2. Implement a small, testable slice.
3. Run quality checks.
4. Update docs when behavior/contracts change.

Required checks before merge:

```bash
npm run lint
npm run typecheck
npm run test
```

Optional sanity:

```bash
npm run verify
npm run build:web
```

## 3) Architectural Guardrails

- Keep core flows local-first and offline-capable.
- Treat ingest as deterministic/resumable stages.
- Keep QR signature exchange as baseline sync transport.
- Require explicit consent before compare/cloud operations.
- Route cloud AI calls through first-party gateway boundaries only.
- Avoid logging raw user/private content.

## 4) Where to Add Code

- `app/` — screens and navigation
- `components/` — reusable UI
- `lib/storage/` — schema, migrations, repositories
- `lib/ingest/` + `lib/services/` — ingest/jobs/AETS/swipe logic
- `lib/sync/` — signatures/session transport helpers
- `lib/store/` — Zustand state

## 5) Data and Migration Rules

- Prefer additive migrations over destructive schema changes.
- Keep repository functions and types in sync with schema updates.
- Add or update tests for migration/repository behavior whenever data contracts change.

## 6) Release Readiness (Developer Gate)

Before shipping a feature branch:

- Lint/type/test pass.
- No architecture violations against `docs/ARCHITECTURE.md`.
- Any privacy-sensitive flow reviewed for minimization and consent.
- Any new docs live under `docs/` and replace one-off root markdown notes.
