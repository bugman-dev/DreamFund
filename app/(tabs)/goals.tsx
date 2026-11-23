import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';
import { compareTransactions } from '../../src/domain/ledger';
import { GoalCard } from '../../src/components/GoalCard';
import { EmptyState, FilterChip, Screen, Title } from '../../src/components/ui';
import { useBooks } from '../../src/data/useBooks';
import { useText } from '../../src/locale';
import type { Palette } from '../../src/theme/palettes';
import { useColors } from '../../src/theme/Theme';
import { fonts } from '../../src/theme/type';

export default function GoalsScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const text = useText();
  const router = useRouter();
  const books = useBooks();
  const [categoryId, setCategoryId] = useState('all');
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const goals = useMemo(
    () => books.active.filter((goal) => {
      const matchesCategory = categoryId === 'all' || goal.categoryId === categoryId;
      const matchesQuery = goal.name.toLowerCase().includes(query.trim().toLowerCase());
      return matchesCategory && matchesQuery;
    }),
    [books.active, categoryId, query],
  );
  const categoryName = books.categories.find((category) => category.id === categoryId)?.name;
  const notes = useMemo(() => {
    const latest = new Map<string, string>();
    const ordered = [...books.transactions].sort(compareTransactions);
    for (const tx of ordered) {
      const note = tx.note.trim();
      if (!note) continue;
      latest.set(tx.goalId, note);
      if (tx.counterGoalId) latest.set(tx.counterGoalId, note);
    }
    return latest;
  }, [books.transactions]);

  return (
    <Screen>
      <View style={styles.header}>
        <Title>{text('goals.title')}</Title>
        <Pressable accessibilityRole="button" accessibilityLabel={text('goals.search')} onPress={() => setSearching((value) => !value)} style={styles.searchButton}>
          <Search color={colors.forest} size={20} />
        </Pressable>
      </View>
      {searching ? (
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={text('goals.search')}
          placeholderTextColor={colors.muted}
          style={styles.search}
          autoFocus
        />
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        <FilterChip label={text('common.all')} selected={categoryId === 'all'} onPress={() => setCategoryId('all')} />
        {books.categories.map((category) => (
          <FilterChip key={category.id} label={category.name} selected={categoryId === category.id} onPress={() => setCategoryId(category.id)} />
        ))}
      </ScrollView>
      {goals.length === 0 ? (
        <EmptyState
          title={categoryId === 'all' ? text('goals.emptyAll') : text('goals.emptyCategory', { category: categoryName ?? text('present.category') })}
          body={text('goals.emptyBody')}
          action={text('home.createGoal')}
          onAction={() => router.push('/goal/create')}
        />
      ) : (
        goals.map((goal) => <GoalCard key={goal.id} goal={goal} note={notes.get(goal.id)} onPress={() => router.push(`/goal/${goal.id}`)} />)
      )}
    </Screen>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 12 },
  searchButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  search: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.grey,
    minHeight: 48,
    paddingHorizontal: 14,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.ink,
  },
  filters: { paddingHorizontal: 20, gap: 8, paddingBottom: 16 },
  });
}
