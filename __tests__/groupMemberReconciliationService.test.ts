import { reconcileGroupMembersFromTransactions } from '../src/services/groupMemberReconciliationService';
import type { Group, Transaction } from '../src/types';

const buildGroup = (overrides: Partial<Group>): Group => ({
  id: 'group-1',
  name: 'Trip',
  isDefault: false,
  createdBy: 'user-1',
  members: [{ id: 'user-1', name: 'Akira', joinedAt: 100 }],
  createdAt: 100,
  updatedAt: 100,
  ...overrides,
});

const buildTransaction = (overrides: Partial<Transaction>): Transaction => {
  const base: Transaction = {
    id: 'tx-1',
    groupId: 'group-1',
    label: 'Trip',
    payerId: 'user-2',
    amount: 100,
    originalCurrency: 'USD',
    fee: 0,
    convertedAmount: 100,
    note: 'Lunch',
    splitType: 'equal',
    splits: [{ userId: 'user-1', amount: 100, isPaid: false }],
    createdBy: 'user-2',
    occurredAt: 200,
    createdAt: 200,
    updatedAt: 200,
    syncId: 'sync-1',
  };

  const merged = { ...base, ...overrides };
  return {
    ...merged,
    occurredAt: overrides.occurredAt ?? overrides.createdAt ?? base.occurredAt,
  };
};

describe('groupMemberReconciliationService', () => {
  test('adds missing participants to group members', () => {
    const groups = [buildGroup({ members: [{ id: 'user-1', name: 'Akira', joinedAt: 100 }] })];
    const transactions = [buildTransaction({ payerId: 'user-2', createdBy: 'user-2' })];

    const reconciled = reconcileGroupMembersFromTransactions({
      groups,
      transactions,
      profileNamesByUserId: {
        'user-2': 'Bob',
      },
    });

    expect(reconciled.groupsUpdated).toBe(1);
    expect(reconciled.membersAdded).toBe(1);
    expect(reconciled.groups[0]?.members.map((member) => member.id)).toContain('user-2');
    expect(
      reconciled.groups[0]?.members.find((member) => member.id === 'user-2')?.name,
    ).toBe('Bob');
  });

  test('updates existing member names from profile metadata', () => {
    const groups = [
      buildGroup({
        members: [
          { id: 'user-1', name: 'Akira', joinedAt: 100 },
          { id: 'user-2', name: 'user-2', joinedAt: 120 },
        ],
      }),
    ];
    const transactions = [buildTransaction({ payerId: 'user-2', createdBy: 'user-2' })];

    const reconciled = reconcileGroupMembersFromTransactions({
      groups,
      transactions,
      profileNamesByUserId: {
        'user-2': 'Bob Updated',
      },
    });

    expect(reconciled.groupsUpdated).toBe(1);
    expect(reconciled.membersAdded).toBe(0);
    expect(
      reconciled.groups[0]?.members.find((member) => member.id === 'user-2')?.name,
    ).toBe('Bob Updated');
  });

  test('does nothing when all participants are already present with same names', () => {
    const groups = [
      buildGroup({
        members: [
          { id: 'user-1', name: 'Akira', joinedAt: 100 },
          { id: 'user-2', name: 'Bob', joinedAt: 120 },
        ],
      }),
    ];
    const transactions = [buildTransaction({ payerId: 'user-2', createdBy: 'user-2' })];

    const reconciled = reconcileGroupMembersFromTransactions({
      groups,
      transactions,
      profileNamesByUserId: {
        'user-2': 'Bob',
      },
    });

    expect(reconciled.groupsUpdated).toBe(0);
    expect(reconciled.membersAdded).toBe(0);
    expect(reconciled.updatedGroupIds).toHaveLength(0);
  });
});
