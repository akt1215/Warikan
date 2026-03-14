import {
  createGroupInvitePassphrase,
  createGroupInvitePayload,
  mergeGroupMembers,
  parseGroupInviteInput,
} from '../src/services/groupInviteService';
import type { Group } from '../src/types';

const sampleGroup: Group = {
  id: 'group-1',
  name: 'Trip to Osaka',
  isDefault: false,
  createdBy: 'user-1',
  members: [
    { id: 'user-1', name: 'Akira', joinedAt: 100 },
    { id: 'Alice', name: 'Alice', joinedAt: 110 },
  ],
  createdAt: 100,
  updatedAt: 100,
};

describe('groupInviteService', () => {
  test('parses JSON invite payload', () => {
    const payload = createGroupInvitePayload(sampleGroup);
    const parsed = parseGroupInviteInput(payload);

    expect(parsed.id).toBe(sampleGroup.id);
    expect(parsed.name).toBe(sampleGroup.name);
    expect(parsed.members).toHaveLength(2);
    expect(parsed.members[1]?.name).toBe('Alice');
  });

  test('parses passphrase invite payload', () => {
    const passphrase = createGroupInvitePassphrase(sampleGroup);
    const parsed = parseGroupInviteInput(passphrase);

    expect(parsed.id).toBe(sampleGroup.id);
    expect(parsed.createdBy).toBe(sampleGroup.createdBy);
    expect(parsed.members.map((member) => member.name)).toContain('Akira');
  });

  test('merges and deduplicates members by id', () => {
    const merged = mergeGroupMembers(
      [{ id: 'Alice', name: 'Alice', joinedAt: 200 }],
      [{ id: 'Alice', name: 'Alice Smith', joinedAt: 150 }],
      [{ id: 'Bob', name: 'Bob', joinedAt: 210 }],
    );

    expect(merged).toHaveLength(2);
    expect(merged.find((member) => member.id === 'Alice')?.joinedAt).toBe(150);
    expect(merged.find((member) => member.id === 'Alice')?.name).toBe('Alice Smith');
    expect(merged.find((member) => member.id === 'Bob')?.name).toBe('Bob');
  });

  test('keeps earliest join time but latest profile name for same id', () => {
    const merged = mergeGroupMembers(
      [{ id: 'user-1', name: 'Old Name', joinedAt: 100 }],
      [{ id: 'user-1', name: 'New Name', joinedAt: 300 }],
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]?.joinedAt).toBe(100);
    expect(merged[0]?.name).toBe('New Name');
  });
});
