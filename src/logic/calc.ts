// Pure calculation functions (SPEC section 7). Nothing here mutates its inputs.
import { itemsById, materialsById } from '../data';
import type { CraftRecord, Item, Material, Outfit, UserState } from '../data/types';

export type Stock = Readonly<Record<string, number>>;
export type Crafted = Readonly<Record<string, CraftRecord>>;
export type ItemStatus = 'crafted' | 'ready' | 'missing';
export type MaterialLookup = (materialId: string) => Material | undefined;

export const STOCK_MIN = 0;
export const STOCK_MAX = 999;

const defaultLookup: MaterialLookup = (id) => materialsById.get(id);

/** Stock amount of a material (missing key = 0). */
export function stockOf(stock: Stock, materialId: string): number {
  return stock[materialId] ?? 0;
}

/** Clamps any input to an integer in 0..999 (non-numbers become 0). */
export function clampStock(value: number): number {
  if (!Number.isFinite(value)) return STOCK_MIN;
  return Math.min(STOCK_MAX, Math.max(STOCK_MIN, Math.trunc(value)));
}

export function isCrafted(itemId: string, crafted: Crafted): boolean {
  return Object.prototype.hasOwnProperty.call(crafted, itemId);
}

/** 7.2: crafted / ready / missing. */
export function itemStatus(item: Item, stock: Stock, crafted: Crafted): ItemStatus {
  if (isCrafted(item.id, crafted)) return 'crafted';
  return item.recipe.every((e) => stockOf(stock, e.materialId) >= e.qty) ? 'ready' : 'missing';
}

/** 7.2: Σ max(0, qty − stock). */
export function shortfall(item: Item, stock: Stock): number {
  return item.recipe.reduce((sum, e) => sum + Math.max(0, e.qty - stockOf(stock, e.materialId)), 0);
}

/** Whether a single recipe entry is covered by the stock (for recipe chips). */
export function hasEnough(materialId: string, qty: number, stock: Stock): boolean {
  return stockOf(stock, materialId) >= qty;
}

/** 7.2: informational lock — some prerequisite is not crafted yet. */
export function isLocked(item: Item, crafted: Crafted): boolean {
  return item.prerequisiteItemIds.some((id) => !isCrafted(id, crafted));
}

export interface Progress {
  done: number;
  total: number;
}

/** Prerequisite progress, e.g. 0/6 for «Легенда Востока». */
export function prerequisiteProgress(item: Item, crafted: Crafted): Progress {
  const total = item.prerequisiteItemIds.length;
  const done = item.prerequisiteItemIds.filter((id) => isCrafted(id, crafted)).length;
  return { done, total };
}

export interface OutfitProgress {
  craftedParts: number;
  totalParts: number;
  complete: boolean;
}

/** 7.3: outfit progress (computed, never stored). */
export function outfitProgress(outfit: Outfit, crafted: Crafted): OutfitProgress {
  const totalParts = outfit.itemIds.length;
  const craftedParts = outfit.itemIds.filter((id) => isCrafted(id, crafted)).length;
  return { craftedParts, totalParts, complete: craftedParts === totalParts };
}

/** Number of crafted items among a list (e.g. «Изготовлено X из Y»). */
export function craftedProgress(list: readonly Item[], crafted: Crafted): Progress {
  return { done: list.filter((i) => isCrafted(i.id, crafted)).length, total: list.length };
}

export interface MaterialNeed {
  materialId: string;
  need: number;
  have: number;
  remaining: number;
}

export interface NeedsTotals {
  /** Materials with remaining > 0. */
  distinct: number;
  /** Σ remaining. */
  units: number;
}

export interface NeedsResult {
  /** Materials with need > 0, in first-appearance order across scope recipes. */
  rows: MaterialNeed[];
  byMaterial: ReadonlyMap<string, MaterialNeed>;
  totals: NeedsTotals;
}

