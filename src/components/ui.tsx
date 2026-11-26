import {
  Check,
  ChevronLeft,
  CircleAlert,
  Info,
  TriangleAlert,
  X,
} from "lucide-react-native";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NOTICE_MS, PERCENT_MAX } from "../constants";
import type { AppNotice, NoticeTone } from "../domain/notice";
import { useText } from "../locale";
import type { Palette } from "../theme/palettes";
import { useColors } from "../theme/Theme";
import { fonts } from "../theme/type";
import { AppIcon } from "./icons";

export function LoadingScreen() {
  const colors = useColors();
  const styles = useUiStyles();
  return (
    <View style={styles.fill}>
      <ActivityIndicator color={colors.forest} />
    </View>
  );
}

export function Screen({
  children,
  footer,
  scroll = true,
}: {
  children: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
}) {
  const styles = useUiStyles();
  const insets = useSafeAreaInsets();
  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={{
        paddingBottom: footer ? 16 : insets.bottom + 28,
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={styles.flex}>{children}</View>
  );
  return (
    <View style={[styles.fill, { paddingTop: insets.top }]}>
      {body}
      {footer ? (
        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          {footer}
        </View>
      ) : null}
    </View>
  );
}

export function ScreenHeader({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack: () => void;
  right?: ReactNode;
}) {
  const colors = useColors();
  const styles = useUiStyles();
  const text = useText();
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={text("common.back")}
        onPress={onBack}
        hitSlop={8}
        style={styles.headerButton}
      >
        <ChevronLeft color={colors.ink} size={24} strokeWidth={2} />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerButton}>{right}</View>
    </View>
  );
}

export function Title({ children }: { children: string }) {
  const styles = useUiStyles();
  return <Text style={styles.title}>{children}</Text>;
}

export function SectionLabel({
  children,
  action,
  onAction,
}: {
  children: string;
  action?: string;
  onAction?: () => void;
}) {
  const styles = useUiStyles();
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.section}>{children}</Text>
      {action && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Button({
  label,
  onPress,
  tone = "primary",
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  tone?: "primary" | "danger" | "ghost";
  disabled?: boolean;
}) {
  const styles = useUiStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        tone === "primary" && styles.buttonPrimary,
        tone === "danger" && styles.buttonDanger,
        tone === "ghost" && styles.buttonGhost,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text
        style={[styles.buttonText, tone === "ghost" && styles.buttonTextGhost]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | null;
  children: ReactNode;
}) {
  const styles = useUiStyles();
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function TextField({
  value,
  onChangeText,
  placeholder,
  multiline = false,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const colors = useColors();
  const styles = useUiStyles();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      multiline={multiline}
      style={[styles.input, multiline && styles.inputMultiline]}
    />
  );
}

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useUiStyles();
  return <View style={[styles.card, style]}>{children}</View>;
}

export function ProgressBar({ progress }: { progress: number }) {
  const styles = useUiStyles();
  return (
    <View style={styles.track}>
      <View
        style={[
          styles.fillBar,
          { width: `${Math.max(0, Math.min(PERCENT_MAX, progress))}%` },
        ]}
      />
    </View>
  );
}

export function CategoryChip({
  name,
  icon,
  accent,
}: {
  name: string;
  icon: string;
  accent: string;
}) {
  const styles = useUiStyles();
  return (
    <View style={styles.chip}>
      <AppIcon name={icon} size={12} color={accent} strokeWidth={2.2} />
      <Text style={styles.chipText}>{name}</Text>
    </View>
  );
}

export function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const styles = useUiStyles();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.filter, selected && styles.filterSelected]}
    >
      <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function EmptyState({
  title,
  body,
  action,
  onAction,
}: {
  title: string;
  body: string;
  action?: string;
  onAction?: () => void;
}) {
  const styles = useUiStyles();
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      {action && onAction ? <Button label={action} onPress={onAction} /> : null}
    </View>
  );
}

export function ErrorText({ children }: { children: string }) {
  const styles = useUiStyles();
  return <Text style={styles.error}>{children}</Text>;
}

