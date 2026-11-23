import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Ellipsis, Minus, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { daysUntil, formatDay, todayIso } from '../../src/domain/dates';
import { compareTransactions, formatInr } from '../../src/domain/ledger';
import { transactionTitle } from '../../src/data/present';
import { ConfirmModal } from '../../src/components/ConfirmModal';
import { GoalImage } from '../../src/components/GoalImage';
import { Button, CategoryChip, EmptyState } from '../../src/components/ui';
import { useBooks } from '../../src/data/useBooks';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/type';

export default function GoalDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const goalId = typeof id === 'string' ? id : '';
  const books = useBooks();
  const goal = books.active.find((item) => item.id === goalId);
  const [menu, setMenu] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activity = books.transactions
    .filter((tx) => tx.goalId === goalId || tx.counterGoalId === goalId)
    .sort((a, b) => compareTransactions(b, a))
    .slice(0, 4);

  if (!goal) {
    return (
      <View style={styles.missing}>
        <EmptyState title="Goal not found" body="It may have been deleted. Its transactions remain in history." action="Back to goals" onAction={() => router.back()} />
      </View>
    );
  }

  const current = goal;
  const days = current.targetDate ? daysUntil(current.targetDate, todayIso()) : null;

  async function remove() {
    try {
      await books.deleteGoal(current.id);
      router.back();
    } catch (reason) {
      setConfirming(false);
      setError(reason instanceof Error ? reason.message : 'The goal could not be deleted.');
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}>
        <GoalImage uri={goal.imageUri} style={styles.hero} iconSize={64} />
        <View style={[styles.toolbar, { top: insets.top + 8 }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.round}>
            <ChevronLeft color={colors.ink} size={22} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Goal actions" onPress={() => setMenu(true)} style={styles.round}>
            <Ellipsis color={colors.ink} size={20} />
          </Pressable>
        </View>
        <View style={styles.card}>
          <CategoryChip name={goal.categoryName} icon={goal.categoryIcon} accent={goal.accent} />
          <Text style={styles.name}>{goal.name}</Text>
          {goal.completed ? <Text style={styles.completed}>Completed</Text> : null}
          <View style={styles.figures}>
            <View style={styles.figureCopy}>
              <Text style={styles.amount}>{formatInr(goal.allocatedPaise)}</Text>
              <Text style={styles.of}>of {formatInr(goal.targetPaise)}</Text>
              <Text style={styles.remaining}>{formatInr(goal.remainingPaise)} remaining</Text>
            </View>
            <Ring progress={goal.progress} />
          </View>
          <View style={styles.meta}>
            <View style={styles.metaTile}>
              <Text style={styles.metaLabel}>Target date</Text>
              <Text style={styles.metaValue}>{goal.targetDate ? formatDay(goal.targetDate) : 'Not set'}</Text>
            </View>
            <View style={styles.metaTile}>
              <Text style={styles.metaLabel}>Days left</Text>
              <Text style={styles.metaValue}>{days == null ? '—' : days < 0 ? 'Passed' : String(days)}</Text>
            </View>
          </View>
        </View>
        <View style={styles.activityHeader}>
          <Text style={styles.activityTitle}>Recent Activity</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/(tabs)/transactions', params: { goalId: goal.id } })}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>
        {activity.length === 0 ? <Text style={styles.quiet}>No money has been recorded for this goal yet.</Text> : null}
        {activity.map((tx) => {
          const outgoing = tx.type === 'withdrawal' || (tx.type === 'transfer' && tx.goalId === goalId);
          return (
            <Pressable key={tx.id} accessibilityRole="button" onPress={() => router.push(`/transaction/${tx.id}`)} style={styles.activity}>
              <View style={[styles.activityIcon, outgoing && styles.activityIconNegative]}>
                {outgoing ? <Minus color={colors.rose} size={16} /> : <Plus color={colors.sage} size={16} />}
              </View>
              <View style={styles.activityCopy}>
                <Text style={styles.activityName}>{transactionTitle(tx, books.goals)}</Text>
                <Text style={styles.activityDate}>{formatDay(tx.date)}</Text>
              </View>
              <Text style={[styles.activityAmount, outgoing && styles.negative]}>
                {outgoing ? '-' : '+'}{formatInr(tx.amountPaise)}
              </Text>
            </Pressable>
          );
        })}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.action}>
          <Button label="Withdraw" tone="danger" onPress={() => router.push({ pathname: '/money/withdraw', params: { goalId: goal.id } })} />
        </View>
        <View style={styles.action}>
          <Button label="Add Money" onPress={() => router.push({ pathname: '/money/add', params: { goalId: goal.id } })} />
        </View>
      </View>
      {menu ? (
        <View style={styles.menuWrap}>
          <Pressable style={styles.menuBackdrop} onPress={() => setMenu(false)} />
          <View style={[styles.menu, { top: insets.top + 58 }]}>
            <Pressable accessibilityRole="button" onPress={() => { setMenu(false); router.push(`/goal/edit/${goal.id}`); }} style={styles.menuItem}>
              <Text style={styles.menuText}>Edit goal</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => { setMenu(false); router.push({ pathname: '/money/transfer', params: { goalId: goal.id } }); }} style={styles.menuItem}>
              <Text style={styles.menuText}>Transfer</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => { setMenu(false); setConfirming(true); }} style={styles.menuItem}>
              <Text style={styles.menuDanger}>Delete goal</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      <ConfirmModal
        visible={confirming}
        title={`Delete ${goal.name}?`}
        message={goal.allocatedPaise > 0
          ? `This records a withdrawal of ${formatInr(goal.allocatedPaise)} and removes the goal. Its history stays in Transactions.`
          : 'Its history stays in Transactions.'}
        confirmLabel="Delete goal"
        tone="danger"
        onCancel={() => setConfirming(false)}
        onConfirm={() => void remove()}
      />
    </View>
  );
}

