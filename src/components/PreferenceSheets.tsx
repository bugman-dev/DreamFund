import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Check } from "lucide-react-native";
import { CURRENCY_IDS, type CurrencyId } from "../domain/money";
import { useText, type MessageId } from "../locale";
import {
  PALETTE_IDS,
  palettes,
  type Palette,
  type PaletteId,
} from "../theme/palettes";
import { useColors } from "../theme/Theme";
import { fonts } from "../theme/type";
import { Button } from "./ui";

const THEME_LABEL: Record<PaletteId, MessageId> = {
  forest: "theme.forest",
  ocean: "theme.ocean",
  dusk: "theme.dusk",
};

const CURRENCY_LABEL: Record<CurrencyId, MessageId> = {
  inr: "currency.inr",
  usd: "currency.usd",
  aed: "currency.aed",
};

const CURRENCY_MARK: Record<CurrencyId, string> = {
  inr: "₹",
  usd: "$",
  aed: "د.إ",
};

export function ThemeSheet({
  visible,
  currentId,
  onClose,
  onApply,
}: {
  visible: boolean;
  currentId: PaletteId;
  onClose: () => void;
  onApply: (id: PaletteId) => void;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const text = useText();
  const [draft, setDraft] = useState(currentId);
  useEffect(() => {
    if (visible) setDraft(currentId);
  }, [currentId, visible]);
  return (
    <ChoiceSheet
      visible={visible}
      title={text("profile.appThemes")}
      actionLabel={text("profile.applyTheme")}
      onClose={onClose}
      onApply={() => onApply(draft)}
    >
      <View style={styles.swatches}>
        {PALETTE_IDS.map((paletteId) => {
          const selected = draft === paletteId;
          const swatch = palettes[paletteId];
          return (
            <Pressable
              key={paletteId}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setDraft(paletteId)}
              style={styles.themeOption}
            >
              <View
                style={[
                  styles.swatch,
                  { backgroundColor: swatch.forest },
                  selected && styles.swatchSelected,
                ]}
              >
                {selected ? (
                  <Check color={swatch.onForest} size={22} strokeWidth={2.6} />
                ) : null}
              </View>
              <Text style={styles.themeName}>
                {text(THEME_LABEL[paletteId])}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ChoiceSheet>
  );
}

export function CurrencySheet({
  visible,
  currentId,
  onClose,
  onApply,
}: {
  visible: boolean;
  currentId: CurrencyId;
  onClose: () => void;
  onApply: (id: CurrencyId) => void;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const text = useText();
  const [draft, setDraft] = useState(currentId);
  useEffect(() => {
    if (visible) setDraft(currentId);
  }, [currentId, visible]);
  return (
    <ChoiceSheet
      visible={visible}
      title={text("profile.currency")}
      actionLabel={text("profile.applyCurrency")}
      onClose={onClose}
      onApply={() => onApply(draft)}
    >
      <View style={styles.currencyList}>
        {CURRENCY_IDS.map((id) => {
          const selected = draft === id;
          return (
            <Pressable
              key={id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setDraft(id)}
              style={[
                styles.currencyRow,
                selected && styles.currencyRowSelected,
              ]}
            >
              <Text style={styles.currencyName}>
                {text(CURRENCY_LABEL[id])}
              </Text>
              <Text style={styles.currencyMark}>{CURRENCY_MARK[id]}</Text>
              {selected ? (
                <Check color={colors.forest} size={18} strokeWidth={2.6} />
              ) : (
                <View style={styles.currencyCheckSpace} />
              )}
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.currencyNote}>{text("profile.currencyNote")}</Text>
    </ChoiceSheet>
  );
}

function ChoiceSheet({
  visible,
  title,
  actionLabel,
  onClose,
  onApply,
  children,
}: {
  visible: boolean;
  title: string;
  actionLabel: string;
  onClose: () => void;
  onApply: () => void;
  children: ReactNode;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <Text style={styles.sheetTitle}>{title}</Text>
          {children}
          <Button label={actionLabel} onPress={onApply} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(30, 40, 35, 0.4)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: colors.ivory,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      gap: 16,
    },
    sheetTitle: { fontFamily: fonts.semibold, fontSize: 20, color: colors.ink },
    swatches: { flexDirection: "row", gap: 12 },
    themeOption: { flex: 1, alignItems: "center", gap: 8 },
    swatch: {
      width: "100%",
      aspectRatio: 1,
      maxWidth: 88,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    swatchSelected: { borderWidth: 3, borderColor: colors.ink },
    themeName: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.ink,
      textAlign: "center",
    },
    currencyList: { gap: 8 },
    currencyRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.white,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    currencyRowSelected: { backgroundColor: colors.paleSage },
    currencyName: {
      flex: 1,
      fontFamily: fonts.medium,
      fontSize: 16,
      color: colors.ink,
    },
    currencyMark: {
      fontFamily: fonts.semibold,
      fontSize: 16,
      color: colors.ink,
    },
    currencyCheckSpace: { width: 18 },
    currencyNote: {
      fontFamily: fonts.regular,
      fontSize: 13,
      lineHeight: 18,
      color: colors.muted,
    },
  });
}
