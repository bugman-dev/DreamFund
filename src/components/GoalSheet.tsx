import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Check, Search, X } from "lucide-react-native";
import { useAmount } from "../currency/Currency";
import type { PresentedGoal } from "../data/present";
import { useText } from "../locale";
import type { Palette } from "../theme/palettes";
import { useColors } from "../theme/Theme";
import { fonts } from "../theme/type";
import { GoalImage } from "./GoalImage";

export function GoalSheet({
  visible,
  goals,
  selectedId,
  onClose,
  onSelect,
}: {
  visible: boolean;
  goals: PresentedGoal[];
  selectedId: string;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const amount = useAmount();
  const text = useText();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (visible) setQuery("");
  }, [visible]);

  const matches = useMemo(
    () =>
      goals.filter((goal) =>
        goal.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [goals, query],
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={text("common.close")}
            onPress={onClose}
            style={styles.iconButton}
          >
            <X color={colors.ink} size={22} />
          </Pressable>
          <Text style={styles.title}>{text("money.selectGoal")}</Text>
          <View style={styles.iconButton} />
        </View>
        <View style={styles.search}>
          <Search color={colors.muted} size={18} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={text("money.searchGoal")}
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
          />
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          {matches.length === 0 ? (
            <Text style={styles.empty}>{text("money.emptyGoals")}</Text>
          ) : null}
          {matches.map((goal) => {
            const selected = goal.id === selectedId;
            return (
              <Pressable
                key={goal.id}
                accessibilityRole="button"
                onPress={() => onSelect(goal.id)}
                style={styles.row}
              >
                <GoalImage
                  uri={goal.imageUri}
                  style={styles.thumb}
                  iconSize={16}
                />
                <View style={styles.copy}>
                  <Text style={styles.name}>{goal.name}</Text>
                  <Text style={styles.meta}>
                    {text("money.savedMeta", {
                      amount: amount(goal.allocatedPaise),
                    })}
                  </Text>
                </View>
                {selected ? <Check color={colors.forest} size={18} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.ivory, paddingTop: 18 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
    },
    iconButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      flex: 1,
      textAlign: "center",
      fontFamily: fonts.semibold,
      fontSize: 18,
      color: colors.ink,
    },
    search: {
      margin: 20,
      marginBottom: 8,
      backgroundColor: colors.white,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.grey,
      minHeight: 48,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontFamily: fonts.regular,
      fontSize: 15,
      color: colors.ink,
      paddingVertical: 10,
    },
    content: { paddingHorizontal: 20, paddingBottom: 32 },
    empty: {
      fontFamily: fonts.regular,
      fontSize: 15,
      color: colors.muted,
      paddingVertical: 12,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 10,
    },
    thumb: { width: 36, height: 36, borderRadius: 18 },
    copy: { flex: 1 },
    name: { fontFamily: fonts.medium, fontSize: 16, color: colors.ink },
    meta: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.muted,
      marginTop: 2,
    },
  });
}
