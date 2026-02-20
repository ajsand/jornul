# Iteration 08 — Sync v1: QR Session Exchange + Consent/Capsule Flow Bootstrap

## Why this iteration exists
Establish reliable in-person sync initiation using QR as baseline transport.

## Architecture alignment (must honor)
- Schema references must align with CLAUDE.md §6: `items`, `media_files`, `normalized_text`, `jobs`, `sync_sessions`, and `session_ledger`.
- QR exchange is required baseline.
- Sync session handshake payloads are summary-only.
- No compare content exchange before explicit consent.

## Claude Opus 4.5 implementation contract
1. Prioritize robustness and clear user flows over protocol complexity.
2. Keep sync handshake payload minimized and versioned.
3. Build for intermittent camera/network conditions.

## Scope
### 1) Sync handshake model + serialization
- Define sync handshake schema/versioning.
- Include non-sensitive summary metrics only.
- Add payload verification helpers as required.

### 2) QR exchange UX
- Generate QR for local sync handshake payload.
- Scan and validate peer handshake payload.
- Handle expiration/version mismatch errors gracefully.

### 3) Sync session store
- Persist exchanged handshake metadata into `sync_sessions`.
- Track session state transitions from discovered → consent pending → capsule ready.

### 4) Reliability hardening
- Retry-friendly exchange flow.
- Camera permission handling and fallback messaging.

## Acceptance criteria
- Two devices can complete QR exchange and create a `sync_sessions` record in consent-pending state.
- Invalid/expired payloads are rejected with understandable errors.

## Verification checklist
- sync handshake serialization tests
- QR flow manual tests
- `npx expo lint`
- `npx tsc --noEmit`

## Deliverables
- Stable QR-first sync session bootstrap for consent/capsule flow.
