import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '../src/auth/session';
import { WelcomeHills } from '../src/components/WelcomeJourneyArt';
import { firstName } from '../src/domain/dates';
import { useText } from '../src/locale';
import type { Palette } from '../src/theme/palettes';
import { useColors } from '../src/theme/Theme';
import { fonts } from '../src/theme/type';

const APP_ICON = require('../assets/icon.png');

/** Google OAuth returns to `…:/oauthredirect`; greet the user, then continue into the app. */
export default function OAuthRedirectScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const text = useText();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user, ready } = useSession();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (user) return;
    const timer = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(timer);
  }, [user]);

  if (ready && !user && timedOut) return <Redirect href="/welcome" />;

  const waiting = !ready || !user;
  const name = user ? firstName(user.name) : '';

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 28, paddingBottom: Math.max(insets.bottom, 20) + 96 }]}>
      <WelcomeHills width={width} height={180} />
      {waiting ? (
        <View style={styles.content}>
          <ActivityIndicator size="large" color={colors.forest} />
          <Text style={styles.loading}>{text('oauth.loading')}</Text>
        </View>
      ) : (
        <>
          <View style={styles.content}>
            <Image source={APP_ICON} style={styles.icon} accessibilityIgnoresInvertColors />
            <View style={styles.copy}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>{text('oauth.welcome', { name })}</Text>
                <View style={styles.sparkles} pointerEvents="none">
                  <View style={[styles.spark, styles.sparkA]} />
                  <View style={[styles.spark, styles.sparkB]} />
                  <View style={[styles.spark, styles.sparkC]} />
                </View>
              </View>
              <Text style={styles.body}>{text('oauth.body')}</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={text('oauth.continue')}
            onPress={() => router.replace('/(tabs)')}
            style={({ pressed }) => [styles.continue, pressed && styles.continuePressed]}
          >
            <Text style={styles.continueLabel}>{text('oauth.continue')}</Text>
            <ArrowRight color={colors.onForest} size={20} strokeWidth={2.4} />
          </Pressable>
        </>
      )}
    </View>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.ivory,
      paddingHorizontal: 28,
      justifyContent: 'space-between',
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 28,
      paddingBottom: 48,
    },
    loading: {
      fontFamily: fonts.medium,
      fontSize: 17,
      color: colors.muted,
      textAlign: 'center',
    },
    icon: {
      width: 168,
      height: 168,
      borderRadius: 36,
    },
    copy: {
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 8,
    },
    titleRow: {
      position: 'relative',
      alignItems: 'center',
      paddingRight: 10,
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: 34,
      lineHeight: 42,
      color: colors.forest,
      textAlign: 'center',
    },
    sparkles: {
      position: 'absolute',
      right: -6,
      top: 2,
      width: 22,
      height: 22,
    },
    spark: {
      position: 'absolute',
      backgroundColor: colors.amber,
      borderRadius: 2,
    },
    sparkA: { width: 10, height: 2.5, right: 0, top: 4, transform: [{ rotate: '-28deg' }] },
    sparkB: { width: 7, height: 2.5, right: 8, top: 0, transform: [{ rotate: '8deg' }] },
    sparkC: { width: 8, height: 2.5, right: 2, top: 11, transform: [{ rotate: '38deg' }] },
    body: {
      fontFamily: fonts.regular,
      fontSize: 16,
      lineHeight: 24,
      color: colors.muted,
      textAlign: 'center',
      maxWidth: 280,
    },
    continue: {
      alignSelf: 'center',
      minWidth: 200,
      minHeight: 56,
      paddingHorizontal: 28,
      borderRadius: 999,
      backgroundColor: colors.forest,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      zIndex: 1,
    },
    continuePressed: { opacity: 0.88 },
    continueLabel: {
      fontFamily: fonts.semibold,
      fontSize: 17,
      color: colors.onForest,
    },
  });
}
