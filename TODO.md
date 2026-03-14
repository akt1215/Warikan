# Warikan - TODO List

This document outlines remaining tasks to fully implement the features defined in PLAN.md.

---

## 1. Firebase Cloud Sync

### Status: Not Implemented (Stub Only)

**Current State:**
- `src/services/firebase.ts` contains only a stub class that returns `enabled = false`
- No Firebase configuration, Firestore integration, or authentication

**Tasks:**

- [ ] **1.1 Firebase Project Setup**
  - [ ] Create Firebase project at https://console.firebase.google.com
  - [ ] Enable Firestore Database
  - [ ] Enable Authentication (Anonymous provider)
  - [ ] Copy Firebase config (apiKey, authDomain, projectId, etc.)

- [ ] **1.2 Install Firebase SDK**
  ```bash
  npx expo install firebase
  ```

- [ ] **1.3 Configure Firebase**
  - [ ] Create `src/services/firebase/config.ts` with Firebase config
  - [ ] Initialize Firebase app in `src/services/firebase/index.ts`
  - [ ] Export initialized auth and firestore instances

- [ ] **1.4 Implement Firestore Sync**
  - [ ] Create user document structure in Firestore
  - [ ] Implement `pushTransactions()` to upload local transactions
  - [ ] Implement `pullTransactions()` to download remote transactions
  - [ ] Add Firestore real-time listeners for live updates
  - [ ] Handle offline persistence with `enableIndexedDbPersistence()`

- [ ] **1.5 Sync Store Integration**
  - [ ] Add Firebase toggle in Settings screen
  - [ ] Implement sync on app launch
  - [ ] Implement periodic background sync
  - [ ] Add conflict resolution (last-write-wins based on `updatedAt`)

---

## 2. Multi-Step Transaction Form

### Status: Single Screen (Should Be 7-Step Wizard)

**Current State:**
- All fields on one screen (`AddTransactionScreen.tsx`)
- No step indicator
- No wizard-style navigation

**Tasks:**

- [ ] **2.1 Create Step Navigator**
  - [ ] Create `src/navigation/AddTransactionStack.tsx`
  - [ ] Define step params: `SelectGroup`, `EnterAmount`, `WhoPaid`, `WhoOwes`, `SplitType`, `Note`, `Review`

- [ ] **2.2 Step 1: Select Group**
  - [ ] Reuse existing GroupPicker component
  - [ ] Show recent groups first
  - [ ] "Next" button to proceed

- [ ] **2.3 Step 2: Enter Amount**
  - [ ] Number input for amount
  - [ ] Currency picker (supported + acquired currencies)
  - [ ] Optional fee input (in original currency)
  - [ ] "Next" / "Back" navigation

- [ ] **2.4 Step 3: Who Paid**
  - [ ] Single-select from group members + current user
  - [ ] Default: current user
  - [ ] Handle case where payer is also in "Who Owes" list

- [ ] **2.5 Step 4: Who Owes**
  - [ ] Multi-select from group members
  - [ ] Pre-select all except payer
  - [ ] Minimum 1 person validation
  - [ ] "Next" / "Back" navigation

- [ ] **2.6 Step 5: Split Type**
  - [ ] Toggle between "Equal" and "Custom"
  - [ ] Equal: show calculated split preview
  - [ ] Custom: allow manual amount entry per person
  - [ ] Real-time preview of split amounts
  - [ ] Validation: splits must equal total amount

- [ ] **2.7 Step 6: Note**
  - [ ] Text input with placeholder "What was this for?"
  - [ ] Optional but recommended
  - [ ] "Next" / "Back" navigation

- [ ] **2.8 Step 7: Review & Submit**
  - [ ] Summary showing all details
  - [ ] Group name
  - [ ] Amount, currency, fee
  - [ ] Payer name
  - [ ] Split breakdown
  - [ ] Note
  - [ ] Confirm button to save
  - [ ] "Back" to edit

- [ ] **2.9 Step Indicator UI**
  - [ ] Horizontal stepper at top showing progress
  - [ ] Current step highlighted
  - [ ] Completed steps marked

---

## 3. Group Deletion with Transactions

### Status: Basic Delete (Missing Migration Modal)

**Current State:**
- `deleteGroup()` in `groupStore.ts` simply removes the group
- No check for transactions
- No warning modal with migration options

**Tasks:**

- [ ] **3.1 Add Transaction Count Check**
  - [ ] Create `countTransactionsByGroup(groupId)` in `transactionDb.ts`
  - [ ] Call this before deletion to check if group has transactions

- [ ] **3.2 Create Delete Group Modal**
  - [ ] Create `src/components/group/DeleteGroupModal.tsx`
  - [ ] Show when group has transactions
  - [ ] Display warning message

- [ ] **3.3 Implement Migration Options**
  - [ ] **Option 1: Migrate**
    - [ ] Dropdown to select target group
    - [ ] Move all transactions to target group
    - [ ] Delete source group

  - [ ] **Option 2: Delete Anyway**
    - [ ] Move all transactions to "Miscellaneous" group
    - [ ] Delete source group

  - [ ] **Option 3: Skip**
    - [ ] Close modal
    - [ ] Keep group unchanged

