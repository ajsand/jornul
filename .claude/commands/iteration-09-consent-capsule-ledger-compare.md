# Iteration 09 — Consent + Capsule Builder + Compare Request Ledgering

## Why this iteration exists
Implement strict minimization and user-governed consent before any compare/insight action leaves device.

## Architecture alignment (must honor)
- Consent gate precedes compare request.
- Capsule is minimized and inspectable.
- Ledger stores metadata only (no raw shared private payload).

## Claude Opus 4.5 implementation contract
1. Build consent UX that is explicit, revocable, and auditable.
2. Enforce minimization rules in code, not just UI copy.
3. Ensure sensitive defaults are protective.

## Scope
### 1) Consent policy engine
- Select scope (tags/themes/time range/item types).
- Sensitive content defaults OFF by default.
- Optional cloud compare toggle with explicit explanation.

### 2) Capsule builder
- Build minimized capsule from selected scope.
- Show preview with counts/types and representative excerpts rules.
- Add validation to block oversized/non-minimized requests.

### 3) Compare session persistence
- Store compare request metadata in `compare_sessions`.
- Store metadata-only shared-action entries in `session_ledger`.

### 4) UX + trust signals
- “What will be shared” screen before confirmation.
- “What was shared” history after completion.

## Acceptance criteria
- No compare request can be sent without explicit consent confirmation.
- Ledger never stores raw private body payload.
- Users can inspect and understand sharing scope.

## Verification checklist
- tests for capsule minimization + policy enforcement
- tests validating ledger redaction rules
- manual consent flow walkthrough
- `npx expo lint`
- `npx tsc --noEmit`

## Deliverables
- Enforced consent-and-minimization compare flow.
