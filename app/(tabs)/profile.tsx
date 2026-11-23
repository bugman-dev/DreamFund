import { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import appConfig from '../../app.json';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Check, ChevronRight, X } from 'lucide-react-native';
import { formatClock } from '../../src/domain/dates';
import { useSession } from '../../src/auth/session';
import { ConfirmModal } from '../../src/components/ConfirmModal';
import { Button, Card, ErrorText, Screen, Title } from '../../src/components/ui';
import { useData } from '../../src/data/store';
import { useText, type MessageId } from '../../src/locale';
import { PALETTE_IDS, palettes, type Palette, type PaletteId } from '../../src/theme/palettes';
import { useColors, useTheme } from '../../src/theme/Theme';
import { fonts } from '../../src/theme/type';

const THEME_LABEL: Record<PaletteId, MessageId> = {
  forest: 'theme.forest',
  ocean: 'theme.ocean',
  dusk: 'theme.dusk',
};

export default function ProfileScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id: themeId, setTheme } = useTheme();
  const text = useText();
  const router = useRouter();
  const { user, signOut } = useSession();
  const data = useData();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<'signout' | 'import' | null>(null);
  const [pickingTime, setPickingTime] = useState(false);
  const [themesOpen, setThemesOpen] = useState(false);
  const [draftTheme, setDraftTheme] = useState<PaletteId>(themeId);
  const initial = user?.name?.trim().charAt(0).toUpperCase() || 'D';

  async function toggleReminder(enabled: boolean) {
    setError(null);
    try {
      await data.setReminder(enabled, data.preferences.reminderHour, data.preferences.reminderMinute);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : text('profile.reminderFailed'));
    }
  }

  async function changeTime(date: Date) {
    setError(null);
    try {
      await data.setReminder(true, date.getHours(), date.getMinutes());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : text('profile.reminderFailed'));
    }
  }

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
      <Row label={text('profile.currency')} value={text('profile.currencyValue')} />
      <Row
        label={text('profile.appThemes')}
        value={text(THEME_LABEL[themeId])}
        onPress={() => {
          setDraftTheme(themeId);
          setThemesOpen(true);
        }}
      />
      <Row label={text('profile.categories')} onPress={() => router.push('/categories')} />
      {Platform.OS === 'web' ? null : (
        <View style={styles.row}>
          <View style={styles.rowCopy}>
            <Text style={styles.rowLabel}>{text('profile.reminder')}</Text>
            <Text style={styles.rowValue}>{data.preferences.reminderEnabled ? formatClock(data.preferences.reminderHour, data.preferences.reminderMinute) : text('profile.reminderOff')}</Text>
          </View>
          <Switch
            value={data.preferences.reminderEnabled}
            onValueChange={(value) => void toggleReminder(value)}
            trackColor={{ true: colors.sage, false: colors.grey }}
            thumbColor={colors.white}
          />
        </View>
      )}
      {Platform.OS !== 'web' && data.preferences.reminderEnabled ? (
        <Row label={text('profile.reminderTime')} value={formatClock(data.preferences.reminderHour, data.preferences.reminderMinute)} onPress={() => setPickingTime(true)} />
      ) : null}
      {pickingTime && Platform.OS !== 'web' ? (
        <DateTimePicker
          value={clockDate(data.preferences.reminderHour, data.preferences.reminderMinute)}
          mode="time"
          onChange={(event, date) => {
            setPickingTime(false);
            if (event.type === 'set' && date) void changeTime(date);
          }}
        />
      ) : null}
      <Text style={styles.group}>{text('profile.data')}</Text>
      <Row label={text('profile.export')} onPress={() => void data.exportBackup().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : text('profile.exportFailed')))} />
      <Row label={text('profile.import')} onPress={() => setConfirming('import')} />
      <Text style={styles.group}>{text('profile.about')}</Text>
      <Card style={styles.about}>
        <Text style={styles.aboutTitle}>{text('profile.version', { version: appConfig.expo.version })}</Text>
        <Text style={styles.aboutBody}>{text('profile.aboutBody')}</Text>
      </Card>
      {error ? <View style={styles.error}><ErrorText>{error}</ErrorText></View> : null}
      <View style={styles.signOut}>
        <Button label={text('profile.signOut')} tone="ghost" onPress={() => setConfirming('signout')} />
      </View>
      <ConfirmModal
        visible={confirming === 'signout'}
        title={text('profile.signOutTitle')}
        message={text('profile.signOutMessage')}
        confirmLabel={text('profile.signOut')}
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          setConfirming(null);
          void signOut().then(() => router.replace('/welcome'));
        }}
      />
      <Modal visible={themesOpen} transparent animationType="fade" onRequestClose={() => setThemesOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setThemesOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{text('profile.appThemes')}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={text('common.close')} onPress={() => setThemesOpen(false)} style={styles.close}>
                <X color={colors.ink} size={22} />
              </Pressable>
            </View>
            <View style={styles.swatches}>
              {PALETTE_IDS.map((paletteId) => {
                const selected = draftTheme === paletteId;
                const swatch = palettes[paletteId];
                return (
                  <Pressable key={paletteId} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => setDraftTheme(paletteId)} style={styles.themeOption}>
                    <View style={[styles.swatch, { backgroundColor: swatch.forest }, selected && styles.swatchSelected]}>
                      {selected ? <Check color={swatch.onForest} size={22} strokeWidth={2.6} /> : null}
                    </View>
                    <Text style={styles.themeName}>{text(THEME_LABEL[paletteId])}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Button
              label={text('profile.applyTheme')}
              onPress={() => {
                setTheme(draftTheme);
                setThemesOpen(false);
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
      <ConfirmModal
        visible={confirming === 'import'}
        title={text('profile.restoreTitle')}
        message={text('profile.restoreMessage')}
        confirmLabel={text('profile.chooseFile')}
        tone="danger"
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          setConfirming(null);
          void data.importBackup().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : text('profile.importFailed')));
        }}
      />
    </Screen>
  );
}

function Row({ label, value, onPress }: { label: string; value?: string; onPress?: () => void }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const content = (
    <>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowEnd}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        {onPress ? <ChevronRight color={colors.muted} size={18} /> : null}
      </View>
    </>
  );
  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      {content}
    </Pressable>
  );
}

function clockDate(hour: number, minute: number): Date {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
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
  rowCopy: { flex: 1 },
  rowLabel: { fontFamily: fonts.medium, fontSize: 15, color: colors.ink },
  rowEnd: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  about: { marginHorizontal: 20 },
  aboutTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  aboutBody: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.muted, marginTop: 6 },
  error: { paddingHorizontal: 20 },
  signOut: { paddingHorizontal: 20, marginTop: 20 },
  backdrop: { flex: 1, backgroundColor: 'rgba(30, 40, 35, 0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.ivory, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 16 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sheetTitle: { flex: 1, fontFamily: fonts.semibold, fontSize: 20, color: colors.ink },
  close: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  swatches: { flexDirection: 'row', gap: 12 },
  themeOption: { flex: 1, alignItems: 'center', gap: 8 },
  swatch: { width: '100%', aspectRatio: 1, maxWidth: 88, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  swatchSelected: { borderWidth: 3, borderColor: colors.ink },
  themeName: { fontFamily: fonts.medium, fontSize: 13, color: colors.ink, textAlign: 'center' },
  });
}
