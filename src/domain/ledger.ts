import {
  GOAL_DELETED_NOTE,
  GOAL_DELETED_REASON,
  NAME_LIMIT,
  NOTE_LIMIT,
  PAISE_PER_RUPEE,
} from "../constants";
import { formatAmount as formatMoney, type CurrencyId } from "./money";
import { t } from "../locale/messages";

export { GOAL_DELETED_NOTE, NAME_LIMIT, NOTE_LIMIT };

export type TxType = "addition" | "withdrawal" | "transfer";

export type GoalRecord = {
  id: string;
  name: string;
  categoryId: string;
  targetPaise: number;
  targetDate: string | null;
  imageUri: string | null;
  deletedAt: string | null;
  categorySnapshot: string | null;
  categoryIconSnapshot: string | null;
};

export type TxRecord = {
  id: string;
  type: TxType;
  amountPaise: number;
  date: string;
  note: string;
  goalId: string;
  counterGoalId: string | null;
  lockedReason: typeof GOAL_DELETED_REASON | null;
  createdAt: string;
};

export type TxSnapshot = {
  amountPaise: number;
  date: string;
  note: string;
  goalId: string;
  counterGoalId: string | null;
};

export type AuditRecord = {
  id: string;
  transactionId: string;
  previous: TxSnapshot;
  updated: TxSnapshot;
  editedAt: string;
};

export type LedgerState = {
  goals: GoalRecord[];
  transactions: TxRecord[];
  audits: AuditRecord[];
};

export type Clock = {
  today: string;
  now: string;
  id: () => string;
};

export type LedgerSuccess = { ok: true; state: LedgerState };
export type LedgerFailure = { ok: false; error: string };
export type LedgerResult = LedgerSuccess | LedgerFailure;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function emptyLedger(): LedgerState {
  return { goals: [], transactions: [], audits: [] };
}

export function formatInr(paise: number): string {
  return formatMoney(paise, "inr");
}

