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

## Travel groups, labels, and invites

- Create travel groups in the **Travel** tab.
- Member names come from each user's profile when they join the group.
- Expense labels are separate (`Dinner`, `Trip`, `Household`, `Miscellaneous`) and selected in **Add Transaction**.
- In **Add Transaction**, choose who owes from selectable member chips (no manual ID typing).
- You can delete your own transactions from **History** and **Group Detail**.
- You can delete your own currency acquisitions from **My Currencies**; balances are recalculated afterward.
- In **Travel**, generate:
  - an actual invite QR code, and
  - a simple passphrase code.
- Scan the QR code (or paste payload/passphrase) in **Join Group**.
- Use **Copy Payload** and **Copy Passphrase** buttons for quick sharing.
- In **Group Detail**, tap **Refresh Members** to merge the latest member list (cloud + local when Firebase is configured).
- If synced transactions include participants missing from local group membership, Warikan auto-adds them to that travel group.
- Currency conversion refresh uses the payer's acquisitions (`payerId`) for average-rate calculation; if unavailable, it falls back to market rate.
- When deleting a group with transactions, you can migrate, skip migration and delete, or cancel.

## QR sync

- Generate a QR code from **QR Sync** on one device.
- Scan it on another device using the in-app camera scanner and tap **Merge Payload**.
- Use **Copy Payload** to send the sync payload over any chat app when scanning is inconvenient.
- QR sync payloads include participant profile names to improve member-name recovery during reconciliation.
- QR sync payloads include the sender's currency acquisitions so payer-specific average rates can be reused on other devices.
- QR sync payloads also include deletion tombstones so deleted transactions are removed on other devices.
- In **Home → Balance Overview**, tap **Refresh** to dedupe synced payload entries and recalculate balances with current average exchange rates.

## Cloud sync (without QR)

- Recommended for teams: set `SCRIPT_FIREBASE_CONFIG` once in `src/services/firebase.ts` so every user shares one preconfigured cloud project.
- You can also configure Firebase via `EXPO_PUBLIC_FIREBASE_*` env vars or in-app via **Settings → Sync → Cloud Sync Setup**.
- In Firebase Console, enable:
  - **Authentication → Sign-in method → Anonymous**
  - **Firestore Database**
- You can sync across users from **Settings → Sync → Cloud Sync** and from **Home → Balance Overview → Refresh**.
- Group membership updates are also synced through Firebase; joining a group attempts to publish member changes to cloud automatically.
- Cloud sync shares per-user currency acquisitions, so recalculation can use the payer's own average acquisition rate on each device.
- Transaction deletions are synced via tombstones so cloud sync removes deleted records on other devices.
- Cloud sync uses Firebase when these env vars are set:
  - `EXPO_PUBLIC_FIREBASE_API_KEY`
  - `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
  - `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `EXPO_PUBLIC_FIREBASE_APP_ID`

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