function Ring({ progress }: { progress: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dash = (progress / 100) * circumference;
  return (
    <View style={styles.ring}>
      <Svg width={72} height={72}>
        <Circle cx={36} cy={36} r={radius} stroke={colors.grey} strokeWidth={6} fill="none" />
        <Circle
          cx={36}
          cy={36}
          r={radius}
          stroke={colors.sage}
          strokeWidth={6}
          fill="none"
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
        />
      </Svg>
      <Text style={styles.ringText}>{progress}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ivory },
  missing: { flex: 1, backgroundColor: colors.ivory, justifyContent: 'center' },
  hero: { height: 240, width: '100%' },
  toolbar: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  round: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  card: { marginTop: -28, marginHorizontal: 16, backgroundColor: colors.white, borderRadius: 12, padding: 20 },
  name: { fontFamily: fonts.bold, fontSize: 26, color: colors.ink, marginTop: 10 },
  completed: { fontFamily: fonts.medium, fontSize: 13, color: colors.sage, marginTop: 4 },
  figures: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  figureCopy: { flex: 1 },
  amount: { fontFamily: fonts.bold, fontSize: 32, color: colors.ink },
  of: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, marginTop: 2 },
  remaining: { fontFamily: fonts.medium, fontSize: 13, color: colors.sage, marginTop: 4 },
  ring: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  ringText: { position: 'absolute', fontFamily: fonts.semibold, fontSize: 13, color: colors.sage },
  meta: { flexDirection: 'row', gap: 10, marginTop: 18 },
  metaTile: { flex: 1, backgroundColor: colors.ivory, borderRadius: 10, padding: 12 },
  metaLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted },
  metaValue: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink, marginTop: 4 },
  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 22, marginBottom: 8 },
  activityTitle: { fontFamily: fonts.semibold, fontSize: 18, color: colors.ink },
  seeAll: { fontFamily: fonts.medium, fontSize: 14, color: colors.sage },
  quiet: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, paddingHorizontal: 20 },
  activity: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 20, marginBottom: 8, backgroundColor: colors.white, borderRadius: 10, padding: 12 },
  activityIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.paleSage, alignItems: 'center', justifyContent: 'center' },
  activityIconNegative: { backgroundColor: colors.roseSoft },
  activityCopy: { flex: 1 },
  activityName: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  activityDate: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, marginTop: 2 },
  activityAmount: { fontFamily: fonts.semibold, fontSize: 14, color: colors.sage },
  negative: { color: colors.rose },
  error: { color: colors.rose, fontFamily: fonts.medium, paddingHorizontal: 20, marginTop: 8 },
  actions: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 10, backgroundColor: colors.ivory },
  action: { flex: 1 },
  menuWrap: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  menuBackdrop: { flex: 1 },
  menu: { position: 'absolute', right: 16, backgroundColor: colors.white, borderRadius: 10, paddingVertical: 6, minWidth: 180 },
  menuItem: { paddingHorizontal: 16, paddingVertical: 12 },
  menuText: { fontFamily: fonts.medium, fontSize: 15, color: colors.ink },
  menuDanger: { fontFamily: fonts.medium, fontSize: 15, color: colors.rose },
});
