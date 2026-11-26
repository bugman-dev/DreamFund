import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { ChevronDown } from "lucide-react-native";
import { MONEY_SHORTCUTS, PAISE_PER_RUPEE } from "../constants";
import { todayIso } from "../domain/dates";
import { useAmount } from "../currency/Currency";
import { NOTE_LIMIT, parseRupees } from "../domain/ledger";
import type { PresentedGoal } from "../data/present";
import { useText } from "../locale";
import type { Palette } from "../theme/palettes";
import { useColors } from "../theme/Theme";
import { fonts } from "../theme/type";
import { useData } from "../data/store";
import { ConfirmModal } from "./ConfirmModal";
import { DateField } from "./DateField";
import { GoalImage } from "./GoalImage";
import { GoalSheet } from "./GoalSheet";
import {
  Button,
  EmptyState,
  ErrorText,
  Field,
  LoadingScreen,
  Screen,
  ScreenHeader,
} from "./ui";

export function MoneyForm({
  mode,
  goals,
  initialGoalId,
  onSubmit,
}: {
  mode: "add" | "withdraw" | "transfer";
  goals: PresentedGoal[];
  initialGoalId?: string;
  onSubmit: (input: {
    goalId: string;
    counterGoalId?: string;
    amountPaise: number;
    date: string;
    note: string;
  }) => Promise<void>;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const money = useAmount();
  const text = useText();
  const router = useRouter();
  const data = useData();
  const active = useMemo(() => goals.filter((goal) => !goal.deleted), [goals]);
  const choice = useGoalChoice(active, initialGoalId, mode);
  const { goal, counter } = choice;
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const title =
    mode === "add"
      ? text("money.addTitle")
      : mode === "withdraw"
        ? text("money.withdrawTitle")
        : text("money.transferTitle");
  const action =
    mode === "add"
      ? text("money.addAction")
      : mode === "withdraw"
        ? text("money.withdrawAction")
        : text("money.transferAction");

  const message = useMemo(
    () =>
      moneyConfirmMessage(
        mode,
        parseRupees(amount),
        goal,
        counter,
        money,
        text,
      ),
    [amount, counter, goal, mode, money, text],
  );

  if (!data.ready) {
    return (
      <Screen>
        <ScreenHeader title={title} onBack={() => router.back()} />
        <LoadingScreen />
      </Screen>
    );
  }
  if (active.length === 0) {
    return (
      <Screen>
        <ScreenHeader title={title} onBack={() => router.back()} />
        <EmptyState
          title={text("money.needGoalTitle")}
          body={text("money.needGoalBody")}
          action={text("home.createGoal")}
          onAction={() => router.push("/goal/create")}
        />
      </Screen>
    );
  }
  if (mode === "transfer" && active.length < 2) {
    return (
      <Screen>
        <ScreenHeader title={title} onBack={() => router.back()} />
        <EmptyState
          title={text("money.needTwoTitle")}
          body={text("money.needTwoBody")}
          action={text("home.createGoal")}
          onAction={() => router.push("/goal/create")}
        />
      </Screen>
    );
  }

  function addShortcut(rupees: number) {
    const current = parseRupees(amount) ?? 0;
    setAmount(String((current + rupees * PAISE_PER_RUPEE) / PAISE_PER_RUPEE));
  }

  function askConfirm() {
    const paise = parseRupees(amount);
    if (!goal) return setError(text("common.chooseGoal"));
    if (paise == null || paise <= 0)
      return setError(text("money.amountRequired"));
    if (mode === "transfer" && (!counter || counter.id === goal.id))
      return setError(text("money.twoGoals"));
    if (note.trim().length > NOTE_LIMIT)
      return setError(text("money.noteLimit", { limit: NOTE_LIMIT }));
    setError(null);
    setConfirming(true);
  }

  async function confirm() {
    const paise = parseRupees(amount);
    if (!goal || paise == null) return;
    setSaving(true);
    try {
      await onSubmit({
        goalId: goal.id,
        counterGoalId: counter?.id,
        amountPaise: paise,
        date,
        note: note.trim(),
      });
      setConfirming(false);
      router.back();
    } catch (reason) {
      setConfirming(false);
      setError(
        reason instanceof Error ? reason.message : text("money.recordFailed"),
      );
      setSaving(false);
    }
  }

  return (
    <Screen
      footer={
        <Button
          label={action}
          tone={mode === "withdraw" ? "danger" : "primary"}
          onPress={askConfirm}
          disabled={saving}
        />
      }
    >
      <ScreenHeader title={title} onBack={() => router.back()} />
      <View style={styles.body}>
        {mode === "transfer" ? (
          <Text style={styles.kicker}>{text("money.from")}</Text>
        ) : null}
        <GoalRow
          goal={goal}
          onPress={() => choice.setPicking("from")}
          detail={
            mode === "withdraw"
              ? text("money.available", {
                  amount: money(goal?.allocatedPaise ?? 0),
                })
              : text("money.savedOf", {
                  saved: money(goal?.allocatedPaise ?? 0),
                  target: money(goal?.targetPaise ?? 0),
                })
          }
        />
        {mode === "transfer" ? (
          <>
            <Text style={styles.kicker}>{text("money.to")}</Text>
            <GoalRow
              goal={counter}
              onPress={() => choice.setPicking("to")}
              detail={
                counter
                  ? text("money.roomLeft", {
                      amount: money(counter.remainingPaise),
                    })
                  : text("common.chooseGoal")
              }
            />
          </>
        ) : null}
        <Field label={text("money.amount")}>
          <TextInput
            value={amount}
            onChangeText={(value) =>
              setAmount(value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1"))
            }
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.grey}
            style={styles.amount}
          />
        </Field>
        <View style={styles.shortcuts}>
          {MONEY_SHORTCUTS.map((rupees) => (
            <Pressable
              key={rupees}
              accessibilityRole="button"
              onPress={() => addShortcut(rupees)}
              style={styles.shortcut}
            >
              <Text style={styles.shortcutText}>
                +{money(rupees * PAISE_PER_RUPEE)}
              </Text>
            </Pressable>
          ))}
        </View>
        <DateField
          label={text("money.date")}
          value={date}
          onChange={setDate}
          maximumDate={todayIso()}
        />
        <Field label={text("money.note")}>
          <TextInput
            value={note}
            onChangeText={(value) => setNote(value.slice(0, NOTE_LIMIT))}
            placeholder={
              mode === "withdraw"
                ? text("money.noteWithdrawPlaceholder")
                : text("money.noteAddPlaceholder")
            }
            placeholderTextColor={colors.muted}
            multiline
            style={styles.note}
          />
          <Text style={styles.count}>
            {note.length}/{NOTE_LIMIT}
          </Text>
        </Field>
        {error ? <ErrorText>{error}</ErrorText> : null}
      </View>
      <GoalSheet
        visible={choice.picking !== null}
        goals={choice.sheetGoals.current}
        selectedId={choice.sheetSelected.current}
        onClose={() => choice.setPicking(null)}
        onSelect={choice.choose}
      />
      <ConfirmModal
        visible={confirming}
        title={action}
        message={message}
        confirmLabel={action}
        tone={mode === "withdraw" ? "danger" : "primary"}
        busy={saving}
        onConfirm={confirm}
        onCancel={() => setConfirming(false)}
      />
    </Screen>
  );
}

function useGoalChoice(
  active: PresentedGoal[],
  initialGoalId: string | undefined,
  mode: "add" | "withdraw" | "transfer",
) {
  const [goalId, setGoalId] = useState("");
  const [counterGoalId, setCounterGoalId] = useState("");
  const [picking, setPicking] = useState<"from" | "to" | null>(null);
  useEffect(() => {
    if (active.length === 0) return;
    setGoalId((current) => {
      if (current && active.some((goal) => goal.id === current)) return current;
      if (initialGoalId && active.some((goal) => goal.id === initialGoalId))
        return initialGoalId;
      return active[0].id;
    });
  }, [active, initialGoalId]);
  useEffect(() => {
    if (mode !== "transfer") return;
    setCounterGoalId((current) => {
      if (
        current &&
        current !== goalId &&
        active.some((goal) => goal.id === current)
      )
        return current;
      return active.find((goal) => goal.id !== goalId)?.id ?? "";
    });
  }, [active, goalId, mode]);
  const goal = active.find((item) => item.id === goalId);
  const counter = active.find((item) => item.id === counterGoalId);
  const sheetGoals = useRef(active);
  const sheetSelected = useRef(goalId);
  if (picking) {
    sheetGoals.current =
      picking === "to" ? active.filter((item) => item.id !== goalId) : active;
    sheetSelected.current = picking === "to" ? counterGoalId : goalId;
  }
  function choose(id: string) {
    if (picking === "from") {
      setGoalId(id);
      if (id === counterGoalId)
        setCounterGoalId(active.find((item) => item.id !== id)?.id ?? "");
    } else {
      setCounterGoalId(id);
    }
    setPicking(null);
  }
  return {
    goal,
    counter,
    picking,
    setPicking,
    sheetGoals,
    sheetSelected,
    choose,
  };
}

function moneyConfirmMessage(
  mode: "add" | "withdraw" | "transfer",
  paise: number | null,
  goal: PresentedGoal | undefined,
  counter: PresentedGoal | undefined,
  money: (paise: number) => string,
  text: ReturnType<typeof useText>,
) {
  if (!paise || !goal) return "";
  if (mode === "add")
    return text("money.confirmAdd", { amount: money(paise), name: goal.name });
  if (mode === "withdraw")
    return text("money.confirmWithdraw", {
      amount: money(paise),
      name: goal.name,
    });
  return text("money.confirmTransfer", {
    amount: money(paise),
    name: goal.name,
    counter: counter?.name ?? text("money.anotherGoal"),
  });
}

function GoalRow({
  goal,
  detail,
  onPress,
}: {
  goal?: PresentedGoal;
  detail: string;
  onPress: () => void;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const text = useText();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.goal}>
      <GoalImage
        uri={goal?.imageUri ?? null}
        style={styles.thumb}
        iconSize={18}
      />
      <View style={styles.goalText}>
        <Text style={styles.goalName}>
          {goal?.name ?? text("common.chooseGoal")}
        </Text>
        <Text style={styles.goalDetail}>{detail}</Text>
      </View>
      <ChevronDown color={colors.muted} size={18} />
    </Pressable>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    body: { paddingHorizontal: 20 },
    kicker: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.muted,
      marginBottom: 8,
    },
    goal: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.white,
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
    },
    thumb: { width: 52, height: 52, borderRadius: 14 },
    goalText: { flex: 1 },
    goalName: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
    goalDetail: {
      fontFamily: fonts.regular,
      fontSize: 13,
      color: colors.muted,
      marginTop: 2,
    },
    amount: {
      fontFamily: fonts.bold,
      fontSize: 40,
      color: colors.ink,
      backgroundColor: colors.white,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    shortcuts: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 12,
      marginBottom: 16,
    },
    shortcut: {
      backgroundColor: colors.paleSage,
      borderRadius: 99,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    shortcutText: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.forest,
    },
    note: {
      minHeight: 88,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.grey,
      backgroundColor: colors.white,
      padding: 14,
      fontFamily: fonts.regular,
      fontSize: 15,
      color: colors.ink,
      textAlignVertical: "top",
    },
    count: {
      alignSelf: "flex-end",
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.muted,
      marginTop: 6,
    },
  });
}
