# JournalLink Roadmap (Iterations 07-26)

## Completed (Pre-07)

- [x] **Iter-01**: Data layer foundation (SQLite schema v0)
- [x] **Iter-02**: Quick Add (paste URL/text)
- [x] **Iter-03**: Library (browse + basic list)
- [x] **Iter-04**: Item Detail (view/edit)
- [x] **Iter-05**: Mass Import (multi-file picker)
- [x] **Iter-06**: File storage normalization

---

## Foundation Phase (07-08)

### Iter-07: Baseline Verification + Docs Scaffold
**Goal:** Lock the foundation before building features

**Acceptance Criteria:**
- [ ] Package manager detected, deps install cleanly
- [ ] TypeScript compiles without errors
- [ ] Lint passes (errors, not warnings)
- [ ] App boots on at least one platform
- [ ] Expo Router structure confirmed (app/, _layout.tsx, tabs)
- [ ] docs/STATUS.md created with current state report
- [ ] docs/PRODUCT.md complete with user flows
- [ ] docs/ARCHITECTURE.md complete with pipelines
- [ ] docs/ROADMAP.md complete (this file)
- [ ] docs/PRIVACY.md created
- [ ] docs/DEFINITION_OF_DONE.md created
- [ ] docs/DEV_WORKFLOW.md created

---

### Iter-08: SQLite Schema v1 + Migrations + Repository
**Goal:** Finalize database schema for MVP

**Acceptance Criteria:**
- [ ] Migration version 3+ with any schema refinements
- [ ] All repository functions have TypeScript types
- [ ] CRUD operations for all tables tested
- [ ] Index coverage for common queries
- [ ] `testDatabase()` function updated and passing
- [ ] README in lib/storage/ updated

---

## Capture Phase (09-11)

### Iter-09: Scratch Capture v1 (Paste & Save)
**Goal:** Zero-friction capture on Inbox tab

**Acceptance Criteria:**
- [ ] Inbox has text input with paste detection
- [ ] URL detection auto-classifies as 'url' type
- [ ] Plain text saved as 'text' type
- [ ] Ingest queue item created with 'pending' status
- [ ] Processor moves to 'ready' within 2 seconds
- [ ] UI shows success feedback
- [ ] Item appears in Library immediately

---

### Iter-10: Inbox Jobs UI + Pipeline Skeleton
**Goal:** Show processing states in Inbox

**Acceptance Criteria:**
- [ ] Inbox shows pending/processing/ready/failed items
- [ ] Failed items show error message
- [ ] Retry button for failed items
- [ ] Clear completed items button
- [ ] Ingest processor runs in background
- [ ] Progress indicator during processing

---

### Iter-11: Mass Upload v1 (Multi-Select + Batch Jobs)
**Goal:** Import multiple files with batch processing

**Acceptance Criteria:**
- [ ] Document picker allows multi-select
- [ ] Each file creates an ingest queue item
- [ ] Batch progress UI shows per-file status
- [ ] Supported types: image, pdf, audio, video
- [ ] Files copied to app documents directory
- [ ] All items appear in Library when complete

---

## Browse Phase (12)

### Iter-12: Vault Browsing v1 (Fast Filters)
**Goal:** Find content quickly with filters

**Acceptance Criteria:**
- [ ] Filter by type (text, url, image, pdf, audio, video)
- [ ] Filter by date range (today, week, month, custom)
- [ ] Filter by source (pasted, imported, shared)
- [ ] Filters combinable (AND logic)
- [ ] Filter UI is collapsible
- [ ] Results update instantly
- [ ] Empty state when no matches

---

## Tagging Phase (13-14)

### Iter-13: Emergent Tags v1 (No Preset Tags)
**Goal:** Tags emerge from content, per-user universe

**Acceptance Criteria:**
- [ ] No preset tag list shipped with app
- [ ] User can create tags manually
- [ ] Tags are per-device (not synced)
- [ ] Tag autocomplete in item detail
- [ ] Tag chips display in library list
- [ ] Filter by tag in library
- [ ] Tag management screen (rename, merge, delete)

---

### Iter-14: Auto-Tag Pipeline Wiring (AETS v1)
**Goal:** Connect Scratch and Mass Upload to auto-tagger

**Acceptance Criteria:**
- [ ] Heuristic tagger extracts keywords from title
- [ ] URL host becomes suggested tag
- [ ] File extension becomes suggested tag
- [ ] Tags saved with source='heuristic', confidence score
- [ ] User can accept/reject suggested tags
- [ ] Rejected tags reduce future confidence
- [ ] Accepted tags increase future confidence

---

## Search Phase (15)

### Iter-15: Search v1 (FTS + Tag Facets)
**Goal:** Full-text search with tag faceting

**Acceptance Criteria:**
- [ ] SQLite FTS5 table for searchable content
- [ ] Search box in Library header
- [ ] Results ranked by relevance
- [ ] Search highlights in results
- [ ] Tag facets in search results
- [ ] Click facet to filter by tag
- [ ] Search history (last 5 queries)

---

## Profile Phase (16-17)

### Iter-16: Swipe Deck v1 (Catalog + Swipe Events)
**Goal:** Card-based swipe UI for profile building

