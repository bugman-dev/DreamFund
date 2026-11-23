import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeftRight, Minus, Plus, Target } from 'lucide-react-native';
import { useText, type MessageId } from '../locale';
import type { Palette } from '../theme/palettes';
import { useColors } from '../theme/Theme';
import { fonts } from '../theme/type';

const ActionsContext = createContext<{ openActions: () => void }>({ openActions: () => undefined });

export function useActions() {
  return useContext(ActionsContext);
}

const ACTIONS: { href: '/money/add' | '/money/withdraw' | '/goal/create' | '/money/transfer'; label: MessageId; Icon: typeof Plus }[] = [
  { href: '/money/add', label: 'actions.addMoney', Icon: Plus },
  { href: '/money/withdraw', label: 'actions.withdraw', Icon: Minus },
  { href: '/goal/create', label: 'actions.newGoal', Icon: Target },
  { href: '/money/transfer', label: 'actions.transfer', Icon: ArrowLeftRight },
];

export function ActionsProvider({ children }: { children: ReactNode }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const text = useText();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ActionsContext.Provider value={{ openActions: () => setOpen(true) }}>
      {children}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]} onPress={() => undefined}>
            <Text style={styles.title}>{text('actions.prompt')}</Text>
            {ACTIONS.map((action) => (
              <Pressable
                key={action.href}
                accessibilityRole="button"
                accessibilityLabel={text(action.label)}
                style={styles.row}
                onPress={() => {
                  setOpen(false);
                  router.push(action.href);
                }}
              >
                <View style={styles.icon}>
                  <action.Icon color={colors.forest} size={20} strokeWidth={2} />
                </View>
                <Text style={styles.label}>{text(action.label)}</Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </ActionsContext.Provider>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(30, 40, 35, 0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.ivory, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 8 },
  title: { fontFamily: fonts.semibold, fontSize: 18, color: colors.ink, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, borderRadius: 10, padding: 12 },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.paleSage, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  });
}
