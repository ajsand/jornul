# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JournalLink is a React Native (Expo SDK 53) mobile app for private, local-first journaling with proximity-based sync via BLE/QR codes. Users capture media, auto-tag it, and compare "profiles" with others to generate conversation insights.

## Development Commands

```bash
# Start dev server (iOS: i, Android: a, Web: w)
npx expo start

# Lint
npx expo lint

# Build for web
npx expo export --platform web

# Install dependencies (requires legacy-peer-deps)
npm install --legacy-peer-deps
```

## Architecture

### File Structure
- `app/` - Expo Router pages (file-based routing with tabs)
- `lib/storage/` - SQLite database layer (db.ts is main entry, migrations.ts for schema)
- `lib/sync/` - BLE manager and device signature compression
- `lib/store/` - Zustand stores (Journal, Sync, Settings)
- `lib/ai/` - Embedding pipeline (stub, ready for ONNX)
- `components/` - Reusable UI components
- `docs/` - Architecture, product, and roadmap docs

### Key Patterns
- **State**: Zustand stores with computed selectors
- **Database**: expo-sqlite with WAL mode, repository pattern in `lib/storage/repository.ts`
- **UI**: React Native Paper (Material Design 3), Lucide icons
- **Theme**: Dark mode default (Deep Purple primary, Amber accent) in `lib/theme.ts`

### Data Model
- `media_items` - Core content (text, images, audio, video, PDFs)
- `tags` / `item_tags` - Many-to-many tagging with confidence scores
- `compare_sessions` - Sync session metadata
- Files stored via expo-filesystem, metadata in SQLite

## Rules

### Source of Truth
Follow `docs/ARCHITECTURE.md` and `docs/PRODUCT.md` for design decisions.

### Code Style
- TypeScript strict mode, no `any` without justification
- Keep changes small and PR-sized
- Justify new library dependencies with alternatives

### Privacy (Critical)
- Never log raw journal content, links, or extracted text to console
- Local-first by default; cloud AI is opt-in only
- API keys in SecureStore only

### Expo Router
- All screens in `app/` following Expo Router conventions
- Use `_layout.tsx` for stacks/tabs in route groups
- Non-route code goes in `components/`, `hooks/`, `lib/`, `utils/`

## Testing

No test framework configured yet. Manual testing via simulators/devices.
- Database integration tests: `lib/storage/test-db.ts` has `testDatabase()` function
- BLE testing requires physical devices or use QR fallback mode
