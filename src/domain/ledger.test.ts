import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GOAL_DELETED_REASON, PRESET_IMAGE_PREFIX } from '../constants.ts';
import {
  applyAddition,
  applyEdit,
  applyGoalDeletion,
  applyGoalPatch,
  applyTransfer,
  applyWithdrawal,
  emptyLedger,
  formatInr,
  GOAL_DELETED_NOTE,
  isCompleted,
  netSaved,
  project,
  totalSavings,
  type Clock,
  type GoalRecord,
  type LedgerState,
} from './ledger.ts';

let sequence = 0;

function clock(): Clock {
  return {
    today: '2026-11-23',
    now: '2026-11-23T09:00:00.000Z',
    id: () => `id-${++sequence}`,
  };
}

function goal(overrides: Partial<GoalRecord> = {}): GoalRecord {
  return {
    id: 'dishwasher',
    name: 'Dishwasher',
    categoryId: 'home',
    targetPaise: 4_000_000,
    targetDate: '2027-04-01',
    imageUri: `${PRESET_IMAGE_PREFIX}home`,
    deletedAt: null,
    categorySnapshot: null,
    categoryIconSnapshot: null,
    ...overrides,
  };
}

function withGoals(...goals: GoalRecord[]): LedgerState {
  return { ...emptyLedger(), goals };
}

function must(result: { ok: true; state: LedgerState } | { ok: false; error: string }): LedgerState {
  assert.equal(result.ok, true, result.ok ? '' : result.error);
  if (!result.ok) throw new Error(result.error);
  return result.state;
}

function allocated(state: LedgerState, id: string): number {
  const projected = project(state);
  assert.equal(projected.ok, true);
  if (!projected.ok) return 0;
  return projected.allocated.get(id) ?? 0;
}

function saved(state: LedgerState): number {
  const projected = project(state);
  assert.equal(projected.ok, true);
  if (!projected.ok) return 0;
  return totalSavings(state, projected.allocated);
}

test('formats rupees with Indian grouping', () => {
  assert.equal(formatInr(7_550_000), '₹75,500');
  assert.equal(formatInr(123_456_700), '₹12,34,567');
  assert.equal(formatInr(50), '₹0.50');
});

test('addition increases the goal and total savings', () => {
  const state = must(applyAddition(withGoals(goal()), {
    goalId: 'dishwasher',
    amountPaise: 1_200_000,
    date: '2026-11-01',
    note: 'Bonus',
  }, clock()));
  assert.equal(allocated(state, 'dishwasher'), 1_200_000);
  assert.equal(saved(state), 1_200_000);
  assert.equal(state.transactions[0]?.type, 'addition');
});

test('addition past the target is blocked and leaves the ledger unchanged', () => {
  const before = withGoals(goal({ targetPaise: 100_000 }));
  const snapshot = structuredClone(before);
  const result = applyAddition(before, {
    goalId: 'dishwasher',
    amountPaise: 150_000,
    date: '2026-11-01',
    note: '',
  }, clock());
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /up to ₹1,000/);
  assert.deepEqual(before, snapshot);
});

test('addition is blocked once the target is already met', () => {
  let state = must(applyAddition(withGoals(goal({ targetPaise: 100_000 })), {
    goalId: 'dishwasher',
    amountPaise: 100_000,
    date: '2026-11-01',
    note: '',
  }, clock()));
  const result = applyAddition(state, {
    goalId: 'dishwasher',
    amountPaise: 100,
    date: '2026-11-02',
    note: '',
  }, clock());
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /already reached its target/);
});

test('withdrawal cannot exceed the available allocation', () => {
  const state = must(applyAddition(withGoals(goal()), {
    goalId: 'dishwasher',
    amountPaise: 50_000,
    date: '2026-11-01',
    note: '',
  }, clock()));
  const result = applyWithdrawal(state, {
    goalId: 'dishwasher',
    amountPaise: 80_000,
    date: '2026-11-02',
    note: '',
  }, clock());
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error, '₹500 is available in Dishwasher.');
});

