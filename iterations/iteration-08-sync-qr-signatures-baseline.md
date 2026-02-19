# Iteration 08 — Sync v1: QR Signature Exchange + Compare Session Bootstrap

## Why this iteration exists
Establish reliable in-person compare initiation using QR as baseline transport.

## Architecture alignment (must honor)
- QR exchange is required baseline.
- Signatures are summary-only.
- No compare content exchange before explicit consent.

## Claude Opus 4.5 implementation contract
1. Prioritize robustness and clear user flows over protocol complexity.
2. Keep signature payload minimized and versioned.
3. Build for intermittent camera/network conditions.

## Scope
### 1) Signature model + serialization
- Define signature schema/versioning.
- Include non-sensitive summary metrics only.
- Add signing/verification helpers as required.

### 2) QR exchange UX
- Generate QR for local signature.
- Scan and validate peer signature.
- Handle expiration/version mismatch errors gracefully.

### 3) Pending session store
- Persist exchanged signatures into `pending_sessions`.
- Track session state transitions from discovered → pending consent.

### 4) Reliability hardening
- Retry-friendly exchange flow.
- Camera permission handling and fallback messaging.

## Acceptance criteria
- Two devices can complete signature exchange and create a pending session.
- Invalid/expired payloads are rejected with understandable errors.

## Verification checklist
- signature serialization tests
- QR flow manual tests
- `npx expo lint`
- `npx tsc --noEmit`

## Deliverables
- Stable QR-first compare session bootstrap.
