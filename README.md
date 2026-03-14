# Warikan

React Native + Expo expense-splitting app for iOS and Android.

## Prerequisites

- Node.js 20+
- npm
- Java 17 (Android Gradle Plugin requirement)
- Android SDK + platform tools (for Android)
- Full Xcode app (for iOS, not only Command Line Tools)

## Install

```bash
npm install
```

## Run

```bash
# Android
npm run android

# iOS
npm run ios
```

`npm run android` is configured to use Java 17 and the default macOS SDK path (`$HOME/Library/Android/sdk`) automatically.

## Build Android debug APK (without emulator)

```bash
cd android
JAVA_HOME=/opt/homebrew/opt/openjdk@17 PATH=/opt/homebrew/opt/openjdk@17/bin:$PATH ./gradlew assembleDebug --no-daemon
```

APK output:

`android/app/build/outputs/apk/debug/app-debug.apk`

## Current native toolchain requirements

### Android

If you see SDK/ADB errors, ensure:

- SDK root exists at `~/Library/Android/sdk` (or set `ANDROID_HOME`)
- `adb` is available in PATH
- Java runtime is 17 for Gradle builds (Java 11 is too old, Java 25 can break Gradle/Groovy compatibility)
- SDK packages include:
  - `platform-tools`
  - `platforms;android-35`
  - `build-tools;35.0.0`
- An emulator is running, or a physical device is connected with USB debugging enabled.

### iOS

If `pod install` fails with `SDK "iphoneos" cannot be located`:

1. Install full Xcode from App Store.
2. Run:

```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -runFirstLaunch
```

3. Re-run:

```bash
npm run ios
```
