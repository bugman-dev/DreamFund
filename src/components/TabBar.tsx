import { Pressable, StyleSheet, Text, View } from 'react-native';
import { House, Plus, Receipt, Target, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useText, type MessageId } from '../locale';
import { colors } from '../theme/colors';
import { fonts } from '../theme/type';
import { useActions } from './ActionSheet';

type DreamTabBarProps = {
  state: { index: number; routes: { name: string; key: string }[] };
  navigateToTab: (routeKey: string) => void;
};

const ITEMS: { name: string; label: MessageId | null; Icon: typeof House }[] = [
  { name: 'index', label: 'tabs.home', Icon: House },
  { name: 'goals', label: 'tabs.goals', Icon: Target },
  { name: 'plus', label: null, Icon: Plus },
  { name: 'transactions', label: 'tabs.transactions', Icon: Receipt },
  { name: 'profile', label: 'tabs.profile', Icon: User },
];

export function DreamTabBar({ state, navigateToTab }: DreamTabBarProps) {
  const text = useText();
  const insets = useSafeAreaInsets();
  const { openActions } = useActions();
  const current = state.routes[state.index]?.name;

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {ITEMS.map((item) => {
        if (item.name === 'plus') {
          return (
            <Pressable key="plus" accessibilityRole="button" accessibilityLabel={text('common.create')} onPress={openActions} style={styles.plusWrap}>
              <View style={styles.plus}>
                <Plus color={colors.white} size={28} strokeWidth={2.4} />
              </View>
            </Pressable>
          );
        }
        const selected = current === item.name;
        const color = selected ? colors.forest : colors.muted;
        return (
          <Pressable
            key={item.name}
            accessibilityRole="button"
            accessibilityLabel={item.label ? text(item.label) : undefined}
            onPress={() => {
              const route = state.routes.find((entry) => entry.name === item.name);
              if (route) navigateToTab(route.key);
            }}
            style={styles.item}
          >
            <item.Icon color={color} size={22} strokeWidth={selected ? 2.4 : 2} />
            <Text style={[styles.label, { color }]}>{item.label ? text(item.label) : ''}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.grey,
    paddingTop: 8,
  },
  item: { flex: 1, alignItems: 'center', gap: 4 },
  label: { fontFamily: fonts.medium, fontSize: 11 },
  plusWrap: { flex: 1, alignItems: 'center' },
  plus: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
  },
});
