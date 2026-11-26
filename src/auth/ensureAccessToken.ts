import * as AuthSession from "expo-auth-session";
import { t } from "../locale/messages";
import { googleTokenEndpoint, googleWebClientId } from "./google";
import {
  clearDriveTokens,
  loadDriveTokens,
  saveDriveTokens,
  tokensFromAuth,
} from "./driveTokens";

const FRESH_MARGIN_MS = 60_000;

export async function ensureAccessToken(): Promise<string> {
  const stored = await loadDriveTokens();
  if (!stored) throw new Error(t("sync.reauth"));
  if (stored.expiresAt - FRESH_MARGIN_MS > Date.now())
    return stored.accessToken;
  if (!stored.refreshToken) {
    await clearDriveTokens();
    throw new Error(t("sync.reauth"));
  }
  try {
    const refreshed = await AuthSession.refreshAsync(
      {
        clientId: googleWebClientId,
        refreshToken: stored.refreshToken,
      },
      { tokenEndpoint: googleTokenEndpoint },
    );
    if (!refreshed.accessToken) {
      await clearDriveTokens();
      throw new Error(t("sync.reauth"));
    }
    const next = tokensFromAuth({
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      expiresIn: refreshed.expiresIn,
      existingRefresh: stored.refreshToken,
    });
    await saveDriveTokens(next);
    return next.accessToken;
  } catch {
    await clearDriveTokens();
    throw new Error(t("sync.reauth"));
  }
}
