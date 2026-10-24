// Persistence: localStorage, migrations, backup export/import (SPEC 11).
import { itemsById, materialsById, meta, outfitsById } from '../data';
import type { CraftRecord, UserState } from '../data/types';
import { clampStock } from '../logic/calc';
import { DEFAULT_SCOPE, GOALS_SCOPE, scopeExists } from '../logic/scopes';

export const STATE_KEY = 'rdr2-hunter:state';
export const BROKEN_KEY_PREFIX = 'rdr2-hunter:state-broken-';
export const UI_KEY = 'rdr2-hunter:ui';
export const BACKUP_APP_ID = 'rdr2-hunter';
export const SAVE_DEBOUNCE_MS = 300;
export const BROKEN_STATE_MESSAGE = 'Не удалось прочитать сохранение, начато с нуля';

/** Minimal storage interface (subset of Web Storage) for testability. */
export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** Returns window.localStorage, or null if it is unavailable. */
export function defaultStorage(): KeyValueStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function createInitialState(): UserState {
  return {
    schemaVersion: 1,
    crafted: {},
    stock: {},
    goals: { items: [], outfits: [] },
    settings: { theme: 'night', showEnglish: true },
  };
}

// ---------------------------------------------------------------------------
// Validation and migration

export class StateFormatError extends Error {}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function isStringArray(x: unknown): x is string[] {
  return Array.isArray(x) && x.every((v) => typeof v === 'string');
}

function isCountRecord(x: unknown): x is Record<string, number> {
  return isRecord(x) && Object.values(x).every((v) => typeof v === 'number' && Number.isFinite(v));
}

function parseV1(raw: Record<string, unknown>): UserState {
  const { crafted, stock, goals, settings } = raw;
  if (!isRecord(crafted)) throw new StateFormatError('crafted');
  const craftedOut: Record<string, CraftRecord> = {};
  for (const [id, rec] of Object.entries(crafted)) {
    if (!isRecord(rec) || typeof rec.at !== 'string' || !isCountRecord(rec.deducted)) {
      throw new StateFormatError(`crafted.${id}`);
    }
    craftedOut[id] = { at: rec.at, deducted: { ...rec.deducted } };
  }
  if (!isCountRecord(stock)) throw new StateFormatError('stock');
  if (!isRecord(goals) || !isStringArray(goals.items) || !isStringArray(goals.outfits)) {
    throw new StateFormatError('goals');
  }
  if (
    !isRecord(settings) ||
    (settings.theme !== 'night' && settings.theme !== 'paper' && settings.theme !== 'system') ||
    typeof settings.showEnglish !== 'boolean'
  ) {
    throw new StateFormatError('settings');
  }
  return {
    schemaVersion: 1,
    crafted: craftedOut,
    stock: { ...stock },
    goals: { items: [...goals.items], outfits: [...goals.outfits] },
    settings: { theme: settings.theme, showEnglish: settings.showEnglish },
  };
}

/**
 * Converts any saved state to the current UserState.
 * Throws StateFormatError for unknown schema versions or invalid structure.
 */
export function migrate(raw: unknown): UserState {
  if (!isRecord(raw)) throw new StateFormatError('not an object');
  switch (raw.schemaVersion) {
    case 1:
      return parseV1(raw);
    default:
      throw new StateFormatError(`unknown schemaVersion ${String(raw.schemaVersion)}`);
  }
}

/** Removes ids that no longer exist in the game data and normalizes values. */
export function cleanState(state: UserState): UserState {
  const crafted: Record<string, CraftRecord> = {};
  for (const [id, rec] of Object.entries(state.crafted)) {
    if (!itemsById.has(id)) continue;
    const deducted: Record<string, number> = {};
    for (const [m, d] of Object.entries(rec.deducted)) {
      const v = clampStock(d);
      if (materialsById.has(m) && v > 0) deducted[m] = v;
    }
    crafted[id] = { at: rec.at, deducted };
  }
  const stock: Record<string, number> = {};
  for (const [m, v] of Object.entries(state.stock)) {
    const c = clampStock(v);
    if (materialsById.has(m) && c > 0) stock[m] = c;
  }
  const uniq = (list: string[], known: (id: string) => boolean) => [...new Set(list)].filter(known);
  return {
    schemaVersion: 1,
    crafted,
    stock,
    goals: {
      items: uniq(state.goals.items, (id) => itemsById.has(id)),
      outfits: uniq(state.goals.outfits, (id) => outfitsById.has(id)),
    },
    settings: { ...state.settings },
  };
}

// ---------------------------------------------------------------------------
// localStorage

export interface LoadResult {
  state: UserState;
  /** True if a saved value existed but could not be read (UI shows BROKEN_STATE_MESSAGE). */
  broken: boolean;
  /** Key the broken value was copied to, if any. */
  brokenKey?: string;
}

