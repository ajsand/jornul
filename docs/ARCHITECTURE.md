# JournalLink Architecture

## Overview

JournalLink is a React Native (Expo SDK 53) mobile app for private, local-first journaling with proximity-based sync via BLE/QR codes. Users capture media, auto-tag it, and compare "profiles" with others to generate conversation insights.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         UI Layer                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │  Inbox  │ │ Library │ │   Add   │ │  Sync   │ │Settings │   │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘   │
└───────┼──────────┼──────────┼──────────┼──────────┼────────────┘
        │          │          │          │          │
┌───────┴──────────┴──────────┴──────────┴──────────┴────────────┐
│                      Zustand Stores                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │JournalState │ │  SyncState  │ │SettingsState│               │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘               │
└─────────┼───────────────┼───────────────┼──────────────────────┘
          │               │               │
┌─────────┴───────────────┴───────────────┴──────────────────────┐
│                      Core Services                              │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐       │
│  │ Database  │ │ Ingest    │ │ Auto-Tag  │ │ Sync      │       │
│  │ (SQLite)  │ │ Pipeline  │ │ (AETS)    │ │ Manager   │       │
│  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘       │
└────────┼─────────────┼─────────────┼─────────────┼─────────────┘
         │             │             │             │
┌────────┴─────────────┴─────────────┴─────────────┴─────────────┐
│                      Storage Layer                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │ SQLite (expo)  │  │ Filesystem     │  │ SecureStore    │    │
│  │ - metadata     │  │ - media files  │  │ - API keys     │    │
│  │ - tags         │  │ - documents    │  │ - device ID    │    │
│  │ - sessions     │  │                │  │                │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
└────────────────────────────────────────────────────────────────┘
```

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
│   ├── ingest/            # Content processing
│   │   └── processor.ts   # Ingest pipeline
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
├── utils/
│   └── questions.ts       # Random conversation starters
└── docs/                  # Architecture & planning docs
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
- **SecureStore**: API keys for cloud AI providers, device ID

### Database Schema (see `lib/storage/migrations.ts`)

```
┌─────────────────┐       ┌─────────────┐       ┌──────────────┐
│  media_items    │       │    tags     │       │  item_tags   │
├─────────────────┤       ├─────────────┤       ├──────────────┤
│ id (PK)         │◄──────│ id (PK)     │◄──────│ item_id (FK) │
│ type            │       │ name        │       │ tag_id (FK)  │
│ title           │       │ created_at  │       │ confidence   │
│ source_url      │       └─────────────┘       │ source       │
│ local_uri       │                             │ created_at   │
│ notes           │                             └──────────────┘
│ extracted_text  │
│ metadata_json   │       ┌──────────────────┐
│ created_at      │◄──────│ journal_entries  │
│ updated_at      │       ├──────────────────┤
└─────────────────┘       │ id (PK)          │
        ▲                 │ media_item_id    │
        │                 │ entry_date       │
        │                 │ mood             │
        │                 │ location         │
        │                 └──────────────────┘
        │
        │                 ┌──────────────────┐
        ├─────────────────│  swipe_signals   │
        │                 ├──────────────────┤
        │                 │ id (PK)          │
        │                 │ media_item_id    │
        │                 │ direction        │
        │                 │ category         │
        │                 │ created_at       │
        │                 └──────────────────┘
        │
┌───────┴─────────┐       ┌──────────────────────┐
│ compare_sessions│       │ compare_session_items│
├─────────────────┤       ├──────────────────────┤
│ id (PK)         │◄──────│ session_id (FK)      │
│ mode            │       │ item_id (FK)         │
│ scope_filters   │       │ share_level          │
│ provider        │       │ created_at           │
│ created_at      │       └──────────────────────┘
└─────────────────┘

┌─────────────────┐       ┌──────────────────┐
│  ingest_queue   │       │ schema_migrations│
├─────────────────┤       ├──────────────────┤
│ id (PK)         │       │ version (PK)     │
│ source_type     │       │ applied_at       │
│ raw_content     │       └──────────────────┘
│ file_uri        │
│ status          │       ┌──────────────────┐
│ error_message   │       │    user_meta     │
│ media_item_id   │       ├──────────────────┤
│ created_at      │       │ key (PK)         │
│ processed_at    │       │ value            │
└─────────────────┘       └──────────────────┘
```

### Repository Pattern
- `lib/storage/db.ts`: High-level Database class (singleton instance)
- `lib/storage/repository.ts`: Low-level CRUD functions
- `lib/storage/types.ts`: TypeScript types for all tables + input/output types
- Legacy compatibility layer in `db.ts` for old `JournalItem` API

## Pipelines

### Ingest Pipeline (Scratch → Vault)

```
Input: Pasted text/URL, file pick, share intent
                    │
                    ▼
            ┌───────────────┐
            │ Detect Type   │  (mediaHelpers.ts)
            │ - text/url    │
            │ - image/pdf   │
            │ - audio/video │
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
            │ Create Ingest │  (ingest_queue table)
            │ Item (pending)│
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
            │ Store File    │  (filesystem.ts)
            │ (if needed)   │
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
            │ Extract Meta  │  (metadata, title)
            │ + Text        │
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
            │ Create Media  │  (media_items table)
            │ Item          │
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
            │ Auto-Tag      │  (AETS - iteration 13+)
            │ (background)  │
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
            │ Update Ingest │  (status: ready)
            │ + Notify UI   │
            └───────────────┘
