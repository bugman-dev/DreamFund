import * as WebBrowser from 'expo-web-browser';
import { PREVIEW_USER } from '../constants';
import { t } from '../locale/messages';
import type { SessionUser } from './types';

WebBrowser.maybeCompleteAuthSession();

export const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ?? '';
export const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || googleWebClientId;
export const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || googleWebClientId;
export const googleConfigured = googleWebClientId.length > 0;

export const previewUser: SessionUser = PREVIEW_USER;

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
