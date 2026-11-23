import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, Minus, PieChart, Plus, Target } from 'lucide-react-native';
import { firstName, greeting } from '../../src/domain/dates';
import { formatInr } from '../../src/domain/ledger';
import { useSession } from '../../src/auth/session';
import { GoalCard } from '../../src/components/GoalCard';
import { EmptyState, ProgressBar, Screen, SectionLabel } from '../../src/components/ui';
import { useBooks } from '../../src/data/useBooks';
import { useText, type MessageId } from '../../src/locale';
import type { Palette } from '../../src/theme/palettes';
import { useColors } from '../../src/theme/Theme';
import { fonts } from '../../src/theme/type';

const ACTIONS: { label: MessageId; href: '/money/add' | '/money/withdraw' | '/goal/create' | '/insights'; Icon: typeof Plus }[] = [
  { label: 'home.addMoney', href: '/money/add', Icon: Plus },
  { label: 'home.withdraw', href: '/money/withdraw', Icon: Minus },
  { label: 'home.newGoal', href: '/goal/create', Icon: Target },
  { label: 'home.insights', href: '/insights', Icon: PieChart },
];

export default function HomeScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const text = useText();
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
        <Pressable accessibilityRole="button" accessibilityLabel={text('home.profile')} onPress={() => router.push('/(tabs)/profile')} style={styles.bell}>
          <Bell color={colors.forest} size={20} />
        </Pressable>
      </View>
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>{text('home.totalSaved')}</Text>
        <Text style={styles.summaryAmount}>{formatInr(books.saved)}</Text>
        <View style={styles.summaryMeta}>
          <Text style={styles.summaryOf}>{text('home.ofAmount', { amount: formatInr(books.target) })}</Text>
          <Text style={styles.summaryPercent}>{books.progress}%</Text>
        </View>
        <ProgressBar progress={books.progress} />
        <Text style={styles.goalCount}>{text('home.goalCount', { count: books.active.length })}</Text>
      </View>
      <View style={styles.actions}>
        {ACTIONS.map((action) => (
          <Pressable key={action.href} accessibilityRole="button" accessibilityLabel={text(action.label)} style={styles.action} onPress={() => router.push(action.href)}>
            <View style={styles.actionIcon}>
              <action.Icon color={colors.forest} size={22} />
            </View>
            <Text style={styles.actionLabel}>{text(action.label)}</Text>
          </Pressable>
        ))}
      </View>
      <SectionLabel children={text('home.myGoals')} action={books.active.length ? text('home.seeAll') : undefined} onAction={() => router.push('/(tabs)/goals')} />
      {books.active.length === 0 ? (
        <EmptyState
          title={text('home.emptyTitle')}
          body={text('home.emptyBody')}
          action={text('home.createGoal')}
          onAction={() => router.push('/goal/create')}
        />
      ) : (
        books.active.slice(0, 4).map((goal) => <GoalCard key={goal.id} goal={goal} onPress={() => router.push(`/goal/${goal.id}`)} />)
      )}
    </Screen>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 32, paddingBottom: 16 },
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
  actionIcon: { width: 68, height: 68, borderRadius: 12, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.ink, textAlign: 'center' },
  });
}
