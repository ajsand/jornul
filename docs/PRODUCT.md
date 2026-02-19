# JournalLink Product Vision

JournalLink is a private, local-first journal + media vault that helps two people compare their "profiles" (built from journals + saved media) to generate conversation-ready insights. By default, everything is stored locally. Cloud AI is optional and opt-in per session.

## Core Philosophy

1. **Local-first, always** - Your data never leaves your device unless you explicitly consent
2. **Emergent over prescribed** - Tags emerge from your content, not a preset list
3. **Minimal friction** - Capture should be instant, browsing should be fast
4. **Consent at every step** - Sync requires explicit, granular consent

## User Modes

### Solo Mode (Default)
- Capture media (text, links, images, PDFs, audio, video)
- Auto-tag with emergent tags (no preset categories)
- Browse and search your vault
- Build your profile through swipe signals

### Compare Mode (In-Person)
- Pair with another JournalLink user via QR or BLE
- Select "Friend" or "Heart" mode
- Choose topic scopes to compare
- Consent gate: select exactly what to share
- Generate Insight Card (conversation starters)

## Core User Flows

### 1. Scratch Capture (Zero-Friction Add)
**Input:** Pasted text/URL, photo, or file
**Output:** Item in Inbox, auto-tagged

Flow:
1. User opens app → lands on Inbox
2. Pastes content OR picks file
3. App detects type, stores file, extracts metadata
4. Auto-tagger suggests emergent tags
5. User can accept/edit tags or skip (processed in background)
6. Item moves to Vault

### 2. Mass Upload
**Input:** Multiple files selected from device
**Output:** Batch of items in processing queue

Flow:
1. User navigates to Import
2. Selects multiple files
3. App shows progress for each file
4. Each file becomes an IngestItem → MediaItem
5. Auto-tagging runs in background
6. All items appear in Vault when ready

### 3. Vault Browsing
**Input:** User wants to find past content
**Output:** Filtered, searchable list

Flow:
1. User opens Library tab
2. Can filter by: type, date range, tags, source
3. Can search by title/text content
4. Tap item → full detail view
5. Can edit tags, add notes, delete

### 4. Swipe Deck (Profile Building)
**Input:** Items from vault
**Output:** Like/dislike signals that build profile

Flow:
1. User opens Swipe Deck
2. Sees cards of their content
3. Swipe right = like, left = dislike
4. Signals recorded with optional category
5. Profile signature updated

### 5. Compare Session (In-Person Sync)
**Input:** Two devices, user consent
**Output:** Insight Card with conversation starters

Flow:
1. Both users open Sync tab
2. One user generates QR code with compressed signature
3. Other user scans QR (or BLE discovery)
4. Both see pairing confirmation
5. Each user selects:
   - Mode: Friend or Heart
   - Scope: Which tags/topics to compare
   - Share level: Title only, snippet, or full
6. Consent gate: Review exactly what will be shared
7. Signatures exchanged (minimized Compare Capsule)
8. If cloud AI enabled: Send capsule to provider
9. Else: Local mock insights
10. Display Insight Card

## Privacy Defaults

| Setting | Default | Notes |
|---------|---------|-------|
| Storage | Local only | SQLite + filesystem |
| Cloud AI | Off | Must explicitly enable |
| BLE Advertising | Off | User must start sync |
| Share level | Title only | Most restrictive default |
| Log content | Never | No raw text in console |

## Cloud AI (Opt-In)

When enabled for a Compare Session:
1. User provides their own API key (stored in SecureStore)
2. Compare Capsule is built (minimized, redacted)
3. Clear disclosure: "This will send the following to [Provider]..."
4. User confirms
5. Request sent, Insight received
6. Raw capsule never stored on cloud

Supported providers (planned):
- OpenAI (GPT-4)
- Anthropic (Claude)
- Google (Gemini)

## Data Model Summary

### MediaItem (Core)
- id, type, title, source_url, local_uri
- notes, extracted_text, metadata_json
- timestamps

### Tags (Emergent)
- No preset list
- Created from: auto-tagger, user input
- Confidence score from ML/heuristics
- Source tracking (heuristic, ml, user)

### SwipeSignal (Profile)
- Direction: like/dislike
- Optional category
- Used to build signature

### CompareSession (Sync)
- Mode: friend/heart
- Scope filters
- Items shared with share_level
- Provider used (if cloud)

## UI Principles

1. **Dark mode first** - Deep purple primary, amber accent
2. **Bottom tabs** - Inbox, Library, Add, Sync, Settings
3. **Card-based** - Items as cards, swipe interactions
4. **Minimal chrome** - Let content shine
5. **Haptic feedback** - Confirm actions physically

## Success Metrics (Future)

- Time to capture: < 3 seconds
- Library load time: < 500ms for 1000 items
- Sync pairing: < 10 seconds
- Insight generation: < 5 seconds (cloud)
