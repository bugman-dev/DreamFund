import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import { Leaf } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { googleAndroidClientId, googleConfigured, googleIosClientId, googleWebClientId, previewUser, profileFromIdToken } from '../src/auth/google';
import { useSession } from '../src/auth/session';
import { Button } from '../src/components/ui';
import { colors } from '../src/theme/colors';
import { fonts } from '../src/theme/type';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, signIn } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const webClientId = googleConfigured ? googleWebClientId : 'preview.apps.googleusercontent.com';
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId,
    iosClientId: googleConfigured ? googleIosClientId : webClientId,
    androidClientId: googleConfigured ? googleAndroidClientId : webClientId,
  });

  useEffect(() => {
    if (response?.type !== 'success') {
      if (response?.type === 'error') setError('Google sign-in did not complete. Try again.');
      return;
    }
    const idToken = response.params.id_token ?? response.authentication?.idToken;
    if (!idToken) {
      setError('Google did not return an account.');
      return;
    }
    setBusy(true);
    try {
      const profile = profileFromIdToken(idToken);
      void signIn(profile).finally(() => setBusy(false));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Google sign-in did not complete.');
      setBusy(false);
    }
  }, [response, signIn]);

  if (user) return <Redirect href="/(tabs)" />;

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 20) }]}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Save. Plan. Achieve.</Text>
        <View style={styles.leaf}>
          <Leaf color={colors.paleSage} size={42} strokeWidth={1.6} />
        </View>
        <Text style={styles.wordmark}>Dream Fund</Text>
        <Text style={styles.quote}>Collect experiences, not things.</Text>
      </View>
      <View style={styles.footer}>
        {!googleConfigured ? (
          <Text style={styles.setup}>
            Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID from a Google Cloud web client to turn on Google sign-in.
          </Text>
        ) : null}
        <Button
          label={busy ? 'Signing in...' : 'Continue with Google'}
          onPress={() => {
            setError(null);
            void promptAsync();
          }}
          disabled={!googleConfigured || !request || busy}
        />
        {!googleConfigured ? (
          <Pressable accessibilityRole="button" onPress={() => void signIn(previewUser)} style={styles.preview}>
            <Text style={styles.previewText}>Preview on this device</Text>
          </Pressable>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ivory },
  hero: { flex: 1, margin: 20, borderRadius: 16, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center', padding: 28 },
  kicker: { fontFamily: fonts.medium, fontSize: 13, color: colors.paleSage, letterSpacing: 1.2, textTransform: 'uppercase' },
  leaf: { width: 84, height: 84, borderRadius: 42, backgroundColor: 'rgba(221, 232, 221, 0.16)', alignItems: 'center', justifyContent: 'center', marginVertical: 22 },
  wordmark: { fontFamily: fonts.bold, fontSize: 42, color: colors.white },
  quote: { fontFamily: fonts.quote, fontSize: 20, color: colors.ivory, marginTop: 12, textAlign: 'center' },
  footer: { paddingHorizontal: 20, gap: 12 },
  setup: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.muted },
  preview: { alignItems: 'center', paddingVertical: 8 },
  previewText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.forest },
  error: { fontFamily: fonts.medium, fontSize: 13, color: colors.rose, textAlign: 'center' },
});
