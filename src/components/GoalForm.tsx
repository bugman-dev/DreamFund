import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ChevronDown, ImagePlus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { parseRupees } from '../domain/ledger';
import type { Category } from '../domain/categories';
import { formatInr } from '../domain/ledger';
import { colors } from '../theme/colors';
import { fonts } from '../theme/type';
import { CategorySheet } from './CategorySheet';
import { DateField } from './DateField';
import { GENERIC_IMAGE, GoalImage } from './GoalImage';
import { AppIcon } from './icons';
import { Button, ErrorText, Field, Screen, ScreenHeader, TextField } from './ui';

export type GoalDraft = {
  name: string;
  categoryId: string;
  targetPaise: number;
  targetDate: string | null;
  imageUri: string;
};

export function GoalForm({
  title,
  submitLabel,
  categories,
  initial,
  allocatedPaise = 0,
  onSubmit,
}: {
  title: string;
  submitLabel: string;
  categories: Category[];
  initial: { name: string; categoryId: string | null; target: string; targetDate: string; imageUri: string | null };
  allocatedPaise?: number;
  onSubmit: (draft: GoalDraft) => Promise<void>;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [categoryId, setCategoryId] = useState<string | null>(initial.categoryId);
  const [target, setTarget] = useState(initial.target);
  const [targetDate, setTargetDate] = useState(initial.targetDate);
  const [imageUri, setImageUri] = useState(initial.imageUri && !initial.imageUri.startsWith('preset:') ? initial.imageUri : GENERIC_IMAGE);
  const [sheet, setSheet] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const category = categories.find((item) => item.id === categoryId);
  const uploaded = !imageUri.startsWith('preset:');

  async function upload() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Allow photo access to upload a goal image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.8 });
    if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
  }

  async function submit() {
    const targetPaise = parseRupees(target);
    if (!name.trim()) return setError('Enter a goal name.');
    if (!categoryId) return setError('Choose a category.');
    if (targetPaise == null || targetPaise <= 0) return setError('Enter a target greater than zero.');
    const chosenCategory = categoryId;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        categoryId: chosenCategory,
        targetPaise,
        targetDate: targetDate || null,
        imageUri,
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The goal could not be saved.');
      setSaving(false);
    }
  }

  return (
    <Screen
      footer={<Button label={submitLabel} onPress={submit} disabled={saving} />}
    >
      <ScreenHeader title={title} onBack={() => router.back()} />
      <View style={styles.imageWrap}>
        <GoalImage uri={imageUri} style={styles.preview} iconSize={36} />
        {uploaded ? null : (
          <Pressable accessibilityRole="button" accessibilityLabel="Upload image" onPress={upload} style={styles.upload}>
            <ImagePlus color={colors.forest} size={18} />
            <Text style={styles.uploadText}>Upload</Text>
          </Pressable>
        )}
      </View>
      <View style={styles.form}>
        <Field label="Goal Name">
          <TextField value={name} onChangeText={setName} placeholder="Buy a Dishwasher" />
        </Field>
        <Field label="Category">
          <Pressable accessibilityRole="button" onPress={() => setSheet(true)} style={styles.select}>
            {category ? <AppIcon name={category.icon} size={18} color={colors.forest} /> : null}
            <Text style={[styles.selectText, !category && styles.placeholder]}>{category?.name ?? 'Choose a category'}</Text>
            <ChevronDown color={colors.muted} size={18} />
          </Pressable>
        </Field>
        <Field label="Target Amount">
          <TextField value={target} onChangeText={setTarget} placeholder="40,000" />
        </Field>
        {allocatedPaise > 0 ? <Text style={styles.hint}>The target must stay at least {formatInr(allocatedPaise)}.</Text> : null}
        <DateField label="Target Date (Optional)" value={targetDate} onChange={setTargetDate} optional />
        {error ? <ErrorText>{error}</ErrorText> : null}
      </View>
      <CategorySheet visible={sheet} selectedId={categoryId} onClose={() => setSheet(false)} onSelect={(id) => { setCategoryId(id); setSheet(false); }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  imageWrap: { marginHorizontal: 20, marginBottom: 8 },
  preview: { width: '100%', height: 160, borderRadius: 12 },
  upload: { position: 'absolute', right: 12, bottom: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.white, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  uploadText: { fontFamily: fonts.medium, fontSize: 14, color: colors.forest },
  form: { paddingHorizontal: 20, paddingTop: 12 },
  select: { minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: colors.grey, backgroundColor: colors.white, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectText: { flex: 1, fontFamily: fonts.medium, fontSize: 16, color: colors.ink },
  placeholder: { color: colors.muted },
  hint: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: -8, marginBottom: 12 },
});
