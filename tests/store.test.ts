import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/preact';
import { h } from 'preact';
import { itemsById, outfitsById } from '../src/data';
import type { UserState } from '../src/data/types';
import { emptyStocks, outfitProgress } from '../src/logic/calc';
import {
  BROKEN_KEY_PREFIX,
  LEGACY_STATE_KEYS,
  STATE_KEY,
  UI_KEY,
  backupFileName,
  createInitialState,
  createSaver,
  initialSummaryScope,
  loadState,
  loadUiPrefs,
  parseBackup,
  saveUiPrefs,
  serializeBackup,
  type KeyValueStorage,
} from '../src/state/persist';
import {
  challengeProgress,
  goalsCount,
  importState,
  initStore,
  markCrafted,
  markOutfitCrafted,
  resetAll,
  resetStoreForTests,
  setSettings,
  setStock,
  state,
  toggleGoalItem,
  toggleChallengeRank,
  toggleGoalOutfit,
  unmarkCrafted,
} from '../src/state/store';
import { TOAST_DURATION_MS, dismissToast, showToast, toast, undoToast } from '../src/state/undo';
import { Toast } from '../src/components/Toast';

function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage & {
  data: Record<string, string>;
} {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = String(v);
    },
    removeItem: (k) => {
      delete data[k];
    },
  };
}

/** State with a Trapper stock (the tests craft Trapper items). */
const trapper = (stock: Record<string, number>): UserState['stock'] => ({
  ...emptyStocks(),
  trapper: stock,
});
const withStock = (stock: Record<string, number>): UserState => ({
  ...createInitialState(),
  stock: trapper(stock),
});

