import { SESSION_KEY } from "../constants";
import {
  readDeviceValue,
  removeDeviceValue,
  writeDeviceValue,
} from "../storage/deviceValue";
import type { SessionUser } from "./types";

export async function loadSession(): Promise<SessionUser | null> {
  const raw = await readDeviceValue(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SessionUser;
    if (!parsed.sub || !parsed.name) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveSession(user: SessionUser): Promise<void> {
  await writeDeviceValue(SESSION_KEY, JSON.stringify(user));
}

export async function clearSession(): Promise<void> {
  await removeDeviceValue(SESSION_KEY);
}
