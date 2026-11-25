// Pure calculation functions (SPEC section 7). Nothing here mutates its inputs.
import { itemsById, materialsById } from '../data';
import type { CraftRecord, Item, Material, Outfit, UserState, VendorId } from '../data/types';

/** Stock of one vendor: materialId -> amount. */
export type Stock = Readonly<Record<string, number>>;
/** Separate stock per vendor (Trapper and Pearson never share pelts). */
export type Stocks = Readonly<Record<VendorId, Stock>>;
export type Crafted = Readonly<Record<string, CraftRecord>>;
export type ItemStatus = 'crafted' | 'ready' | 'missing';
export type MaterialLookup = (materialId: string) => Material | undefined;

export const STOCK_MIN = 0;
export const STOCK_MAX = 999;

const defaultLookup: MaterialLookup = (id) => materialsById.get(id);

export const VENDOR_IDS: readonly VendorId[] = ['trapper', 'pearson', 'fence'];

const EMPTY_STOCK: Stock = Object.freeze({});

/** Empty stock for every vendor. */
export function emptyStocks(): Record<VendorId, Record<string, number>> {
  return { trapper: {}, pearson: {}, fence: {} };
}

/** Stock of one vendor (missing = empty). */
export function vendorStock(stocks: Stocks, vendorId: VendorId): Stock {
  return stocks[vendorId] ?? EMPTY_STOCK;
}

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
export function itemStatus(item: Item, stocks: Stocks, crafted: Crafted): ItemStatus {
  if (isCrafted(item.id, crafted)) return 'crafted';
  const stock = vendorStock(stocks, item.vendorId);
  return item.recipe.every((e) => stockOf(stock, e.materialId) >= e.qty) ? 'ready' : 'missing';
}

/** 7.2: Σ max(0, qty − stock of the item's vendor). */
export function shortfall(item: Item, stocks: Stocks): number {
  const stock = vendorStock(stocks, item.vendorId);
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

/** Prerequisite progress, e.g. 0/6. */
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

/** Number of crafted items among a list (e.g. "Crafted X of Y"). */
export function craftedProgress(list: readonly Item[], crafted: Crafted): Progress {
  return { done: list.filter((i) => isCrafted(i.id, crafted)).length, total: list.length };
}

export interface MaterialNeed {
  /** Whose stock this row counts: the same pelt is needed separately for each vendor. */
  vendorId: VendorId;
  materialId: string;
  need: number;
  have: number;
  remaining: number;
}

export interface NeedsTotals {
  /** Distinct materials with remaining > 0 (for any vendor). */
  distinct: number;
  /** Σ remaining. */
  units: number;
}

export interface NeedsResult {
  /** (vendor, material) pairs with need > 0, in first-appearance order across scope recipes. */
  rows: MaterialNeed[];
  /** Key: needKey(vendorId, materialId). */
  byKey: ReadonlyMap<string, MaterialNeed>;
  totals: NeedsTotals;
}

/** Key of a needs row: one per vendor and material. */
export function needKey(vendorId: VendorId, materialId: string): string {
  return `${vendorId}:${materialId}`;
}

/** Needs row of a material for one vendor, if the scope needs it there. */
export function needOf(
  needs: NeedsResult,
  vendorId: VendorId,
  materialId: string,
): MaterialNeed | undefined {
  return needs.byKey.get(needKey(vendorId, materialId));
}

/**
 * 7.4: material needs for a scope. Each vendor keeps its own stock, so a pelt needed
 * by both the Trapper and Pearson gives two rows, each compared with that vendor's stock.
 */
export function computeNeeds(
  scopeItems: readonly Item[],
  stocks: Stocks,
  crafted: Crafted,
  lookup: MaterialLookup = defaultLookup,
): NeedsResult {
  const need = new Map<string, { vendorId: VendorId; materialId: string; n: number }>();
  for (const item of scopeItems) {
    if (isCrafted(item.id, crafted)) continue;
    for (const e of item.recipe) {
      const m = lookup(e.materialId);
      // Unknown materials are treated as consumable.
      const consumed = m ? m.consumedOnCraft : true;
      const key = needKey(item.vendorId, e.materialId);
      const entry = need.get(key) ?? { vendorId: item.vendorId, materialId: e.materialId, n: 0 };
      entry.n = consumed ? entry.n + e.qty : 1;
      need.set(key, entry);
    }
  }
  const rows: MaterialNeed[] = [];
  const byKey = new Map<string, MaterialNeed>();
  const missing = new Set<string>();
  let units = 0;
  for (const [key, { vendorId, materialId, n }] of need) {
    if (n <= 0) continue;
    const have = stockOf(vendorStock(stocks, vendorId), materialId);
    const remaining = Math.max(0, n - have);
    const row = { vendorId, materialId, need: n, have, remaining };
    rows.push(row);
    byKey.set(key, row);
    if (remaining > 0) {
      missing.add(materialId);
      units += remaining;
    }
  }
  return { rows, byKey, totals: { distinct: missing.size, units } };
}

/** Σ remaining of the given materials for all vendors (e.g. per animal). */
export function sumRemaining(needs: NeedsResult, materialIds: readonly string[]): number {
  const ids = new Set(materialIds);
  return needs.rows.reduce((s, r) => s + (ids.has(r.materialId) ? r.remaining : 0), 0);
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
  const stock = { ...vendorStock(state.stock, item.vendorId) };
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
      stock: { ...state.stock, [item.vendorId]: stock },
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

/** 7.6 unmarkCrafted as a pure state transition; materials go back to the item's vendor. */
export function applyUnmarkCrafted(
  state: UserState,
  itemId: string,
  getItem: (id: string) => Item | undefined = (id) => itemsById.get(id),
): UncraftResult {
  const record = state.crafted[itemId];
  const item = getItem(itemId);
  if (!record || !item || !isCrafted(itemId, state.crafted)) {
    return { state, returned: {}, changed: false };
  }
  const stock = { ...vendorStock(state.stock, item.vendorId) };
  for (const [m, d] of Object.entries(record.deducted)) {
    stock[m] = clampStock(stockOf(stock, m) + d);
  }
  const crafted = { ...state.crafted };
  delete crafted[itemId];
  return {
    state: { ...state, stock: { ...state.stock, [item.vendorId]: stock }, crafted },
    returned: { ...record.deducted },
    changed: true,
  };
}

/** Sets a vendor's stock of a material (clamped to 0..999). Zero removes the key. */
export function applySetStock(
  state: UserState,
  vendorId: VendorId,
  materialId: string,
  value: number,
): UserState {
  const v = clampStock(value);
  const current = vendorStock(state.stock, vendorId);
  if (stockOf(current, materialId) === v && (v !== 0 || !(materialId in current))) {
    return state;
  }
  const stock = { ...current };
  if (v === 0) delete stock[materialId];
  else stock[materialId] = v;
  return { ...state, stock: { ...state.stock, [vendorId]: stock } };
}

/** Adds or removes an id in a list (immutably). */
export function toggleInList(list: readonly string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}
