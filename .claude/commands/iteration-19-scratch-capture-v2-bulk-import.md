# Iteration 19 — Scratch Capture v2 + Bulk Import + Inbox Jobs
**Primary subagents:** journallink-ingest, journallink-mobile-ui  
**Support subagents:** journallink-db, journallink-qa, journallink-architect

## Goal
Make capture seamless:
- Single “Scratch” entry point
- Paste text/links
- Attach multiple files (bulk) in one action
- Show background processing progress in Inbox

## Critical Note (Expo)
`expo-sharing` does NOT let other apps share *into* your app; receiving shares requires native share extension / intent work. For now, implement bulk import via pickers + later add true share intake via dev-build config/plugin. :contentReference[oaicite:4]{index=4}

## Implementation Requirements
### A) Scratch UX
- One screen with:
  - paste button
  - text area
  - attach button (multi-select)
  - save
- On save:
  - create item immediately
  - enqueue background jobs for each attached media

### B) Bulk import
- Allow selecting multiple images + pdfs + audio (as supported)
- Create one item per file OR a single “bundle item” with children (choose and justify)

### C) Inbox jobs
- Show items with statuses:
  - saved
  - enriching
  - tagging
  - failed (retry)

## Acceptance Criteria
- User can attach 10 files at once and see progress.
- No UI freezing; background jobs chunk work.
- Vault shows imported items; tags appear when ready.

## Verification Checklist
- Bulk import 10 images → verify all saved + statuses update
- Paste multi links + attach a pdf → all processed
- Kill app mid-job → app resumes safely

## Commit
`feat(capture): scratch v2 + bulk import + inbox job statuses`
