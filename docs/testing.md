# Testing Guide

This document describes how to run tests, what is covered, and the QA checklist for JournalLink.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run full verification (lint + typecheck + tests)
npm run verify
```

## Test Organization

Tests are organized in `__tests__/` following the source code structure:

```
__tests__/
├── integration/              # Integration tests
│   ├── itemsRepo.test.ts     # Media item CRUD
│   ├── tagsRepo.test.ts      # Tag management
│   ├── swipeRepo.test.ts     # Swipe sessions & events
│   ├── preferenceComputation.test.ts  # Preference pipeline
│   ├── aetsPipeline.test.ts  # Tag extraction pipeline
│   └── storeState.test.ts    # Zustand store management
├── lib/
│   ├── services/
│   │   ├── aets/             # Tagging unit tests
│   │   │   ├── keyphrase.test.ts
│   │   │   ├── tagger.test.ts
│   │   │   └── wordLists.test.ts
│   │   └── swipe/
│   │       └── ranker.test.ts
│   └── utils/
│       └── mediaHelpers.test.ts
└── seed/
    └── testData.ts           # Shared test fixtures
```

## Test Coverage by Iteration

| Iteration | Feature | Test Coverage |
|-----------|---------|---------------|
| 1-5 | Core database & storage | `itemsRepo.test.ts`, `tagsRepo.test.ts` |
| 6-10 | Quick capture & import | `mediaHelpers.test.ts` |
| 11-17 | URL ingestion & auto-tagging | `aetsPipeline.test.ts`, `tagger.test.ts`, `keyphrase.test.ts`, `wordLists.test.ts` |
| 18 | AETS v2 meaningful tags | `tagger.test.ts`, `wordLists.test.ts` |
| 19 | Bulk import | Repository tests |
| 20 | Vault browse/filters | `itemsRepo.test.ts` (filters) |
| 21-22 | Swipe deck & ranking | `swipeRepo.test.ts`, `ranker.test.ts`, `preferenceComputation.test.ts` |
| 23 | Sync via QR | `storeState.test.ts` (sync store) |
| 24 | Consent & capsule | `storeState.test.ts` (consent flow) |

## Test Counts

| Category | Count | Target | Status |
|----------|-------|--------|--------|
| Unit tests | 82 | 10 | Exceeds |
| Integration tests | 86 | 8 | Exceeds |
| **Total** | **168** | **18** | Exceeds |

## Test Seed Data

Deterministic test data is provided in `__tests__/seed/testData.ts`:

- **5 media items** (text notes, URLs, images)
- **8 tags** (productivity, react-native, music, cooking, etc.)
- **10 tag assignments** with confidence scores
- **4 swipe media items** (movies, books, podcasts)
- **12 swipe events** (likes, dislikes, super_likes, skips)

## Mocking Strategy

Tests use Jest mocks for external dependencies:

- **expo-sqlite**: Mocked database operations
- **expo-file-system**: Mocked file operations
- **expo-haptics**: Mocked haptic feedback
- **expo-secure-store**: Mocked secure storage
- **uuid**: Deterministic UUID generation

Mock setup is in `jest.setup.js`.

---

# QA Checklist

## Critical Path Testing (Web)

These are the core flows that must work on web after recent fixes.

### Onboarding Flow

| Step | Expected Result | Status |
|------|-----------------|--------|
| Fresh load (clear localStorage) | Onboarding screen appears | [ ] Pass |
| Click "Next" button | Screen advances to 2/4 | [ ] Pass |
| Click "Next" again | Screen advances to 3/4 | [ ] Pass |
| Click "Next" again | Screen advances to 4/4 | [ ] Pass |
| Click "Get Started" | Routes to Inbox tab | [ ] Pass |
| Reload page | Goes directly to tabs (no onboarding) | [ ] Pass |
| Click "Back" on screen 2 | Returns to screen 1 | [ ] Pass |
| Click "Skip" (X button) | Completes onboarding, routes to tabs | [ ] Pass |

### Create and Delete Flow

| Step | Expected Result | Status |
|------|-----------------|--------|
| Go to Scratch tab | Text input visible | [ ] Pass |
| Type "Test note for QA" | "Detected: Note" indicator shows | [ ] Pass |
| Click "Save" | Dialog appears: "Note captured..." | [ ] Pass |
| Click "View Library" in dialog | Navigates to Vault tab | [ ] Pass |
| See "Test note for QA" in list | Item is visible | [ ] Pass |
| Click on the item | Detail screen opens | [ ] Pass |
| Click delete button (trash icon) | Confirmation dialog appears | [ ] Pass |
| Click "Cancel" in dialog | Dialog closes, item remains | [ ] Pass |
| Click delete button again | Confirmation dialog appears | [ ] Pass |
| Click "Delete" in dialog | Item deleted, returns to Vault | [ ] Pass |
| Verify item is gone | List no longer shows the item | [ ] Pass |
| Reload page | Item stays deleted | [ ] Pass |

### Tag Management Flow

| Step | Expected Result | Status |
|------|-----------------|--------|
| Create a new note | Note appears in Vault | [ ] Pass |
| Open item detail | Tags section visible | [ ] Pass |
| Click "Add" tag button | Tag dialog opens | [ ] Pass |
| Type "qa-test" and click "Add" | Tag added to item | [ ] Pass |
| Click X on a tag | Remove tag dialog appears | [ ] Pass |
| Click "Remove" | Tag is removed | [ ] Pass |

### Discover/Swipe Flow

| Step | Expected Result | Status |
|------|-----------------|--------|
| Go to Discover tab | Loading indicator appears | [ ] Pass |
| Wait for cards to load | Swipe card visible | [ ] Pass |
| Click Like button (heart) | Card animates, counter updates | [ ] Pass |
| Click Dislike button (X) | Card animates, counter updates | [ ] Pass |
| Click Skip button | Card skips, counter updates | [ ] Pass |

## Pre-Release Verification

### Web (Chrome/Safari)

- [ ] App loads without fatal console errors
- [ ] Onboarding flow completes (all 4 screens)
- [ ] Can create text note
- [ ] Can create URL bookmark (paste URL)
- [ ] Auto-tagging extracts meaningful tags
- [ ] Vault list displays items
- [ ] Search/filter works
- [ ] Delete shows confirmation dialog
- [ ] Delete removes item from DB
- [ ] Swipe deck loads catalog
- [ ] Swipe buttons work
- [ ] Preferences summary updates after swipes
- [ ] Settings persist after refresh

### iOS (Simulator / Device)

- [ ] App launches without crash
- [ ] Onboarding completes
- [ ] Text note creation works
- [ ] Delete shows native alert
- [ ] Share sheet intake accepts URLs
- [ ] Camera/photo picker works
- [ ] Document picker works
- [ ] Haptic feedback fires on swipe
- [ ] BLE permission prompt appears
- [ ] QR code displays for sync
- [ ] Consent flow completes

### Android (Emulator / Device)

See [docs/run-android.md](run-android.md) for setup instructions.

- [ ] App launches without crash
- [ ] Onboarding completes
- [ ] Text note creation works
- [ ] Delete shows native alert
- [ ] Share sheet intake accepts URLs
- [ ] Camera/photo picker works
- [ ] Document picker works
- [ ] Haptic feedback fires on swipe
- [ ] BLE permission prompt appears
- [ ] QR code displays for sync
- [ ] Consent flow completes

## Regression Checks

After any code change, verify:

1. `npm run verify` passes (lint + typecheck + tests)
2. App builds for web: `npm run build:web`
3. No new console warnings/errors in browser
4. Core flows work: create item → view in vault → delete

## Performance Checks

- [ ] Vault loads <500ms with 100+ items
- [ ] Search results appear <200ms
- [ ] Swipe animation is smooth (60fps)
- [ ] No memory leaks during extended use

## Known Limitations

### Web Platform
- BLE not available (uses QR fallback only)
- Camera may require HTTPS in some browsers
- expo-sqlite uses IndexedDB backend

### Testing
- E2E tests not yet implemented (future work)
- Component tests require `@testing-library/react-native` setup

---

## Future Test Improvements

1. Add React Native Testing Library component tests
2. Add E2E tests with Detox or Maestro
3. Add visual regression tests for UI
4. Add performance benchmarks

