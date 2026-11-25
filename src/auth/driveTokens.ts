import { DRIVE_TOKENS_KEY } from '../constants';
import { readDeviceValue, removeDeviceValue, writeDeviceValue } from '../storage/deviceValue';

export type DriveTokens = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
};

export async function loadDriveTokens(): Promise<DriveTokens | null> {
  const raw = await readDeviceValue(DRIVE_TOKENS_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DriveTokens;
    if (!parsed.accessToken || typeof parsed.expiresAt !== 'number') return null;
    return {
      accessToken: parsed.accessToken,
      refreshToken: typeof parsed.refreshToken === 'string' ? parsed.refreshToken : null,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}

export async function saveDriveTokens(tokens: DriveTokens): Promise<void> {
  await writeDeviceValue(DRIVE_TOKENS_KEY, JSON.stringify(tokens));
}

export async function clearDriveTokens(): Promise<void> {
  await removeDeviceValue(DRIVE_TOKENS_KEY);
}

export function tokensFromAuth(input: {
  accessToken: string;
  refreshToken?: string | null;
  expiresIn?: number | null;
  existingRefresh?: string | null;
}): DriveTokens {
  const expiresIn = input.expiresIn && input.expiresIn > 0 ? input.expiresIn : 3600;
  return {
    accessToken: input.accessToken,
    refreshToken: input.refreshToken || input.existingRefresh || null,
    expiresAt: Date.now() + expiresIn * 1000,
  };
}
