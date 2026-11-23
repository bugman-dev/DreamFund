export type Category = {
  id: string;
  name: string;
  icon: string;
  isPreset: boolean;
  sortOrder: number;
};

export const PRESET_CATEGORIES = [
  { key: 'home', name: 'Home & Living', icon: 'House', sortOrder: 0 },
  { key: 'travel', name: 'Travel', icon: 'Plane', sortOrder: 1 },
  { key: 'personal', name: 'Personal', icon: 'User', sortOrder: 2 },
  { key: 'shopping', name: 'Shopping', icon: 'ShoppingBag', sortOrder: 3 },
  { key: 'education', name: 'Education', icon: 'GraduationCap', sortOrder: 4 },
  { key: 'gadget', name: 'Gadget', icon: 'Monitor', sortOrder: 5 },
  { key: 'other', name: 'Other', icon: 'Ellipsis', sortOrder: 6 },
] as const;

export function presetCategoryId(userId: string, key: string): string {
  return `${userId}:${key}`;
}
