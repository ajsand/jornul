# Iteration 11 — Security, Privacy Controls, Settings, and Reliability Hardening

## Why this iteration exists
Finalize trust-critical controls before release: privacy defaults, secret handling, diagnostics hygiene, and resilience.

## Architecture alignment (must honor)
- No raw private content logging.
- No plaintext secret storage.
- Local-first behavior independent of gateway availability.

## Claude Opus 4.5 implementation contract
1. Treat privacy/security issues as release blockers.
2. Add automated checks where feasible.
3. Ensure settings map directly to enforceable behavior.

## Scope
### 1) Secret + credential handling
- Move secrets/tokens to secure storage mechanism.
- Rotate/expire transient credentials safely.

### 2) Logging and diagnostics hygiene
- Audit and remove raw-content logging paths.
- Add structured non-sensitive diagnostics for failures.

### 3) Settings UX completion
- Privacy controls (sharing scope defaults, cloud toggles).
- Account/subscription visibility for gateway usage.
- Usage counters and budget guardrails where applicable.

### 4) Resilience hardening
- Improve error boundaries and recovery flows.
- Ensure key journeys work in offline/degraded mode.
- Add migration/rollback safety checks.

## Acceptance criteria
- Security/privacy checklist passes with no critical findings.
- Settings are functional (not decorative) and persist correctly.
- App remains usable when gateway unavailable.

## Verification checklist
- Mandatory quality-gate commands (run and pass):
  - `npx expo lint`
  - `npx tsc --noEmit`
  - `npm test` (or the repository's equivalent test command)
- Iteration-specific automated tests called out in this document.
- Explicit smoke suite (must pass before sign-off):
  - Web (quick UI pass): create entry, delete entry, tag assignment, library filters/search, swipe decision updates, preference view updates.
  - Android emulator (core flows): create entry, delete entry, tag assignment, library filters/search, swipe decision updates, preference view updates.
  - iOS simulator (core flows): create entry, delete entry, tag assignment, library filters/search, swipe decision updates, preference view updates.
- Warning: Do not treat web success as production readiness for native capture/sync flows.
## Deliverables
- Release-candidate security/privacy posture and settings completeness.