beforeEach(() => {
  resetStoreForTests();
  dismissToast();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('15.2 crafting via store', () => {
  it('3. deduction never goes negative', () => {
    state.value = withStock({ perfect_boar: 1, perfect_rabbit: 1 });
    const deducted = markCrafted('boar_riding_gloves');
    expect(state.value.stock.trapper.perfect_boar).toBe(0);
    expect(state.value.stock.trapper.perfect_rabbit).toBe(0);
    expect(deducted).toEqual({ perfect_boar: 1, perfect_rabbit: 1 });
    expect(state.value.crafted.boar_riding_gloves.deducted).toEqual({
      perfect_boar: 1,
      perfect_rabbit: 1,
    });
    expect(toast.value?.title).toBe(`Crafted: ${itemsById.get('boar_riding_gloves')?.nameEn}`);
    expect(toast.value?.detail).toBe('Boar −1, Rabbit −1');
  });

  it('4. undo returns exactly what was deducted', () => {
    state.value = withStock({ perfect_boar: 1, perfect_rabbit: 1 });
    markCrafted('boar_riding_gloves');
    unmarkCrafted('boar_riding_gloves');
    expect(state.value.stock.trapper).toEqual({ perfect_boar: 1, perfect_rabbit: 1 });
    expect(state.value.crafted).toEqual({});
  });

  it('4b. toast undo = unmarkCrafted', () => {
    state.value = withStock({ perfect_boar: 1, perfect_rabbit: 1 });
    markCrafted('boar_riding_gloves');
    undoToast();
    expect(state.value.stock.trapper).toEqual({ perfect_boar: 1, perfect_rabbit: 1 });
    expect(state.value.crafted).toEqual({});
    expect(toast.value).toBeNull();
  });

  it('5. non-consumable is not deducted', () => {
    state.value = withStock({ legendary_bear_pelt: 1 });
    const deducted = markCrafted('legendary_bear_head_hat');
    expect(state.value.stock.trapper.legendary_bear_pelt).toBe(1);
    expect(deducted).toEqual({});
    expect(toast.value?.detail).toBe('Nothing deducted');
  });

  it('marking an already crafted item does nothing', () => {
    markCrafted('boar_riding_gloves');
    const before = state.value;
    expect(markCrafted('boar_riding_gloves')).toBeNull();
    expect(state.value).toBe(before);
  });

  it('7. whole outfit and undo', () => {
    const outfit = outfitsById.get('bear_hunter')!;
    const marked = markOutfitCrafted('bear_hunter');
    expect(marked).toHaveLength(4);
    expect(Object.keys(state.value.crafted)).toHaveLength(4);
    expect(outfitProgress(outfit, state.value.crafted).complete).toBe(true);
    expect(toast.value?.title).toBe(`Outfit: ${outfit.nameEn}, 4 parts`);
    expect(toast.value?.detail).toBe('Nothing deducted');
    undoToast();
    expect(Object.keys(state.value.crafted)).toHaveLength(0);
  });

  it('7b. outfit marks only uncrafted parts and undo restores stock', () => {
    state.value = withStock({ perfect_boar: 1, perfect_rabbit: 2, perfect_bison: 1 });
    markCrafted('boar_riding_gloves');
    const marked = markOutfitCrafted('bear_hunter');
    expect(marked).toHaveLength(3);
    undoToast();
    expect(Object.keys(state.value.crafted)).toEqual(['boar_riding_gloves']);
    expect(state.value.stock.trapper).toEqual({
      perfect_boar: 0,
      perfect_rabbit: 0,
      perfect_bison: 1,
    });
  });
});

describe('other actions', () => {
  it('setStock clamps to 0..999', () => {
    setStock('trapper', 'perfect_boar', 5.8);
    expect(state.value.stock.trapper.perfect_boar).toBe(5);
    setStock('trapper', 'perfect_boar', 5000);
    expect(state.value.stock.trapper.perfect_boar).toBe(999);
    setStock('trapper', 'perfect_boar', -1);
    expect(state.value.stock.trapper.perfect_boar).toBeUndefined();
  });

  it('goals toggle and count', () => {
    toggleGoalItem('moccasins');
    toggleGoalOutfit('wrangler');
    expect(goalsCount.value).toBe(2);
    toggleGoalItem('moccasins');
    expect(state.value.goals).toEqual({ items: [], outfits: ['wrangler'] });
    expect(goalsCount.value).toBe(1);
  });

  it('settings and reset keeps settings', () => {
    setSettings({ theme: 'paper' });
    setStock('trapper', 'perfect_boar', 3);
    toggleGoalItem('moccasins');
    resetAll();
    expect(state.value.stock).toEqual(emptyStocks());
    expect(state.value.goals.items).toEqual([]);
    expect(state.value.settings).toEqual({ theme: 'paper' });
  });

  it('importState cleans unknown ids', () => {
    importState({
      ...createInitialState(),
      crafted: { unknown_item: { at: 'x', deducted: {} } },
      stock: { ...emptyStocks(), trapper: { perfect_boar: 2, nope: 4 } },
    });
    expect(state.value.crafted).toEqual({});
    expect(state.value.stock).toEqual(trapper({ perfect_boar: 2 }));
  });
});

describe('persistence', () => {
  it('10. unknown ids are removed on load', () => {
    const saved: UserState = {
      ...createInitialState(),
      crafted: {
        unknown_item: { at: '2026-01-01', deducted: { perfect_boar: 1 } },
        moccasins: { at: '2026-01-01', deducted: { gone_material: 1 } },
      },
      stock: { ...emptyStocks(), trapper: { gone_material: 3, perfect_boar: 1 } },
      goals: { items: ['moccasins', 'ghost'], outfits: ['wrangler', 'ghost_outfit'] },
    };
    const storage = memoryStorage({ [STATE_KEY]: JSON.stringify(saved) });
    const { state: s, broken } = loadState(storage);
    expect(broken).toBe(false);
    expect(s.crafted).toEqual({ moccasins: { at: '2026-01-01', deducted: {} } });
    expect('unknown_item' in s.crafted).toBe(false);
    expect(s.stock).toEqual(trapper({ perfect_boar: 1 }));
    expect(s.goals).toEqual({ items: ['moccasins'], outfits: ['wrangler'] });
  });

  it('missing key gives the initial state', () => {
    expect(loadState(memoryStorage())).toEqual({ state: createInitialState(), broken: false });
  });

  it('broken JSON or unknown schema is backed up and reset', () => {
    const now = new Date(1700000000000);
    for (const bad of ['{not json', JSON.stringify({ schemaVersion: 7 })]) {
      const storage = memoryStorage({ [STATE_KEY]: bad });
      const r = loadState(storage, now);
      expect(r.broken).toBe(true);
      expect(r.state).toEqual(createInitialState());
      expect(storage.data[`${BROKEN_KEY_PREFIX}1700000000000`]).toBe(bad);
    }
  });

  it('initStore shows a toast for a broken save', () => {
    initStore({ storage: memoryStorage({ [STATE_KEY]: '{oops' }), listenVisibility: false });
    expect(toast.value?.title).toBe('Could not read the save, starting from scratch');
    expect(toast.value?.undo).toBeUndefined();
  });

  it('roundtrip: debounced save, reload', () => {
    vi.useFakeTimers();
    const storage = memoryStorage();
    initStore({ storage, listenVisibility: false });
    setStock('trapper', 'perfect_boar', 4);
    markCrafted('moccasins');
    toggleGoalOutfit('wrangler');
    expect(storage.data[STATE_KEY]).toBeUndefined();
    vi.advanceTimersByTime(299);
    expect(storage.data[STATE_KEY]).toBeUndefined();
    vi.advanceTimersByTime(1);
    expect(storage.data[STATE_KEY]).toBeDefined();
    const saved = state.value;
    resetStoreForTests();
    initStore({ storage, listenVisibility: false });
    expect(state.value).toEqual(saved);
  });

  it('saves immediately on visibilitychange hidden', () => {
    vi.useFakeTimers();
    const storage = memoryStorage();
    initStore({ storage, listenVisibility: true });
    setStock('trapper', 'perfect_boar', 2);
    expect(storage.data[STATE_KEY]).toBeUndefined();
    const spy = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    spy.mockRestore();
    expect(JSON.parse(storage.data[STATE_KEY]).stock).toEqual(trapper({ perfect_boar: 2 }));
    resetStoreForTests();
  });

  it('createSaver debounces', () => {
    vi.useFakeTimers();
    const storage = memoryStorage();
    let n = 0;
    const saver = createSaver(
      () => ({ ...createInitialState(), stock: trapper({ perfect_boar: ++n }) }),
      storage,
    );
    saver.schedule();
    saver.schedule();
    vi.advanceTimersByTime(300);
    expect(n).toBe(1);
  });
});

describe('backup', () => {
  const sample: UserState = {
    ...createInitialState(),
    crafted: { moccasins: { at: '2026-01-01T00:00:00.000Z', deducted: { perfect_deer: 1 } } },
    stock: { trapper: { perfect_boar: 3 }, pearson: { perfect_boar: 1 }, fence: {} },
    goals: { items: ['moccasins'], outfits: ['wrangler'] },
    challenges: { bandit: 3 },
    settings: { theme: 'paper' },
  };

  it('export -> parse roundtrip', () => {
    const text = serializeBackup(sample, new Date('2026-10-24T10:00:00Z'));
    const parsed = JSON.parse(text);
    expect(parsed.app).toBe('rdr2-hunter');
    expect(parsed.exportedAt).toBe('2026-10-24T10:00:00.000Z');
    expect(typeof parsed.dataVersion).toBe('string');
    expect(parseBackup(text)).toEqual({ ok: true, state: sample });
  });

  it('export -> reset -> import restores progress', () => {
    state.value = sample;
    const text = serializeBackup(state.value);
    resetAll();
    const r = parseBackup(text);
    if (!r.ok) throw new Error(r.error);
    importState(r.state);
    expect(state.value).toEqual(sample);
  });

  it('rejects invalid files with readable messages', () => {
    const cases = [
      'not json',
      JSON.stringify({ app: 'other', state: sample }),
      JSON.stringify({ app: 'rdr2-hunter' }),
      JSON.stringify({ app: 'rdr2-hunter', state: { ...sample, schemaVersion: 4 } }),
      JSON.stringify({ app: 'rdr2-hunter', state: { ...sample, stock: { trapper: { a: 'x' } } } }),
      JSON.stringify({ app: 'rdr2-hunter', state: { ...sample, goals: { items: [1] } } }),
      JSON.stringify({ app: 'rdr2-hunter', state: { ...sample, settings: { theme: 'pink' } } }),
    ];
    for (const c of cases) {
      const r = parseBackup(c);
      expect(r.ok, c).toBe(false);
      if (!r.ok) expect(r.error).toMatch(/^[A-Z].+\./);
    }
  });

  it('cleans unknown ids on import', () => {
    const text = JSON.stringify({
      app: 'rdr2-hunter',
      state: { ...sample, crafted: { unknown_item: { at: 'x', deducted: {} } } },
    });
    const r = parseBackup(text);
    expect(r.ok && r.state.crafted).toEqual({});
  });

  it('file name', () => {
    expect(backupFileName(new Date(2026, 0, 5))).toBe('rdr2-hunter-backup-2026-01-05.json');
  });
});

describe('ui prefs', () => {
  it('saves and loads', () => {
    const storage = memoryStorage();
    expect(loadUiPrefs(storage)).toEqual({});
    saveUiPrefs({ summaryScope: 'fence' }, storage);
    saveUiPrefs({ summaryGroup: 'flat' }, storage);
    expect(JSON.parse(storage.data[UI_KEY])).toEqual({
      summaryScope: 'fence',
      summaryGroup: 'flat',
    });
    expect(loadUiPrefs(memoryStorage({ [UI_KEY]: '{bad' }))).toEqual({});
  });

  it('resolves the initial summary scope', () => {
    expect(initialSummaryScope({}, false)).toBe('all');
    expect(initialSummaryScope({}, true)).toBe('goals');
    expect(initialSummaryScope({ summaryScope: 'outfit:gone' }, true)).toBe('all');
    expect(initialSummaryScope({ summaryScope: 'fence' }, true)).toBe('fence');
  });
});

describe('toast', () => {
  it('auto-hides after 6 s and new toast replaces old', () => {
    vi.useFakeTimers();
    showToast({ title: 'A', detail: '' });
    vi.advanceTimersByTime(TOAST_DURATION_MS - 1000);
    showToast({ title: 'B', detail: '' });
    vi.advanceTimersByTime(1500);
    expect(toast.value?.title).toBe('B');
    vi.advanceTimersByTime(TOAST_DURATION_MS);
    expect(toast.value).toBeNull();
  });

  it('Toast component renders and undoes', async () => {
    state.value = withStock({ perfect_boar: 1, perfect_rabbit: 1 });
    render(h(Toast, null));
    markCrafted('boar_riding_gloves');
    const btn = await screen.findByRole('button', { name: 'Undo' });
    expect(document.querySelector('.toast__title')?.textContent).toMatch(/^Crafted: /);
    expect(document.querySelector('.toast__detail')?.textContent).toBe('Boar −1, Rabbit −1');
    fireEvent.click(btn);
    expect(state.value.stock.trapper).toEqual({ perfect_boar: 1, perfect_rabbit: 1 });
    expect(state.value.crafted).toEqual({});
  });
});

describe('one-time progress reset (state v2)', () => {
  const v1 = {
    schemaVersion: 1,
    crafted: { moccasins: { at: '2026-01-01', deducted: {} } },
    stock: { perfect_boar: 2 },
    goals: { items: ['moccasins'], outfits: [] },
    settings: { theme: 'paper', showEnglish: true },
  };

  it('ignores and removes the old v1 save, starting from scratch', () => {
    const storage = memoryStorage({ [LEGACY_STATE_KEYS[0]]: JSON.stringify(v1) });
    const { state: s, broken } = loadState(storage);
    expect(broken).toBe(false);
    expect(s).toEqual(createInitialState());
    expect(storage.data[LEGACY_STATE_KEYS[0]]).toBeUndefined();
    expect(STATE_KEY).not.toBe(LEGACY_STATE_KEYS[0]);
  });

  it('still imports a v1 backup file', () => {
    const r = parseBackup(JSON.stringify({ app: 'rdr2-hunter', state: v1 }));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.state.schemaVersion).toBe(3);
      expect(r.state.stock).toEqual(trapper({ perfect_boar: 2 }));
      expect(r.state.challenges).toEqual({});
      expect(r.state.settings).toEqual({ theme: 'paper' });
    }
  });
});

