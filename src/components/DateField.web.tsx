import { Pressable, StyleSheet, Text } from 'react-native';
import { formatDay } from '../domain/dates';
import { useText } from '../locale';
import { colors } from '../theme/colors';
import { fonts } from '../theme/type';
import { Field } from './ui';

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
  return (
    <Field label={label}>
      <input
        aria-label={label}
        type="date"
        value={value}
        max={maximumDate}
        onChange={(event) => onChange(event.target.value)}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          minHeight: 52,
          borderRadius: 14,
          border: `1px solid ${colors.grey}`,
          background: colors.white,
          padding: '0 14px',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 16,
          color: value ? colors.ink : colors.muted,
        }}
      />
      {value ? <Text style={styles.hint}>{formatDay(value)}</Text> : optional ? <Text style={styles.hint}>{text('common.optional')}</Text> : null}
      {optional && value ? (
        <Pressable accessibilityRole="button" onPress={() => onChange('')}>
          <Text style={styles.clear}>{text('common.clearDate')}</Text>
        </Pressable>
      ) : null}
    </Field>
  );
}

const styles = StyleSheet.create({
  hint: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 6 },
  clear: { fontFamily: fonts.medium, fontSize: 13, color: colors.sage, marginTop: 8 },
});
