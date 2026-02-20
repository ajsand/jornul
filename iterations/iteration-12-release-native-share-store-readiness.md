# Iteration 12 — Finalization: Native Share Intake + Release + App Store / Play Store Readiness

## Why this iteration exists
Complete production readiness: native share intake in dev/release builds, quality polish, compliance artifacts, and store submission readiness.

## Architecture alignment (must honor)
- Schema references must align with CLAUDE.md §6: `items`, `media_files`, `normalized_text`, `jobs`, `sync_sessions`, and `session_ledger`.
- Native share intake may require dev builds/config plugins.
- QR-first sync remains baseline.
- Cloud gateway is optional per action, not a hard dependency for core local usage.

## Claude Opus 4.5 implementation contract
1. Focus on shipping quality and compliance.
2. Resolve all P0/P1 defects before final sign-off.
3. Produce clear release artifacts and runbooks.

## Scope
### 1) Native share intake implementation
- iOS share extension and Android share intent pathway.
- Route incoming shared content into Scratch/import pipeline.
- Ensure robust handling of shared links/text/media_files.

### 2) UX polish + accessibility + performance
- Accessibility pass (labels, focus order, contrast, dynamic type).
- Startup, scrolling, and key interaction performance tuning.
- Resolve visual consistency gaps across screens.

### 3) Release engineering
- Configure EAS build profiles and signing.
- Production env config and secret injection.
- Crash/reporting + analytics (privacy-safe) readiness.

### 4) Store compliance and submission package
- App Store/Play Store metadata, screenshots, privacy labels.
- Data safety disclosures aligned with actual behavior.
- Final QA matrix across supported devices/OS versions.

### 5) Go-live playbook
- Final regression pass and release checklist.
- Rollout plan (staged if needed) and rollback strategy.
- Post-release monitoring checklist and ownership map.

## Acceptance criteria
- Dev and production builds succeed for iOS and Android.
- Native share intake works end-to-end on both platforms.
- Store submission packages are complete and compliant.
- Final QA sign-off grants production launch readiness.

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
- Production-ready application and complete store-release artifact set.
