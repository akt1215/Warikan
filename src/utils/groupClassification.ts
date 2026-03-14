import { LEGACY_LABEL_GROUP_NAMES } from '../constants';
import type { Group } from '../types';

const legacyNames = new Set<string>(LEGACY_LABEL_GROUP_NAMES);

export const isLegacyLabelGroup = (group: Pick<Group, 'name' | 'isDefault'>): boolean => {
  return group.isDefault && legacyNames.has(group.name);
};

export const isTravelGroup = (group: Pick<Group, 'name' | 'isDefault'>): boolean => {
  return !isLegacyLabelGroup(group);
};
