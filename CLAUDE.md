# CLAUDE.md

This file is the highest-priority instruction artifact for agents working in this repository.

## 0) Authority + Priority

- Treat this document as the top implementation guide for day-to-day agent behavior in this repo.
- If instructions conflict, follow this order:
  1. Direct user/developer/system instructions in the active run
  2. This `CLAUDE.md`
  3. `docs/ARCHITECTURE.md`
  4. `docs/PRODUCT.md`
  5. `docs/ROADMAP.md`
  6. Iteration documents in `iterations/`

## 1) Product Baseline

JournalLink is a local-first Expo mobile app (iOS/Android primary) for capturing notes, media, and URLs, then browsing and refining a personal knowledge vault.

## 2) Non-Negotiable Defaults

- Local-first is the default: core capture, storage, and browse must work offline.
- Keep behavior deterministic and resumable for core ingestion paths.
- Favor additive, backward-compatible evolution over destructive redesigns.

## 3) AI Strategy (Primary Path)

- Cloud AI Gateway is the primary AI path for all users.
- Do not make BYOK or direct third-party provider credentials the main user flow.
- AI requests from app clients should use authenticated JournalLink gateway endpoints with minimized payloads.

## 4) OpenClaw Positioning

- OpenClaw integration is optional and additive only.
- OpenClaw must never become a core runtime dependency for baseline capture/browse/insight functionality.
- If OpenClaw is unavailable, all primary product flows should remain functional through standard local + gateway paths.

## 5) Data + Schema Direction

- Preserve local SQLite + local file storage as the source of truth on device.
- Use additive migrations, maintain compatibility with existing user data, and avoid destructive schema changes without explicit migration strategy.
- Keep repositories and storage access patterns explicit, typed, and testable.

## 6) Emergent Intelligence Model

- Tags and themes are emergent per-user artifacts, not globally fixed taxonomy requirements.
- Prefer user-specific relevance over one-size-fits-all categorization.
- Keep confidence/scoring transparent where surfaced, and avoid implying objective finality for inferred labels.

## 7) Ingestion Pipeline Requirements

- Maintain staged ingestion that can be resumed safely (detect → normalize → extract → tag → theme refresh → ready).
- Scratch/capture save should be immediate; enrichment may complete asynchronously.
- Failures in later enrichment stages must not destroy successfully captured source data.

## 8) URL Ingestion Quality Bar

When ingesting URLs, quality must meet all of the following:

- Canonicalization: normalize and de-duplicate URL forms safely.
- Metadata completeness: attempt title, description, source/domain, and content-type extraction.
- Content usefulness: prefer meaningful cleaned text/summary candidates over boilerplate.
- Provenance traceability: preserve source URL and extraction timestamps.
- Robust fallback behavior: if deep extraction fails, store minimally useful metadata and keep the item usable.

## 9) Sync, Privacy, and Consent Guardrails

- Explicit user consent must gate any sharing/comparison action.
- Practice strict minimization: share only what is necessary for the selected feature.
- Avoid logging raw private content in diagnostic logs.
- Keep user-visible transparency for what was shared and why.

## 10) Security + Reliability Expectations

- Do not persist secrets in plaintext.
- Prefer short-lived tokens and scoped credentials.
- Validate AI response schemas before rendering user-facing insight payloads.
- Provide graceful degradation when network/gateway services are unavailable.

## 11) App Architecture Expectations

- Expo Router remains the standard navigation approach.
- Keep module boundaries clear (capture, storage, ingest, AI client, sync/consent, UI state).
- Introduce heavy native dependencies only when roadmap-justified and operationally maintainable.

## 12) Coding Standards

- TypeScript strict mode; avoid `any` unless narrowly justified.
- Keep changes iteration-sized with clear intent.
- Prefer explicit logic over opaque heuristics in core flows.
- Update tests and migrations alongside behavior/schema changes.

## 13) Required Validation / Smoke Checks

Run these checks for relevant changes:

1. `npx expo lint`
2. `npx tsc --noEmit`
3. `npx expo export --platform web` (sanity build)
4. Targeted runtime smoke checks for touched flows (capture, ingestion, vault, AI insights, sync/consent as applicable)

If an environment limitation blocks a check, report it explicitly with reason.

## 14) Delivery Expectations for Agents

- Keep commits focused and reviewable.
- Document behavior changes and any follow-up work clearly.
- Do not reintroduce deprecated design sections or legacy terminology that conflicts with this document.

---
END OF CLAUDE.md
