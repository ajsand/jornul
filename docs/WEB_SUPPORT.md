# JournalLink Web Support

JournalLink runs on the web via Expo's Metro bundler with React Native Web. This document covers web-specific considerations, known limitations, and expected warnings.

## Platform Status

| Feature | Web Support | Notes |
|---------|-------------|-------|
| SQLite Database | ✅ Working | Uses WASM via expo-sqlite |
| Onboarding | ✅ Working | Fixed scroll navigation |
| Create Entry | ✅ Working | Text and URL capture |
| Delete Entry | ✅ Working | Uses Paper Dialog |
| Vault Browser | ✅ Working | Full search and filter |
| Tag Management | ✅ Working | Add/remove tags |
| Discover/Swipe | ✅ Working | Button-based interaction |
| Job Queue | ✅ Working | Background processing |
| BLE Sync | ❌ Not Available | Native only (use QR fallback) |
| Haptic Feedback | ❌ Not Available | Silently ignored |
| Camera | ⚠️ Limited | Basic support only |

## Known Console Warnings

The following warnings appear in the browser console during development. They are **expected** and do not affect functionality.

### 1. `useNativeDriver` Warning

```
Animated: `useNativeDriver` is not supported because the native animated module is missing.
Falling back to JS-based animation.
```

**Cause:** React Native Animated API uses native drivers on mobile for performance. On web, it falls back to JavaScript-based animations automatically.

**Impact:** None. Animations work correctly via the JS fallback.

### 2. Deprecated `shadow*` Props

```
"shadow*" style props are deprecated. Use "boxShadow".
```

**Cause:** React Native Paper components use React Native's shadow props internally. React Native Web has deprecated these in favor of CSS `boxShadow`.

**Impact:** None. Shadows render correctly. This warning comes from library code, not app code.

### 3. Deprecated `pointerEvents` Prop

```
props.pointerEvents is deprecated. Use style.pointerEvents
```

**Cause:** React Native Paper and other libraries pass `pointerEvents` as a prop rather than a style.

**Impact:** None. Touch handling works correctly.

## SQLite on Web

JournalLink uses `expo-sqlite` which supports web via WASM (WebAssembly). 

### Requirements

- **Metro Config:** The `metro.config.js` includes WASM support:
  ```javascript
  config.resolver.assetExts.push('wasm');
  config.resolver.unstable_enablePackageExports = true;
  ```

### OPFS Storage

On web, SQLite uses the Origin Private File System (OPFS) for persistence. This requires:

1. **HTTPS in production** (localhost works in development)
2. **Same-origin policy** for database access
3. **No cross-tab sharing** - Only one tab can have the database open at a time

If you see database locking errors:
```
Database is locked by another tab or process.
Please close other tabs using this app and refresh.
```

Close other tabs running the app and refresh.

## Web-Specific Behavior

### Alerts and Dialogs

React Native's `Alert.alert()` doesn't work on web. JournalLink uses React Native Paper's `Dialog` component for all confirmations:

- Delete confirmations
- Save success dialogs
- Import confirmations
- Tag removal confirmations

### Navigation

Expo Router handles web navigation automatically. The URL bar reflects the current route:

- `/` or `/inbox` - Inbox
- `/scratch` - Scratch pad
- `/library` - Vault
- `/swipe` - Discover
- `/item/[id]` - Item detail

### Local Storage

Onboarding completion state uses `localStorage` on web (instead of SecureStore) for reliability.

## Development Tips

### Clear Cache

If you encounter stale state issues:
```bash
npx expo start --clear
```

### Browser DevTools

Use Chrome/Firefox DevTools for:
- Console logs
- Network inspection
- Application storage (IndexedDB, localStorage)

### Testing Responsiveness

The app is designed for mobile-first but works on larger screens. Use browser DevTools device emulation for testing different screen sizes.

## Known Limitations

1. **No BLE Support:** Bluetooth Low Energy is not available in browsers. Use QR code sync as fallback.

2. **No Haptic Feedback:** Vibration API has limited support and is silently ignored.

3. **File Import:** Document picker may have browser-specific behavior. Drag-and-drop is not currently supported.

4. **Camera Access:** Requires HTTPS in production. Some features may be limited.

## See Also

- [Expo Web Documentation](https://docs.expo.dev/workflow/web/)
- [React Native Web](https://necolas.github.io/react-native-web/)
- [expo-sqlite Web Support](https://docs.expo.dev/versions/latest/sdk/sqlite/)
