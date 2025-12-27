# Roadmap (Iteration Plan)

## Completed
- [x] Iter-01: Data layer (SQLite schema + repos)
- [x] Iter-02: Quick Add (paste URL/text)
- [x] Iter-03: Library (browse + search + sort)
- [x] Iter-04: Item Detail (tags + notes)
- [x] Iter-05: Mass import (files)
- [x] Iter-06: Local file storage normalization

## Current
- [ ] **Iter-07: Baseline hardening + architecture truth source** (this iteration)
  - Create/update `ARCHITECTURE.md`, `ROADMAP.md`, `QA.md`
  - Add package.json scripts: lint, typecheck, test
  - Add AppHealth debug panel (DB status, counts, build mode)

## Upcoming (Iterations 08-20)

### Core Features
- [ ] **Iter-08: Dynamic tags v1 (heuristics + feedback)**
  - Keyword extraction from title, text, URL host
  - Tag confidence scoring
  - User feedback loop (accept/reject/edit)

- [ ] **Iter-09: Tag Browser + Library filters**
  - Tag cloud view
  - Filter library by multiple tags (AND/OR)
  - Sort by tag usage, date, confidence

- [ ] **Iter-10: Inbox scratchpad capture UX**
  - Quick text capture without leaving inbox
  - Auto-save drafts
  - Batch processing (tag multiple items at once)

- [ ] **Iter-11: Inbound share intent handler**
  - Accept shared URLs/text from other apps
  - Auto-route to inbox
  - Background processing

### Profile & Swipe Features
- [ ] **Iter-12: Swipe Builder v1 (like/dislike signals)**
  - Card-based swipe UI for items
  - Record swipe_signals to DB
  - Category assignment (optional)

- [ ] **Iter-13: Swipe feed ranking v1**
  - Prioritize unswiped items
  - Weight by recency, tag diversity
  - Simple scoring algorithm

- [ ] **Iter-14: Profile signature v1**
  - Generate compressed signature from swipe signals
  - Tag frequency vector
  - Export for BLE advertising

### Sync & Compare Features
- [ ] **Iter-15: Compare Session v1 (pairing + consent)**
  - BLE discovery + handshake
  - QR code fallback mode
  - Explicit consent UI before sharing

- [ ] **Iter-16: Insight Card renderer v1 (local mock)**
  - Display common/unique tags
  - Conversation starter suggestions
  - Mock AI-generated insights

- [ ] **Iter-17: Cloud orchestrator v1 (optional providers)**
  - Adapter pattern for OpenAI, Gemini, Claude
  - API key storage in SecureStore
  - Privacy disclosures + opt-in flow

- [ ] **Iter-18: Session ledger + privacy UI**
  - History of all compare sessions
  - View shared items per session
  - Revoke/delete session data

### Export & Production
- [ ] **Iter-19: Export/Import vault (encrypted)**
  - Export all data to encrypted JSON/SQLite file
  - Import from backup
  - Cloud storage upload (optional)

- [ ] **Iter-20: Release hardening**
  - Crash reporting (Sentry or similar)
  - Full QA regression pass
  - EAS build/submit/OTA update setup
  - Performance profiling
  - Accessibility audit

## Future (Post-MVP)
- On-device ML embeddings (ONNX runtime)
- Advanced AI clustering (topic detection)
- Multi-device sync (peer-to-peer)
- Calendar integration (journal entries by date)
- Photo OCR + audio transcription
- Widget support (iOS/Android home screen)
