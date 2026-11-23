import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { periodStart, todayIso, type Period } from '../src/domain/dates';
import { formatInr, netSaved } from '../src/domain/ledger';
import { accentFor } from '../src/theme/colors';
import { EmptyState, FilterChip, LoadingScreen, Screen, ScreenHeader } from '../src/components/ui';
import { useBooks } from '../src/data/useBooks';
import { colors } from '../src/theme/colors';
import { fonts } from '../src/theme/type';

const PERIODS: { id: Period; label: string }[] = [
  { id: 'month', label: 'This Month' },
  { id: 'year', label: 'This Year' },
  { id: 'all', label: 'All Time' },
];

export default function InsightsScreen() {
  const router = useRouter();
  const books = useBooks();
  const [period, setPeriod] = useState<Period>('month');
  const today = todayIso();
  const saved = netSaved(books.transactions, periodStart(period, today), today);
  const slices = useMemo(() => {
    const totals = new Map<string, number>();
    for (const goal of books.active) {
      if (goal.allocatedPaise <= 0) continue;
      totals.set(goal.categoryName, (totals.get(goal.categoryName) ?? 0) + goal.allocatedPaise);
    }
    return [...totals.entries()].map(([name, value]) => ({ name, value, color: accentFor(name) }));
  }, [books.active]);

  return (
    <Screen>
      <ScreenHeader title="Insights" onBack={() => router.back()} />
      <View style={styles.filters}>
        {PERIODS.map((item) => (
          <FilterChip key={item.id} label={item.label} selected={period === item.id} onPress={() => setPeriod(item.id)} />
        ))}
      </View>
      {!books.ready ? (
        <LoadingScreen />
      ) : books.active.length === 0 ? (
        <EmptyState title="Nothing to chart yet" body="Create a goal and record what you have set aside." action="Create a goal" onAction={() => router.push('/goal/create')} />
      ) : (
        <>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Saved</Text>
              <Text style={[styles.statValue, saved < 0 && styles.negative]}>{formatInr(saved)}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Goals</Text>
              <Text style={styles.statValue}>{books.active.length}</Text>
            </View>
          </View>
          <Text style={styles.section}>Allocation by category</Text>
          <Text style={styles.caption}>Saved is the net added in this period. The chart is what is set aside now.</Text>
          <View style={styles.chartCard}>
            <Donut slices={slices} total={books.saved} />
            <View style={styles.legend}>
              {slices.length === 0 ? <Text style={styles.caption}>Add money to see the split.</Text> : null}
              {slices.map((slice) => (
                <View key={slice.name} style={styles.legendRow}>
                  <View style={[styles.swatch, { backgroundColor: slice.color }]} />
                  <Text style={styles.legendName}>{slice.name}</Text>
                  <Text style={styles.legendValue}>{books.saved ? Math.round((slice.value / books.saved) * 100) : 0}%</Text>
                </View>
              ))}
            </View>
          </View>
        </>
      )}
    </Screen>
  );
}

function Donut({ slices, total }: { slices: { value: number; color: string }[]; total: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <View style={styles.donut}>
      <Svg width={160} height={160}>
        <Circle cx={80} cy={80} r={radius} stroke={colors.grey} strokeWidth={18} fill="none" />
        {total > 0
          ? slices.map((slice, index) => {
              const length = (slice.value / total) * circumference;
              const element = (
                <Circle
                  key={index}
                  cx={80}
                  cy={80}
                  r={radius}
                  stroke={slice.color}
                  strokeWidth={18}
                  fill="none"
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 80 80)"
                />
              );
              offset += length;
              return element;
            })
          : null}
      </Svg>
      <View style={styles.donutLabel}>
        <Text style={styles.donutAmount}>{formatInr(total)}</Text>
        <Text style={styles.donutCaption}>Allocated</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, paddingBottom: 16 },
  stats: { flexDirection: 'row', gap: 12, paddingHorizontal: 20 },
  stat: { flex: 1, backgroundColor: colors.white, borderRadius: 12, padding: 16 },
  statLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted },
  statValue: { fontFamily: fonts.bold, fontSize: 22, color: colors.ink, marginTop: 6 },
  negative: { color: colors.rose },
  section: { fontFamily: fonts.semibold, fontSize: 18, color: colors.ink, paddingHorizontal: 20, marginTop: 22 },
  caption: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, paddingHorizontal: 20, marginTop: 6, lineHeight: 18 },
  chartCard: { margin: 20, backgroundColor: colors.white, borderRadius: 12, padding: 16, alignItems: 'center' },
  donut: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center' },
  donutLabel: { position: 'absolute', alignItems: 'center' },
  donutAmount: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  donutCaption: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted },
  legend: { alignSelf: 'stretch', marginTop: 12, gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  swatch: { width: 10, height: 10, borderRadius: 5 },
  legendName: { flex: 1, fontFamily: fonts.medium, fontSize: 14, color: colors.ink },
  legendValue: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
});
