import React from 'react';

import { Picker, type PickerOption } from '../common';

interface GroupPickerProps {
  groups: PickerOption[];
  selectedGroupId: string;
  onSelectGroup: (groupId: string) => void;
}

export const GroupPicker = ({
  groups,
  selectedGroupId,
  onSelectGroup,
}: GroupPickerProps): React.JSX.Element => {
  return (
    <Picker
      label="Select Group"
      onValueChange={onSelectGroup}
      options={groups}
      selectedValue={selectedGroupId}
    />
  );
};

export default GroupPicker;