export function NoticeBanner({
  notice,
  onDismiss,
}: {
  notice: AppNotice | null;
  onDismiss: () => void;
}) {
  const colors = useColors();
  const styles = useUiStyles();
  const text = useText();
  const insets = useSafeAreaInsets();
  const expand = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(1)).current;
  const tone = notice ? noticeTone(colors, notice.tone) : null;
  const Icon = notice ? NOTICE_ICONS[notice.tone] : Check;

  useEffect(() => {
    if (!notice) return;
    expand.setValue(0);
    progress.setValue(1);
    Animated.timing(expand, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    Animated.timing(progress, {
      toValue: 0,
      duration: NOTICE_MS,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [notice, expand, progress]);

  if (!notice || !tone) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.notice,
        {
          top: insets.top + 8,
          backgroundColor: tone.surface,
          opacity: expand,
          transform: [{ scaleX: expand }, { scaleY: expand }],
        },
      ]}
    >
      <View style={styles.noticeRow}>
        <View style={[styles.noticeIconWrap, { backgroundColor: tone.iconBg }]}>
          <Icon color={tone.accent} size={18} strokeWidth={2.4} />
        </View>
        <View style={styles.noticeCopy}>
          <Text style={styles.noticeTitle}>{notice.title}</Text>
          {notice.body ? (
            <Text style={styles.noticeBody}>{notice.body}</Text>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={text("common.dismissNotice")}
          hitSlop={10}
          onPress={onDismiss}
          style={styles.noticeDismiss}
        >
          <X color={colors.muted} size={18} strokeWidth={2} />
        </Pressable>
      </View>
      <View style={[styles.noticeTrack, { backgroundColor: tone.track }]}>
        <Animated.View
          style={[
            styles.noticeProgress,
            {
              backgroundColor: tone.accent,
              transform: [{ scaleX: progress }],
            },
          ]}
        />
      </View>
    </Animated.View>
  );
}

const NOTICE_ICONS = {
  success: Check,
  error: CircleAlert,
  warning: TriangleAlert,
  info: Info,
} as const;

function noticeTone(colors: Palette, tone: NoticeTone) {
  switch (tone) {
    case "success":
      return {
        surface: colors.paleSage,
        iconBg: "#C9DEC9",
        accent: colors.forest,
        track: "#B7CDB7",
      };
    case "error":
      return {
        surface: colors.roseSoft,
        iconBg: "#F0CFCA",
        accent: colors.rose,
        track: "#E5B8B2",
      };
    case "warning":
      return {
        surface: "#F8EBDA",
        iconBg: "#F5D7B0",
        accent: colors.amber,
        track: "#E8D0AE",
      };
    case "info":
      return {
        surface: "#E8EEF2",
        iconBg: "#D0DBE3",
        accent: colors.sky,
        track: "#C5D2DC",
      };
  }
}

function useUiStyles() {
  const colors = useColors();
  return useMemo(() => createUiStyles(colors), [colors]);
}

function createUiStyles(colors: Palette) {
  return StyleSheet.create({
    flex: { flex: 1 },
    fill: { flex: 1, backgroundColor: colors.ivory },
    footer: {
      paddingHorizontal: 20,
      paddingTop: 8,
      backgroundColor: colors.ivory,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingBottom: 8,
    },
    headerButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      flex: 1,
      textAlign: "center",
      fontFamily: fonts.semibold,
      fontSize: 18,
      color: colors.ink,
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: 32,
      color: colors.ink,
      paddingHorizontal: 20,
    },
    sectionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      marginBottom: 12,
    },
    section: { fontFamily: fonts.semibold, fontSize: 20, color: colors.ink },
    sectionAction: {
      fontFamily: fonts.medium,
      fontSize: 14,
      color: colors.sage,
    },
    button: {
      minHeight: 52,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 18,
    },
    buttonPrimary: { backgroundColor: colors.forest },
    buttonDanger: { backgroundColor: colors.rose },
    buttonGhost: {
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.forest,
    },
    buttonText: {
      fontFamily: fonts.semibold,
      fontSize: 16,
      color: colors.onForest,
    },
    buttonTextGhost: { color: colors.forest },
    disabled: { opacity: 0.45 },
    pressed: { opacity: 0.86 },
    field: { marginBottom: 16 },
    fieldLabel: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.muted,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.white,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.grey,
      minHeight: 52,
      paddingHorizontal: 14,
      fontFamily: fonts.regular,
      fontSize: 16,
      color: colors.ink,
    },
    inputMultiline: { minHeight: 88, paddingTop: 12, textAlignVertical: "top" },
    card: { backgroundColor: colors.white, borderRadius: 12, padding: 16 },
    track: {
      height: 6,
      borderRadius: 99,
      backgroundColor: colors.grey,
      overflow: "hidden",
    },
    fillBar: { height: 6, borderRadius: 99, backgroundColor: colors.sage },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.paleSage,
      borderRadius: 99,
      paddingHorizontal: 8,
      paddingVertical: 4,
      alignSelf: "flex-start",
    },
    chipText: { fontFamily: fonts.medium, fontSize: 11, color: colors.ink },
    filter: {
      borderRadius: 99,
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.grey,
    },
    filterSelected: {
      backgroundColor: colors.forest,
      borderColor: colors.forest,
    },
    filterText: { fontFamily: fonts.medium, fontSize: 13, color: colors.ink },
    filterTextSelected: { color: colors.onForest },
    empty: { paddingHorizontal: 20, paddingVertical: 28, gap: 10 },
    emptyTitle: { fontFamily: fonts.semibold, fontSize: 22, color: colors.ink },
    emptyBody: {
      fontFamily: fonts.regular,
      fontSize: 15,
      color: colors.muted,
      lineHeight: 22,
      marginBottom: 8,
    },
    error: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.rose,
      marginTop: 6,
    },
    notice: {
      position: "absolute",
      left: 16,
      right: 16,
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 14,
      overflow: "hidden",
      zIndex: 20,
    },
    noticeRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
    noticeIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    noticeCopy: { flex: 1, gap: 2, paddingTop: 1 },
    noticeTitle: {
      fontFamily: fonts.semibold,
      fontSize: 15,
      color: colors.ink,
      lineHeight: 20,
    },
    noticeBody: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.muted,
      lineHeight: 18,
    },
    noticeDismiss: { padding: 2, marginTop: 2 },
    noticeTrack: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 2,
      overflow: "hidden",
    },
    noticeProgress: {
      height: 2,
      width: "100%",
      transformOrigin: "left center",
    },
  });
}

export function pagePadding(): ViewStyle {
  return { paddingHorizontal: 20 };
}
