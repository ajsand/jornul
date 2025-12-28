# Development Workflow

This document describes how to run, test, and build JournalLink during development.

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm (comes with Node.js)
- Expo Go app (for mobile testing) OR
- Xcode (iOS simulator) OR
- Android Studio (Android emulator)

## Quick Start

```bash
# Install dependencies (use legacy-peer-deps for compatibility)
npm install --legacy-peer-deps

# Start development server
npx expo start
```

Then:
- Press `w` to open in web browser
- Press `i` to open iOS simulator (macOS only)
- Press `a` to open Android emulator
- Scan QR code with Expo Go app (physical device)

## Development vs Expo Go vs Dev Build

### Expo Go (Quick Testing)
- **Pros:** Instant reload, no build step, works on physical device
- **Cons:** No native modules, limited to Expo SDK

```bash
npx expo start
# Scan QR with Expo Go app
```

**What works in Expo Go:**
- All UI components
- SQLite database
- File system
- Camera/Photo picker
- Most navigation

**What doesn't work in Expo Go:**
- BLE (react-native-ble-plx requires native build)
- ONNX runtime (requires native build)
- Custom native modules

### Development Build (Full Features)
For features requiring native code (BLE, ONNX):

```bash
# Build for iOS simulator
npx expo run:ios

# Build for Android emulator
npx expo run:android
```

This creates a custom dev client with all native modules linked.

### Production Build (EAS)
For App Store / Play Store:

```bash
# Configure EAS (one-time)
npx eas-cli@latest build:configure

# Build for iOS
npx eas build --platform ios --profile production

# Build for Android
npx eas build --platform android --profile production
```

## Available Scripts

```bash
# Start dev server
npm run dev              # Same as npx expo start

# Type checking
npm run typecheck        # Run TypeScript compiler (no emit)

# Linting
npm run lint             # Run ESLint via Expo

# Build for web
npm run build:web        # Export static web build

# Format code (if Prettier installed)
npm run format           # Format all TS/TSX/JSON/MD files

# Testing (placeholder)
npm run test             # Currently just echoes message
```

## File Structure for Development

When adding features, follow this structure:

```
New UI screen?        → app/(tabs)/newscreen.tsx or app/newscreen.tsx
New component?        → components/NewComponent.tsx
New database table?   → lib/storage/migrations.ts (add migration)
                      → lib/storage/repository.ts (add CRUD)
                      → lib/storage/types.ts (add types)
New utility?          → lib/utils/newHelper.ts
New store?            → lib/store/index.ts (add to existing or new file)
New sync feature?     → lib/sync/
New AI feature?       → lib/ai/
```

## Database Development

### Adding a Migration

1. Open `lib/storage/migrations.ts`
2. Add a new entry to the `migrations` object:

```typescript
const migrations: { [version: number]: string } = {
  1: `...existing...`,
  2: `...existing...`,
  3: `
    -- Your new migration
    CREATE TABLE IF NOT EXISTS new_table (
      id TEXT PRIMARY KEY,
      ...
    );
  `,
};
```

3. Add types in `lib/storage/types.ts`
4. Add repository functions in `lib/storage/repository.ts`

### Testing Database Changes

```typescript
// In React Native debugger or add to a screen temporarily:
import { testDatabase } from '@/lib/storage/test-db';

// Call this to run integration tests
await testDatabase();
```

### Debugging Database

```typescript
// Get database instance
import { db } from '@/lib/storage/db';
await db.init();

// Run raw SQL
const result = await db.db?.getAllAsync('SELECT * FROM media_items');
console.log(result);
```

## Testing BLE Features

BLE requires native builds and physical devices:

1. Build dev client: `npx expo run:ios` or `npx expo run:android`
2. Use two physical devices for testing sync
3. OR use QR fallback mode (Settings → QR Fallback: ON)

### QR Fallback Testing

1. Enable QR fallback in Settings
2. One device shows QR with signature
3. Other device scans QR
4. Pairing proceeds without BLE

## Debugging Tips

### React Native Debugger

Press `j` in terminal to open debugger. Useful for:
- Console logs
- Network requests
- React DevTools

### Expo DevTools

Press `m` in terminal or shake device for dev menu:
- Reload app
- Toggle performance monitor
- Open element inspector

### Common Issues

**"Cannot find module" errors:**
```bash
rm -rf node_modules
npm install --legacy-peer-deps
npx expo start --clear
```

**Metro bundler cache issues:**
```bash
npx expo start --clear
```

**iOS simulator issues (macOS):**
```bash
# Reset simulator
xcrun simctl shutdown all
xcrun simctl erase all
```

**Android emulator issues:**
```bash
# Cold boot
adb kill-server
adb start-server
```

## Code Style

### TypeScript

- Use strict mode (enabled in tsconfig.json)
- Avoid `any` unless absolutely necessary
- Use explicit return types for public functions
- Prefer `interface` over `type` for objects

### React Native

- Use functional components with hooks
- Use React Native Paper components for UI
- Follow existing patterns in codebase

### Imports

```typescript
// External imports first
import React from 'react';
import { View, Text } from 'react-native';
import { Button } from 'react-native-paper';

// Internal imports after
import { theme } from '@/lib/theme';
import { useJournalStore } from '@/lib/store';
```

## Git Workflow

### Commit Messages

```
iter-07: baseline verification + docs scaffold
iter-08: SQLite schema v1 + migrations
feat: add tag autocomplete
fix: library filter race condition
docs: update architecture diagram
```

### Before Committing

```bash
# Check types
npm run typecheck

# Check lint
npm run lint

# Manual test the feature
npx expo start
```

## Environment Variables (Future)

When needed, use Expo's environment variable support:

```bash
# .env (not committed)
API_KEY=your-key-here
```

```typescript
// Access in code
import Constants from 'expo-constants';
const apiKey = Constants.expoConfig?.extra?.apiKey;
```

Configure in `app.config.js`:
```javascript
export default {
  expo: {
    extra: {
      apiKey: process.env.API_KEY,
    },
  },
};
```

## Performance Profiling

### React DevTools Profiler

1. Open debugger (press `j`)
2. Go to Profiler tab
3. Record interaction
4. Analyze component render times

### Memory Profiling

1. Use Chrome DevTools Memory tab
2. Take heap snapshots
3. Compare before/after user actions
4. Look for retained objects

### Bundle Size

```bash
# Analyze web bundle
npx expo export --platform web
# Check size of dist/ folder

# For native, use EAS build logs
npx eas build --platform ios --profile production
# Check build logs for bundle size
```
