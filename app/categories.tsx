import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ICON_NAMES } from '../src/domain/icons';
import type { Category } from '../src/domain/categories';
import { AppIcon } from '../src/components/icons';
import { Button, ErrorText, Screen, ScreenHeader } from '../src/components/ui';
import { useData } from '../src/data/store';
import { useText } from '../src/locale';
import { colors } from '../src/theme/colors';
import { fonts } from '../src/theme/type';

export default function CategoriesScreen() {
  const text = useText();
  const router = useRouter();
  const data = useData();
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Heart');
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  function open(category?: Category) {
    setError(null);
    if (category) {
      setEditing(category);
      setName(category.name);
      setIcon(category.icon);
      setCreating(false);
      return;
    }
    setEditing(null);
    setName('');
    setIcon('Heart');
    setCreating(true);
  }

  async function save() {
    setError(null);
    try {
      if (creating) await data.createCategory(name, icon);
      else if (editing) await data.updateCategory(editing.id, name, icon);
      setCreating(false);
      setEditing(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : text('categories.saveFailed'));
    }
  }

  async function remove() {
    if (!editing) return;
    setError(null);
    try {
      await data.deleteCategory(editing.id);
      setEditing(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : text('categories.deleteFailed'));
    }
  }

  return (
    <Screen>
      <ScreenHeader title={text('categories.title')} onBack={() => router.back()} />
      <View style={styles.list}>
        {data.categories.map((category) => (
          <Pressable key={category.id} accessibilityRole="button" onPress={() => open(category)} style={styles.row}>
            <View style={styles.icon}>
              <AppIcon name={category.icon} size={18} color={colors.forest} />
            </View>
            <Text style={styles.name}>{category.name}</Text>
            <Text style={styles.edit}>{text('categories.edit')}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.add}>
        <Button label={text('categories.add')} onPress={() => open()} />
      </View>
      <Modal visible={creating || editing != null} transparent animationType="fade" onRequestClose={() => { setCreating(false); setEditing(null); }}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{creating ? text('categories.new') : text('categories.editTitle')}</Text>
            <TextInput value={name} onChangeText={setName} placeholder={text('categories.namePlaceholder')} placeholderTextColor={colors.muted} style={styles.input} />
            <View style={styles.icons}>
              {ICON_NAMES.map((item) => (
                <Pressable key={item} accessibilityRole="button" onPress={() => setIcon(item)} style={[styles.choice, icon === item && styles.choiceSelected]}>
                  <AppIcon name={item} size={16} color={icon === item ? colors.white : colors.forest} />
                </Pressable>
              ))}
            </View>
            {error ? <ErrorText>{error}</ErrorText> : null}
            <Button label={text('common.save')} onPress={() => void save()} />
            {editing ? <Button label={text('common.delete')} tone="danger" onPress={() => void remove()} /> : null}
            <Button label={text('common.close')} tone="ghost" onPress={() => { setCreating(false); setEditing(null); }} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 20, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, borderRadius: 10, padding: 12 },
  icon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.paleSage, alignItems: 'center', justifyContent: 'center' },
  name: { flex: 1, fontFamily: fonts.medium, fontSize: 16, color: colors.ink },
  edit: { fontFamily: fonts.medium, fontSize: 13, color: colors.sage },
  add: { padding: 20 },
  backdrop: { flex: 1, backgroundColor: 'rgba(30, 40, 35, 0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.ivory, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 12, maxHeight: '80%' },
  sheetTitle: { fontFamily: fonts.semibold, fontSize: 20, color: colors.ink },
  input: { backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.grey, minHeight: 48, paddingHorizontal: 14, fontFamily: fonts.regular, fontSize: 16, color: colors.ink },
  icons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.paleSage, alignItems: 'center', justifyContent: 'center' },
  choiceSelected: { backgroundColor: colors.forest },
});
