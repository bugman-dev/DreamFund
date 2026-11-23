import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useText } from '../locale';
import { colors } from '../theme/colors';
import { fonts } from '../theme/type';
import { Button } from './ui';

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  tone = 'primary',
  busy = false,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  tone?: 'primary' | 'danger';
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const text = useText();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={busy ? undefined : onCancel}>
        <Pressable style={styles.card} onPress={() => undefined}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <View style={styles.action}>
              <Button label={text('common.cancel')} tone="ghost" onPress={onCancel} disabled={busy} />
            </View>
            <View style={styles.action}>
              <Button label={confirmLabel} tone={tone} onPress={onConfirm} disabled={busy} />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(30, 40, 35, 0.4)', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: colors.white, borderRadius: 12, padding: 20 },
  title: { fontFamily: fonts.semibold, fontSize: 20, color: colors.ink },
  message: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted, lineHeight: 22, marginTop: 8, marginBottom: 18 },
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1 },
});
