import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ChevronRight } from 'lucide-react-native';
import { formatClock } from '../../src/domain/dates';
import { useSession } from '../../src/auth/session';
import { ConfirmModal } from '../../src/components/ConfirmModal';
import { Button, Card, ErrorText, Screen, Title } from '../../src/components/ui';
import { useData } from '../../src/data/store';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/type';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useSession();
  const data = useData();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<'signout' | 'import' | null>(null);
  const [pickingTime, setPickingTime] = useState(false);
  const initial = user?.name?.trim().charAt(0).toUpperCase() || 'D';

  async function toggleReminder(enabled: boolean) {
    setError(null);
    try {
      await data.setReminder(enabled, data.preferences.reminderHour, data.preferences.reminderMinute);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The reminder could not be saved.');
    }
  }

  async function changeTime(date: Date) {
    setError(null);
    try {
      await data.setReminder(true, date.getHours(), date.getMinutes());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The reminder could not be saved.');
    }
  }

  return (
    <Screen>
      <Title>Profile</Title>
      <Card style={styles.account}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.accountCopy}>
          <Text style={styles.accountName}>{user?.name}</Text>
          <Text style={styles.accountEmail}>{user?.email || 'Google account'}</Text>
        </View>
      </Card>
      <Text style={styles.group}>Preferences</Text>
      <Row label="Currency" value="INR ₹" />
      <Row label="Categories" onPress={() => router.push('/categories')} />
      {Platform.OS === 'web' ? null : (
        <View style={styles.row}>
          <View style={styles.rowCopy}>
            <Text style={styles.rowLabel}>Daily reminder</Text>
            <Text style={styles.rowValue}>{data.preferences.reminderEnabled ? formatClock(data.preferences.reminderHour, data.preferences.reminderMinute) : 'Off'}</Text>
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
        <Row label="Reminder time" value={formatClock(data.preferences.reminderHour, data.preferences.reminderMinute)} onPress={() => setPickingTime(true)} />
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
      <Text style={styles.group}>Data</Text>
      <Row label="Export backup" onPress={() => void data.exportBackup().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'The backup could not be exported.'))} />
      <Row label="Import backup" onPress={() => setConfirming('import')} />
      <Text style={styles.group}>About</Text>
      <Card style={styles.about}>
        <Text style={styles.aboutTitle}>Dream Fund 1.0.0</Text>
        <Text style={styles.aboutBody}>A personal savings allocation tracker. Dream Fund records how you set money aside. It does not hold or move real money.</Text>
      </Card>
      {error ? <View style={styles.error}><ErrorText>{error}</ErrorText></View> : null}
      <View style={styles.signOut}>
        <Button label="Sign out" tone="ghost" onPress={() => setConfirming('signout')} />
      </View>
      <ConfirmModal
        visible={confirming === 'signout'}
        title="Sign out"
        message="Your goals stay on this device for the next time this Google account signs in."
        confirmLabel="Sign out"
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          setConfirming(null);
          void signOut().then(() => router.replace('/welcome'));
        }}
      />
      <ConfirmModal
        visible={confirming === 'import'}
        title="Restore a backup"
        message="This replaces the goals and transactions stored on this device for your account."
        confirmLabel="Choose file"
        tone="danger"
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          setConfirming(null);
          void data.importBackup().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'The backup could not be restored.'));
        }}
      />
    </Screen>
  );
}

function Row({ label, value, onPress }: { label: string; value?: string; onPress?: () => void }) {
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

const styles = StyleSheet.create({
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
});
