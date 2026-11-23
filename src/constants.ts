export const SESSION_KEY = 'dreamfund.session';
export const DATABASE_NAME = 'dreamfund.db';
export const BACKUP_FILE_PREFIX = 'dreamfund-backup-';
export const BACKUP_VERSION = 1 as const;
export const REMINDER_KIND = 'dreamfund-reminder';

export const GOAL_DELETED_NOTE = 'Removed when goal was deleted';
export const GOAL_DELETED_REASON = 'goal_deleted' as const;

export const PRESET_IMAGE_PREFIX = 'preset:';
export const GENERIC_IMAGE = `${PRESET_IMAGE_PREFIX}generic`;

export const PREVIEW_GOOGLE_CLIENT_ID = 'preview.apps.googleusercontent.com';
export const PREVIEW_USER = {
  sub: 'preview-thejus',
  name: 'Thejus',
  email: 'thejus@dreamfund.app',
  photoUrl: null,
};

export const NAME_LIMIT = 60;
export const NOTE_LIMIT = 100;
export const CATEGORY_NAME_LIMIT = 40;
export const IMAGE_URI_LIMIT = 5000;
export const PAISE_PER_RUPEE = 100;
export const PERCENT_MAX = 100;
export const INR_SYMBOL = '₹';

export const NOTICE_MS = 2600;
export const WEB_MAX_WIDTH = 430;
export const MONEY_SHORTCUTS = [1000, 2000, 5000, 10000] as const;

export const MORNING_UNTIL_HOUR = 12;
export const AFTERNOON_UNTIL_HOUR = 17;
export const DEFAULT_REMINDER_HOUR = 20;
export const DEFAULT_REMINDER_MINUTE = 0;

export const TRANSACTION_TYPES = ['addition', 'withdrawal', 'transfer'] as const;

export const FALLBACK_ICON = 'Ellipsis';
export const DEFAULT_ICON = 'Circle';
export const GOAL_PLACEHOLDER_BACKGROUND = '#1E4A3C';
export const GOAL_PLACEHOLDER_ICON = '#E7F0EA';

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
