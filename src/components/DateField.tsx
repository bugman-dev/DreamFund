import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { formatDay } from '../domain/dates';
import { useText } from '../locale';
import { colors } from '../theme/colors';
import { fonts } from '../theme/type';
import { Button, Field } from './ui';

export function DateField({
  label,
  value,
  onChange,
  maximumDate,
  optional = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maximumDate?: string;
  optional?: boolean;
}) {
  const text = useText();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value || todayFromDevice());
  const selected = value ? parseIso(value) : new Date();
  const max = maximumDate ? parseIso(maximumDate) : undefined;

  function commit(date: Date) {
    onChange(toIso(date));
  }

  return (
    <Field label={label}>
      <Pressable accessibilityRole="button" onPress={() => { setDraft(value || todayFromDevice()); setOpen(true); }} style={styles.row}>
        <Text style={[styles.value, !value && styles.placeholder]}>{value ? formatDay(value) : optional ? text('common.optional') : text('common.chooseDate')}</Text>
        <Calendar color={colors.forest} size={18} />
      </Pressable>
      {optional && value ? (
        <Pressable accessibilityRole="button" onPress={() => onChange('')} hitSlop={6}>
          <Text style={styles.clear}>{text('common.clearDate')}</Text>
        </Pressable>
      ) : null}
      {Platform.OS === 'android' && open ? (
        <DateTimePicker
          value={selected}
          mode="date"
          maximumDate={max}
          onChange={(event, date) => {
            setOpen(false);
            if (event.type === 'set' && date) commit(date);
          }}
        />
      ) : null}
      {Platform.OS === 'ios' ? (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <View style={styles.backdrop}>
            <View style={styles.sheet}>
              <DateTimePicker
                value={parseIso(draft)}
                mode="date"
                display="spinner"
                maximumDate={max}
                onChange={(_, date) => {
                  if (date) setDraft(toIso(date));
                }}
              />
              <Button label={text('common.done')} onPress={() => { commit(parseIso(draft)); setOpen(false); }} />
            </View>
          </View>
        </Modal>
      ) : null}
    </Field>
  );
}

function todayFromDevice(): string {
  const now = new Date();
  return toIso(now);
}

function parseIso(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function toIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.grey,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: { fontFamily: fonts.medium, fontSize: 16, color: colors.ink },
  placeholder: { color: colors.muted },
  clear: { fontFamily: fonts.medium, fontSize: 13, color: colors.sage, marginTop: 8 },
  backdrop: { flex: 1, backgroundColor: 'rgba(30, 40, 35, 0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.white, padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 12 },
});
