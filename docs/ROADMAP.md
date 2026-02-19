# JournalLink Roadmap (Aligned to Updated Architecture)

## Guiding Sequence

1. Stabilize core screens and local data flows
2. Finalize deterministic ingest pipeline + status UX
3. Improve AETS tag quality + tag management
4. Integrate Cloud AI Gateway for enrichment and insights
5. Build swipe catalog/ranking loops
6. Harden QR sync + consent + capsule minimization
7. Add native share intake via dev builds
8. Release hardening + store compliance

## Iteration Mapping (Current files)

- Iteration 17: smart link ingestion
- Iteration 18: AETS noun-phrase quality
- Iteration 19: Scratch + bulk import + Inbox jobs
- Iteration 20: Vault filters/search
- Iteration 21: Swipe deck foundation
- Iteration 22: Swipe ranking/profile reinforcement
- Iteration 23: QR signature exchange
- Iteration 24: consent + capsule builder
- Iteration 25: gateway-backed insights + schema validation
- Iteration 26: insights UI/history/evidence
- Iteration 27: security/privacy controls
- Iteration 28: settings for gateway account/privacy/usage controls
- Iteration 29: polish/a11y/perf
- Iteration 30: release + EAS/store preflight
- Iteration 31: share intake (iOS extension / Android intent)
- Iteration 32: optional integrations (OpenClaw connectors), not core transport rewrite

## Explicit Product Decisions

- QR sync remains baseline; avoid blocking on BLE/P2P.
- BYOK provider setup is not required in the primary user journey.
- Cloud AI is provided by JournalLink Gateway with subscription controls.
- OpenClaw is optional and additive only.
