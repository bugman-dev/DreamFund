import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import {
  googleAndroidClientId,
  googleAuthScopes,
  googleConfigured,
  googleIosClientId,
  googleNativeRedirectUri,
  googleWebClientId,
  profileFromIdToken,
} from './google';
import { clearDriveTokens, saveDriveTokens, tokensFromAuth } from './driveTokens';
import { useSession } from './session';
import { Button } from '../components/ui';
import { PREVIEW_GOOGLE_CLIENT_ID } from '../constants';
import { useText } from '../locale';

export default function GoogleControls({ onError }: { onError: (message: string | null) => void }) {
  const text = useText();
  const { signIn } = useSession();
  const [busy, setBusy] = useState(false);
  const webClientId = googleConfigured ? googleWebClientId : PREVIEW_GOOGLE_CLIENT_ID;
  const androidClientId = googleConfigured ? googleAndroidClientId : webClientId;
  const iosClientId = googleConfigured ? googleIosClientId : webClientId;
  const nativeClientId = Platform.OS === 'ios' ? iosClientId : androidClientId;
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId,
    iosClientId,
    androidClientId,
    scopes: googleAuthScopes,
    // Prefer Google's reverse-client redirect so Android OAuth accepts the request.
    redirectUri: Platform.OS === 'web' ? undefined : googleNativeRedirectUri(nativeClientId),
    extraParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  });

  useEffect(() => {
    if (response?.type !== 'success') {
      if (response?.type === 'error') onError(text('welcome.googleFailed'));
      return;
    }
    const idToken = response.params.id_token ?? response.authentication?.idToken;
    const accessToken = response.authentication?.accessToken;
    if (!idToken || !accessToken) {
      onError(text('welcome.googleNoAccount'));
      return;
    }
    setBusy(true);
    try {
      const profile = profileFromIdToken(idToken);
      void (async () => {
        try {
          await saveDriveTokens(
            tokensFromAuth({
              accessToken,
              refreshToken: response.authentication?.refreshToken,
              expiresIn: response.authentication?.expiresIn,
            }),
          );
          await signIn(profile);
        } catch (reason) {
          await clearDriveTokens();
          onError(reason instanceof Error ? reason.message : text('welcome.googleFailed'));
        } finally {
          setBusy(false);
        }
      })();
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : text('welcome.googleFailed'));
      setBusy(false);
    }
  }, [onError, response, signIn, text]);

  return (
    <Button
      label={busy ? text('welcome.googleBusy') : text('welcome.google')}
      onPress={() => {
        onError(null);
        void promptAsync();
      }}
      disabled={!googleConfigured || !request || busy}
    />
  );
}
