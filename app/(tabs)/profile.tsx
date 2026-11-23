import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import appConfig from '../../app.json';
import { ChevronRight } from 'lucide-react-native';
import { formatClock } from '../../src/domain/dates';
import { useSession } from '../../src/auth/session';
import { useCurrency } from '../../src/currency/Currency';
import type { CurrencyId } from '../../src/domain/money';
import { ConfirmModal } from '../../src/components/ConfirmModal';
import { CurrencySheet, ThemeSheet } from '../../src/components/PreferenceSheets';
import { Button, Card, Screen, Title } from '../../src/components/ui';
import { useData } from '../../src/data/store';
import { useText, type MessageId } from '../../src/locale';
import type { Palette, PaletteId } from '../../src/theme/palettes';
import { useColors, useTheme } from '../../src/theme/Theme';
import { fonts } from '../../src/theme/type';

const THEME_LABEL: Record<PaletteId, MessageId> = {
  forest: 'theme.forest',
  ocean: 'theme.ocean',
  dusk: 'theme.dusk',
};

const CURRENCY_VALUE: Record<CurrencyId, string> = {
  inr: 'INR ₹',
  usd: 'USD $',
  aed: 'AED',
};

export default function ProfileScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id: themeId, setTheme } = useTheme();
  const { id: currencyId, setCurrency } = useCurrency();
  const text = useText();
  const router = useRouter();
  const { user, signOut } = useSession();
  const data = useData();
  const [confirming, setConfirming] = useState(false);
  const [themesOpen, setThemesOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const initial = user?.name?.trim().charAt(0).toUpperCase() || 'D';

  return (
    <Screen>
      <Title>{text('profile.title')}</Title>
      <Card style={styles.account}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.accountCopy}>
          <Text style={styles.accountName}>{user?.name}</Text>
          <Text style={styles.accountEmail}>{user?.email || text('profile.googleAccount')}</Text>
        </View>
      </Card>
      <Text style={styles.group}>{text('profile.preferences')}</Text>
      <Row
        label={text('profile.currency')}
        value={CURRENCY_VALUE[currencyId]}
        onPress={() => setCurrencyOpen(true)}
      />
      <Row
        label={text('profile.appThemes')}
        value={text(THEME_LABEL[themeId])}
        onPress={() => setThemesOpen(true)}
      />
      <Row label={text('profile.categories')} onPress={() => router.push('/categories')} />
      <View style={[styles.row, styles.unavailable]}>
        <View style={styles.rowCopy}>
          <Text style={styles.rowLabel}>{text('profile.reminder')}</Text>
          <Text style={styles.rowValue}>{data.preferences.reminderEnabled ? formatClock(data.preferences.reminderHour, data.preferences.reminderMinute) : text('profile.reminderOff')}</Text>
        </View>
        <Switch
          disabled
          value={data.preferences.reminderEnabled}
          trackColor={{ true: colors.sage, false: colors.grey }}
          thumbColor={colors.white}
        />
      </View>
      <Text style={styles.group}>{text('profile.data')}</Text>
      <Row label={text('profile.export')} disabled />
      <Row label={text('profile.import')} disabled />
      <Text style={styles.group}>{text('profile.about')}</Text>
      <Card style={styles.about}>
        <Text style={styles.aboutTitle}>{text('profile.version', { version: appConfig.expo.version })}</Text>
        <Text style={styles.aboutBody}>{text('profile.aboutBody')}</Text>
      </Card>
      <View style={styles.signOut}>
        <Button label={text('profile.signOut')} tone="danger" onPress={() => setConfirming(true)} />
      </View>
      <ConfirmModal
        visible={confirming}
        title={text('profile.signOutTitle')}
        message={text('profile.signOutMessage')}
        confirmLabel={text('profile.signOut')}
        tone="danger"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          void signOut().then(() => router.replace('/welcome'));
        }}
      />
      <CurrencySheet
        visible={currencyOpen}
        currentId={currencyId}
        onClose={() => setCurrencyOpen(false)}
        onApply={(id) => {
          setCurrency(id);
          setCurrencyOpen(false);
        }}
      />
      <ThemeSheet
        visible={themesOpen}
        currentId={themeId}
        onClose={() => setThemesOpen(false)}
        onApply={(id) => {
          setTheme(id);
          setThemesOpen(false);
        }}
      />
    </Screen>
  );
}

function Row({ label, value, onPress, disabled = false }: { label: string; value?: string; onPress?: () => void; disabled?: boolean }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const content = (
    <>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowEnd}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        {onPress || disabled ? <ChevronRight color={colors.muted} size={18} /> : null}
      </View>
    </>
  );
  if (disabled || !onPress) return <View style={[styles.row, disabled && styles.unavailable]}>{content}</View>;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      {content}
    </Pressable>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
  account: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 20, marginTop: 16 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.paleSage, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bold, fontSize: 20, color: colors.forest },
  accountCopy: { flex: 1 },
  accountName: { fontFamily: fonts.semibold, fontSize: 18, color: colors.ink },
  accountEmail: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 2 },
  group: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink, marginHorizontal: 20, marginTop: 22, marginBottom: 8 },
  row: { marginHorizontal: 20, marginBottom: 8, backgroundColor: colors.white, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  unavailable: { opacity: 0.45 },
  rowCopy: { flex: 1 },
  rowLabel: { fontFamily: fonts.medium, fontSize: 15, color: colors.ink },
  rowEnd: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  about: { marginHorizontal: 20 },
  aboutTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  aboutBody: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.muted, marginTop: 6 },
  signOut: { paddingHorizontal: 20, marginTop: 20 },
  });
}