describe('separate vendor stock (state v3)', () => {
  it('migrates a v2 save in place: shared stock goes to the first vendor using it', () => {
    const v2 = {
      schemaVersion: 2,
      crafted: {},
      // beaver: Trapper + Pearson; bear claw: Fence only; snake: Trapper only.
      stock: { perfect_beaver: 4, legendary_bear_claw: 1, perfect_snake: 2 },
      goals: { items: [], outfits: [] },
      challenges: { bandit: 1 },
      settings: { theme: 'night' },
    };
    const { state: s, broken } = loadState(memoryStorage({ [STATE_KEY]: JSON.stringify(v2) }));
    expect(broken).toBe(false);
    expect(s.schemaVersion).toBe(3);
    expect(s.stock).toEqual({
      trapper: { perfect_beaver: 4, perfect_snake: 2 },
      pearson: {},
      fence: { legendary_bear_claw: 1 },
    });
    expect(s.challenges).toEqual({ bandit: 1 });
  });

  it('drops materials a vendor does not use', () => {
    importState({
      ...createInitialState(),
      stock: { trapper: { legendary_bear_claw: 1 }, pearson: { perfect_snake: 3 }, fence: {} },
    });
    expect(state.value.stock).toEqual(emptyStocks());
  });

  it('setStock for Pearson leaves the Trapper stock alone', () => {
    setStock('trapper', 'perfect_beaver', 2);
    setStock('pearson', 'perfect_beaver', 1);
    expect(state.value.stock.trapper).toEqual({ perfect_beaver: 2 });
    expect(state.value.stock.pearson).toEqual({ perfect_beaver: 1 });
  });
});

