# Iteration 21 — Swipe Deck Foundation (Catalog + UI + Events)
**Primary subagents:** journallink-swipe, journallink-mobile-ui  
**Support subagents:** journallink-db, journallink-qa, journallink-architect

## Goal
Add the Swipe tab:
- local cached media catalog
- swipe cards (like/dislike/neutral/super-like)
- store swipe events

## Implementation Requirements
### A) Catalog
- Ship a starter `swipe_catalog.json` locally (books/movies/podcasts/games/etc)
- DB table `swipe_media` + import on first run
- Include: type, title, image_url (or bundled), short_desc, tags_json, popularity_score

### B) Swipe UI
- Card with big image, title, subtitle, 1-line descriptor
- Buttons + gesture swipes
- Filter bar by media type

### C) Events
- Store `swipe_sessions` + `swipe_events`

## Acceptance Criteria
- User can swipe 100 cards without crashes.
- Filters work (Books only, Movies only).
- Events persist; restarting app keeps history.

## Verification Checklist
- Swipe 10 likes + 10 dislikes → verify db rows
- Apply filter → verify deck uses only that type
- Reopen app → continue where left off

## Commit
`feat(swipe): catalog + card ui + swipe events`