export function loadState(
  storage: KeyValueStorage | null = defaultStorage(),
  now: Date = new Date(),
): LoadResult {
  if (!storage) return { state: createInitialState(), broken: false };
  let text: string | null;
  try {
    text = storage.getItem(STATE_KEY);
  } catch {
    return { state: createInitialState(), broken: false };
  }
  if (text === null) return { state: createInitialState(), broken: false };
  try {
    return { state: cleanState(migrate(JSON.parse(text))), broken: false };
  } catch {
    const brokenKey = `${BROKEN_KEY_PREFIX}${now.getTime()}`;
    try {
      storage.setItem(brokenKey, text);
    } catch {
      // Ignore quota errors: nothing else we can do.
    }
    return { state: createInitialState(), broken: true, brokenKey };
  }
}

export function saveState(
  state: UserState,
  storage: KeyValueStorage | null = defaultStorage(),
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STATE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export interface Saver {
  /** Schedules a debounced save. */
  schedule(): void;
  /** Saves immediately if a save is pending. */
  flush(): void;
  /** Cancels a pending save. */
  cancel(): void;
}

/** Debounced saver: saves `getState()` 300 ms after the last `schedule()`. */
export function createSaver(
  getState: () => UserState,
  storage: KeyValueStorage | null = defaultStorage(),
  delay = SAVE_DEBOUNCE_MS,
): Saver {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cancel = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };
  return {
    schedule() {
      cancel();
      timer = setTimeout(() => {
        timer = undefined;
        saveState(getState(), storage);
      }, delay);
    },
    flush() {
      if (timer === undefined) return;
      cancel();
      saveState(getState(), storage);
    },
    cancel,
  };
}

// ---------------------------------------------------------------------------
// Backup (SPEC 11.2)

export interface Backup {
  app: typeof BACKUP_APP_ID;
  exportedAt: string;
  dataVersion: string;
  state: UserState;
}

export function createBackup(state: UserState, now: Date = new Date()): Backup {
  return {
    app: BACKUP_APP_ID,
    exportedAt: now.toISOString(),
    dataVersion: meta.dataVersion,
    state,
  };
}

export function serializeBackup(state: UserState, now: Date = new Date()): string {
  return JSON.stringify(createBackup(state, now), null, 2);
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** `rdr2-hunter-backup-YYYY-MM-DD.json` (local date). */
export function backupFileName(now: Date = new Date()): string {
  const d = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  return `rdr2-hunter-backup-${d}.json`;
}

export type ParseBackupResult = { ok: true; state: UserState } | { ok: false; error: string };

/** Validates a backup file's text. Errors are user-facing Russian messages. */
export function parseBackup(text: string): ParseBackupResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Файл не читается: это не JSON.' };
  }
  if (!isRecord(raw) || raw.app !== BACKUP_APP_ID) {
    return { ok: false, error: 'Это не резервная копия «Журнала охотника».' };
  }
  if (!isRecord(raw.state)) {
    return { ok: false, error: 'В файле нет сохранённого прогресса.' };
  }
  if (raw.state.schemaVersion !== 1) {
    return { ok: false, error: 'Резервная копия сделана в неподдерживаемой версии приложения.' };
  }
  try {
    return { ok: true, state: cleanState(migrate(raw.state)) };
  } catch {
    return { ok: false, error: 'Файл повреждён: данные прогресса в неверном формате.' };
  }
}

// ---------------------------------------------------------------------------
// UI preferences (separate key, not part of backups)

export type SummaryGroup = 'animal' | 'region' | 'flat';

export interface UiPrefs {
  summaryScope?: string;
  summaryGroup?: SummaryGroup;
}

export function loadUiPrefs(storage: KeyValueStorage | null = defaultStorage()): UiPrefs {
  if (!storage) return {};
  try {
    const raw: unknown = JSON.parse(storage.getItem(UI_KEY) ?? '{}');
    if (!isRecord(raw)) return {};
    const prefs: UiPrefs = {};
    if (typeof raw.summaryScope === 'string') prefs.summaryScope = raw.summaryScope;
    if (
      raw.summaryGroup === 'animal' ||
      raw.summaryGroup === 'region' ||
      raw.summaryGroup === 'flat'
    ) {
      prefs.summaryGroup = raw.summaryGroup;
    }
    return prefs;
  } catch {
    return {};
  }
}

/** Merges and saves UI preferences. */
export function saveUiPrefs(
  patch: UiPrefs,
  storage: KeyValueStorage | null = defaultStorage(),
): UiPrefs {
  const next = { ...loadUiPrefs(storage), ...patch };
  if (storage) {
    try {
      storage.setItem(UI_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage errors.
    }
  }
  return next;
}

/**
 * Summary scope to open: saved scope if it still exists (unknown → 'all');
 * without a saved scope — 'goals' if there are goals, otherwise 'all'.
 */
export function initialSummaryScope(prefs: UiPrefs, hasGoals: boolean): string {
  if (prefs.summaryScope !== undefined) {
    return scopeExists(prefs.summaryScope) ? prefs.summaryScope : DEFAULT_SCOPE;
  }
  return hasGoals ? GOALS_SCOPE : DEFAULT_SCOPE;
}

export function initialSummaryGroup(prefs: UiPrefs): SummaryGroup {
  return prefs.summaryGroup ?? 'animal';
}
