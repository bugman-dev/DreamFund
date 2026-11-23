import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeftRight, Minus, Plus } from 'lucide-react-native';
import { formatDay, formatMonth } from '../../src/domain/dates';
import { useAmount } from '../../src/currency/Currency';
import { compareTransactions } from '../../src/domain/ledger';
import { transactionTitle } from '../../src/data/present';
import { EmptyState, FilterChip, Screen, Title } from '../../src/components/ui';
import { useBooks } from '../../src/data/useBooks';
import { useText, type MessageId } from '../../src/locale';
import type { Palette } from '../../src/theme/palettes';
import { useColors } from '../../src/theme/Theme';
import { fonts } from '../../src/theme/type';

const FILTERS = [
  { id: 'all', label: 'common.all' },
  { id: 'addition', label: 'tx.additions' },
  { id: 'withdrawal', label: 'tx.withdrawals' },
  { id: 'transfer', label: 'tx.transfers' },
] as const satisfies readonly { id: string; label: MessageId }[];

type TransactionFilter = (typeof FILTERS)[number]['id'];

function transactionFilter(value: string | string[] | undefined): TransactionFilter {
  const raw = Array.isArray(value) ? value[0] : value;
  return FILTERS.some((filter) => filter.id === raw) ? (raw as TransactionFilter) : 'all';
}

export default function TransactionsScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const amount = useAmount();
  const text = useText();
  const router = useRouter();
  const params = useLocalSearchParams<{ goalId?: string; type?: string }>();
  const goalId = typeof params.goalId === 'string' ? params.goalId : '';
  const type = transactionFilter(params.type);
  const books = useBooks();
  const goal = books.presented.find((item) => item.id === goalId);
  const rows = useMemo(() => {
    return books.transactions
      .filter((tx) => (type === 'all' ? true : tx.type === type))
      .filter((tx) => (goalId ? tx.goalId === goalId || tx.counterGoalId === goalId : true))
      .sort((a, b) => compareTransactions(b, a));
  }, [books.transactions, goalId, type]);
  const groups = new Map<string, typeof rows>();
  for (const tx of rows) {
    const key = tx.date.slice(0, 7);
    groups.set(key, [...(groups.get(key) ?? []), tx]);
  }

  return (
    <Screen>
      <Title>{text('tx.title')}</Title>
      <View style={styles.filters}>
        {FILTERS.map((filter) => (
          <FilterChip key={filter.id} label={text(filter.label)} selected={type === filter.id} onPress={() => router.setParams({ type: filter.id })} />
        ))}
      </View>
      {goal ? (
        <Pressable accessibilityRole="button" onPress={() => router.setParams({ goalId: '' })} style={styles.goalFilter}>
          <Text style={styles.goalFilterText}>{text('tx.clearGoal', { name: goal.name })}</Text>
        </Pressable>
      ) : null}
      {rows.length === 0 ? (
        <EmptyState title={text('tx.emptyTitle')} body={text('tx.emptyBody')} action={text('tx.addMoney')} onAction={() => router.push('/money/add')} />
      ) : (
        [...groups.entries()].map(([month, items]) => (
          <View key={month} style={styles.group}>
            <Text style={styles.month}>{formatMonth(`${month}-01`)}</Text>
            {items.map((tx) => {
              const positive = tx.type === 'addition';
              const negative = tx.type === 'withdrawal';
              const Icon = tx.type === 'addition' ? Plus : tx.type === 'withdrawal' ? Minus : ArrowLeftRight;
              return (
                <Pressable key={tx.id} accessibilityRole="button" onPress={() => router.push(`/transaction/${tx.id}`)} style={styles.row}>
                  <View style={[styles.icon, negative && styles.iconNegative]}>
                    <Icon color={negative ? colors.rose : colors.sage} size={16} />
                  </View>
                  <View style={styles.copy}>
                    <Text style={styles.rowTitle}>{transactionTitle(tx, books.goals)}</Text>
                    <Text style={styles.rowDetail}>{formatDay(tx.date)}</Text>
                    {tx.note.trim() ? <Text style={styles.note} numberOfLines={2}>{tx.note.trim()}</Text> : null}
                  </View>
                  <Text style={[styles.amount, positive && styles.amountPositive, negative && styles.amountNegative]}>
                    {negative ? '-' : positive ? '+' : ''}{amount(tx.amountPaise)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))
      )}
    </Screen>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, paddingVertical: 16 },
  goalFilter: { alignSelf: 'flex-start', marginHorizontal: 20, marginBottom: 8, backgroundColor: colors.paleSage, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 },
  goalFilterText: { fontFamily: fonts.medium, fontSize: 13, color: colors.forest },
  group: { paddingHorizontal: 20, marginBottom: 8 },
  month: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: colors.white, borderRadius: 10, padding: 12, marginBottom: 8 },
  icon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.paleSage, alignItems: 'center', justifyContent: 'center' },
  iconNegative: { backgroundColor: colors.roseSoft },
  copy: { flex: 1 },
  rowTitle: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  rowDetail: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, marginTop: 2 },
  note: { fontFamily: fonts.regular, fontSize: 13, color: colors.ink, marginTop: 2 },
  amount: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  amountPositive: { color: colors.sage },
  amountNegative: { color: colors.rose },
  });
}