```

### Auto-Emergent Tag System (AETS)

```
MediaItem Created
        │
        ▼
┌───────────────────┐
│ Heuristic Tagger  │  v1: keyword extraction
├───────────────────┤
│ - Title words     │
│ - URL host        │
│ - Text keywords   │
│ - File extension  │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ ML Tagger (opt)   │  v2: on-device embeddings
├───────────────────┤
│ - Topic detection │
│ - Clustering      │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Tag Suggester     │
├───────────────────┤
│ - Confidence rank │
│ - Dedup existing  │
│ - Surface to user │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ User Feedback     │
├───────────────────┤
│ - Accept/reject   │
│ - Edit/create new │
│ - Learn over time │
└───────────────────┘
```

### Compare Session Pipeline (Sync + Insights)

```
Device A                              Device B
   │                                     │
   ▼                                     ▼
┌─────────────┐                   ┌─────────────┐
│ Build       │                   │ Build       │
│ Signature   │                   │ Signature   │
├─────────────┤                   ├─────────────┤
│ - Top tags  │                   │ - Top tags  │
│ - Avg embed │                   │ - Avg embed │
│ - Device ID │                   │ - Device ID │
└──────┬──────┘                   └──────┬──────┘
       │                                 │
       └───────────┬─────────────────────┘
                   │
                   ▼
           ┌───────────────┐
           │  QR / BLE     │
           │  Handshake    │
           └───────┬───────┘
                   │
                   ▼
           ┌───────────────┐
           │ Consent Gate  │
           ├───────────────┤
           │ - Mode select │
           │ - Scope select│
           │ - Item select │
           │ - Share level │
           └───────┬───────┘
                   │
                   ▼
           ┌───────────────┐
           │ Build Compare │
           │ Capsule       │
           ├───────────────┤
           │ - Minimize    │
           │ - Redact PII  │
           └───────┬───────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
┌───────────────┐     ┌───────────────┐
│ Local Mock    │     │ Cloud AI      │
│ Insights      │     │ (opt-in)      │
└───────┬───────┘     └───────┬───────┘
        │                     │
        └──────────┬──────────┘
                   │
                   ▼
           ┌───────────────┐
           │ Insight Card  │
           │ Renderer      │
           ├───────────────┤
           │ - Shared tags │
           │ - Unique tags │
           │ - Questions   │
           │ - AI insights │
           └───────────────┘
```

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

## UI/Theme

- **Framework**: React Native Paper (Material Design 3)
- **Icons**: Lucide React Native
- **Theme**: Dark mode default (Deep Purple primary, Amber accent)
  - Defined in `lib/theme.ts`
- **Platform**: Cross-platform (iOS, Android, Web via Expo)

## Cloud AI (Future: Iteration 22+)

```
┌─────────────────────────────────────────┐
│           Unified AI Interface          │
├─────────────────────────────────────────┤
│  sendInsightRequest(capsule): Insight   │
│  getProviders(): Provider[]             │
│  testConnection(provider): boolean      │
└─────────────────┬───────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
    ▼             ▼             ▼
┌────────┐  ┌────────┐  ┌────────┐
│ OpenAI │  │ Claude │  │ Gemini │
│Adapter │  │Adapter │  │Adapter │
└────────┘  └────────┘  └────────┘
```

- Provider adapters behind unified interface
- API keys in SecureStore (never logged)
- Strict JSON schema for insight output
- Opt-in only, with clear privacy disclosures

## Privacy Principles

1. **Local-first**: All data stays on device by default
2. **No logging**: Never log raw journal content, links, or extracted text
3. **Consent-driven sync**: Explicit opt-in for BLE sessions
4. **Minimization**: Only share snippet-level data when syncing
5. **Cloud AI opt-in**: User must explicitly enable and provide API keys

See `docs/PRIVACY.md` for full privacy architecture.

## Testing Strategy

- No automated test framework yet (future: Jest + Testing Library)
- Manual QA via simulators/devices (see `docs/QA.md`)
- Database integration tests: `lib/storage/test-db.ts` has `testDatabase()` function
- BLE testing requires physical devices or QR fallback mode

## Dev Workflow

See `docs/DEV_WORKFLOW.md` for:
- Running dev builds vs Expo Go
- Building for production (EAS)
- Debugging database issues
- Testing sync features
