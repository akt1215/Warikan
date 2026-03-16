import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Group } from '../../types';
import { colors, spacing, typography } from '../../constants';
import { Card } from '../common';

interface GroupCardProps {
  group: Group;
  onPress?: (group: Group) => void;
}

export const GroupCard = ({ group, onPress }: GroupCardProps): React.JSX.Element => {
  const memberPreview = group.members
    .slice(0, 3)
    .map((member) => member.name)
    .join(', ');

  const content = (
    <Card>
      <View style={styles.row}>
        <Text style={styles.name}>{group.name}</Text>
        {group.isDefault ? <Text style={styles.badge}>Default</Text> : null}
      </View>
      <Text style={styles.meta}>Members: {group.members.length}</Text>
      {memberPreview ? <Text style={styles.meta}>People: {memberPreview}</Text> : null}
    </Card>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable onPress={() => onPress(group)} style={({ pressed }) => [pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  name: {
    color: colors.textPrimary,
    fontSize: typography.sizes.h4,
    fontWeight: typography.weights.semibold,
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: spacing.xl,
    color: colors.white,
    fontSize: typography.sizes.caption,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: typography.sizes.bodySmall,
    marginTop: spacing.xs,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});

export default GroupCard;
