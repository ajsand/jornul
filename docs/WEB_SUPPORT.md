# JournalLink Web Support

This document outlines the configuration and requirements for running JournalLink on the web platform.

## Overview

JournalLink uses Expo with React Native for cross-platform support. The web target requires special configuration for certain features, particularly SQLite database access.

## SQLite on Web

### Requirements

Expo SQLite on web uses **WebAssembly (WASM)** and requires specific HTTP headers to enable `SharedArrayBuffer`:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

### Dev Server Configuration

For local development, you may need to configure your development server to include these headers. With Expo Go and `npx expo start --web`, these headers should be handled automatically.

If using a custom server or deploying to production, ensure these headers are set:

#### Vercel (`vercel.json`)
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
        { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" }
      ]
    }
  ]
}
```

#### Nginx
```nginx
add_header Cross-Origin-Opener-Policy same-origin;
add_header Cross-Origin-Embedder-Policy require-corp;
```

### Metro Configuration

The `metro.config.js` includes necessary settings for WASM support:

```javascript
// Enable WASM file extension
config.resolver.assetExts.push('wasm');

// Enable package exports (required for some web polyfills)
config.resolver.unstable_enablePackageExports = true;
```

## Storage Fallbacks

### Onboarding State

- **Native (iOS/Android)**: Uses `expo-secure-store` for encrypted local storage
- **Web**: Uses `localStorage` directly (more reliable than SecureStore's web shim)

The app automatically detects the platform and uses the appropriate storage mechanism. See `app/_layout.tsx` for implementation.

### Database Operations

SQLite operations on web may fail if COOP/COEP headers are not properly configured. The app includes error handling to gracefully degrade:

1. Database initialization includes try/catch blocks
2. UI screens handle database errors without crashing
3. Sample/placeholder data may be shown if database is unavailable

## Known Limitations

### Web-specific

1. **Barcode Scanner**: The `expo-barcode-scanner` may have limited functionality on web. Camera access requires HTTPS in production.

2. **Haptic Feedback**: Haptic APIs are not available on web. The haptic utility functions are no-ops on web.

3. **Secure Storage**: True secure storage (like Keychain) is not available on web. Sensitive data uses localStorage with appropriate caveats.

4. **File System**: Direct file system access is limited. File imports use browser file picker APIs.

### Performance

- Initial WASM load may be slower than native SQLite
- Large database operations should be batched to avoid blocking the main thread
- Consider lazy loading for screens that heavily use the database

## Testing on Web

```bash
# Start web development server
npx expo start --web

# Build for web production
npx expo export --platform web
```

### Browser Compatibility

JournalLink web is tested on:
- Chrome 90+
- Firefox 90+
- Safari 15+
- Edge 90+

Note: SharedArrayBuffer support varies by browser. Chrome and Firefox have full support; Safari has partial support.

## Debugging

### Check COOP/COEP Headers

Open browser DevTools → Network tab → Check response headers for any request.

### SQLite Issues

If SQLite operations fail on web:
1. Check browser console for WASM-related errors
2. Verify COOP/COEP headers are present
3. Try clearing browser cache and localStorage
4. Check if SharedArrayBuffer is defined: `console.log(typeof SharedArrayBuffer)`

### Storage Debugging

```javascript
// Check localStorage (web)
console.log(localStorage.getItem('journallink_onboarding_complete'));

// Check all localStorage keys
for (let i = 0; i < localStorage.length; i++) {
  console.log(localStorage.key(i));
}
```

## Migration Notes

When migrating from native-only to web-compatible:

1. Replace `SecureStore` usage with platform checks (done in `app/_layout.tsx`)
2. Ensure all file operations use Expo's cross-platform APIs
3. Test database migrations on all platforms
4. Verify routing works correctly with Expo Router's web support