export function parseRupees(input: string): number | null {
  const cleaned = input.replace(/,/g, "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, fraction = ""] = cleaned.split(".");
  const paise =
    Number(whole) * PAISE_PER_RUPEE + Number((fraction + "00").slice(0, 2));
  if (!Number.isSafeInteger(paise) || paise < 0) return null;
  return paise;
}

export function paiseToInput(paise: number): string {
  const rupees = Math.trunc(paise / PAISE_PER_RUPEE);
  const fraction = Math.abs(paise) % PAISE_PER_RUPEE;
  return fraction === 0
    ? String(rupees)
    : `${rupees}.${String(fraction).padStart(2, "0")}`;
}

export function isCompleted(
  allocatedPaise: number,
  targetPaise: number,
): boolean {
  return targetPaise > 0 && allocatedPaise >= targetPaise;
}

export function replayLedger(
  state: LedgerState,
  currency: CurrencyId = "inr",
): { ok: true; allocated: Map<string, number> } | LedgerFailure {
  const goals = new Map(state.goals.map((goal) => [goal.id, goal]));
  const allocated = new Map(state.goals.map((goal) => [goal.id, 0]));
  const ordered = [...state.transactions].sort(compareTransactions);

  for (const tx of ordered) {
    const amountError = assertAmount(tx.amountPaise);
    if (amountError) return fail(amountError);
    const goal = goals.get(tx.goalId);
    if (!goal) return fail(t("ledger.goalMissing"));

    if (tx.type === "addition") {
      const next = (allocated.get(tx.goalId) ?? 0) + tx.amountPaise;
      if (next > goal.targetPaise) {
        const room = goal.targetPaise - (allocated.get(tx.goalId) ?? 0);
        return fail(
          room <= 0
            ? t("ledger.addFull", { name: goal.name })
            : t("ledger.addRoom", {
                amount: formatMoney(room, currency),
                name: goal.name,
              }),
        );
      }
      allocated.set(tx.goalId, next);
      continue;
    }

    if (tx.type === "withdrawal") {
      const available = allocated.get(tx.goalId) ?? 0;
      const next = available - tx.amountPaise;
      if (next < 0)
        return fail(
          t("ledger.available", {
            amount: formatMoney(available, currency),
            name: goal.name,
          }),
        );
      allocated.set(tx.goalId, next);
      continue;
    }

    if (!tx.counterGoalId || tx.counterGoalId === tx.goalId)
      return fail(t("ledger.twoGoals"));
    const destination = goals.get(tx.counterGoalId);
    if (!destination) return fail(t("ledger.goalMissing"));
    const available = allocated.get(tx.goalId) ?? 0;
    if (available < tx.amountPaise)
      return fail(
        t("ledger.available", {
          amount: formatMoney(available, currency),
          name: goal.name,
        }),
      );
    const destNext = (allocated.get(tx.counterGoalId) ?? 0) + tx.amountPaise;
    if (destNext > destination.targetPaise) {
      const room =
        destination.targetPaise - (allocated.get(tx.counterGoalId) ?? 0);
      return fail(
        room <= 0
          ? t("ledger.transferFull", { name: destination.name })
          : t("ledger.transferRoom", {
              amount: formatMoney(room, currency),
              name: destination.name,
            }),
      );
    }
    allocated.set(tx.goalId, available - tx.amountPaise);
    allocated.set(tx.counterGoalId, destNext);
  }

  for (const goal of state.goals) {
    if (goal.deletedAt && (allocated.get(goal.id) ?? 0) !== 0) {
      return fail(t("ledger.deletedBalance", { name: goal.name }));
    }
  }

  return { ok: true, allocated };
}

export function totalSavings(
  state: LedgerState,
  allocated: Map<string, number>,
): number {
  return state.goals
    .filter((goal) => !goal.deletedAt)
    .reduce((sum, goal) => sum + (allocated.get(goal.id) ?? 0), 0);
}

export function reconciliationError(
  state: LedgerState,
  allocated: Map<string, number>,
): string | null {
  let stored = 0;
  let active = 0;
  for (const goal of state.goals) {
    const amount = allocated.get(goal.id) ?? 0;
    stored += amount;
    if (!goal.deletedAt) active += amount;
  }
  if (stored !== active) return t("error.reconcile");
  return null;
}

export function netSaved(
  transactions: TxRecord[],
  start: string | null,
  today: string,
): number {
  return transactions.reduce((sum, tx) => {
    if (start && tx.date < start) return sum;
    if (tx.date > today) return sum;
    if (tx.type === "addition") return sum + tx.amountPaise;
    if (tx.type === "withdrawal") return sum - tx.amountPaise;
    return sum;
  }, 0);
}

export function compareTransactions(a: TxRecord, b: TxRecord): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export function validateGoalDraft(
  input: {
    name: string;
    categoryId: string;
    targetPaise: number;
    targetDate: string | null;
    allocatedPaise?: number;
  },
  currency: CurrencyId = "inr",
): string | null {
  const name = input.name.trim();
  if (!name) return t("goal.nameRequired");
  if (name.length > NAME_LIMIT)
    return t("ledger.nameLimit", { limit: NAME_LIMIT });
  if (!input.categoryId) return t("common.chooseCategory");
  if (!Number.isInteger(input.targetPaise) || input.targetPaise <= 0)
    return t("goal.targetRequired");
  const allocated = input.allocatedPaise ?? 0;
  if (input.targetPaise < allocated) {
    return t("ledger.targetMinimum", {
      amount: formatMoney(allocated, currency),
    });
  }
  if (input.targetDate && !isRealDate(input.targetDate))
    return t("ledger.targetDate");
  return null;
}

export function applyAddition(
  state: LedgerState,
  input: { goalId: string; amountPaise: number; date: string; note: string },
  clock: Clock,
  currency: CurrencyId = "inr",
): LedgerResult {
  const goal = state.goals.find((item) => item.id === input.goalId);
  if (!goal || goal.deletedAt) return fail(t("ledger.activeGoal"));
  const note = input.note.trim();
  const invalid =
    assertAmount(input.amountPaise) ||
    assertDate(input.date, clock.today) ||
    assertNote(note);
  if (invalid) return fail(invalid);
  const next = cloneState(state);
  next.transactions.push(
    makeTx(clock, {
      type: "addition",
      amountPaise: input.amountPaise,
      date: input.date,
      note,
      goalId: goal.id,
      counterGoalId: null,
      lockedReason: null,
    }),
  );
  return commit(next, currency);
}

export function applyWithdrawal(
  state: LedgerState,
  input: { goalId: string; amountPaise: number; date: string; note: string },
  clock: Clock,
  currency: CurrencyId = "inr",
): LedgerResult {
  const goal = state.goals.find((item) => item.id === input.goalId);
  if (!goal || goal.deletedAt) return fail(t("ledger.activeGoal"));
  const note = input.note.trim();
  const invalid =
    assertAmount(input.amountPaise) ||
    assertDate(input.date, clock.today) ||
    assertNote(note);
  if (invalid) return fail(invalid);
  const next = cloneState(state);
  next.transactions.push(
    makeTx(clock, {
      type: "withdrawal",
      amountPaise: input.amountPaise,
      date: input.date,
      note,
      goalId: goal.id,
      counterGoalId: null,
      lockedReason: null,
    }),
  );
  return commit(next, currency);
}

export function applyTransfer(
  state: LedgerState,
  input: {
    fromGoalId: string;
    toGoalId: string;
    amountPaise: number;
    date: string;
    note: string;
  },
  clock: Clock,
  currency: CurrencyId = "inr",
): LedgerResult {
  if (input.fromGoalId === input.toGoalId) return fail(t("ledger.twoGoals"));
  const source = state.goals.find((item) => item.id === input.fromGoalId);
  const destination = state.goals.find((item) => item.id === input.toGoalId);
  if (!source || source.deletedAt || !destination || destination.deletedAt)
    return fail(t("ledger.twoActive"));
  const note = input.note.trim();
  const invalid =
    assertAmount(input.amountPaise) ||
    assertDate(input.date, clock.today) ||
    assertNote(note);
  if (invalid) return fail(invalid);
  const next = cloneState(state);
  next.transactions.push(
    makeTx(clock, {
      type: "transfer",
      amountPaise: input.amountPaise,
      date: input.date,
      note,
      goalId: source.id,
      counterGoalId: destination.id,
      lockedReason: null,
    }),
  );
  return commit(next, currency);
}

export function applyEdit(
  state: LedgerState,
  input: {
    transactionId: string;
    amountPaise?: number;
    date?: string;
    note?: string;
    goalId?: string;
    counterGoalId?: string | null;
  },
  clock: Clock,
  currency: CurrencyId = "inr",
): LedgerResult {
  const current = state.transactions.find(
    (item) => item.id === input.transactionId,
  );
  if (!current) return fail(t("ledger.txMissing"));

  const amountPaise = input.amountPaise ?? current.amountPaise;
  const date = input.date ?? current.date;
  const note = (input.note ?? current.note).trim();
  const goalId = input.goalId ?? current.goalId;
  const counterGoalId =
    current.type === "transfer"
      ? input.counterGoalId === undefined
        ? current.counterGoalId
        : input.counterGoalId
      : null;

  if (current.lockedReason === GOAL_DELETED_REASON) {
    if (
      amountPaise !== current.amountPaise ||
      goalId !== current.goalId ||
      counterGoalId !== current.counterGoalId
    ) {
      return fail(t("ledger.lockedEdit"));
    }
  }

  const invalid =
    assertAmount(amountPaise) ||
    assertDate(date, clock.today) ||
    assertNote(note);
  if (invalid) return fail(invalid);

  if (goalId !== current.goalId) {
    const goal = state.goals.find((item) => item.id === goalId);
    if (!goal || goal.deletedAt) return fail(t("ledger.activeGoal"));
  }
  if (current.type === "transfer") {
    if (!counterGoalId) return fail(t("ledger.destination"));
    if (counterGoalId === goalId) return fail(t("ledger.twoGoals"));
    if (counterGoalId !== current.counterGoalId) {
      const destination = state.goals.find((item) => item.id === counterGoalId);
      if (!destination || destination.deletedAt)
        return fail(t("ledger.activeGoal"));
    }
  }

  const updated: TxRecord = {
    ...current,
    amountPaise,
    date,
    note,
    goalId,
    counterGoalId,
  };
  const next = cloneState(state);
  next.transactions = next.transactions.map((item) =>
    item.id === current.id ? updated : item,
  );
  next.audits.push({
    id: clock.id(),
    transactionId: current.id,
    previous: snapshot(current),
    updated: snapshot(updated),
    editedAt: clock.now,
  });
  return commit(next, currency);
}

export function applyGoalPatch(
  state: LedgerState,
  goalId: string,
  patch: {
    name?: string;
    categoryId?: string;
    targetPaise?: number;
    targetDate?: string | null;
    imageUri?: string | null;
  },
  currency: CurrencyId = "inr",
): LedgerResult {
  const goal = state.goals.find((item) => item.id === goalId);
  if (!goal || goal.deletedAt) return fail(t("ledger.goalNotFound"));
  const projected = replayLedger(state, currency);
  if (!projected.ok) return projected;
  const draftError = validateGoalDraft(
    {
      name: patch.name ?? goal.name,
      categoryId: patch.categoryId ?? goal.categoryId,
      targetPaise: patch.targetPaise ?? goal.targetPaise,
      targetDate:
        patch.targetDate === undefined ? goal.targetDate : patch.targetDate,
      allocatedPaise: projected.allocated.get(goal.id) ?? 0,
    },
    currency,
  );
  if (draftError) return fail(draftError);
  const next = cloneState(state);
  next.goals = next.goals.map((item) =>
    item.id === goal.id
      ? {
          ...item,
          name: (patch.name ?? item.name).trim(),
          categoryId: patch.categoryId ?? item.categoryId,
          targetPaise: patch.targetPaise ?? item.targetPaise,
          targetDate:
            patch.targetDate === undefined ? item.targetDate : patch.targetDate,
          imageUri:
            patch.imageUri === undefined ? item.imageUri : patch.imageUri,
        }
      : item,
  );
  return commit(next, currency);
}

export function applyGoalDeletion(
  state: LedgerState,
  input: { goalId: string; categoryName: string; categoryIcon: string },
  clock: Clock,
  currency: CurrencyId = "inr",
): LedgerResult {
  const goal = state.goals.find((item) => item.id === input.goalId);
  if (!goal || goal.deletedAt) return fail(t("ledger.goalNotFound"));
  const projected = replayLedger(state, currency);
  if (!projected.ok) return projected;
  const allocated = projected.allocated.get(goal.id) ?? 0;
  const next = cloneState(state);
  if (allocated > 0) {
    next.transactions.push(
      makeTx(clock, {
        type: "withdrawal",
        amountPaise: allocated,
        date: clock.today,
        note: GOAL_DELETED_NOTE,
        goalId: goal.id,
        counterGoalId: null,
        lockedReason: GOAL_DELETED_REASON,
      }),
    );
  }
  next.goals = next.goals.map((item) =>
    item.id === goal.id
      ? {
          ...item,
          deletedAt: clock.now,
          categorySnapshot: input.categoryName,
          categoryIconSnapshot: input.categoryIcon,
        }
      : item,
  );
  return commit(next, currency);
}

function commit(
  state: LedgerState,
  currency: CurrencyId = "inr",
): LedgerResult {
  const seen = new Set<string>();
  for (const tx of state.transactions) {
    if (seen.has(tx.id)) return fail(t("ledger.duplicate"));
    seen.add(tx.id);
  }
  const projected = replayLedger(state, currency);
  if (!projected.ok) return projected;
  if (reconciliationError(state, projected.allocated))
    return fail(t("error.reconcile"));
  return { ok: true, state };
}

function makeTx(
  clock: Clock,
  input: Omit<TxRecord, "id" | "createdAt">,
): TxRecord {
  return { ...input, id: clock.id(), createdAt: clock.now };
}

function snapshot(tx: TxRecord): TxSnapshot {
  return {
    amountPaise: tx.amountPaise,
    date: tx.date,
    note: tx.note,
    goalId: tx.goalId,
    counterGoalId: tx.counterGoalId,
  };
}

function cloneState(state: LedgerState): LedgerState {
  return {
    goals: state.goals.map((goal) => ({ ...goal })),
    transactions: state.transactions.map((tx) => ({ ...tx })),
    audits: state.audits.map((audit) => ({
      ...audit,
      previous: { ...audit.previous },
      updated: { ...audit.updated },
    })),
  };
}

function fail(error: string): LedgerFailure {
  return { ok: false, error };
}

function assertAmount(amount: number): string | null {
  if (!Number.isInteger(amount) || amount <= 0)
    return t("money.amountRequired");
  return null;
}

function assertNote(note: string): string | null {
  if (note.length > NOTE_LIMIT)
    return t("money.noteLimit", { limit: NOTE_LIMIT });
  return null;
}

function assertDate(date: string, today: string): string | null {
  if (!isRealDate(date)) return t("ledger.dateInvalid");
  if (date > today) return t("ledger.dateFuture");
  return null;
}

function isRealDate(date: string): boolean {
  if (!DATE_PATTERN.test(date)) return false;
  const [year, month, day] = date.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === day
  );
}
