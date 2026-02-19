# Running JournalLink on Android

This guide explains how to set up your development environment to run JournalLink on Android.

## Prerequisites

### 1. Install Android Studio

Download and install Android Studio from:
https://developer.android.com/studio

During installation, ensure you select:
- Android SDK
- Android SDK Platform-Tools
- Android Virtual Device (AVD)

### 2. Set Up Environment Variables

#### Windows

1. Open **System Properties** > **Advanced** > **Environment Variables**
2. Add a new **System Variable**:
   - Name: `ANDROID_HOME`
   - Value: `C:\Users\<YourUsername>\AppData\Local\Android\Sdk`
3. Add to **Path**:
   - `%ANDROID_HOME%\platform-tools`
   - `%ANDROID_HOME%\tools`
   - `%ANDROID_HOME%\tools\bin`
4. Restart your terminal/IDE

#### macOS / Linux

Add to your `~/.bashrc`, `~/.zshrc`, or `~/.bash_profile`:

```bash
export ANDROID_HOME=$HOME/Android/Sdk
# or for macOS: export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

Then run `source ~/.bashrc` (or equivalent).

### 3. Verify Installation

```bash
adb --version
# Should output: Android Debug Bridge version X.X.X
```

## Running the App

### Option A: Using Expo Go (Quickest)

1. Install **Expo Go** on your Android device from the Play Store
2. Start the development server:
   ```bash
   npx expo start
   ```
3. Scan the QR code with Expo Go

### Option B: Using Android Emulator

1. Open Android Studio > **Virtual Device Manager**
2. Create a virtual device (recommended: Pixel 5, API 33+)
3. Start the emulator
4. Run:
   ```bash
   npx expo start
   # Press 'a' to open on Android
   ```

### Option C: Using Physical Device (USB)

1. Enable **Developer Options** on your device:
   - Settings > About Phone > Tap "Build Number" 7 times
2. Enable **USB Debugging** in Developer Options
3. Connect via USB
4. Run:
   ```bash
   adb devices  # Verify device is connected
   npx expo start
   # Press 'a' to open on Android
   ```

## Common Issues

### "ANDROID_HOME not set"

```
Failed to resolve the Android SDK path. Default install location not found.
Use ANDROID_HOME to set the Android SDK location.
```

**Solution:** Set the `ANDROID_HOME` environment variable as described above.

### "adb is not recognized"

```
Error: 'adb' is not recognized as an internal or external command
```

**Solution:** Add `platform-tools` to your PATH as described above.

### "Unable to load script" / Metro Connection Issues

**For Emulator:**
- Ensure Metro bundler is running (`npx expo start`)
- Try `adb reverse tcp:8081 tcp:8081`

**For Physical Device:**
- Ensure device and computer are on the same WiFi network
- Shake device to open developer menu > "Change Bundle Location"
- Enter your computer's IP address with port (e.g., `192.168.1.100:8081`)

### Build Errors with Expo Go

If you see compatibility warnings about Expo packages:
```
expo@53.0.0 - expected version: ~53.0.25
```

This is expected in development. The app should still work with Expo Go.

For production builds or to resolve all warnings:
```bash
npx expo install --fix
```

## Development Build (Advanced)

For features requiring native code (like BLE), you may need a development build:

```bash
# Install expo-dev-client
npx expo install expo-dev-client

# Build for Android
eas build --profile development --platform android

# Or build locally (requires Android Studio setup)
npx expo run:android
```

## Useful Commands

```bash
# List connected devices
adb devices

# View device logs
adb logcat *:E  # Errors only

# Kill all Metro instances
npx expo start --clear

# Reset cache
rm -rf node_modules && npm install --legacy-peer-deps
```

## See Also

- [Expo Android Development Guide](https://docs.expo.dev/workflow/android-studio-emulator/)
- [React Native Environment Setup](https://reactnative.dev/docs/environment-setup)



















