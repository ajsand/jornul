# JournalLink Triage Report

Generated: January 4, 2026

## Executive Summary

This report documents all issues found during functional testing of JournalLink across Web and Android platforms. The app is built with Expo SDK 53, using expo-router for navigation and expo-sqlite for persistence.

## Issue Inventory

| # | Issue | Platform | Severity | Root Cause | Status |
|---|-------|----------|----------|------------|--------|
| 1 | Onboarding "Next" doesn't scroll | Web | High | FlatList `scrollToIndex` broken on web | To Fix |
| 2 | Delete confirmation not appearing | Web | High | `Alert.alert()` is native-only | To Fix |
| 3 | Android doesn't launch | Android | High | Android SDK not installed on dev machine | Document |
| 4 | `useNativeDriver` warning | Web | Low | Expected - falls back to JS animation | Document |
| 5 | Deprecated `shadow*` props | Web | Low | React Native Paper internal | Document |
| 6 | `pointerEvents` deprecation | Web | Low | React Native Paper internal | Document |

## Detailed Analysis

### Issue 1: Onboarding Navigation Broken on Web

**Symptoms:**
- Clicking "Next" button does not advance to the next onboarding screen
- Screen counter stays at "1/4" despite button clicks
- Skip button works correctly

**Root Cause:**
The `FlatList.scrollToIndex()` method doesn't work reliably on web. The method is called but the scroll position doesn't change.

**Location:** `components/Onboarding.tsx` lines 97-102

```typescript
const goToNext = () => {
  if (isLastScreen) {
    onComplete();
  } else {
    flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
  }
};
```

**Fix:** Replace `scrollToIndex` with `scrollToOffset` using calculated width based on `SCREEN_WIDTH`.

---

### Issue 2: Delete Confirmation Not Appearing on Web

**Symptoms:**
- Clicking delete button on item detail screen does nothing
- No confirmation dialog appears
- Item is not deleted
- No error in console

**Root Cause:**
React Native's `Alert.alert()` uses native platform dialogs which don't exist on web. The function is called but silently fails.

**Location:** `app/item/[id].tsx` lines 259-286

```typescript
const handleDeleteItem = () => {
  Alert.alert(
    'Delete Item',
    'Are you sure you want to delete this item?',
    [...]
  );
};
```

**Also affected:** `app/(tabs)/scratch.tsx` - Uses `Alert.alert` for save success feedback

**Fix:** Replace `Alert.alert` with React Native Paper's `Dialog` component which works cross-platform.

---

### Issue 3: Android SDK Not Configured

**Symptoms:**
```
Failed to resolve the Android SDK path. Default install location not found: C:\Users\PC\AppData\Local\Android\Sdk
Error: 'adb' is not recognized as an internal or external command
```

**Root Cause:**
This is a development environment issue, not a code issue. The Android SDK is not installed or `ANDROID_HOME` environment variable is not set.

**Fix:** Document Android setup requirements. No code changes needed.

---

### Issue 4-6: Web Deprecation Warnings (Low Priority)

**Console Warnings:**
```
[WARNING] "shadow*" style props are deprecated. Use "boxShadow".
[WARNING] props.pointerEvents is deprecated. Use style.pointerEvents
[WARNING] Animated: `useNativeDriver` is not supported because the native animated module is missing.
```

**Root Cause:**
- `shadow*` and `pointerEvents` warnings come from React Native Paper internal components
- `useNativeDriver` warning is expected on web - animations fall back to JS driver

**Impact:** None. These are warnings only and don't affect functionality.

**Fix:** Document as known issues. No code changes needed.

---

## What's Working

The following features were verified working on Web:

| Feature | Status | Notes |
|---------|--------|-------|
| Onboarding Skip | ✅ Working | Completes onboarding and routes to tabs |
| Tab Navigation | ✅ Working | All 6 tabs accessible |
| SQLite on Web | ✅ Working | Database initializes via WASM |
| Create Note | ✅ Working | Saves to DB, appears in Vault |
| Job Queue | ✅ Working | Jobs process, tags assigned |
| Vault List | ✅ Working | Items displayed with metadata |
| Item Detail | ✅ Working | Shows tags, notes, metadata |
| FTS Search | ✅ Working | Search in Vault works |
| Discover/Swipe | ✅ Working | Cards load, buttons functional |
| Onboarding Persistence | ✅ Working | Uses localStorage on web |

---

## Fix Plan Summary

| Commit | Description | Files |
|--------|-------------|-------|
| 1 | Fix onboarding scroll on web | `components/Onboarding.tsx` |
| 2 | Replace Alert.alert with Dialog | `app/item/[id].tsx`, `app/(tabs)/scratch.tsx` |
| 3 | Document Android setup | `docs/run-android.md` |
| 4 | Document web warnings | `docs/WEB_SUPPORT.md` |
| 5 | Add QA checklist | `docs/testing.md` |

---

## Environment

- **Expo SDK:** 53.0.0
- **React Native:** 0.79.1
- **expo-router:** 5.0.2
- **expo-sqlite:** 15.2.14
- **Node.js:** (as installed)
- **Platform tested:** Web (Chrome), Android (not available - SDK missing)



















