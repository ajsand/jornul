# Iteration 31 — True Share Intake (Dev Build): iOS Share Extension + Android Share Intent
**Primary subagents:** journallink-ingest, journallink-release  
**Support subagents:** journallink-mobile-ui, journallink-architect, journallink-qa

## Goal
Enable sharing *into* JournalLink from other apps (URLs, text, images), via dev-build/native config.

## Important Constraint
Expo’s `expo-sharing` cannot receive shares into your app. You need native share extension / intent handling. :contentReference[oaicite:5]{index=5}

## Implementation Requirements
- Choose approach:
  - config plugin + prebuild
  - or adopt a known share extension approach compatible with your Expo SDK
- Ingest shared payload into Scratch Inbox as a new item.
- Add “Share Intake Debug” screen to verify payload parsing.

## Acceptance Criteria
- Share URL from Safari/Chrome → appears in Inbox with enrichment pipeline.
- Share image → saved and tagged.
- Works on both platforms in dev build.

## Commit
`feat(share): native share intake wired into ingest pipeline`
