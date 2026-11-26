import { useMemo } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ICON_NAMES, type IconName } from "../domain/icons";
import { useText } from "../locale";
import type { Palette } from "../theme/palettes";
import { useColors } from "../theme/Theme";
import { fonts } from "../theme/type";
import { AppIcon } from "./icons";

export function CategoryDraftFields({
  name,
  onChangeName,
  icon,
  onChangeIcon,
  error,
}: {
  name: string;
  onChangeName: (value: string) => void;
  icon: string;
  onChangeIcon: (icon: IconName) => void;
  error?: string | null;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const text = useText();
  return (
    <View style={styles.fields}>
      <TextInput
        value={name}
        onChangeText={onChangeName}
        placeholder={text("category.namePlaceholder")}
        placeholderTextColor={colors.muted}
        style={styles.input}
      />
      <Text style={styles.choose}>{text("category.chooseIcon")}</Text>
      <View style={styles.icons}>
        {ICON_NAMES.map((item) => {
          const selected = icon === item;
          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityLabel={item}
              onPress={() => onChangeIcon(item)}
              style={[styles.choice, selected && styles.choiceSelected]}
            >
              <AppIcon
                name={item}
                size={18}
                color={selected ? colors.onForest : colors.forest}
              />
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    fields: { gap: 12 },
    input: {
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
    choose: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted },
    icons: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    choice: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.paleSage,
      alignItems: "center",
      justifyContent: "center",
    },
    choiceSelected: { backgroundColor: colors.forest },
    error: { fontFamily: fonts.medium, fontSize: 13, color: colors.rose },
  });
}
