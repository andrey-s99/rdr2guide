// Application state (signals) and actions (SPEC 7.6, M2).
import { batch, computed, effect, signal } from '@preact/signals';
import { itemsById, materialShortName, outfitsById } from '../data';
import type { UserState } from '../data/types';
import {
  applyMarkCrafted,
  applySetStock,
  applyUnmarkCrafted,
  computeNeeds,
  isCrafted,
  toggleInList,
  type NeedsResult,
} from '../logic/calc';
import { getScopeItems } from '../logic/scopes';
import {
  BROKEN_STATE_MESSAGE,
  cleanState,
  createInitialState,
  createSaver,
  defaultStorage,
  loadState,
  type KeyValueStorage,
  type Saver,
} from './persist';
import { showToast } from './undo';

export const state = signal<UserState>(createInitialState());

// ---------------------------------------------------------------------------
// Derived values

export const goalsCount = computed(
  () => state.value.goals.items.length + state.value.goals.outfits.length,
);
export const goalItemIds = computed(() => new Set(state.value.goals.items));
export const goalOutfitIds = computed(() => new Set(state.value.goals.outfits));

/** Needs (7.4) for a scope using the current state. Wrap in useComputed in components. */
export function needsForScope(scopeId: string, s: UserState = state.value): NeedsResult {
  return computeNeeds(getScopeItems(scopeId, s.goals), s.stock, s.crafted);
}

// ---------------------------------------------------------------------------
// Initialization and persistence

export interface InitStoreOptions {
  storage?: KeyValueStorage | null;
  now?: () => Date;
  /** Attach the visibilitychange listener (default: true when document exists). */
  listenVisibility?: boolean;
}

let nowFn: () => Date = () => new Date();
let saver: Saver | null = null;
let teardown: (() => void) | null = null;

/** Loads saved state and starts auto-saving. Returns whether the save was broken. */
export function initStore(options: InitStoreOptions = {}): { broken: boolean } {
  teardown?.();
  const storage = options.storage === undefined ? defaultStorage() : options.storage;
  nowFn = options.now ?? (() => new Date());
  const loaded = loadState(storage, nowFn());
  state.value = loaded.state;

  const s = createSaver(() => state.value, storage);
  saver = s;
  let first = true;
  const stopEffect = effect(() => {
    void state.value; // subscribe
    if (first) {
      first = false;
      return;
    }
    s.schedule();
  });

  const listen = options.listenVisibility ?? typeof document !== 'undefined';
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') s.flush();
  };
  if (listen) document.addEventListener('visibilitychange', onVisibility);

  teardown = () => {
    stopEffect();
    s.flush();
    if (listen) document.removeEventListener('visibilitychange', onVisibility);
    saver = null;
    teardown = null;
  };

  if (loaded.broken) showToast({ title: BROKEN_STATE_MESSAGE, detail: '' });
  return { broken: loaded.broken };
}

/** Saves pending changes right away (no-op if nothing pending). */
export function flushSave(): void {
  saver?.flush();
}

/** Test helper: stops persistence and resets to the initial state. */
export function resetStoreForTests(initial: UserState = createInitialState()): void {
  teardown?.();
  nowFn = () => new Date();
  state.value = initial;
}

// ---------------------------------------------------------------------------
// Actions

const MINUS = '−';

/** «Бобр −2, Корова −1» or «Ничего не списано». */
export function formatDeducted(deducted: Record<string, number>): string {
  const parts = Object.entries(deducted)
    .filter(([, d]) => d > 0)
    .map(([m, d]) => `${materialShortName(m)} ${MINUS}${d}`);
  return parts.length > 0 ? parts.join(', ') : 'Ничего не списано';
}

/** Russian plural for «часть»: 1 часть, 2 части, 5 частей. */
export function partsWord(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'часть';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'части';
  return 'частей';
}

export interface ActionOptions {
  /** Show the undo toast (default true). */
  toast?: boolean;
}

/**
 * Marks an item as crafted, deducting consumable materials (7.6).
 * Returns the deducted amounts, or null if nothing changed.
 */
export function markCrafted(
  itemId: string,
  options: ActionOptions = {},
): Record<string, number> | null {
  const res = applyMarkCrafted(state.value, itemId, nowFn().toISOString());
  if (!res.changed) return null;
  state.value = res.state;
  if (options.toast !== false) {
    const item = itemsById.get(itemId);
    showToast({
      title: `Изготовлено: ${item?.nameRu ?? itemId}`,
      detail: formatDeducted(res.deducted),
      undo: () => unmarkCrafted(itemId),
    });
  }
  return res.deducted;
}

/** Removes the crafted mark and returns exactly the deducted materials. */
export function unmarkCrafted(itemId: string): Record<string, number> | null {
  const res = applyUnmarkCrafted(state.value, itemId);
  if (!res.changed) return null;
  state.value = res.state;
  return res.returned;
}

/** Toggles crafted state (checkbox). */
export function toggleCrafted(itemId: string): void {
  if (isCrafted(itemId, state.value.crafted)) unmarkCrafted(itemId);
  else markCrafted(itemId);
}

/**
 * Marks every not-yet-crafted part of an outfit in `itemIds` order with one shared toast.
 * Returns the ids that were marked.
 */
export function markOutfitCrafted(outfitId: string, options: ActionOptions = {}): string[] {
  const outfit = outfitsById.get(outfitId);
  if (!outfit) return [];
  const marked: string[] = [];
  const total: Record<string, number> = {};
  batch(() => {
    for (const id of outfit.itemIds) {
      if (isCrafted(id, state.value.crafted)) continue;
      const deducted = markCrafted(id, { toast: false });
      if (deducted === null) continue;
      marked.push(id);
      for (const [m, d] of Object.entries(deducted)) total[m] = (total[m] ?? 0) + d;
    }
  });
  if (marked.length > 0 && options.toast !== false) {
    showToast({
      title: `Костюм: ${outfit.nameRu}, ${marked.length} ${partsWord(marked.length)}`,
      detail: formatDeducted(total),
      undo: () =>
        batch(() => {
          for (const id of [...marked].reverse()) unmarkCrafted(id);
        }),
    });
  }
  return marked;
}

/** Sets stock to an integer 0..999. */
export function setStock(materialId: string, value: number): void {
  state.value = applySetStock(state.value, materialId, value);
}

export function toggleGoalItem(itemId: string): void {
  const s = state.value;
  state.value = { ...s, goals: { ...s.goals, items: toggleInList(s.goals.items, itemId) } };
}

export function toggleGoalOutfit(outfitId: string): void {
  const s = state.value;
  state.value = { ...s, goals: { ...s.goals, outfits: toggleInList(s.goals.outfits, outfitId) } };
}

export function setSettings(patch: Partial<UserState['settings']>): void {
  const s = state.value;
  state.value = { ...s, settings: { ...s.settings, ...patch } };
}

/** Resets progress (crafted, stock, goals). Settings are kept. */
export function resetAll(): void {
  state.value = { ...createInitialState(), settings: { ...state.value.settings } };
  flushSave();
}

/** Replaces the whole state (e.g. from a backup), applying id cleanup. */
export function importState(next: UserState): void {
  state.value = cleanState(next);
  flushSave();
}
