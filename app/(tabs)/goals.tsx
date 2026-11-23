import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';
import { GoalCard } from '../../src/components/GoalCard';
import { EmptyState, FilterChip, Screen, Title } from '../../src/components/ui';
import { useBooks } from '../../src/data/useBooks';
import { useText } from '../../src/locale';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/type';

export default function GoalsScreen() {
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
        goals.map((goal) => <GoalCard key={goal.id} goal={goal} onPress={() => router.push(`/goal/${goal.id}`)} />)
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
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
