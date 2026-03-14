# Warikan - Comprehensive Technical Specification

> A multi-currency expense splitting app for iOS and Android

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Data Models](#3-data-models)
4. [Core Features](#4-core-features)
5. [Exchange Rate Algorithm](#5-exchange-rate-algorithm)
6. [UI/UX Design System](#6-ux-design-system)
7. [Screen Flow](#7-screen-flow)
8. [API Integrations](#8-api-integrations)
9. [Directory Structure](#9-directory-structure)
10. [Implementation Steps](#10-implementation-steps)
11. [Edge Cases](#11-edge-cases)

---

## 1. Project Overview

### Basic Information
- **Project Name**: Warikan (割り勘 - Japanese for "splitting the bill")
- **Type**: Cross-platform mobile application (iOS & Android)
- **Core Functionality**: Track shared expenses with multi-currency support, automatic balance calculation, and flexible sync options
- **Target Users**: Friends, roommates, travel groups who share expenses

### Supported Currencies
- USD (US Dollar) - Default base currency
- EUR (Euro)
- GBP (British Pound)
- BAM (Bosnia and Herzegovina Convertible Mark)
- *(Extensible)*

### Key Features
1. Track expenses with multiple people
2. Multi-currency support with fee handling
3. Automatic weighted average currency conversion
4. Cloud sync (Firebase) + QR code offline sync
5. Works fully offline

---

## 2. Tech Stack

### Framework & Language
| Component | Technology | Version |
|-----------|------------|---------|
| Framework | React Native (Expo) | SDK 52+ |
| Language | TypeScript | 5.x |
| Runtime | Node.js | 20.x LTS |

### Required Dependencies
```json
{
  "dependencies": {
    "expo": "~52.0.0",
    "react": "18.3.1",
    "react-native": "0.76.5",
    "@react-navigation/native": "^7.0.0",
    "@react-navigation/bottom-tabs": "^7.0.0",
    "@react-navigation/stack": "^7.0.0",
    "react-native-screens": "~4.4.0",
    "react-native-safe-area-context": "~4.14.0",
    "react-native-gesture-handler": "~2.20.0",
    "@react-native-async-storage/async-storage": "1.23.1",
    "expo-sqlite": "~15.0.6",
    "expo-camera": "~16.0.0",
    "expo-qrcode": "~14.0.0",
    "zustand": "^5.0.0",
    "decimal.js": "^10.4.3",
    "date-fns": "^4.0.0",
    "uuid": "^11.0.0"
  },
  "devDependencies": {
    "@types/react": "~18.3.0",
    "@types/uuid": "^10.0.0",
    "typescript": "~5.3.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.0"
  }
}
```

### Backend
| Component | Technology | Purpose |
|-----------|------------|---------|
| Database | Firebase Firestore | Cloud sync & real-time updates |
| Authentication | Firebase Auth | User identity (anonymous for now) |

### State Management
- **Zustand** for global state (lightweight, TypeScript-friendly)
- Separate stores: userStore, groupStore, transactionStore, syncStore

---

## 3. Data Models

### 3.1 User
```typescript
interface User {
  id: string;                    // UUID
  name: string;                  // Display name
  baseCurrency: string;          // Default: "USD"
  createdAt: number;             // Unix timestamp (ms)
  updatedAt: number;             // Unix timestamp (ms)
  lastSyncedAt: number;          // For QR sync delta
}
```

### 3.2 Group
```typescript
interface Group {
  id: string;                    // UUID
  name: string;                  // e.g., "Dinner", "Trip to Japan"
  isDefault: boolean;            // true for system defaults
  createdBy: string;             // User ID who created
  memberIds: string[];           // Array of user IDs
  createdAt: number;
  updatedAt: number;
}

// Default Groups (pre-created on first launch)
const DEFAULT_GROUPS = [
  { name: "Dinner", isDefault: true },
  { name: "Trip", isDefault: true },
  { name: "Household", isDefault: true },
  { name: "Miscellaneous", isDefault: true }
];
```

### 3.3 CurrencyAcquisition
```typescript
interface CurrencyAcquisition {
  id: string;
  userId: string;
  currency: string;              // Target currency (e.g., "JPY")
  amount: number;                // Foreign currency received (e.g., 1000)
  paidAmount: number;            // Home currency paid (e.g., 10)
  rate: number;                  // Calculated: amount / paidAmount
  acquiredAt: number;            // Unix timestamp
  note?: string;                 // Optional note
}
```

### 3.4 Transaction
```typescript
interface Transaction {
  id: string;
  groupId: string;
  payerId: string;               // Who paid
  amount: number;                // Original amount in originalCurrency
  originalCurrency: string;      // Currency of the expense
  fee: number;                  // Transaction fee in originalCurrency
  convertedAmount: number;       // Converted to payer's base currency
  note: string;                  // What was it for
  splitType: "equal" | "custom";
  splits: Split[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  syncId: string;                // Unique ID for QR sync duplicate detection
}
```

### 3.5 Split
```typescript
interface Split {
  userId: string;
  amount: number;                // Amount owed in payer's base currency
  isPaid: boolean;               // Whether settled
}
```

### 3.6 ExchangeRate (for display only)
```typescript
interface ExchangeRate {
  currency: string;
  rateToUSD: number;             // 1 USD = X currency
  updatedAt: number;
}
```

---

## 4. Core Features

### Phase 1: Core Functionality

#### 4.1 User Onboarding
- First launch: Prompt user to enter name
- Select base currency from supported list (USD, EUR, GBP, BAM)
- Store locally in SQLite
- No authentication required (local-only mode)

#### 4.2 Group Management
- **Default Groups**: Created on first launch (Dinner, Trip, Household, Miscellaneous)
- **Create Group**: User enters custom name
- **Delete Group**:
  - Only non-default groups can be deleted by their creator
  - If group has transactions:
    - Show warning modal with 3 options:
      1. Migrate: Select another group to move transactions to
      2. Delete anyway: Move transactions to "Miscellaneous"
      3. Skip: Cancel deletion, keep group as-is

#### 4.3 Add Transaction (Multi-step Form)
**Step 1: Select Group**
- Dropdown/picker with all groups
- Show recent groups first

**Step 2: Enter Amount**
- Number input for amount
- Currency picker (USD, EUR, GBP, BAM + user's other acquired currencies)
- Optional fee input (in original currency)

**Step 3: Who Paid**
- Single-select from group members + current user
- Default: Current user

**Step 4: Who Owes**
- Multi-select from group members + current user
- Default: All group members except payer
- Minimum: 1 person

**Step 5: Split Type**
- **Equal Split**: Divide equally among selected people
- **Custom Split**: Manually enter amount for each person
- Show real-time preview of split amounts

**Step 6: Note**
- Text input (optional but recommended)
- Placeholder: "What was this for?"

**Step 7: Review & Submit**
- Summary screen showing all details
- Confirm button to save

#### 4.4 Balance Display
- **Home Screen**:
  - Total you owe (sum of all negative balances)
  - Total owed to you (sum of all positive balances)
  - Per-person breakdown with direction indicators
- **Group Detail**: Show all transactions in group with running balance

#### 4.5 Local Storage
- All data stored in expo-sqlite
- Works fully offline
- Auto-save on every action

### Phase 2: Multi-Currency & Fees

#### 4.6 Currency Acquisition Logging
- Access via: Settings → My Currencies → Add Acquisition
- Input fields:
  - Currency (e.g., JPY)
  - Amount received (e.g., 1000 JPY)
  - Amount paid (e.g., 10 USD)
  - Date (default: now)
  - Optional note
- System calculates rate: amount / paidAmount

#### 4.7 Transaction Conversion
- Convert original amount + fee using payer's average acquisition rate
- Display both original currency and converted amount

#### 4.8 Balance Display (Dual Currency)
- Show balance in:
  1. Payers base currency (primary)
  2. Your base currency (converted using market rate for display)
- Update exchange rates once/twice daily from API

### Phase 3: Sync & Sharing

#### 4.9 Firebase Cloud Sync
- Real-time sync via Firestore listeners
- Offline support with queued changes
- Conflict resolution: Last-write-wins

#### 4.10 QR Code Sync
- **Generate QR**: Export transactions since last sync as compressed JSON
- **Scan QR**: Parse and merge transactions
- **Merge Logic**:
  1. Compare syncId with local transactions
  2. Add new transactions (different syncId)
  3. Skip duplicates (same syncId)
  4. Recalculate all balances

---

## 5. Exchange Rate Algorithm

### 5.1 Weighted Average Calculation

```typescript
// Get user's average acquisition rate for a currency
function getAverageRate(userId: string, targetCurrency: string, db: Database): number {
  const acquisitions = db.getCurrencyAcquisitions(userId, targetCurrency);
  
  if (acquisitions.length === 0) return null;
  
  const totalForeign = acquisitions.reduce((sum, a) => sum + a.amount, 0);
  const totalPaid = acquisitions.reduce((sum, a) => sum + a.paidAmount, 0);
  
  return totalForeign / totalPaid;
}

// Example:
// Acquisition 1: 1000 JPY for 10 USD → 100 JPY/USD
// Acquisition 2: 1000 JPY for 8 USD → 125 JPY/USD
// Average: (1000 + 1000) / (10 + 8) = 2000/18 = 111.11 JPY/USD
```

### 5.2 Transaction Conversion

```typescript
function convertToBaseCurrency(
  amount: number,
  fee: number,
  fromCurrency: string,
  userId: string,
  db: Database
): number {
  // If same currency, no conversion needed
  if (fromCurrency === userBaseCurrency) return amount + fee;
  
  // Get user's average acquisition rate
  const avgRate = getAverageRate(userId, fromCurrency, db);
  
  if (!avgRate) {
    // No acquisition history - use market rate
    const marketRate = getMarketRate(fromCurrency, userBaseCurrency);
    return (amount + fee) / marketRate;
  }
  
  // Use average acquisition rate (what it actually cost them)
  return (amount + fee) / avgRate;
}
```

### 5.3 Past Transaction Updates

```typescript
// When new acquisition is added, recalculate all past transactions
function recalculateTransactions(userId: string, currency: string, db: Database): void {
  const newRate = getAverageRate(userId, currency, db);
  const transactions = db.getTransactionsByCurrency(userId, currency);
  
  for (const tx of transactions) {
    const baseAmount = tx.amount + tx.fee;
    tx.convertedAmount = baseAmount / newRate;
    tx.updatedAt = Date.now();
    db.updateTransaction(tx);
  }
  
  // Recalculate all balances
  recalculateBalances(db);
}
```

---

## 6. UI/UX Design System

### 6.1 Color Palette (Modern/Bold Dark Theme)
```typescript
export const colors = {
  primary: '#6366F1',        // Indigo - main actions
  primaryDark: '#4F46E5',   // Darker indigo - pressed
  primaryLight: '#818CF8',  // Lighter - highlights
  secondary: '#EC4899',      // Pink - accents
  success: '#10B981',       // Green - positive balance
  successLight: '#34D399',  // Light green
  danger: '#EF4444',         // Red - negative balance
  dangerLight: '#F87171',   // Light red
  warning: '#F59E0B',       // Amber - warnings
  warningLight: '#FBBF24',  // Light amber
  background: '#0F172A',    // Dark slate - main bg
  surface: '#1E293B',       // Lighter slate - cards
  surfaceLight: '#334155',  // Even lighter - inputs
  surfaceLighter: '#475569',// Borders
  textPrimary: '#F8FAFC',   // White - main text
  textSecondary: '#94A3B8', // Gray - secondary text
  textTertiary: '#64748B',  // Darker gray - hints
  border: '#475569',        // Gray - borders
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};
```

### 6.2 Typography
```typescript
export const typography = {
  fontFamily: {
    regular: 'System',
    bold: 'System',
  },
  sizes: {
    h1: 32,         // Screen titles
    h2: 24,         // Section headers
    h3: 20,         // Card titles
    h4: 18,         // Subheaders
    body: 16,       // Main text
    bodySmall: 14,  // Secondary text
    caption: 12,    // Labels, hints
    xs: 10,         // Very small
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};
```

### 6.3 Spacing System (8pt Grid)
```typescript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};
```

### 6.4 Border Radius
```typescript
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};
```

### 6.5 Component Specifications
- **Buttons**: Rounded (12px), bold colors, clear pressed states (scale 0.98, opacity 0.8)
- **Cards**: Rounded (16px), surface color background, subtle shadow
- **Inputs**: Rounded (8px), surfaceLight background, border on focus (primary color)
- **Modals**: Bottom sheet style with drag indicator
- **Icons**: Outlined style, 24px default size

---

## 7. Screen Flow

### 7.1 Navigation Structure
```
Root (Stack Navigator)
├── Onboarding (if no user data)
└── Main (Tab Navigator)
    ├── Home (Tab 1) - Balance Overview
    ├── Groups (Tab 2) - Group List
    ├── Add Transaction (Modal Stack)
    │   ├── Step 1: Select Group
    │   ├── Step 2: Amount & Currency
    │   ├── Step 3: Who Paid
    │   ├── Step 4: Who Owes
    │   ├── Step 5: Split Type
    │   └── Step 6: Note & Review
    ├── History (Tab 3) - All Transactions
    └── Settings (Tab 4)
        ├── Profile
        ├── My Currencies (Add Acquisition)
        ├── Sync Settings
        ├── QR Sync
        └── About
```

### 7.2 Screen Descriptions

#### Home Screen
- Balance summary cards (you owe / owed to you)
- Per-person breakdown list
- Recent transactions (last 5)
- Quick action button: Add Expense

#### Groups Screen
- List of all groups with member count and balance
- FAB to create new group
- Swipe to delete (non-default groups)

#### Add Transaction Screen (Modal)
- Step indicator at top
- Back/Next navigation
- Form inputs with validation
- Preview of split amounts

#### History Screen
- Chronological list of all transactions
- Filter by group, date range
- Search by note

#### Settings Screen
- User profile (name, base currency)
- Currency wallet management
- Cloud sync toggle
- QR code sync button
- App info

---

## 8. API Integrations

### 8.1 Exchange Rate API
**Provider**: ExchangeRate-API (free tier)

**Endpoint**: 
```
GET https://api.exchangerate-api.com/v4/latest/USD
```

**Response**:
```json
{
  "base": "USD",
  "date": "2024-01-15",
  "rates": {
    "EUR": 0.92,
    "GBP": 0.79,
    "JPY": 148.5,
    "BAM": 1.78
  }
}
```

**Implementation**:
- Fetch once on app launch
- Cache in AsyncStorage
- Update every 12 hours
- Use for display conversion only (not debt calculation)

### 8.2 Firebase Configuration

**Required Setup**:
1. Create Firebase project
2. Enable Firestore
3. Enable Anonymous Auth
4. Copy config to app

**Firestore Security Rules** (for future auth):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /groups/{groupId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 9. Directory Structure

```
Warikan/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Typography.tsx
│   │   │   ├── Picker.tsx
│   │   │   └── index.ts
│   │   ├── transaction/
│   │   │   ├── TransactionCard.tsx
│   │   │   ├── TransactionForm.tsx
│   │   │   ├── SplitInput.tsx
│   │   │   └── index.ts
│   │   ├── group/
│   │   │   ├── GroupCard.tsx
│   │   │   ├── GroupPicker.tsx
│   │   │   └── index.ts
│   │   ├── balance/
│   │   │   ├── BalanceOverview.tsx
│   │   │   ├── PersonBalance.tsx
│   │   │   └── index.ts
│   │   └── sync/
│   │       ├── QRGenerator.tsx
│   │       ├── QRScanner.tsx
│   │       └── index.ts
│   │
│   ├── screens/
│   │   ├── OnboardingScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── GroupsScreen.tsx
│   │   ├── GroupDetailScreen.tsx
│   │   ├── AddTransactionScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── CurrencyWalletScreen.tsx
│   │   ├── AddAcquisitionScreen.tsx
│   │   ├── QRSyncScreen.tsx
│   │   └── index.ts
│   │
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   ├── MainTabNavigator.tsx
│   │   ├── AddTransactionNavigator.tsx
│   │   └── types.ts
│   │
│   ├── store/
│   │   ├── userStore.ts
│   │   ├── groupStore.ts
│   │   ├── transactionStore.ts
│   │   ├── currencyStore.ts
│   │   ├── syncStore.ts
│   │   └── index.ts
│   │
│   ├── services/
│   │   ├── database/
│   │   │   ├── database.ts        # SQLite initialization
│   │   │   ├── userDb.ts          # User CRUD
│   │   │   ├── groupDb.ts         # Group CRUD
│   │   │   ├── transactionDb.ts    # Transaction CRUD
│   │   │   ├── currencyDb.ts       # Currency acquisition CRUD
│   │   │   └── index.ts
│   │   ├── firebase.ts            # Firebase config (stub for now)
│   │   ├── exchangeRate.ts        # Exchange rate API
│   │   ├── currencyCalculator.ts  # Average rate calculations
│   │   ├── balanceCalculator.ts   # Balance calculation
│   │   └── syncService.ts         # QR sync logic
│   │
│   ├── utils/
│   │   ├── formatCurrency.ts
│   │   ├── calculateBalance.ts
│   │   ├── generateId.ts
│   │   ├── dateUtils.ts
│   │   └── index.ts
│   │
│   ├── constants/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   ├── currencies.ts
│   │   ├── defaultGroups.ts
│   │   └── index.ts
│   │
│   ├── types/
│   │   ├── user.ts
│   │   ├── group.ts
│   │   ├── transaction.ts
│   │   ├── currency.ts
│   │   ├── exchangeRate.ts
│   │   └── index.ts
│   │
│   └── hooks/
│       ├── useDatabase.ts
│       ├── useBalance.ts
│       ├── useExchangeRate.ts
│       └── index.ts
│
├── App.tsx
├── app.json
├── package.json
├── tsconfig.json
├── babel.config.js
└── metro.config.js
```

---

## 10. Implementation Steps

### Step 1: Project Setup
```bash
# Create Expo project
npx create-expo-app@latest Warikan --template blank-typescript

# Install dependencies
cd Warikan
npx expo install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
npx expo install react-native-screens react-native-safe-area-context react-native-gesture-handler
npx expo install @react-native-async-storage/async-storage expo-sqlite
npx expo install expo-camera expo-qrcode
npx expo install zustand decimal.js date-fns uuid

# Install dev dependencies
npm install --save-dev @types/uuid @types/jest jest ts-node
```

### Step 2: Database Setup
- Initialize expo-sqlite
- Create tables: users, groups, transactions, currency_acquisitions, exchange_rates
- Implement CRUD operations

### Step 3: State Management
- Create Zustand stores
- Connect to database operations

### Step 4: Core Features
- Onboarding flow
- Group management
- Transaction creation
- Balance calculation

### Step 5: Multi-Currency
- Currency acquisition logging
- Weighted average calculation
- Transaction conversion

### Step 6: Sync
- QR code generation
- QR code scanning
- Merge logic

### Step 7: Testing
- Unit tests for:
  - Balance calculation
  - Currency conversion
  - Weighted average rate
  - QR merge

---

## 11. Edge Cases

| Scenario | Handling |
|----------|----------|
| No currency acquisition history | Use market rate with warning badge |
| Delete group with transactions | Show modal: Migrate / Delete to Miscellaneous / Skip |
| Same person in multiple groups | Calculate separately per group |
| Negative balance (they owe you) | Show as positive in "they owe" section |
| Currency not in acquisition history | Prompt user to add acquisition |
| QR sync conflicts | Last-write-wins based on timestamp |
| Offline for extended period | Queue changes, sync on reconnect |
| Empty group (no members) | Allow, show empty state |
| Transaction with 0 amount | Show validation error |
| Very large numbers | Use decimal.js for precision |

---

## 12. Testing Strategy

### Unit Tests (Jest)

```typescript
// __tests__/currencyCalculator.test.ts
import { getAverageRate, convertToBaseCurrency } from '../services/currencyCalculator';

describe('Currency Calculator', () => {
  test('calculates weighted average correctly', () => {
    const acquisitions = [
      { amount: 1000, paidAmount: 10 },  // 100 JPY/USD
      { amount: 1000, paidAmount: 8 },   // 125 JPY/USD
    ];
    const avgRate = getAverageRate(acquisitions);
    expect(avgRate).toBeCloseTo(111.11, 1);
  });

  test('converts transaction using average rate', () => {
    const amount = 3000;
    const avgRate = 111.11;
    const converted = convertToBaseCurrency(amount, 0, avgRate);
    expect(converted).toBeCloseTo(27, 0);
  });
});

// __tests__/balanceCalculator.test.ts
import { calculateBalances } from '../services/balanceCalculator';

describe('Balance Calculator', () => {
  test('calculates correct balances for equal split', () => {
    const transactions = [
      {
        payerId: 'user1',
        splits: [
          { userId: 'user2', amount: 33.33 },
          { userId: 'user3', amount: 33.33 },
        ],
      },
    ];
    const balances = calculateBalances('user1', transactions);
    expect(balances['user2']).toBe(-33.33);
    expect(balances['user3']).toBe(-33.33);
  });
});

// __tests__/syncService.test.ts
import { mergeTransactions } from '../services/syncService';

describe('Sync Service', () => {
  test('detects and skips duplicates', () => {
    const local = [
      { id: '1', syncId: 'sync-1', amount: 100 },
      { id: '2', syncId: 'sync-2', amount: 200 },
    ];
    const imported = [
      { id: '3', syncId: 'sync-2', amount: 200 }, // duplicate
      { id: '4', syncId: 'sync-3', amount: 300 },  // new
    ];
    const merged = mergeTransactions(local, imported);
    expect(merged.length).toBe(3);
  });
});
```

---

## 13. Summary

This specification provides all the information needed to build the Warikan app:

1. **Tech Stack**: React Native + Expo + TypeScript + SQLite + Zustand
2. **Data Models**: Complete TypeScript interfaces for all entities
3. **Features**: 3-phase implementation (Core → Multi-Currency → Sync)
4. **Algorithm**: Weighted average for currency conversion
5. **Design**: Modern bold dark theme with 8pt grid
6. **Testing**: Unit tests for core business logic

An LLM can read this spec and implement the complete application following the directory structure and implementation steps.
