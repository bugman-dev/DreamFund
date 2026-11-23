import { useEffect, useState } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import { googleAndroidClientId, googleConfigured, googleIosClientId, googleWebClientId, profileFromIdToken } from './google';
import { useSession } from './session';
import { Button } from '../components/ui';
import { PREVIEW_GOOGLE_CLIENT_ID } from '../constants';
import { useText } from '../locale';

export default function GoogleControls({ onError }: { onError: (message: string | null) => void }) {
  const text = useText();
  const { signIn } = useSession();
  const [busy, setBusy] = useState(false);
  const webClientId = googleConfigured ? googleWebClientId : PREVIEW_GOOGLE_CLIENT_ID;
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId,
    iosClientId: googleConfigured ? googleIosClientId : webClientId,
    androidClientId: googleConfigured ? googleAndroidClientId : webClientId,
  });

  useEffect(() => {
    if (response?.type !== 'success') {
      if (response?.type === 'error') onError(text('welcome.googleFailed'));
      return;
    }
    const idToken = response.params.id_token ?? response.authentication?.idToken;
    if (!idToken) {
      onError(text('welcome.googleNoAccount'));
      return;
    }
    setBusy(true);
    try {
      const profile = profileFromIdToken(idToken);
      void signIn(profile).finally(() => setBusy(false));
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
