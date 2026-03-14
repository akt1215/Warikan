import React from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '../../constants';
import { Button, Modal, Picker, type PickerOption, Typography } from '../common';

interface DeleteGroupModalProps {
  visible: boolean;
  groupName: string;
  transactionCount: number;
  migrationOptions: PickerOption[];
  selectedMigrationTargetId: string;
  onChangeMigrationTarget: (groupId: string) => void;
  onMigrate: () => void;
  onDeleteAnyway: () => void;
  onClose: () => void;
}

export const DeleteGroupModal = ({
  visible,
  groupName,
  transactionCount,
  migrationOptions,
  selectedMigrationTargetId,
  onChangeMigrationTarget,
  onMigrate,
  onDeleteAnyway,
  onClose,
}: DeleteGroupModalProps): React.JSX.Element => {
  return (
    <Modal onClose={onClose} title="Delete Group" visible={visible}>
      <View style={styles.content}>
        <Typography variant="bodySmall">
          "{groupName}" has {transactionCount} transaction
          {transactionCount === 1 ? '' : 's'}.
        </Typography>
        <Typography variant="bodySmall">
          Choose what to do with those transactions:
        </Typography>

        <Picker
          label="Option 1: Migrate to another group"
          onValueChange={onChangeMigrationTarget}
          options={migrationOptions}
          selectedValue={selectedMigrationTargetId}
        />
        <Button onPress={onMigrate} title="Migrate & Delete Group" />

        <Button
          onPress={onDeleteAnyway}
          title="Option 2: Move to another travel group & Delete"
          variant="danger"
        />

        <Button onPress={onClose} title="Option 3: Skip" variant="ghost" />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
  },
});

export default DeleteGroupModal;
