# JournalLink Architecture (MVP)

## Navigation (Expo Router)
- Tabs: Quick Add (Inbox), Library, Compare, Swipe Builder, Settings
- Each tab is a route group under app/(tabs)
- Root layout in app/_layout.tsx, tabs layout in app/(tabs)/_layout.tsx

## Storage
- SQLite (expo-sqlite): metadata + indexes
- Filesystem: blobs (images, pdfs, audio, video)
- SecureStore: API keys for cloud providers (optional)

## Data model (minimum)
- MediaItem: id, type, title, sourceUrl, localUri, createdAt, updatedAt, notes, extractedText (optional), metadataJson
- Tag: id, name, createdAt
- ItemTag: itemId, tagId, confidence, source (heuristic|ml|user), createdAt
- SwipeSignal: id, mediaRefId, direction (like|dislike), category, createdAt
- CompareSession: id, mode (friend|heart), scopeFilters, provider, createdAt
- CompareSessionItem: sessionId, itemId, shareLevel (title|snippet|full), createdAt

## Pipelines
### Ingest pipeline
Input: paste text/url OR picked files OR inbound share
Steps:
1) Normalize metadata (title, type, source)
2) Store file to app directory (if file)
3) Write MediaItem to SQLite
4) Auto-tag locally (v1 heuristics; optional v2 on-device ML)
5) Update Library + indexes

### Auto-tagging (dynamic, per-user)
- No preset tag list.
- v1: local heuristics keyword extraction (title/text/url host)
- User can accept/remove tags; feedback influences future suggestions.

### Compare Capsule (for cloud sessions)
- Build a minimized set of snippets + tag summaries
- Redact identifiers by default
- Send only with explicit consent

## Cloud AI (optional)
- Provider adapters: OpenAI/Gemini/Claude behind one interface
- Keys stored in SecureStore
- Strict JSON schema for Insight output