test('withdrawal reduces total savings', () => {
  let state = must(applyAddition(withGoals(goal()), {
    goalId: 'dishwasher',
    amountPaise: 200_000,
    date: '2026-11-01',
    note: '',
  }, clock()));
  state = must(applyWithdrawal(state, {
    goalId: 'dishwasher',
    amountPaise: 50_000,
    date: '2026-11-02',
    note: 'Returned',
  }, clock()));
  assert.equal(saved(state), 150_000);
  assert.equal(allocated(state, 'dishwasher'), 150_000);
});

test('transfer moves money and leaves total savings unchanged', () => {
  let state = withGoals(goal(), goal({ id: 'trip', name: 'Rajasthan Trip', targetPaise: 5_000_000 }));
  state = must(applyAddition(state, { goalId: 'dishwasher', amountPaise: 500_000, date: '2026-11-01', note: '' }, clock()));
  const before = saved(state);
  state = must(applyTransfer(state, {
    fromGoalId: 'dishwasher',
    toGoalId: 'trip',
    amountPaise: 200_000,
    date: '2026-11-20',
    note: 'Reallocated towards travel',
  }, clock()));
  assert.equal(saved(state), before);
  assert.equal(allocated(state, 'dishwasher'), 300_000);
  assert.equal(allocated(state, 'trip'), 200_000);
  assert.equal(netSaved(state.transactions, null, '2026-11-23'), 500_000);
});

test('transfer to the same goal is rejected', () => {
  const state = must(applyAddition(withGoals(goal()), {
    goalId: 'dishwasher',
    amountPaise: 100_000,
    date: '2026-11-01',
    note: '',
  }, clock()));
  const result = applyTransfer(state, {
    fromGoalId: 'dishwasher',
    toGoalId: 'dishwasher',
    amountPaise: 100,
    date: '2026-11-02',
    note: '',
  }, clock());
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error, 'Choose two different goals.');
});

test('transfer that would pass the destination target is rejected', () => {
  let state = withGoals(
    goal({ targetPaise: 500_000 }),
    goal({ id: 'trip', name: 'Trip', targetPaise: 100_000 }),
  );
  state = must(applyAddition(state, { goalId: 'dishwasher', amountPaise: 300_000, date: '2026-11-01', note: '' }, clock()));
  const result = applyTransfer(state, {
    fromGoalId: 'dishwasher',
    toGoalId: 'trip',
    amountPaise: 150_000,
    date: '2026-11-02',
    note: '',
  }, clock());
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /up to ₹1,000/);
});

test('editing a transaction writes an audit and updates the balance', () => {
  const state = must(applyAddition(withGoals(goal()), {
    goalId: 'dishwasher',
    amountPaise: 100_000,
    date: '2026-11-01',
    note: 'First',
  }, clock()));
  const edited = must(applyEdit(state, {
    transactionId: state.transactions[0].id,
    amountPaise: 250_000,
    note: 'Corrected',
  }, clock()));
  assert.equal(allocated(edited, 'dishwasher'), 250_000);
  assert.equal(edited.audits.length, 1);
  assert.equal(edited.audits[0].previous.amountPaise, 100_000);
  assert.equal(edited.audits[0].updated.amountPaise, 250_000);
  assert.equal(edited.audits[0].updated.note, 'Corrected');
  assert.equal(edited.audits[0].editedAt, '2026-11-23T09:00:00.000Z');
});

test('an edit that breaks the balance is rejected and keeps the original record', () => {
  const state = must(applyAddition(withGoals(goal({ targetPaise: 100_000 })), {
    goalId: 'dishwasher',
    amountPaise: 80_000,
    date: '2026-11-01',
    note: '',
  }, clock()));
  const snapshot = structuredClone(state);
  const result = applyEdit(state, { transactionId: state.transactions[0].id, amountPaise: 180_000 }, clock());
  assert.equal(result.ok, false);
  assert.deepEqual(state, snapshot);
});

