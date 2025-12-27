# JournalLink Architecture

## Overview
JournalLink is a React Native (Expo SDK 53) mobile app for private, local-first journaling with proximity-based sync via BLE/QR codes. Users capture media, auto-tag it, and compare "profiles" with others to generate conversation insights.

## Folder Structure

```
Jornul/
├── app/                    # Expo Router pages (file-based routing)
│   ├── _layout.tsx        # Root layout with PaperProvider, theme
│   ├── (tabs)/            # Tab navigation group
│   │   ├── _layout.tsx    # Tab bar configuration
│   │   ├── index.tsx      # Inbox (quick capture)
│   │   ├── library.tsx    # Media library browser
│   │   ├── newitem.tsx    # Add new item (paste, capture)
│   │   ├── sync.tsx       # BLE/QR sync screen
│   │   └── settings.tsx   # Settings + debug panel
│   ├── item/[id].tsx      # Item detail view
│   ├── import.tsx         # Mass file import
│   └── +not-found.tsx     # 404 handler
├── lib/
│   ├── storage/           # SQLite database layer
│   │   ├── db.ts          # Main Database class (singleton)
│   │   ├── migrations.ts  # Schema migrations
│   │   ├── repository.ts  # CRUD operations
│   │   ├── types.ts       # TypeScript types for data models
│   │   ├── filesystem.ts  # File storage helpers
│   │   └── test-db.ts     # Database integration tests
│   ├── store/             # Zustand state management
│   │   └── index.ts       # Journal, Sync, Settings stores
│   ├── sync/              # BLE sync layer
│   │   ├── ble.ts         # BLE manager
│   │   ├── signatures.ts  # Device signature compression
│   │   └── types.ts       # Sync-related types
│   ├── ai/                # Embedding pipeline (stub)
│   │   └── embeddings.ts  # Future: ONNX runtime
│   ├── utils/             # Shared utilities
│   │   ├── fileHelpers.ts # File operations
│   │   └── mediaHelpers.ts# Media type detection
│   └── theme.ts           # React Native Paper theme
├── components/            # Reusable UI components
│   ├── MediaItemList.tsx  # List view for media items
│   ├── TypeIcon.tsx       # Icon for media types
│   ├── ImportProgressList.tsx
│   ├── InsightCard.tsx
│   └── JournalList.tsx
├── hooks/
│   └── useFrameworkReady.ts
└── docs/                  # Architecture & planning docs
    ├── ARCHITECTURE.md    # This file
    ├── PRODUCT.md         # Product vision
    ├── ROADMAP.md         # Iteration plan
    └── QA.md              # QA checklist
```

## Navigation (Expo Router)
- File-based routing with tabs layout
- Root layout: `app/_layout.tsx` provides theme + PaperProvider
- Tabs: Inbox, Library, Add, Sync, Settings (see `app/(tabs)/_layout.tsx`)
- Stack navigation for item detail: `app/item/[id].tsx`
- Non-route code lives in `components/`, `hooks/`, `lib/`

## Data Layer

### Storage Architecture
- **SQLite (expo-sqlite)**: All metadata, tags, relationships, sessions
- **expo-filesystem**: Media files (images, PDFs, audio, video)
- **SecureStore** (future): API keys for cloud AI providers

### Database Schema (see `lib/storage/migrations.ts`)
- **media_items**: Core content with metadata
  - `id`, `type`, `title`, `source_url`, `local_uri`, `notes`, `extracted_text`, `metadata_json`, `created_at`, `updated_at`
- **tags**: User tags (no preset list, dynamic)
  - `id`, `name`, `created_at`
- **item_tags**: Many-to-many item-tag relationships
  - `item_id`, `tag_id`, `confidence`, `source` (heuristic|ml|user), `created_at`
- **journal_entries**: Optional rich metadata for media items
  - `id`, `media_item_id`, `entry_date`, `mood`, `location`, `created_at`, `updated_at`
- **swipe_signals**: User feedback (like/dislike) for profile building
  - `id`, `media_item_id`, `direction`, `category`, `created_at`
- **compare_sessions**: Sync sessions with other users
  - `id`, `mode`, `scope_filters`, `provider`, `created_at`
- **compare_session_items**: Items shared in a session
  - `session_id`, `item_id`, `share_level`, `created_at`
- **schema_migrations**: Track applied migrations
- **user_meta**: Key-value store for app preferences

### Repository Pattern
- `lib/storage/db.ts`: High-level Database class (singleton instance)
- `lib/storage/repository.ts`: Low-level CRUD functions
- `lib/storage/types.ts`: TypeScript types for all tables + input/output types
- Legacy compatibility layer in `db.ts` for old `JournalItem` API

## State Management (Zustand)

Stores in `lib/store/index.ts`:

1. **JournalState**: In-memory item list + tag filtering
   - `items`, `selectedTags`, `filteredItems()`
   - Actions: `setItems`, `addItem`, `setSelectedTags`

2. **SyncState**: BLE sync status
   - `isAdvertising`, `isScanning`, `discoveredDevices`, `currentSync`
   - Actions: `setAdvertising`, `setScanning`, `addDiscoveredDevice`, `setSyncResult`, `clearSync`

3. **SettingsState**: App preferences
   - `darkMode`, `bleEnabled`, `qrFallback`
   - Actions: `setDarkMode`, `setBleEnabled`, `setQrFallback`

## Data Flow

### Ingest Pipeline
Input: Pasted text/URL, picked files, or inbound share
1. **Normalize metadata** (`lib/utils/mediaHelpers.ts`)
   - Detect media type, extract title from URL/filename
2. **Store file** (`lib/storage/filesystem.ts`)
   - Copy to app documents directory if needed
3. **Create MediaItem** (`db.createMediaItem()`)
   - Insert into SQLite with metadata
4. **Auto-tag** (stub in current iteration)
   - v1: Heuristics (keyword extraction from title/text/URL host)
   - v2: On-device ML (future)
5. **Update UI**
   - Refresh Zustand store, reload library view

### Auto-Tagging (Future: Iteration 07+)
- No preset tag list; tags emerge from content
- v1: Local heuristics (keyword extraction)
- User can accept/remove/edit tags
- Feedback loop to improve future suggestions

### Compare Capsule (Future: Iteration 14+)
- Build minimized snippet set + tag summaries
- Redact personal identifiers by default
- Send only with explicit user consent

## UI/Theme
- **Framework**: React Native Paper (Material Design 3)
- **Icons**: Lucide React Native
- **Theme**: Dark mode default (Deep Purple primary, Amber accent)
  - Defined in `lib/theme.ts`
- **Platform**: Cross-platform (iOS, Android, Web via Expo)

## Cloud AI (Future: Iteration 16+)
- Provider adapters: OpenAI, Gemini, Claude behind unified interface
- API keys in SecureStore
- Strict JSON schema for insight output
- Opt-in only, with clear privacy disclosures

## Privacy Principles
- **Local-first**: All data stays on device by default
- **No logging**: Never log raw journal content, links, or extracted text
- **Consent-driven sync**: Explicit opt-in for BLE sessions
- **Minimization**: Only share snippet-level data when syncing
- **Cloud AI opt-in**: User must explicitly enable and provide API keys

## Testing Strategy
- No automated test framework yet (future: Jest + Testing Library)
- Manual QA via simulators/devices (see `docs/QA.md`)
- Database integration tests: `lib/storage/test-db.ts` has `testDatabase()` function
- BLE testing requires physical devices or QR fallback mode
