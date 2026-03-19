# Warikan

A modern, multi-currency expense-splitting app for iOS and Android. Track shared expenses, manage travel groups, and split costs fairly across currencies with real-time exchange rates.

## Table of Contents

- [For Users](#for-users)
  - [Overview](#overview)
  - [Core Features](#core-features)
  - [Getting Started](#getting-started)
  - [Adding Transactions](#adding-transactions)
  - [Currency Management](#currency-management)
  - [Travel Groups](#travel-groups)
  - [Syncing Your Data](#syncing-your-data)
  - [Settings & Preferences](#settings--preferences)
- [For Developers](#for-developers)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the App](#running-the-app)
  - [Building APKs](#building-apks)
  - [Toolchain Requirements](#toolchain-requirements)

---

## For Users

### Overview

Warikan is a shared-expense tracker designed for travelers, roommates, and groups who need to split costs across multiple currencies. It handles complex scenarios like:

- Multi-currency transactions with automatic conversion
- Custom split percentages or itemized bills
- Group expense tracking with QR or cloud sync
- Currency acquisition tracking for accurate exchange rates
- Offline-first operation with optional cloud backup

### Core Features

#### 1. **Multi-Currency Support**
- Track transactions in 150+ currencies
- Real-time exchange rates (cached up to 12 hours)
- Log your own currency acquisitions for personalized conversion rates
- Favorite currencies for quick access

#### 2. **Flexible Expense Splitting**
- **Equal Split**: Divide costs evenly among participants
- **Custom Split**: Set exact amounts or percentages per person
- **Itemized Split**: Assign specific items to individuals

#### 3. **Travel Groups**
- Create unlimited travel groups for different trips or households
- Generate QR codes or passphrases for easy group joining
- Member names sync automatically when users join
- View group-specific balances and transaction history

#### 4. **Transaction Management**
- Add payments or currency acquisitions
- Edit past transactions (date, time, amounts, splits, currency)
- View detailed transaction breakdowns
- Delete transactions with automatic balance recalculation

#### 5. **Budget & Usage Tracking**
- Visual spending charts on Home screen
- Shows both what you paid and what you owe
- Track individual and group spending patterns
- Filter by label (Dinner, Trip, Household, Miscellaneous)

#### 6. **Sync Options**
- **QR Sync**: Scan QR codes to merge data between devices (no internet required)
- **Cloud Sync**: Optional Firebase-based sync across all your devices
- **Offline-First**: All features work without internet; sync when convenient

---

### Getting Started

#### First Launch: Onboarding

When you first open Warikan:

1. **Enter Your Name**: This name will appear to other group members
2. **Choose Your Primary Currency**: Your default currency for transactions
3. **Start Using**: You'll land on the Home screen

You can change your name and currency anytime in **Settings**.

#### Home Screen Overview

The **Home** tab shows:

- **Usage Overview Chart**: Visual breakdown of your spending by person
  - Combines what you paid + what you owe
  - Tap chart segments for detailed per-person views
- **Who Owes What**: Simplified settlement suggestions
  - Shows the minimum transfers needed to settle all balances
  - Tap **Refresh** to recalculate with latest exchange rates
- **Recent Transactions**: Quick access to your latest expenses
  - Tap any transaction to view details or edit

---

### Adding Transactions

#### Adding a Payment

From the **Add** tab (middle button):

1. **Select Mode**: Choose **Payment** (default)
2. **Enter Amount**: Type the transaction amount
3. **Select Currency**: Choose from favorites or tap "More Currencies"
   - Use the toggle to switch between favorite currencies only or all currencies
4. **Choose Exchange Rate Type**:
   - **My Rate**: Uses your logged currency acquisitions (most accurate)
   - **Market Rate**: Uses current exchange rates (locked at transaction time)
5. **Select Label**: Dinner, Trip, Household, or Miscellaneous
6. **Choose Travel Group**: Assign to a specific group or "No Group"
7. **Add Description** (optional): Note what the expense was for
8. **Select Who Owes**:
   - Tap member chips to include them in the split
   - By default, equal split is applied
9. **Adjust Split** (if needed):
   - **Equal**: Everyone pays the same amount
   - **Custom**: Set exact amounts or percentages
   - **Itemized**: Assign specific items to individuals
10. **Save**: Transaction is saved and balances update instantly

#### Adding a Currency Acquisition

When you exchange money (e.g., at an ATM or currency exchange):

From the **Add** tab:

1. **Select Mode**: Choose **Currency Acquisition**
2. **Foreign Currency**: Select what you acquired
3. **Foreign Amount**: How much you received
4. **Home Currency**: Your base currency
5. **Home Amount**: What you paid
6. **Date & Time**: When the exchange occurred
7. **Save**: Acquisition is logged for future rate calculations

**Why log acquisitions?**
- Warikan uses *your actual* exchange rates instead of market rates
- More accurate cost splitting when traveling
- Transactions using "My Rate" pull from these acquisitions

#### Editing Transactions

1. Tap any transaction in **History**, **Home**, or **Group Detail**
2. Tap **Edit Transaction** button
3. Modify any field:
   - Amount, currency, exchange rate type
   - Date and time
   - Split type and participant shares
   - Label or description
4. Save changes

**Note**: Editing preserves sync identity—changes propagate to other devices without creating duplicates.

---

### Currency Management

#### My Currencies Screen

Access from the **Currencies** tab:

- **View Your Acquisitions**: See all logged currency exchanges
- **Current Balances**: How much of each foreign currency you have
- **Exchange Rates**: View current market rates (refreshed every 12 hours)
- **Refresh Rates**: Manually update exchange rates (may use cache if recent)
- **Delete Acquisitions**: Remove logged exchanges; balances recalculate automatically

#### Setting Favorite Currencies

**Settings → Currency Preferences → Select Favorite Currencies**

1. Tap currencies to toggle favorites (checkmark + highlight)
2. Select as many as you need
3. Tap **Save**

Favorite currencies appear first in transaction screens with a small toggle to show all when needed.

#### Understanding Exchange Rates

Warikan uses two rate sources:

1. **My Rate** (Recommended):
   - Calculated from your logged currency acquisitions
   - Average of all acquisitions for that currency
   - Most accurate for your actual costs
   - Falls back to market rate if no acquisitions exist

2. **Market Rate**:
   - Fetched from `api.exchangerate-api.com`
   - Cached up to 12 hours to reduce network usage
   - Locked per transaction when selected (doesn't change retroactively)

**Rate Cache Behavior**:
- Rates are cached locally for 12 hours
- "Refresh Market Rates" may return cached data if recent
- Network failures fall back to last known cached rates
- This is intentional to ensure offline reliability

---

### Travel Groups

#### Creating a Group

**Travel** tab → **Create Group**:

1. **Group Name**: e.g., "Europe Trip 2026"
2. **Add Members**: Select from profiles or add manually
3. **Save**: Group is created and appears in your list

#### Inviting Others to Join

From **Group Detail**:

1. Tap **Generate Invite Code**
2. Share via:
   - **QR Code**: Other user scans with Warikan app
   - **Passphrase**: Simple code to type (e.g., "WARIKAN-X9K2")
   - **Copy Payload**: Raw JSON for chat apps

**Recipient Steps**:
1. Open Warikan → **Travel** tab
2. Tap **Join Group**
3. Scan QR code, paste payload, or enter passphrase
4. Confirm join

#### Managing Group Members

**Group Detail** screen:

- **View Members**: See all participants and their spending
- **Refresh Members**: Sync latest member list from cloud + local
- **Auto-Addition**: If synced transactions include unknown users, they're added automatically
- **Name Updates**: When users change their profile name, it syncs via QR/cloud

#### Viewing Group Balances

**Group Detail** shows:

- **Per-Person Balances**: Who owes what within this group
- **Transaction History**: All expenses for this group
- **Settlement Suggestions**: Tap member cards for details

#### Deleting a Group

**Group Detail → Delete Group**:

If the group has transactions:
1. **Migrate Transactions**: Move expenses to another group
2. **Skip Migration & Delete**: Remove group and mark transactions as "No Group"
3. **Cancel**: Keep the group

---

### Syncing Your Data

Warikan offers two sync methods:

#### QR Sync (No Internet Required)

**Use Case**: Sync between two devices in-person or via chat app

**On Device A (Sender)**:
1. **Home** or **QR Sync** tab → **Generate QR Code**
2. Show QR to other device, or tap **Copy Payload** to send via chat

**On Device B (Receiver)**:
1. **QR Sync** tab → **Scan QR Code**
2. Point camera at QR, or paste payload if received via text
3. Tap **Merge Payload**
4. Data merges automatically

**What Syncs**:
- Transactions (with all details)
- Currency acquisitions
- Group membership updates
- Deletion tombstones (removes deleted items)
- Profile names

**Note**: QR sync is one-way per operation. To fully sync two devices, generate and scan from both sides.

#### Cloud Sync (Automatic)

**Use Case**: Continuous sync across all your devices

**Setup**:

1. **Settings → Sync → Enable Firebase Cloud Sync**
2. If no credentials exist:
   - **Cloud Sync Setup** appears
   - Enter Firebase project credentials (API key, project ID, etc.)
   - Or configure via `.env.local` file (developers)
3. Tap **Enable** to activate

**How It Works**:
- Runs automatically in background when enabled
- Triggers on:
  - App startup
  - Adding/editing/deleting transactions
  - Joining groups
  - Manual refresh from Home screen
- Syncs bidirectionally across all devices
- Offline-friendly: queues changes when offline, syncs when reconnected

**What Syncs**:
- All transactions (including edits/deletions)
- Currency acquisitions
- Group membership
- Profile updates

**Privacy**:
- Cloud sync is **OFF by default** on each device
- You control when to enable it
- Uses Firebase anonymous authentication
- Credentials stay on your device (not committed to git)

**Disabling Cloud Sync**:

**Settings → Sync → Disable Firebase Cloud Sync**

When disabled, Warikan skips all Firebase operations and works purely locally.

---

### Settings & Preferences

#### Profile Settings

**Settings → Profile**:

- **Your Name**: Changes reflect in all groups via next sync
- **Default Currency**: Your primary currency for new transactions
- **Change Anytime**: Updates apply immediately

#### Currency Preferences

**Settings → Currency Preferences**:

- **Select Favorite Currencies**: Multi-select your commonly used currencies
  - Appear first in transaction currency picker
  - Toggle to show all currencies when needed
- **View Exchange Rates**: See current market rates
- **Refresh Rates**: Update cached rates (12-hour cache)

#### Sync Settings

**Settings → Sync**:

- **Enable/Disable Cloud Sync**: Toggle Firebase cloud backup
- **Cloud Sync Setup**: Configure Firebase credentials
- **View Sync Status**: See last sync time and status
- **Manual Sync**: Force a cloud sync operation

#### About & Info

**Settings → About**:

- App version
- Legal information
- Support links

---

### Tips & Best Practices

#### For Accurate Expense Tracking

1. **Log Currency Acquisitions**: Always add exchanges to get accurate "My Rate" calculations
2. **Sync Regularly**: Use QR sync after group outings or enable cloud sync for automatic updates
3. **Edit Mistakes Quickly**: Edit transactions rather than delete/recreate to preserve sync history
4. **Use Labels**: Categorize expenses for better spending insights

#### For Travel Groups

1. **Create Group Before Trip**: Add members early so everyone's devices are in sync
2. **Use QR Codes**: Fastest way to onboard new members in-person
3. **Refresh Members**: After QR syncs, tap "Refresh Members" in group detail to merge updates
4. **Set Favorites**: Add trip currencies to favorites for faster transaction entry

#### For Multi-Device Users

1. **Enable Cloud Sync**: Easiest way to keep devices synchronized
2. **QR Backup**: Use QR sync as backup method when internet is unavailable
3. **Consistent Profile Name**: Use the same name across devices for cleaner records

#### For Privacy-Conscious Users

1. **Keep Cloud Sync OFF**: Use only local storage + manual QR sync
2. **QR Payload Sharing**: Share via encrypted messaging apps rather than scanning
3. **Group Deletion**: Always choose "Migrate Transactions" to preserve data before deleting groups

---

### Troubleshooting

#### "Unable to load script" on Android
- Ensure you're using a **release build** (`npm run android:release`)
- Or ensure Metro is running for debug builds (`npx expo start --dev-client`)

#### Exchange rates not updating
- Rates are cached for 12 hours (intentional for offline reliability)
- Check internet connection if older than 12 hours
- Network failures fall back to last cached rates

#### Cloud sync not working
- Verify Firebase credentials in **Settings → Cloud Sync Setup**
- Check internet connection
- Ensure "Enable Cloud Sync" is ON
- Try manual refresh from **Home → Refresh**

#### Balances seem incorrect
- Tap **Refresh** on Home screen to recalculate with latest rates
- Verify all transactions have correct split configurations
- Check if currency acquisitions are properly logged

#### Group member names not updating
- Tap **Refresh Members** in Group Detail
- Ensure QR/cloud sync has occurred since name change
- Verify all devices have synced recent changes

---

## For Developers

### Prerequisites

- Node.js 20+
- npm
- Java 17 (Android Gradle Plugin requirement)
- Android SDK + platform tools (for Android)
- Full Xcode app (for iOS, not only Command Line Tools)

### Installation

```bash
npm install
```

### Running the App

```bash
# Android (debug/dev-client build)
npm run android

# iOS (debug/dev-client build)
npm run ios

# iOS release install (bundled JS, no Metro required after install)
npm run ios:release
```

`npm run android` installs a debug build and expects Metro to be running.

For USB-free reopening (no Metro dependency), install a release build:

```bash
# Android release install (bundled JS, no Metro required after install)
npm run android:release
```

`npm run android` / `npm run android:release` are configured to use Java 17 and the default macOS SDK path (`$HOME/Library/Android/sdk`) automatically.

This app uses `@expo/vector-icons` for tab icons, so `expo-font` must be installed (managed automatically via `npx expo install expo-font`).

If Android tab icons are missing while labels are visible, reinstall the app after a rebuild (`npm run android:release`). This ensures the latest icon-font changes are applied.
Warikan uses platform-specific tab icons: iOS uses Ionicons and Android uses a built-in SVG renderer for stable sizing/visibility.

#### Android debug vs release behavior

- **Debug (`npm run android`)**: requires Metro (`expo start`) and connectivity (USB reverse or same-network LAN).
- **Release (`npm run android:release`)**: includes bundled JS (`index.android.bundle`) and works without Metro after installation.

If you see:

`Unable to load script. Make sure you're either running Metro ... or that your bundle 'index.android.bundle' is packaged correctly for release.`

it means you launched a debug build without Metro reachable. Fix by either:

1. Running Metro for debug:
   - `npx expo start --dev-client --lan`
2. Installing release build:
   - `npm run android:release`

#### iOS debug vs release behavior

- **Debug (`npm run ios`)**: requires Metro (`expo start`) and connectivity while loading JS.
- **Release (`npm run ios:release`)**: includes bundled JS and works without Metro after installation.

If you see an iOS equivalent script-loading error (for example `No bundle URL present`), you launched a debug build without Metro reachable. Fix by either:

1. Running Metro for debug:
   - `npx expo start --dev-client --lan`
2. Installing release build:
   - `npm run ios:release`

### Developer Notes

#### Travel groups, labels, and invites

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

#### QR sync internals

- Generate a QR code from **QR Sync** on one device.
- Scan it on another device using the in-app camera scanner and tap **Merge Payload**.
- Use **Copy Payload** to send the sync payload over any chat app when scanning is inconvenient.
- QR sync payloads include participant profile names to improve member-name recovery during reconciliation.
- QR sync payloads include the sender's currency acquisitions so payer-specific average rates can be reused on other devices.
- QR sync payloads also include deletion tombstones so deleted transactions are removed on other devices.
- In **Home → Balance Overview**, tap **Refresh** to dedupe synced payload entries and recalculate balances with current average exchange rates.

#### Cloud sync setup (without QR)

- Do **not** commit Firebase secrets to git.
- Firebase cloud sync can be turned ON/OFF from **Settings → Sync → Enable/Disable Firebase Cloud Sync**.
- Cloud sync is **OFF by default** on each device; when OFF, all Firebase calls are skipped.
- Preferred setup: create `.env.local` (gitignored) using `.env.example` and set `EXPO_PUBLIC_FIREBASE_*` values there.
- You can also configure Firebase on-device via **Settings → Sync → Cloud Sync Setup**.
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

### Building APKs

```bash
# Debug APK
cd android
JAVA_HOME=/opt/homebrew/opt/openjdk@17 PATH=/opt/homebrew/opt/openjdk@17/bin:$PATH ./gradlew assembleDebug --no-daemon

# Release APK
cd android
JAVA_HOME=/opt/homebrew/opt/openjdk@17 PATH=/opt/homebrew/opt/openjdk@17/bin:$PATH ./gradlew assembleRelease --no-daemon
```

APK outputs:

`android/app/build/outputs/apk/debug/app-debug.apk`

`android/app/build/outputs/apk/release/app-release.apk`

### Toolchain Requirements

#### Android

If you see SDK/ADB errors, ensure:

- SDK root exists at `~/Library/Android/sdk` (or set `ANDROID_HOME`)
- `adb` is available in PATH
- Java runtime is 17 for Gradle builds (Java 11 is too old, Java 25 can break Gradle/Groovy compatibility)
- SDK packages include:
  - `platform-tools`
  - `platforms;android-35`
  - `build-tools;35.0.0`
- An emulator is running, or a physical device is connected with USB debugging enabled.

#### iOS

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

### Testing & Validation

```bash
# Type checking
npm run typecheck

# Run all tests
npm test

# Run tests in serial (useful for CI)
npm test -- --runInBand
```

### Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── common/      # Buttons, cards, inputs
│   └── transaction/ # Transaction-specific components
├── constants/       # Design tokens, colors, spacing
├── navigation/      # React Navigation setup
├── screens/         # App screens (Home, Add, History, etc.)
├── services/        # Business logic
│   ├── database/   # SQLite operations
│   ├── firebase.ts # Cloud sync
│   ├── exchangeRate.ts # Currency rates
│   └── syncService.ts  # QR/cloud sync orchestration
├── store/          # Zustand state management
├── types/          # TypeScript type definitions
└── utils/          # Helper functions
```

### Key Technical Details

#### Data Persistence
- **Local**: SQLite database via `expo-sqlite`
- **Cloud**: Firebase Firestore (optional)
- **Sync**: Merge-based sync with tombstones for deletions

#### State Management
- Zustand for global state (transactions, users, groups)
- React Context for theme/navigation
- AsyncStorage for preferences (favorites, settings)

#### Exchange Rates
- Source: `api.exchangerate-api.com`
- Cache: 12 hours in AsyncStorage
- Fallback: Last known cached rates on network failure

#### Transaction Metadata
Each transaction includes:
- `occurredAt`: User-editable timestamp (defaults to creation time)
- `appliedRateType`: "my_rate" or "market_rate"
- `appliedRateValue`: Exchange rate locked at transaction time
- Sync identity fields: `localId`, `cloudId`, `deviceId`

#### Sync Architecture
- **QR Sync**: One-way payload merge (manual trigger)
- **Cloud Sync**: Bidirectional with conflict resolution
- **Tombstones**: Deleted items sync as deletion markers
- **Reconciliation**: Member profiles sync with name updates
