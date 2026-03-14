export interface GroupMember {
  id: string;
  name: string;
  joinedAt: number;
}

export interface Group {
  id: string;
  name: string;
  isDefault: boolean;
  createdBy: string;
  members: GroupMember[];
  createdAt: number;
  updatedAt: number;
}
