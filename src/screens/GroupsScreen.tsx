import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import * as Clipboard from 'expo-clipboard';

import { DeleteGroupModal, GroupCard } from '../components/group';
import { QRGenerator, QRScanner } from '../components/sync';
import { Button, Card, Input, Picker, Typography } from '../components/common';
import { colors, spacing } from '../constants';
import type { RootStackParamList } from '../navigation/types';
import { useGroupStore, useTransactionStore, useUserStore } from '../store';
import { isTravelGroup } from '../utils';

export const GroupsScreen = (): React.JSX.Element => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const user = useUserStore((state) => state.user);
  const groups = useGroupStore((state) => state.groups);
  const loadGroups = useGroupStore((state) => state.loadGroups);
  const createGroup = useGroupStore((state) => state.createGroup);
  const deleteGroup = useGroupStore((state) => state.deleteGroup);
  const generateInviteForGroup = useGroupStore((state) => state.generateInviteForGroup);
  const joinGroupFromInvite = useGroupStore((state) => state.joinGroupFromInvite);
  const refreshGroupMembers = useGroupStore((state) => state.refreshGroupMembers);
  const countTransactionsInGroup = useTransactionStore((state) => state.countTransactionsInGroup);
  const deleteTransactionsByGroup = useTransactionStore((state) => state.deleteTransactionsByGroup);
  const moveTransactionsToGroup = useTransactionStore((state) => state.moveTransactionsToGroup);

  const [newGroupName, setNewGroupName] = useState('');
  const [selectedInviteGroupId, setSelectedInviteGroupId] = useState('');
  const [generatedInvitePayload, setGeneratedInvitePayload] = useState('');
  const [generatedPassphrase, setGeneratedPassphrase] = useState('');
  const [isPassphraseCopied, setIsPassphraseCopied] = useState(false);
  const [inviteInput, setInviteInput] = useState('');
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [deletingGroupTransactionCount, setDeletingGroupTransactionCount] = useState(0);
  const [selectedMigrationTargetId, setSelectedMigrationTargetId] = useState('');

  useEffect(() => {
    if (user) {
      void loadGroups(user.id);
    }
  }, [loadGroups, user]);

  const travelGroups = useMemo(() => {
    return groups.filter(isTravelGroup);
  }, [groups]);

  useEffect(() => {
    if (travelGroups.length === 0) {
      if (selectedInviteGroupId) {
        setSelectedInviteGroupId('');
      }
      return;
    }

    if (!travelGroups.some((group) => group.id === selectedInviteGroupId)) {
      setSelectedInviteGroupId(travelGroups[0]?.id ?? '');
    }
  }, [selectedInviteGroupId, travelGroups]);

  useEffect(() => {
    if (!isPassphraseCopied) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setIsPassphraseCopied(false);
    }, 1500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isPassphraseCopied]);

  const groupOptions = useMemo(() => {
    return travelGroups.map((group) => ({
      label: group.name,
      value: group.id,
    }));
  }, [travelGroups]);

  const deletingGroup = useMemo(() => {
    return deletingGroupId
      ? travelGroups.find((group) => group.id === deletingGroupId) ?? null
      : null;
  }, [deletingGroupId, travelGroups]);

  const migrationOptions = useMemo(() => {
    return travelGroups
      .filter((group) => group.id !== deletingGroupId)
      .map((group) => ({
        label: group.name,
        value: group.id,
      }));
  }, [deletingGroupId, travelGroups]);

  const handleCreateGroup = async (): Promise<void> => {
    if (!user) {
      return;
    }

    if (!newGroupName.trim()) {
      Alert.alert('Group name required', 'Please enter a group name.');
      return;
    }

    try {
      await createGroup(user.id, user.name, newGroupName);
      setNewGroupName('');
    } catch (error) {
      Alert.alert('Could not create group', error instanceof Error ? error.message : 'Unknown error.');
    }
  };

  const handleDeleteGroup = async (groupId: string): Promise<void> => {
    try {
      const transactionCount = await countTransactionsInGroup(groupId);

      if (transactionCount === 0) {
        await deleteGroup(groupId);
        return;
      }

      const defaultTarget = travelGroups.find((group) => group.id !== groupId)?.id ?? '';

      setDeletingGroupId(groupId);
      setDeletingGroupTransactionCount(transactionCount);
      setSelectedMigrationTargetId(defaultTarget);
    } catch (error) {
      Alert.alert('Could not delete group', error instanceof Error ? error.message : 'Unknown error.');
    }
  };

  const closeDeleteModal = (): void => {
    setDeletingGroupId(null);
    setDeletingGroupTransactionCount(0);
    setSelectedMigrationTargetId('');
  };

  const handleMigrateAndDelete = async (): Promise<void> => {
    if (!deletingGroupId) {
      return;
    }

    if (!selectedMigrationTargetId) {
      Alert.alert('Target group required', 'Choose a target group for migration.');
      return;
    }

    try {
      await moveTransactionsToGroup(deletingGroupId, selectedMigrationTargetId);
      await deleteGroup(deletingGroupId);
      closeDeleteModal();
    } catch (error) {
      Alert.alert('Could not migrate', error instanceof Error ? error.message : 'Unknown error.');
    }
  };

  const handleDeleteWithoutMigration = async (): Promise<void> => {
    if (!deletingGroupId || !user) {
      return;
    }

    try {
      await deleteTransactionsByGroup(deletingGroupId, user.id);
      await deleteGroup(deletingGroupId);
      closeDeleteModal();
    } catch (error) {
      Alert.alert('Could not delete group', error instanceof Error ? error.message : 'Unknown error.');
    }
  };

  const handleGenerateInvite = (): void => {
    if (!selectedInviteGroupId) {
      Alert.alert('Select a group', 'Choose a group first.');
      return;
    }

    try {
      const invite = generateInviteForGroup(selectedInviteGroupId);
      setGeneratedInvitePayload(invite.payload);
      setGeneratedPassphrase(invite.passphrase);
      setIsPassphraseCopied(false);
    } catch (error) {
      Alert.alert('Invite failed', error instanceof Error ? error.message : 'Could not generate invite.');
    }
  };

  const handleCopyPassphrase = async (): Promise<void> => {
    if (!generatedPassphrase.trim()) {
      Alert.alert('No passphrase', 'Generate an invite first.');
      return;
    }

    try {
      await Clipboard.setStringAsync(generatedPassphrase);
      setIsPassphraseCopied(true);
    } catch (error) {
      Alert.alert(
        'Copy failed',
        error instanceof Error ? error.message : 'Could not copy passphrase.',
      );
    }
  };

  const handleJoinGroup = async (): Promise<void> => {
    if (!user) {
      return;
    }

    if (!inviteInput.trim()) {
      Alert.alert('Invite required', 'Paste a QR payload or passphrase.');
      return;
    }

    try {
      const group = await joinGroupFromInvite(user.id, user.name, inviteInput);
      let cloudSyncWarning: string | null = null;

      try {
        await refreshGroupMembers(user.id, group.id);
      } catch (error) {
        cloudSyncWarning = error instanceof Error
          ? error.message
          : 'Cloud sync failed.';
      }

      setInviteInput('');
      setSelectedInviteGroupId(group.id);
      if (cloudSyncWarning) {
        Alert.alert(
          'Joined locally',
          `You are now in "${group.name}", but member cloud sync failed: ${cloudSyncWarning}`,
        );
      } else {
        Alert.alert('Joined group', `You are now in "${group.name}".`);
      }
    } catch (error) {
      Alert.alert('Join failed', error instanceof Error ? error.message : 'Invalid invite.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h3">Travel Groups</Typography>

      <Card>
        <Typography variant="h4">Create Travel Group</Typography>
        <View style={styles.cardSection}>
          <Input
            label="Group name"
            onChangeText={setNewGroupName}
            placeholder="e.g. Road Trip"
            value={newGroupName}
          />
          <Typography variant="caption">
            Members are added automatically when they join using your invite QR code.
          </Typography>
          <Button onPress={handleCreateGroup} title="Create Group" />
        </View>
      </Card>

      <Card>
        <Typography variant="h4">Invite / Join Group</Typography>
        <View style={styles.cardSection}>
          <Picker
            label="Travel group to invite others to"
            onValueChange={setSelectedInviteGroupId}
            options={groupOptions}
            selectedValue={selectedInviteGroupId}
          />
          <Button onPress={handleGenerateInvite} title="Generate Invite" variant="secondary" />

          {generatedPassphrase ? (
            <View style={styles.passphraseSection}>
              <Typography selectable variant="bodySmall">
                Passphrase: {generatedPassphrase}
              </Typography>
              <Button
                onPress={() => {
                  void handleCopyPassphrase();
                }}
                title={isPassphraseCopied ? 'Copied' : 'Copy Passphrase'}
                variant="secondary"
              />
            </View>
          ) : null}

          {generatedInvitePayload ? (
            <QRGenerator
              payload={generatedInvitePayload}
              title="Group Invite QR"
            />
          ) : null}

          <QRScanner
            inputLabel="Scanned or pasted invite payload / passphrase"
            onChange={setInviteInput}
            onSubmit={() => {
              void handleJoinGroup();
            }}
            scanTitle="Scan Group Invite"
            submitLabel="Join Group"
            value={inviteInput}
          />
        </View>
      </Card>

      <View style={styles.groupList}>
        {travelGroups.map((group) => (
          <View key={group.id} style={styles.groupRow}>
            <GroupCard
              group={group}
              onPress={() => navigation.navigate('GroupDetail', { groupId: group.id })}
            />
            {!group.isDefault ? (
              <Button
                onPress={() => {
                  void handleDeleteGroup(group.id);
                }}
                title="Delete"
                variant="danger"
              />
            ) : null}
          </View>
        ))}
        {travelGroups.length === 0 ? (
          <Typography variant="bodySmall">
            No travel groups yet. Create one above.
          </Typography>
        ) : null}
      </View>

      <DeleteGroupModal
        groupName={deletingGroup?.name ?? 'Group'}
        migrationOptions={migrationOptions}
        onChangeMigrationTarget={setSelectedMigrationTargetId}
        onCancel={closeDeleteModal}
        onDeleteWithoutMigration={() => {
          void handleDeleteWithoutMigration();
        }}
        onMigrate={() => {
          void handleMigrateAndDelete();
        }}
        selectedMigrationTargetId={selectedMigrationTargetId}
        transactionCount={deletingGroupTransactionCount}
        visible={Boolean(deletingGroupId)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    gap: spacing.md,
    padding: spacing.md,
  },
  groupList: {
    gap: spacing.md,
  },
  groupRow: {
    gap: spacing.sm,
  },
  cardSection: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  passphraseSection: {
    gap: spacing.sm,
  },
});
