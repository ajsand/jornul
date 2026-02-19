# JournalLink Product Vision (Updated)

JournalLink is a private, **local-first** journal + media vault. Users capture anything quickly, browse their vault, build preference signals via swipe, and optionally run in-person compare insights with explicit consent.

## Core Principles

1. **Local-first by default**: core capture/browse/search work offline.
2. **AI for all users**: cloud AI runs through JournalLink Cloud AI Gateway (no BYOK required).
3. **Consent + minimization**: only minimized compare capsules can be sent to cloud.
4. **Fast capture everywhere**: Scratch for in-app speed; native share intake for cross-app capture.

## Primary User Flows

### 1) Scratch / Inbox Capture
- Paste URL(s), type notes, attach files
- Save immediately
- Ingestion/enrichment continues in background

### 2) Vault Browsing
- Facets: media type, tags/themes, date range, source
- Search: keyword first; semantic later
- Item detail: previews, extracted text, tags, edit/export

### 3) Swipe Deck
- Like / dislike / neutral / super-like
- Builds preference profile and reinforces emergent tags/themes

### 4) In-person Sync + Insights
- QR signature exchange
- Consent step (Friend/Heart/Custom topic, sensitive defaults OFF)
- Compare capsule built locally
- Insights generated locally or via gateway

## AI Model

- Baseline: local heuristic fallback insights (always available)
- Preferred quality: Cloud AI Gateway with schema-validated output
- Gateway handles provider routing, quota, safety/minimization checks

## Non-goals (for core app)

- Requiring end users to enter raw OpenAI/Gemini/Claude keys
- Making BLE/P2P transport a launch dependency
- Making OpenClaw a hard runtime dependency

## Optional Add-on

OpenClaw integration is additive and later-phase only:
- Save Bot (chat/desktop intake)
- BYO agent hub mode for power users
