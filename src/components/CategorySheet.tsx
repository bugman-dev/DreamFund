import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Check, Search, X } from 'lucide-react-native';
import { ICON_NAMES } from '../domain/icons';
import { useData } from '../data/store';
import { useText } from '../locale';
import { colors } from '../theme/colors';
import { fonts } from '../theme/type';
import { AppIcon } from './icons';
import { Button } from './ui';

export function CategorySheet({
  visible,
  selectedId,
  onClose,
  onSelect,
}: {
  visible: boolean;
  selectedId: string | null;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const text = useText();
  const data = useData();
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string>('Heart');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const categories = useMemo(
    () => data.categories.filter((category) => category.name.toLowerCase().includes(query.trim().toLowerCase())),
    [data.categories, query],
  );

  async function addCategory() {
    setSaving(true);
    setError(null);
    try {
      const created = await data.createCategory(name, icon);
      setName('');
      onSelect(created.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : text('category.createFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel={text('common.close')} onPress={onClose} style={styles.iconButton}>
            <X color={colors.ink} size={22} />
          </Pressable>
          <Text style={styles.title}>{text('category.select')}</Text>
          <View style={styles.iconButton} />
        </View>
        <View style={styles.search}>
          <Search color={colors.muted} size={18} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={text('category.search')}
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
          />
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          {categories.map((category) => {
            const selected = category.id === selectedId;
            return (
              <Pressable key={category.id} accessibilityRole="button" onPress={() => onSelect(category.id)} style={styles.row}>
                <View style={styles.iconTile}>
                  <AppIcon name={category.icon} size={18} color={colors.forest} />
                </View>
                <Text style={styles.name}>{category.name}</Text>
                {selected ? <Check color={colors.forest} size={18} /> : null}
              </Pressable>
            );
          })}
          <Text style={styles.addTitle}>{text('category.addTitle')}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={text('category.namePlaceholder')}
            placeholderTextColor={colors.muted}
            style={styles.nameInput}
          />
          <Text style={styles.choose}>{text('category.chooseIcon')}</Text>
          <View style={styles.icons}>
            {ICON_NAMES.map((item) => (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityLabel={item}
                onPress={() => setIcon(item)}
                style={[styles.choice, icon === item && styles.choiceSelected]}
              >
                <AppIcon name={item} size={18} color={icon === item ? colors.white : colors.forest} />
              </Pressable>
            ))}
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button label={name.trim() ? text('category.addNamed', { name: name.trim() }) : text('categories.add')} onPress={addCategory} disabled={saving || !name.trim()} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ivory, paddingTop: 18 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontFamily: fonts.semibold, fontSize: 18, color: colors.ink },
  search: {
    margin: 20,
    marginBottom: 8,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.grey,
    minHeight: 48,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.ink, paddingVertical: 10 },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  iconTile: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.paleSage, alignItems: 'center', justifyContent: 'center' },
  name: { flex: 1, fontFamily: fonts.medium, fontSize: 16, color: colors.ink },
  addTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink, marginTop: 18, marginBottom: 10 },
  nameInput: {
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
  choose: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted, marginTop: 14, marginBottom: 10 },
  icons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  choice: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.paleSage, alignItems: 'center', justifyContent: 'center' },
  choiceSelected: { backgroundColor: colors.forest },
  error: { fontFamily: fonts.medium, fontSize: 13, color: colors.rose, marginBottom: 10 },
});