describe('challenge progress', () => {
  beforeEach(() => resetStoreForTests());

  it('ticking a rank completes all ranks up to it; unticking steps back', () => {
    expect(challengeProgress('bandit')).toBe(0);
    toggleChallengeRank('bandit', 3);
    expect(challengeProgress('bandit')).toBe(3);
    toggleChallengeRank('bandit', 2);
    expect(challengeProgress('bandit')).toBe(1);
    toggleChallengeRank('bandit', 1);
    expect(challengeProgress('bandit')).toBe(0);
    expect(state.value.challenges).toEqual({});
    toggleChallengeRank('bandit', 99);
    expect(challengeProgress('bandit')).toBe(10);
  });

  it('is cleared by reset and cleaned on import', () => {
    toggleChallengeRank('gambler', 4);
    resetAll();
    expect(state.value.challenges).toEqual({});
    importState({
      ...createInitialState(),
      challenges: { herbalist: 12, nope: 3 } as UserState['challenges'],
    });
    expect(state.value.challenges).toEqual({ herbalist: 10 });
  });

  it('is saved and loaded', () => {
    const storage = memoryStorage();
    initStore({ storage, listenVisibility: false });
    toggleChallengeRank('explorer', 5);
    resetStoreForTests(); // flushes the pending save
    expect(loadState(storage).state.challenges).toEqual({ explorer: 5 });
  });
});
