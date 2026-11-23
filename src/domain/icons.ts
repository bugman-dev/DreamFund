export const ICON_NAMES = [
  'House',
  'Plane',
  'User',
  'ShoppingBag',
  'GraduationCap',
  'Monitor',
  'Ellipsis',
  'Car',
  'Landmark',
  'TreePalm',
  'WashingMachine',
  'Heart',
  'Gift',
  'BookOpen',
  'Camera',
  'Music',
  'Dumbbell',
  'Utensils',
  'Briefcase',
  'Bike',
  'TreePine',
  'Laptop',
  'Smartphone',
  'Trophy',
  'Shirt',
  'Umbrella',
  'Palette',
  'Baby',
  'PawPrint',
  'Sparkles',
  'Home',
  'Flag',
  'Wallet',
  'Circle',
] as const;

export type IconName = (typeof ICON_NAMES)[number];

export function isIconName(value: string): value is IconName {
  return (ICON_NAMES as readonly string[]).includes(value);
}
