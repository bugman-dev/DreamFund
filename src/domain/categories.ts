export type Category = {
  id: string;
  name: string;
  icon: string;
  isPreset: boolean;
  sortOrder: number;
};

export { PRESET_CATEGORIES } from '../constants';

export function presetCategoryId(userId: string, key: string): string {
  return `${userId}:${key}`;
}