/** 7.4: material needs for a scope. */
export function computeNeeds(
  scopeItems: readonly Item[],
  stock: Stock,
  crafted: Crafted,
  lookup: MaterialLookup = defaultLookup,
): NeedsResult {
  const need = new Map<string, number>();
  for (const item of scopeItems) {
    if (isCrafted(item.id, crafted)) continue;
    for (const e of item.recipe) {
      const m = lookup(e.materialId);
      // Unknown materials are treated as consumable.
      const consumed = m ? m.consumedOnCraft : true;
      if (consumed) need.set(e.materialId, (need.get(e.materialId) ?? 0) + e.qty);
      else need.set(e.materialId, 1);
    }
  }
  const rows: MaterialNeed[] = [];
  const byMaterial = new Map<string, MaterialNeed>();
  let distinct = 0;
  let units = 0;
  for (const [materialId, n] of need) {
    if (n <= 0) continue;
    const have = stockOf(stock, materialId);
    const remaining = Math.max(0, n - have);
    const row = { materialId, need: n, have, remaining };
    rows.push(row);
    byMaterial.set(materialId, row);
    if (remaining > 0) {
      distinct += 1;
      units += remaining;
    }
  }
  return { rows, byMaterial, totals: { distinct, units } };
}

/** Σ remaining of the given materials in a needs result (e.g. per animal). */
export function sumRemaining(needs: NeedsResult, materialIds: readonly string[]): number {
  return materialIds.reduce((s, id) => s + (needs.byMaterial.get(id)?.remaining ?? 0), 0);
}

export interface CraftResult {
  state: UserState;
  /** What was actually deducted (empty if nothing). */
  deducted: Record<string, number>;
  /** False if the item was already crafted or unknown (state unchanged). */
  changed: boolean;
}

/** 7.6 markCrafted as a pure state transition. */
export function applyMarkCrafted(
  state: UserState,
  itemId: string,
  now: string,
  getItem: (id: string) => Item | undefined = (id) => itemsById.get(id),
  lookup: MaterialLookup = defaultLookup,
): CraftResult {
  const item = getItem(itemId);
  if (!item || isCrafted(itemId, state.crafted)) return { state, deducted: {}, changed: false };
  const stock = { ...state.stock };
  const deducted: Record<string, number> = {};
  for (const e of item.recipe) {
    const m = lookup(e.materialId);
    if (m && !m.consumedOnCraft) continue;
    const d = Math.min(stockOf(stock, e.materialId), e.qty);
    if (d > 0) {
      stock[e.materialId] = stockOf(stock, e.materialId) - d;
      deducted[e.materialId] = (deducted[e.materialId] ?? 0) + d;
    }
  }
  return {
    state: {
      ...state,
      stock,
      crafted: { ...state.crafted, [itemId]: { at: now, deducted } },
    },
    deducted,
    changed: true,
  };
}

export interface UncraftResult {
  state: UserState;
  /** Materials returned to the stock. */
  returned: Record<string, number>;
  changed: boolean;
}

/** 7.6 unmarkCrafted as a pure state transition. */
export function applyUnmarkCrafted(state: UserState, itemId: string): UncraftResult {
  const record = state.crafted[itemId];
  if (!record || !isCrafted(itemId, state.crafted)) {
    return { state, returned: {}, changed: false };
  }
  const stock = { ...state.stock };
  for (const [m, d] of Object.entries(record.deducted)) {
    stock[m] = clampStock(stockOf(stock, m) + d);
  }
  const crafted = { ...state.crafted };
  delete crafted[itemId];
  return { state: { ...state, stock, crafted }, returned: { ...record.deducted }, changed: true };
}

/** Sets a stock value (clamped to 0..999). Zero removes the key. */
export function applySetStock(state: UserState, materialId: string, value: number): UserState {
  const v = clampStock(value);
  if (stockOf(state.stock, materialId) === v && (v !== 0 || !(materialId in state.stock))) {
    return state;
  }
  const stock = { ...state.stock };
  if (v === 0) delete stock[materialId];
  else stock[materialId] = v;
  return { ...state, stock };
}

/** Adds or removes an id in a list (immutably). */
export function toggleInList(list: readonly string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}
