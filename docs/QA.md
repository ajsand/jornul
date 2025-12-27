# QA Manual Testing Checklist

## How to Use This Checklist
- Run through relevant sections after each iteration
- Check off items as you test
- Note any failures or unexpected behavior
- Re-test after fixes

## Pre-Flight Checks (Every Build)
- [ ] App launches without crash
- [ ] No console errors on startup
- [ ] Database initializes successfully
- [ ] Theme/UI renders correctly
- [ ] All tabs are accessible

## Core Flows (Regression)

### 1. Quick Add (Inbox)
- [ ] Navigate to Inbox tab
- [ ] Paste a URL → item created
- [ ] Paste plain text → item created
- [ ] Items appear in Library immediately
- [ ] No duplicate items on multiple pastes

### 2. Library Browse
- [ ] Library shows all items in reverse chronological order
- [ ] Scroll works smoothly (no lag with 10+ items)
- [ ] Tap item → navigates to detail view
- [ ] Empty state shows when no items exist
- [ ] Pull to refresh works

### 3. Item Detail
- [ ] Item detail shows correct title, type, date
- [ ] Tags display correctly
- [ ] Can add new tag
- [ ] Can remove existing tag
- [ ] Notes field saves on blur
- [ ] Back navigation preserves library scroll position

### 4. Mass Import
- [ ] Navigate to Import screen
- [ ] Select multiple files (images, PDFs)
- [ ] Progress indicator shows during import
- [ ] All files appear in library after import
- [ ] File types detected correctly
- [ ] Local URIs are valid (files accessible)

### 5. Settings
- [ ] Dark mode toggle works (theme changes)
- [ ] BLE toggle changes state
- [ ] QR fallback toggle changes state
- [ ] Settings persist after app restart

### 6. AppHealth Debug Panel (Iteration 07)
- [ ] Navigate to Settings > AppHealth
- [ ] DB status shows "Connected" or similar
- [ ] Media item count is correct
- [ ] Tag count is correct
- [ ] Build mode shows "development" or "production"
- [ ] Refresh button updates counts

## Data Integrity

### Database
- [ ] Run database test: `import { testDatabase } from '@/lib/storage/test-db'` and call `testDatabase()`
- [ ] No SQLite errors in console
- [ ] Media items have valid UUIDs
- [ ] Timestamps are reasonable (not negative, not future)
- [ ] Tags are unique (no duplicate tag names)

### File Storage
- [ ] Imported files exist at `local_uri` paths
- [ ] File sizes are reasonable (not 0 bytes)
- [ ] No broken file references
- [ ] Files survive app restart

## Privacy Compliance
- [ ] No raw journal content logged to console
- [ ] No URLs logged to console
- [ ] No extracted text logged to console
- [ ] No personal identifiers in logs
- [ ] API keys (if any) not visible in UI or logs

## Performance
- [ ] Library loads in <1s with 10 items
- [ ] Library loads in <3s with 100 items
- [ ] Item detail opens instantly
- [ ] Import of 10 files completes in <10s
- [ ] No memory leaks (check with dev tools)

## Platform-Specific

### iOS
- [ ] Safe area insets respected (notch, home indicator)
- [ ] Haptic feedback works (if implemented)
- [ ] Camera/photo picker works (if implemented)

### Android
- [ ] Back button navigation works
- [ ] Camera/photo picker works (if implemented)
- [ ] Permissions requested correctly

### Web
- [ ] App loads in browser
- [ ] File picker works
- [ ] No native-only features crash

## Edge Cases
- [ ] Empty title/text → graceful fallback
- [ ] Very long text (10,000+ chars) → handles without crash
- [ ] Special characters in tags (#, @, emoji) → saves correctly
- [ ] Rapid successive adds → no race conditions
- [ ] Delete all items → empty state shows correctly
- [ ] App works offline (no network required)

## Known Issues / Limitations
(Update this section as you find bugs)
- None yet (Iteration 07 baseline)

## Iteration-Specific Checks

### Iteration 07: Baseline Hardening
- [ ] `npm run lint` passes with no errors
- [ ] `npm run typecheck` passes with no errors
- [ ] AppHealth panel shows correct DB status
- [ ] AppHealth panel shows correct item/tag counts
- [ ] ARCHITECTURE.md is up to date
- [ ] ROADMAP.md is up to date