**Acceptance Criteria:**
- [ ] New Swipe tab or screen
- [ ] Cards show item title/thumbnail
- [ ] Swipe right = like, left = dislike
- [ ] Swipe signals saved to database
- [ ] Optional category selection per swipe
- [ ] Undo last swipe button
- [ ] Progress indicator (items swiped / total)

---

### Iter-17: Swipe Ranking v1 (Balanced Exploration)
**Goal:** Smart card ordering for swipe deck

**Acceptance Criteria:**
- [ ] Prioritize unswept items
- [ ] Diversify by type and tag
- [ ] Weight recent items higher
- [ ] Avoid showing same items repeatedly
- [ ] Skip items with all-reject history
- [ ] Algorithm documented

---

## Embeddings Phase (18-19)

### Iter-18: On-Device Embeddings (Dev Build + Feature Flag)
**Goal:** Enable ONNX runtime for development builds

**Acceptance Criteria:**
- [ ] onnxruntime-react-native linked properly
- [ ] Feature flag for embedding generation
- [ ] Basic embedding model loaded (.onnx file)
- [ ] embed() function produces real vectors
- [ ] Embeddings stored in metadata_json
- [ ] Dev build required (not Expo Go)

---

### Iter-19: Themes View (Tag Clusters) + Tag Merge UX
**Goal:** Visualize tag clusters and allow merging

**Acceptance Criteria:**
- [ ] Themes screen shows tag clusters
- [ ] Clusters based on co-occurrence or embedding similarity
- [ ] Tap cluster to see items
- [ ] Merge similar tags UI
- [ ] Bulk tag operations (rename across items)
- [ ] Orphan tag cleanup

---

## Sync Phase (20-21)

### Iter-20: Sync v1 (QR Handshake + Signature Exchange)
**Goal:** In-person pairing via QR code

**Acceptance Criteria:**
- [ ] Generate QR code with compressed signature
- [ ] Scan QR code with camera
- [ ] Decode and validate signature
- [ ] Show pairing confirmation UI
- [ ] Exchange signatures after confirmation
- [ ] BLE fallback (if available)
- [ ] Handle scan failures gracefully

---

### Iter-21: Consent + Compare Capsule Builder
**Goal:** Privacy-preserving data sharing

**Acceptance Criteria:**
- [ ] Consent gate UI before sharing
- [ ] Mode selection: Friend / Heart
- [ ] Scope selection: which tags to compare
- [ ] Item selection: which items to include
- [ ] Share level per item: title / snippet / full
- [ ] Capsule minimization applied
- [ ] PII redaction applied
- [ ] Preview what will be shared

---

## AI Phase (22-23)

### Iter-22: Cloud AI Adapters + Insight JSON Schema
**Goal:** Connect to cloud AI providers

**Acceptance Criteria:**
- [ ] Provider adapter interface defined
- [ ] OpenAI adapter implemented
- [ ] Claude adapter implemented
- [ ] Gemini adapter implemented
- [ ] API key storage in SecureStore
- [ ] Insight JSON schema defined and validated
- [ ] Error handling for API failures
- [ ] Rate limiting / retry logic

---

### Iter-23: Insights UI + Evidence Mapping + Session History
**Goal:** Display AI insights with evidence

**Acceptance Criteria:**
- [ ] Insight Card component renders JSON schema
- [ ] Shared tags highlighted
- [ ] Unique tags shown
- [ ] Conversation starters displayed
- [ ] AI-generated insights (if enabled)
- [ ] Evidence links to source items
- [ ] Session saved to history
- [ ] Session history browsable

---

## Integration Phase (24)

### Iter-24: Share-to-App Ingestion
**Goal:** Accept shared content from other apps

**Acceptance Criteria:**
- [ ] Deep link handling for URLs
- [ ] Share intent handler (Android)
- [ ] Share extension (iOS) - may be post-MVP
- [ ] Shared content routes to Inbox
- [ ] Background processing for shares
- [ ] Notification when processing complete

---

## Production Phase (25-26)

### Iter-25: Production Readiness Pass
**Goal:** Prepare for app store submission

**Acceptance Criteria:**
- [ ] EAS build configured (iOS + Android)
- [ ] App icons at all sizes
- [ ] Splash screen configured
- [ ] OTA updates configured
- [ ] Crash reporting (Sentry or similar)
- [ ] Performance profiling complete
- [ ] Memory leaks fixed
- [ ] Bundle size optimized

---

### Iter-26: Store Submission Checklist + Hardening
**Goal:** Submit to App Store and Play Store

**Acceptance Criteria:**
- [ ] Privacy policy URL
- [ ] Terms of service URL
- [ ] App Store screenshots
- [ ] Play Store screenshots
- [ ] App Store description
- [ ] Play Store description
- [ ] Age rating questionnaire
- [ ] Data safety form (Play Store)
- [ ] App privacy details (App Store)
- [ ] TestFlight / Internal testing
- [ ] Full QA regression pass
- [ ] Accessibility audit
- [ ] Submit for review

---

## Post-MVP (Future)

- [ ] Advanced ML clustering (topic detection)
- [ ] Multi-device sync (peer-to-peer)
- [ ] Calendar integration (journal by date)
- [ ] Photo OCR (text from images)
- [ ] Audio transcription
- [ ] Widget support (iOS/Android)
- [ ] Apple Watch / Wear OS companion
- [ ] Export vault (encrypted backup)
- [ ] Import from other apps
