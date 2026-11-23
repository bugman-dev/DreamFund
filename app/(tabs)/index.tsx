import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, Minus, PieChart, Plus, Target } from 'lucide-react-native';
import { firstName, greeting } from '../../src/domain/dates';
import { formatInr } from '../../src/domain/ledger';
import { useSession } from '../../src/auth/session';
import { GoalCard } from '../../src/components/GoalCard';
import { EmptyState, ProgressBar, Screen, SectionLabel } from '../../src/components/ui';
import { useBooks } from '../../src/data/useBooks';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/type';

const ACTIONS = [
  { label: 'Add Money', href: '/money/add', Icon: Plus },
  { label: 'Withdraw', href: '/money/withdraw', Icon: Minus },
  { label: 'New Goal', href: '/goal/create', Icon: Target },
  { label: 'Insights', href: '/insights', Icon: PieChart },
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useSession();
  const books = useBooks();
  return (
    <Screen>
      <View style={styles.top}>
        <View style={styles.greetingBlock}>
          <Text style={styles.greeting}>{greeting()},</Text>
          <Text style={styles.name}>{firstName(user?.name ?? '')}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Profile" onPress={() => router.push('/(tabs)/profile')} style={styles.bell}>
          <Bell color={colors.forest} size={20} />
        </Pressable>
      </View>
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Total Saved</Text>
        <Text style={styles.summaryAmount}>{formatInr(books.saved)}</Text>
        <View style={styles.summaryMeta}>
          <Text style={styles.summaryOf}>of {formatInr(books.target)}</Text>
          <Text style={styles.summaryPercent}>{books.progress}%</Text>
        </View>
        <ProgressBar progress={books.progress} />
        <Text style={styles.goalCount}>{books.active.length === 1 ? '1 goal' : `${books.active.length} goals`}</Text>
      </View>
      <View style={styles.actions}>
        {ACTIONS.map((action) => (
          <Pressable key={action.href} accessibilityRole="button" accessibilityLabel={action.label} style={styles.action} onPress={() => router.push(action.href)}>
            <View style={styles.actionIcon}>
              <action.Icon color={colors.forest} size={20} />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
      <SectionLabel children="My Goals" action={books.active.length ? 'See all' : undefined} onAction={() => router.push('/(tabs)/goals')} />
      {books.active.length === 0 ? (
        <EmptyState
          title="Start your first goal"
          body="Dream Fund keeps one savings picture across the things you are planning. Money stays in your real account."
          action="Create a goal"
          onAction={() => router.push('/goal/create')}
        />
      ) : (
        books.active.slice(0, 4).map((goal) => <GoalCard key={goal.id} goal={goal} onPress={() => router.push(`/goal/${goal.id}`)} />)
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  greetingBlock: { flex: 1 },
  greeting: { fontFamily: fonts.regular, fontSize: 16, color: colors.muted },
  name: { fontFamily: fonts.bold, fontSize: 28, color: colors.ink },
  bell: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  summary: { marginHorizontal: 20, backgroundColor: colors.white, borderRadius: 12, padding: 20, gap: 8 },
  summaryLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted },
  summaryAmount: { fontFamily: fonts.bold, fontSize: 36, color: colors.ink },
  summaryMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryOf: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  summaryPercent: { fontFamily: fonts.semibold, fontSize: 14, color: colors.sage },
  goalCount: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted, marginTop: 4 },
  actions: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 22 },
  action: { flex: 1, alignItems: 'center', gap: 8 },
  actionIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.ink, textAlign: 'center' },
});
