import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatInr } from '../domain/ledger';
import type { PresentedGoal } from '../data/present';
import { colors } from '../theme/colors';
import { fonts } from '../theme/type';
import { GoalImage } from './GoalImage';
import { CategoryChip, ProgressBar } from './ui';

export function GoalCard({ goal, onPress }: { goal: PresentedGoal; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={goal.name} onPress={onPress} style={styles.card}>
      <GoalImage uri={goal.imageUri} style={styles.image} iconSize={26} />
      <View style={styles.body}>
        <View style={styles.top}>
          <Text style={styles.name} numberOfLines={1}>{goal.name}</Text>
          <CategoryChip name={goal.categoryName} icon={goal.categoryIcon} accent={goal.accent} />
        </View>
        <View style={styles.amounts}>
          <Text style={styles.saved}>{formatInr(goal.allocatedPaise)}</Text>
          <Text style={styles.target}>of {formatInr(goal.targetPaise)}</Text>
          <Text style={styles.percent}>{goal.progress}%</Text>
        </View>
        <ProgressBar progress={goal.progress} />
        {goal.completed ? <Text style={styles.done}>Completed</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: 12, backgroundColor: colors.white, borderRadius: 12, padding: 12, marginHorizontal: 20, marginBottom: 12 },
  image: { width: 72, height: 72, borderRadius: 8 },
  body: { flex: 1, justifyContent: 'center', gap: 6 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1, fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  amounts: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  saved: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  target: { flex: 1, fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  percent: { fontFamily: fonts.semibold, fontSize: 12, color: colors.sage },
  done: { fontFamily: fonts.medium, fontSize: 12, color: colors.sage },
});