test('deleting a funded goal posts a withdrawal, hides the balance, and lowers total savings', () => {
  let state = must(applyAddition(withGoals(goal()), {
    goalId: 'dishwasher',
    amountPaise: 2_500_000,
    date: '2026-10-01',
    note: '',
  }, clock()));
  state = must(applyGoalDeletion(state, {
    goalId: 'dishwasher',
    categoryName: 'Home & Living',
    categoryIcon: 'House',
  }, clock()));
  const deleted = state.goals[0];
  assert.ok(deleted.deletedAt);
  assert.equal(deleted.categorySnapshot, 'Home & Living');
  assert.equal(allocated(state, 'dishwasher'), 0);
  assert.equal(saved(state), 0);
  const withdrawal = state.transactions.find((tx) => tx.lockedReason === GOAL_DELETED_REASON);
  assert.ok(withdrawal);
  assert.equal(withdrawal?.amountPaise, 2_500_000);
  assert.equal(withdrawal?.note, GOAL_DELETED_NOTE);
  assert.equal(state.transactions.filter((tx) => tx.type === 'addition').length, 1);
});

test('deleting an empty goal does not create a withdrawal', () => {
  const state = must(applyGoalDeletion(withGoals(goal()), {
    goalId: 'dishwasher',
    categoryName: 'Home & Living',
    categoryIcon: 'House',
  }, clock()));
  assert.equal(state.transactions.length, 0);
  assert.ok(state.goals[0].deletedAt);
});

test('completion follows the current allocation', () => {
  let state = must(applyAddition(withGoals(goal({ targetPaise: 100_000 })), {
    goalId: 'dishwasher',
    amountPaise: 100_000,
    date: '2026-11-01',
    note: '',
  }, clock()));
  assert.equal(isCompleted(allocated(state, 'dishwasher'), 100_000), true);
  state = must(applyWithdrawal(state, {
    goalId: 'dishwasher',
    amountPaise: 10_000,
    date: '2026-11-02',
    note: '',
  }, clock()));
  assert.equal(isCompleted(allocated(state, 'dishwasher'), 100_000), false);
});

test('a target cannot drop below the amount already saved', () => {
  const state = must(applyAddition(withGoals(goal()), {
    goalId: 'dishwasher',
    amountPaise: 200_000,
    date: '2026-11-01',
    note: '',
  }, clock()));
  const result = applyGoalPatch(state, 'dishwasher', { targetPaise: 100_000 });
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /cannot be lower/);
});

test('a future transaction date is rejected', () => {
  const result = applyAddition(withGoals(goal()), {
    goalId: 'dishwasher',
    amountPaise: 100,
    date: '2026-12-01',
    note: '',
  }, clock());
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /future/);
});

test('a deletion withdrawal can change its note and date, not its amount', () => {
  let state = must(applyAddition(withGoals(goal()), {
    goalId: 'dishwasher',
    amountPaise: 100_000,
    date: '2026-11-01',
    note: '',
  }, clock()));
  state = must(applyGoalDeletion(state, {
    goalId: 'dishwasher',
    categoryName: 'Home & Living',
    categoryIcon: 'House',
  }, clock()));
  const locked = state.transactions.find((tx) => tx.lockedReason === GOAL_DELETED_REASON);
  assert.ok(locked);
  const blocked = applyEdit(state, { transactionId: locked!.id, amountPaise: 50_000 }, clock());
  assert.equal(blocked.ok, false);
  const edited = must(applyEdit(state, { transactionId: locked!.id, note: 'Closed the goal', date: '2026-11-22' }, clock()));
  const updated = edited.transactions.find((tx) => tx.id === locked!.id);
  assert.equal(updated?.note, 'Closed the goal');
  assert.equal(updated?.date, '2026-11-22');
  assert.equal(updated?.amountPaise, 100_000);
  assert.equal(saved(edited), 0);
});