- [ ] **3.4 Update GroupsScreen**
  - [ ] Add swipe-to-delete gesture
  - [ ] Trigger modal for groups with transactions
  - [ ] Allow immediate delete for groups without transactions

---

## 4. Jest Unit Tests

### Status: No Tests

**Tasks:**

- [ ] **4.1 Setup Jest**
  - [ ] Verify Jest is configured in `package.json`
  - [ ] Create `jest.config.js` if needed
  - [ ] Create `__tests__` directory

- [ ] **4.2 Currency Calculator Tests**
  - [ ] `getAverageRate()` - weighted average calculation
  - [ ] `convertToBaseCurrency()` - conversion with acquisition rate
  - [ ] `convertToBaseCurrency()` - conversion with market rate (no acquisitions)
  - [ ] Edge case: zero acquisitions
  - [ ] Edge case: single acquisition

- [ ] **4.3 Balance Calculator Tests**
  - [ ] `calculateBalances()` - equal split between 2 people
  - [ ] `calculateBalances()` - equal split between 3+ people
  - [ ] `calculateBalances()` - custom split
  - [ ] `calculateBalances()` - multiple transactions
  - [ ] `calculateBalances()` - same person in multiple groups (separate calculation)

- [ ] **4.4 Sync Service Tests**
  - [ ] `mergeTransactions()` - detect duplicates (same syncId)
  - [ ] `mergeTransactions()` - add new transactions
  - [ ] `mergeTransactions()` - last-write-wins conflict resolution

- [ ] **4.5 Group Invite Tests**
  - [ ] `createGroupInvitePayload()` - generate valid payload
  - [ ] `parseGroupInviteInput()` - parse valid input
  - [ ] `mergeGroupMembers()` - merge without duplicates
  - [ ] `mergeGroupMembers()` - prioritize earlier join dates

---

## 5. Past Transaction Recalculation

### Status: Not Implemented

**Current State:**
- New acquisitions are saved to database
- Past transactions are NOT recalculated when new acquisition is added

**Tasks:**

- [ ] **5.1 Recalculation Trigger**
  - [ ] In `AddAcquisitionScreen.tsx` or `currencyStore.ts`
  - [ ] After successful acquisition save, trigger recalculation

- [ ] **5.2 Implement Recalculation Logic**
  - [ ] Create `recalculateTransactionsForCurrency()` in `currencyDb.ts`
  - [ ] Get all transactions with originalCurrency matching new acquisition
  - [ ] Recalculate `convertedAmount` using new average rate
  - [ ] Update `updatedAt` timestamp for each transaction

- [ ] **5.3 Balance Recalculation**
  - [ ] After transaction recalculation, recalculate all balances
  - [ ] Update any cached balance data

- [ ] **5.4 User Feedback**
  - [ ] Show loading indicator during recalculation
  - [ ] Show success message when complete

---

## 6. "Who Paid" Payer Selection

### Status: Missing (Currently Assumes Current User)

**Current State:**
- In `AddTransactionScreen.tsx`, `payerId` is hardcoded to `user.id`
- No step or option to select who paid

**Tasks:**

- [ ] **6.1 Add Payer Selection to Form**
  - [ ] Add "Who Paid?" section in transaction form
  - [ ] Single-select from group members
  - [ ] Default to current user

- [ ] **6.2 Update Transaction Creation**
  - [ ] Change `payerId` from `user.id` to selected payer ID
  - [ ] Validate that payer exists in group members

- [ ] **6.3 Update Balance Calculation**
  - [ ] Ensure balances calculate correctly when payer != current user
  - [ ] Test: user A pays for user B - should show A is owed

---

## 7. Additional Improvements

### 7.1 Exchange Rate Caching
- [ ] Store exchange rates in SQLite instead of AsyncStorage (for consistency)
- [ ] Add last updated timestamp display in Settings

### 7.2 Group Member Management
- [ ] Add ability to add/remove members from existing groups
- [ ] Add member rename functionality

### 7.3 Transaction Editing
- [ ] Allow editing existing transactions
- [ ] Allow deleting transactions

### 7.4 Offline Queue
- [ ] Queue changes when offline
- [ ] Sync when connection restored
- [ ] Show pending sync indicator

---

## Priority Order

1. **High Priority** (Core Functionality)
   - Multi-step transaction form (7 steps)
   - Payer selection
   - Group deletion with migration

2. **Medium Priority** (Data Integrity)
   - Past transaction recalculation
   - Unit tests for core business logic

3. **Low Priority** (Nice to Have)
   - Firebase cloud sync
   - Offline queue

---

## Notes

- Some features may already exist but under different names/structures
- Always verify existing code before implementing new features
- Run `npm run typecheck` after any changes
- Test on both iOS and Android when possible
