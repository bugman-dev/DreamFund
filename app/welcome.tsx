import { lazy, Suspense, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Redirect } from "expo-router";
import { Leaf } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { googleConfigured, previewUser } from "../src/auth/google";
import { useSession } from "../src/auth/session";
import { useText } from "../src/locale";
import type { Palette } from "../src/theme/palettes";
import { useColors } from "../src/theme/Theme";
import { fonts } from "../src/theme/type";

const GoogleControls = lazy(() =>
  import("../src/auth/GoogleControls").catch(() => ({
    default: function GoogleUnavailable(_props: {
      onError: (message: string | null) => void;
    }) {
      return <View />;
    },
  })),
);

export default function WelcomeScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const text = useText();
  const insets = useSafeAreaInsets();
  const { user, signIn } = useSession();
  const [error, setError] = useState<string | null>(null);

  if (user) return <Redirect href="/(tabs)" />;

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 20) },
      ]}
    >
      <View style={styles.hero}>
        <Text style={styles.kicker}>{text("welcome.kicker")}</Text>
        <View style={styles.leaf}>
          <Leaf
            color={
              colors.statusBar === "light" ? colors.onForest : colors.paleSage
            }
            size={42}
            strokeWidth={1.6}
          />
        </View>
        <Text style={styles.wordmark}>{text("welcome.wordmark")}</Text>
        <Text style={styles.quote}>{text("welcome.quote")}</Text>
      </View>
      <View style={styles.footer}>
        <Suspense fallback={null}>
          <GoogleControls onError={setError} />
        </Suspense>
        {googleConfigured ? (
          <Text style={styles.hint}>{text("welcome.googleHint")}</Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          onPress={() => void signIn(previewUser)}
          style={styles.preview}
        >
          <Text style={styles.previewText}>{text("welcome.guest")}</Text>
        </Pressable>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </View>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.ivory },
    hero: {
      flex: 1,
      margin: 20,
      borderRadius: 16,
      backgroundColor: colors.forest,
      alignItems: "center",
      justifyContent: "center",
      padding: 28,
    },
    kicker: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.statusBar === "light" ? colors.onForest : colors.paleSage,
      letterSpacing: 1.2,
      textTransform: "uppercase",
    },
    leaf: {
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: "rgba(221, 232, 221, 0.16)",
      alignItems: "center",
      justifyContent: "center",
      marginVertical: 22,
    },
    wordmark: { fontFamily: fonts.bold, fontSize: 42, color: colors.onForest },
    quote: {
      fontFamily: fonts.quote,
      fontSize: 20,
      color: colors.statusBar === "light" ? colors.onForest : colors.ivory,
      marginTop: 12,
      textAlign: "center",
    },
    footer: { paddingHorizontal: 20, gap: 12 },
    hint: {
      fontFamily: fonts.regular,
      fontSize: 13,
      lineHeight: 18,
      color: colors.muted,
      textAlign: "center",
    },
    preview: { alignItems: "center", paddingVertical: 8 },
    previewText: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      color: colors.forest,
    },
    error: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.rose,
      textAlign: "center",
    },
  });
}
