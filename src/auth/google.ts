import * as WebBrowser from 'expo-web-browser';
import { PREVIEW_USER } from '../constants';
import { t } from '../locale/messages';
import type { SessionUser } from './types';

WebBrowser.maybeCompleteAuthSession();

export const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ?? '';
export const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || googleWebClientId;
export const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || googleWebClientId;
export const googleConfigured = googleWebClientId.length > 0;

/** Google Android/iOS clients expect `com.googleusercontent.apps.<client-id-prefix>` as the redirect scheme. */
export function googleNativeRedirectScheme(clientId: string): string | null {
  const prefix = clientId.trim().replace(/\.apps\.googleusercontent\.com$/i, '');
  if (!prefix || prefix === clientId.trim()) return null;
  return `com.googleusercontent.apps.${prefix}`;
}

export function googleNativeRedirectUri(clientId: string): string | undefined {
  const scheme = googleNativeRedirectScheme(clientId);
  return scheme ? `${scheme}:/oauthredirect` : undefined;
}

export const googleTokenEndpoint = process.env.EXPO_PUBLIC_GOOGLE_TOKEN_ENDPOINT?.trim() || 'https://oauth2.googleapis.com/token';
export const googleDriveApiBase = process.env.EXPO_PUBLIC_GOOGLE_DRIVE_API_BASE?.trim() || 'https://www.googleapis.com/drive/v3';
export const googleDriveUploadBase = process.env.EXPO_PUBLIC_GOOGLE_DRIVE_UPLOAD_BASE?.trim() || 'https://www.googleapis.com/upload/drive/v3';
export const googleDriveScope = process.env.EXPO_PUBLIC_GOOGLE_DRIVE_SCOPE?.trim() || 'https://www.googleapis.com/auth/drive.appdata';

export const googleAuthScopes = ['openid', 'profile', 'email', googleDriveScope];

export const previewUser: SessionUser = PREVIEW_USER;

export function isGuestUser(user: SessionUser | null | undefined): boolean {
  return !user || user.sub === PREVIEW_USER.sub;
}

export function profileFromIdToken(idToken: string): SessionUser {
  const payload = idToken.split('.')[1];
  if (!payload) throw new Error(t('welcome.googleNoAccount'));
  const json = JSON.parse(decodeBase64Url(payload)) as {
    sub?: string;
    name?: string;
    email?: string;
    picture?: string;
  };
  if (!json.sub) throw new Error(t('welcome.googleNoAccount'));
  return {
    sub: json.sub,
    name: json.name || json.email || t('auth.member'),
    email: json.email || '',
    photoUrl: json.picture || null,
  };
}

function decodeBase64Url(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = globalThis.atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
