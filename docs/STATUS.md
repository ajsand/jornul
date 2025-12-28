# Current State Report (Iteration 07)

**Last updated:** December 2025
**Status:** Baseline verification complete

## Summary

JournalLink is a React Native (Expo SDK 53) mobile app for private, local-first journaling with proximity-based sync. The foundation is in place with working navigation, database layer, and basic capture flows.

## Project Health

| Check | Status |
|-------|--------|
| Package Manager | npm (package-lock.json) |
| Dependencies | Installed, up to date |
| TypeScript | Compiles without errors |
| Lint | Passes (8 warnings, 0 errors) |
| Web Build | Bundles successfully |

## Screens (app/)

| Screen | File | Status | Notes |
|--------|------|--------|-------|
| Inbox | `app/(tabs)/index.tsx` | Working | Shows recent items, basic capture |
| Library | `app/(tabs)/library.tsx` | Working | Lists media items with filters |
| Add Item | `app/(tabs)/newitem.tsx` | Working | Manual item creation |
| Sync | `app/(tabs)/sync.tsx` | Stub | BLE/QR pairing UI (not functional) |
| Settings | `app/(tabs)/settings.tsx` | Working | Dark mode, BLE toggles |
| Item Detail | `app/item/[id].tsx` | Working | View/edit item, manage tags |
| Mass Import | `app/import.tsx` | Working | Multi-file import |

## Database Schema (SQLite)

Current schema version: **2**

| Table | Status | Records |
|-------|--------|---------|
| media_items | Active | Core content storage |
| tags | Active | User-defined tags |
| item_tags | Active | Many-to-many relationships |
| journal_entries | Active | Optional rich metadata |
| swipe_signals | Active | Like/dislike for profile |
| compare_sessions | Active | Sync session metadata |
| compare_session_items | Active | Items shared in sessions |
| ingest_queue | Active | Quick Add processing |
| schema_migrations | Active | Migration tracking |
| user_meta | Active | App preferences |

## Zustand Stores (lib/store/)

| Store | Status | Purpose |
|-------|--------|---------|
| JournalState | Active | In-memory items + tag filtering |
| SyncState | Active | BLE advertising/scanning state |
| SettingsState | Active | App preferences |

## Key Modules

| Module | Path | Status | Notes |
|--------|------|--------|-------|
| Database | `lib/storage/db.ts` | Working | Singleton, WAL mode |
| Repository | `lib/storage/repository.ts` | Working | Full CRUD operations |
| Migrations | `lib/storage/migrations.ts` | Working | Auto-runs on app start |
| File Storage | `lib/storage/filesystem.ts` | Working | expo-filesystem integration |
| Embeddings | `lib/ai/embeddings.ts` | Stub | Hash-based placeholder |
| BLE Manager | `lib/sync/ble.ts` | Stub | BLE-PLX wrapper |
| Signatures | `lib/sync/signatures.ts` | Working | Device signature compression |
| Theme | `lib/theme.ts` | Working | Dark mode, Material 3 |

## Components

| Component | Status | Notes |
|-----------|--------|-------|
| MediaItemList | Working | FlatList of media items |
| TypeIcon | Working | Icons for media types |
| ImportProgressList | Working | Import status display |
| InsightCard | Stub | Future compare session output |
| JournalList | Working | Legacy list component |

## What's Missing (for MVP)

### Critical Path
1. **Auto-tagging pipeline** - Currently no automatic tagging
2. **Swipe Deck UI** - swipe_signals table exists, no UI
3. **Compare Session flow** - BLE/QR pairing not functional
4. **Consent Capsule builder** - Data minimization for sync
5. **Cloud AI adapters** - OpenAI/Claude/Gemini integration
6. **Insights UI** - Display compare session results

### Nice to Have
- On-device embeddings (ONNX runtime)
- Share intent handler
- Export/import vault
- Push notifications

## Known Issues

1. **Lint warnings** (non-blocking):
   - Unused imports in sync.tsx, item/[id].tsx
   - Missing useEffect dependencies (needs review)

2. **Package versions** (non-blocking):
   - Some expo packages slightly outdated
   - All function correctly at current versions

## File Structure

```
Jornul/
├── app/                    # Expo Router pages
│   ├── _layout.tsx        # Root layout
│   ├── (tabs)/            # Tab navigation
│   │   ├── _layout.tsx    # Tab bar config
│   │   ├── index.tsx      # Inbox
│   │   ├── library.tsx    # Library
│   │   ├── newitem.tsx    # Add item
│   │   ├── sync.tsx       # Sync (stub)
│   │   └── settings.tsx   # Settings
│   ├── item/[id].tsx      # Item detail
│   └── import.tsx         # Mass import
├── lib/
│   ├── storage/           # SQLite + filesystem
│   ├── store/             # Zustand stores
│   ├── sync/              # BLE sync layer
│   ├── ai/                # Embeddings (stub)
│   ├── utils/             # Helpers
│   ├── ingest/            # Processor (stub)
│   └── theme.ts           # UI theme
├── components/            # Reusable UI
├── hooks/                 # Custom hooks
└── docs/                  # Documentation
```

## Next Steps

1. Complete docs scaffold (this iteration)
2. Proceed with Iteration 08 (SQLite schema v1 refinement)
3. Build Scratch capture v1 (Iteration 09)
