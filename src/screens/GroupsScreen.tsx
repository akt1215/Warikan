import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { GroupCard } from '../components/group';
import { Button, Input, Typography } from '../components/common';
import { colors, spacing } from '../constants';
import type { RootStackParamList } from '../navigation/types';
import { useGroupStore, useUserStore } from '../store';

export const GroupsScreen = (): React.JSX.Element => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const user = useUserStore((state) => state.user);
  const groups = useGroupStore((state) => state.groups);
  const loadGroups = useGroupStore((state) => state.loadGroups);
  const createGroup = useGroupStore((state) => state.createGroup);
  const deleteGroup = useGroupStore((state) => state.deleteGroup);

  const [newGroupName, setNewGroupName] = useState('');

  useEffect(() => {
    if (user) {
      void loadGroups(user.id);
    }
  }, [loadGroups, user]);

  const handleCreateGroup = async (): Promise<void> => {
    if (!user) {
      return;
    }

    if (!newGroupName.trim()) {
      Alert.alert('Group name required', 'Please enter a group name.');
      return;
    }

    try {
      await createGroup(user.id, newGroupName);
      setNewGroupName('');
    } catch (error) {
      Alert.alert('Could not create group', error instanceof Error ? error.message : 'Unknown error.');
    }
  };

  const handleDeleteGroup = async (groupId: string): Promise<void> => {
    try {
      await deleteGroup(groupId);
    } catch (error) {
      Alert.alert('Could not delete group', error instanceof Error ? error.message : 'Unknown error.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h3">Groups</Typography>

      <Input
        label="Create group"
        onChangeText={setNewGroupName}
        placeholder="e.g. Road Trip"
        value={newGroupName}
      />
      <Button onPress={handleCreateGroup} title="Create Group" />

      <View style={styles.groupList}>
        {groups.map((group) => (
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
      </View>
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
});
