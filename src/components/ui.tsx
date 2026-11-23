import { ChevronLeft } from 'lucide-react-native';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PERCENT_MAX } from '../constants';
import { useText } from '../locale';
import { colors } from '../theme/colors';
import { fonts } from '../theme/type';
import { AppIcon } from './icons';

export function LoadingScreen() {
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
  const insets = useSafeAreaInsets();
  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={{ paddingBottom: footer ? 16 : insets.bottom + 28 }}
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
      {footer ? <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>{footer}</View> : null}
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
  const text = useText();
  return (
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel={text('common.back')} onPress={onBack} hitSlop={8} style={styles.headerButton}>
        <ChevronLeft color={colors.ink} size={24} strokeWidth={2} />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerButton}>{right}</View>
    </View>
  );
}

export function Title({ children }: { children: string }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function SectionLabel({ children, action, onAction }: { children: string; action?: string; onAction?: () => void }) {
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
  tone = 'primary',
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'danger' | 'ghost';
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        tone === 'primary' && styles.buttonPrimary,
        tone === 'danger' && styles.buttonDanger,
        tone === 'ghost' && styles.buttonGhost,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.buttonText, tone === 'ghost' && styles.buttonTextGhost]}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, error, children }: { label: string; error?: string | null; children: ReactNode }) {
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

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function ProgressBar({ progress }: { progress: number }) {
  return (
    <View style={styles.track}>
      <View style={[styles.fillBar, { width: `${Math.max(0, Math.min(PERCENT_MAX, progress))}%` }]} />
    </View>
  );
}

export function CategoryChip({ name, icon, accent }: { name: string; icon: string; accent: string }) {
  return (
    <View style={styles.chip}>
      <AppIcon name={icon} size={12} color={accent} strokeWidth={2.2} />
      <Text style={styles.chipText}>{name}</Text>
    </View>
  );
}

export function FilterChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.filter, selected && styles.filterSelected]}>
      <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{label}</Text>
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
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      {action && onAction ? <Button label={action} onPress={onAction} /> : null}
    </View>
  );
}

export function ErrorText({ children }: { children: string }) {
  return <Text style={styles.error}>{children}</Text>;
}

export function NoticeBanner({ message }: { message: string | null }) {
  const insets = useSafeAreaInsets();
  if (!message) return null;
  return (
    <View pointerEvents="none" style={[styles.notice, { top: insets.top + 8 }]}>
      <Text style={styles.noticeText}>{message}</Text>
    </View>
  );
}

export const text = {
  display: { fontFamily: fonts.bold, fontSize: 36, color: colors.ink, letterSpacing: -0.6 } satisfies TextStyle,
  h1: { fontFamily: fonts.bold, fontSize: 28, color: colors.ink } satisfies TextStyle,
  h2: { fontFamily: fonts.semibold, fontSize: 20, color: colors.ink } satisfies TextStyle,
  h3: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink } satisfies TextStyle,
  body: { fontFamily: fonts.regular, fontSize: 15, color: colors.ink, lineHeight: 22 } satisfies TextStyle,
  small: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted } satisfies TextStyle,
  label: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted } satisfies TextStyle,
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  fill: { flex: 1, backgroundColor: colors.ivory },
  footer: { paddingHorizontal: 20, paddingTop: 8, backgroundColor: colors.ivory },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 8 },
  headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: fonts.semibold, fontSize: 18, color: colors.ink },
  title: { fontFamily: fonts.bold, fontSize: 32, color: colors.ink, paddingHorizontal: 20 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  section: { fontFamily: fonts.semibold, fontSize: 20, color: colors.ink },
  sectionAction: { fontFamily: fonts.medium, fontSize: 14, color: colors.sage },
  button: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  buttonPrimary: { backgroundColor: colors.forest },
  buttonDanger: { backgroundColor: colors.rose },
  buttonGhost: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.forest },
  buttonText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.white },
  buttonTextGhost: { color: colors.forest },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.86 },
  field: { marginBottom: 16 },
  fieldLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted, marginBottom: 8 },
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
  inputMultiline: { minHeight: 88, paddingTop: 12, textAlignVertical: 'top' },
  card: { backgroundColor: colors.white, borderRadius: 12, padding: 16 },
  track: { height: 6, borderRadius: 99, backgroundColor: colors.grey, overflow: 'hidden' },
  fillBar: { height: 6, borderRadius: 99, backgroundColor: colors.sage },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.paleSage,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  chipText: { fontFamily: fonts.medium, fontSize: 11, color: colors.ink },
  filter: { borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.grey },
  filterSelected: { backgroundColor: colors.forest, borderColor: colors.forest },
  filterText: { fontFamily: fonts.medium, fontSize: 13, color: colors.ink },
  filterTextSelected: { color: colors.white },
  empty: { paddingHorizontal: 20, paddingVertical: 28, gap: 10 },
  emptyTitle: { fontFamily: fonts.semibold, fontSize: 22, color: colors.ink },
  emptyBody: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted, lineHeight: 22, marginBottom: 8 },
  error: { fontFamily: fonts.medium, fontSize: 13, color: colors.rose, marginTop: 6 },
  notice: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: colors.paleSage,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 20,
  },
  noticeText: { fontFamily: fonts.medium, fontSize: 14, color: colors.forest, textAlign: 'center' },
});

export function pagePadding(): ViewStyle {
  return { paddingHorizontal: 20 };
}
