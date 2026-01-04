# Iteration 26 — Insights UI: History, Cards, Evidence Drilldown
**Primary subagents:** journallink-mobile-ui  
**Support subagents:** journallink-db, journallink-qa, journallink-architect

## Goal
Make insights usable and reviewable:
- list past sessions
- open session card
- drill into evidence and see what drove the insight
- export/share *insight summary only* (optional)

## Implementation Requirements
### A) Insights tab
- Session list grouped by date
- Each session shows:
  - mode
  - provider (local/cloud)
  - topic count
  - createdAt

### B) Insight Card
- Render schema sections with nice UI
- “Evidence” button per entry: shows referenced items

### C) Safety
- Do not display raw capsule payload by default
- Evidence opens local items only

## Acceptance Criteria
- User can revisit any session.
- Evidence drilldown works and is fast.
- No crashes on empty history.

## Verification Checklist
- Create 2 sessions → both show in list
- Open session → open evidence item
- Delete session (optional) → removed from list

## Commit
`feat(insights): session history + cards + evidence drilldown`
