# QA Manual Checklist (Architecture-Aligned)

Use this checklist for release candidates and major feature merges.

## Pre-Flight

- [ ] App launches without crash
- [ ] Tab navigation works (Inbox/Scratch/Library/Swipe/Sync/Settings)
- [ ] No high-severity runtime errors in logs

## Core Local-First Flows

### Capture + Ingest
- [ ] Create a scratch note and confirm immediate local save
- [ ] Add URL/media and confirm item appears with ingest status
- [ ] Background enrichment transitions status to ready/failed deterministically

### Vault/Library
- [ ] List and detail views load with expected metadata
- [ ] Search/filter interactions return stable results
- [ ] Empty/loading/error states are understandable

### Swipe
- [ ] Session loads candidate items
- [ ] Like/dislike/neutral/super-like actions persist
- [ ] Ranking updates reflect prior preference signals

### Sync + Consent
- [ ] QR signature exchange can be initiated/completed
- [ ] Consent screen clearly shows scope/toggles
- [ ] Compare capsule preview is inspectable and minimized

## Cloud Boundary and Privacy

- [ ] App still functions in local-only mode without gateway
- [ ] Any cloud action is explicitly user-triggered and consented
- [ ] No raw private note/extraction content is logged
- [ ] Secrets/tokens are not stored in plaintext locations

## Regression Commands

```bash
npm run lint
npm run typecheck
npm run test
```

## Sign-Off

- [ ] Behavior matches `docs/ARCHITECTURE.md`
- [ ] Behavior matches `docs/PRODUCT.md`
- [ ] Any contract changes documented in `docs/`
