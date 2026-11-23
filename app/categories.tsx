import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { ICON_NAMES } from '../src/domain/icons';
import type { Category } from '../src/domain/categories';
import { AppIcon } from '../src/components/icons';
import { Button, ErrorText, Screen, ScreenHeader } from '../src/components/ui';
import { useData } from '../src/data/store';
import { useText } from '../src/locale';
import type { Palette } from '../src/theme/palettes';
import { useColors } from '../src/theme/Theme';
import { fonts } from '../src/theme/type';

export default function CategoriesScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const text = useText();
  const router = useRouter();
  const data = useData();
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Heart');
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [openSheet, setOpenSheet] = useState(false);

  function open(category?: Category) {
    setError(null);
    if (category) {
      setEditing(category);
      setName(category.name);
      setIcon(category.icon);
      setCreating(false);
    } else {
      setEditing(null);
      setName('');
      setIcon('Heart');
      setCreating(true);
    }
    setOpenSheet(true);
  }

  async function save() {
    setError(null);
    try {
      if (creating) await data.createCategory(name, icon);
      else if (editing) await data.updateCategory(editing.id, name, icon);
      setOpenSheet(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : text('categories.saveFailed'));
    }
  }

  async function remove() {
    if (!editing) return;
    setError(null);
    try {
      await data.deleteCategory(editing.id);
      setOpenSheet(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : text('categories.deleteFailed'));
    }
  }

  function close() {
    setOpenSheet(false);
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
      <Modal visible={openSheet} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{creating ? text('categories.new') : text('categories.editTitle')}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={text('common.close')} onPress={close} hitSlop={8} style={styles.close}>
                <X color={colors.ink} size={22} />
              </Pressable>
            </View>
            <TextInput value={name} onChangeText={setName} placeholder={text('categories.namePlaceholder')} placeholderTextColor={colors.muted} style={styles.input} />
            <View style={styles.icons}>
              {ICON_NAMES.map((item) => (
                <Pressable key={item} accessibilityRole="button" onPress={() => setIcon(item)} style={[styles.choice, icon === item && styles.choiceSelected]}>
                  <AppIcon name={item} size={16} color={icon === item ? colors.onForest : colors.forest} />
                </Pressable>
              ))}
            </View>
            {error ? <ErrorText>{error}</ErrorText> : null}
            {editing ? (
              <View style={styles.actions}>
                <View style={styles.action}>
                  <Button label={text('categories.delete')} tone="danger" onPress={() => void remove()} />
                </View>
                <View style={styles.action}>
                  <Button label={text('categories.saveChanges')} onPress={() => void save()} />
                </View>
              </View>
            ) : (
              <Button label={text('categories.add')} onPress={() => void save()} />
            )}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
  list: { paddingHorizontal: 20, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, borderRadius: 10, padding: 12 },
  icon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.paleSage, alignItems: 'center', justifyContent: 'center' },
  name: { flex: 1, fontFamily: fonts.medium, fontSize: 16, color: colors.ink },
  edit: { fontFamily: fonts.medium, fontSize: 13, color: colors.sage },
  add: { padding: 20 },
  backdrop: { flex: 1, backgroundColor: 'rgba(30, 40, 35, 0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.ivory, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 12, maxHeight: '80%' },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sheetTitle: { flex: 1, fontFamily: fonts.semibold, fontSize: 20, color: colors.ink },
  close: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1 },
  input: { backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.grey, minHeight: 48, paddingHorizontal: 14, fontFamily: fonts.regular, fontSize: 16, color: colors.ink },
  icons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.paleSage, alignItems: 'center', justifyContent: 'center' },
  choiceSelected: { backgroundColor: colors.forest },
  });
}
