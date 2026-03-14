export interface Group {
  id: string;
  name: string;
  isDefault: boolean;
  createdBy: string;
  memberIds: string[];
  createdAt: number;
  updatedAt: number;
}
