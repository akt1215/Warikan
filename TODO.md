# Warikan - Current Stage TODO

This TODO reflects the current real state of the app: what is working now, what is partially complete, and what still needs implementation.

---

## 1) Working Now (Implemented)

- [x] Travel groups are separate from transaction labels.
- [x] Group invite/join works with QR code and passphrase.
- [x] Group member names come from user profile on join.
- [x] Group member refresh exists and can merge local/cloud state (when cloud sync is enabled).
- [x] Missing transaction participants are auto-reconciled into local group membership.

- [x] Add Transaction supports payer selection from group members.
- [x] Add Transaction supports debtor/member selection from group members.
- [x] Transaction labels (`Dinner`, `Trip`, `Household`, `Miscellaneous`) are independent from travel groups.
- [x] Balance view displays user names (not raw user IDs) when profile/member data exists.

- [x] Balance refresh reprocesses transactions and deduplicates synced payload entries.
- [x] FX recalculation uses payer-owned acquisitions (`payerId`) when available.
- [x] Currency acquisitions are shared through sync payloads so payer-rate recalculation can work across devices.

- [x] User can delete own transactions.
- [x] User can delete own currency acquisitions.
- [x] Transaction deletions propagate via tombstones (QR + cloud sync).
- [x] Group deletion flow supports migrate, skip migration + delete, and cancel.

- [x] QR sync supports real QR generation/scanning and text fallback.
- [x] Copy-to-clipboard exists for sync payloads and invite passphrases.

- [x] Cloud sync via Firebase is implemented (transactions, groups, tombstones, acquisitions).
- [x] Cloud sync scope now expands by discovering groups where the current user is a member.
- [x] Cloud sync diagnostics/messages include scope/pull/push/no-op info.
- [x] Firebase usage has a global device-local toggle in Settings.
- [x] Firebase cloud sync defaults to OFF; when OFF, Firebase calls are skipped.

- [x] Sensitive Firebase values were removed from tracked source.
- [x] `.env.example` and `.gitignore` support secret-safe setup.
- [x] Unit tests exist for core sync/currency/balance/invite/reconciliation logic.

---

## 2) Partially Complete / Needs Real-Device Verification

- [ ] Verify cloud sync end-to-end across two physical devices in daily use scenarios:
  - create/update/delete transaction on device A -> appears correctly on device B
  - group member join/refresh propagation
  - payer-rate recalculation consistency after acquisition sync
  - tombstone deletion propagation without stale resurrection

- [ ] Validate cloud toggle UX behavior in real usage:
  - OFF should never surface Firebase auth/config/runtime errors
  - ON should resume normal cloud sync behavior without reinstall

---

## 3) Not Implemented Yet (Backlog)

- [ ] Multi-step transaction wizard flow (if still desired)
  - current flow works, but is still not a full step-by-step wizard

- [ ] Transaction editing
  - users can create/delete, but edit flow is not implemented

- [ ] Advanced group member management UI
  - manual add/remove/rename screens are still missing

- [ ] Offline queue + pending sync indicator
  - no explicit queued operations UI/state machine for offline-first cloud sync

- [ ] Optional background/automatic cloud sync scheduling
  - current sync is user-triggered (Settings action / balance refresh path)

- [ ] Exchange-rate persistence improvements
  - optional move to SQLite + richer "last updated" surfacing if needed

---

## 4) External Blockers (Environment)

- [ ] iOS native run is blocked until full Xcode toolchain/runtime is available in environment.
- [ ] Final multi-device cloud verification requires manual testing outside CLI session.

---

## 5) Priority Order (Current)

1. **Reliability verification**
   - complete two-device cloud sync verification matrix
   - confirm no regressions around deletions and payer-based FX behavior

2. **Core UX improvements**
   - transaction editing
   - optional multi-step transaction flow polish
   - member management UI improvements

3. **Advanced sync enhancements**
   - offline queue/pending sync indicator
   - optional background sync strategy
