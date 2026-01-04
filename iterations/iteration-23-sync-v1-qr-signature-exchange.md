# Iteration 23 — Sync v1: QR Pairing + Signature Exchange
**Primary subagents:** journallink-sync, journallink-mobile-ui  
**Support subagents:** journallink-db, journallink-qa, journallink-architect

## Goal
Implement an “in-person” sync baseline that is shippable now:
- QR pairing
- exchange minimal signatures (no raw vault)
- prepare for Consent + Capsule steps

## Implementation Requirements
### A) Signature
- Local “signature” object:
  - top tags/themes
  - swipe summary stats
  - recent topics
- Store locally, regenerate on demand

### B) QR flow
- Device A shows QR containing ephemeral session payload (short-lived token + summary)
- Device B scans and imports signature
- Store imported signature under a “pending session”

### C) UI
- Sync tab: “Show QR” + “Scan QR”
- Status & error handling

## Acceptance Criteria
- Two devices can exchange signatures.
- No sensitive text is shared yet.
- Pending session appears in Insights list as “Awaiting consent”.

## Verification Checklist
- Create signature on device A → scan on device B
- Verify signature contents are summaries only
- Restart app → pending session persists

## Commit
`feat(sync): qr pairing + signature exchange`
