import { describe, expect, it } from 'vitest';
import { itemsById, outfitsById } from '../src/data';
import type { UserState } from '../src/data/types';
import {
  applyMarkCrafted,
  applySetStock,
  applyUnmarkCrafted,
  clampStock,
  computeNeeds,
  isLocked,
  itemStatus,
  outfitProgress,
  prerequisiteProgress,
  shortfall,
} from '../src/logic/calc';
import { getScopeItems, scopeExists, scopeGroups, scopes } from '../src/logic/scopes';
import { normalize, search } from '../src/logic/search';
import { createInitialState } from '../src/state/persist';

const noGoals = { items: [], outfits: [] };
const item = (id: string) => {
  const i = itemsById.get(id);
  if (!i) throw new Error(`no item ${id}`);
  return i;
};
const needs = (scopeId: string, stock = {}, crafted = {}, goals = noGoals) =>
  computeNeeds(getScopeItems(scopeId, goals), stock, crafted);
const needOf = (scopeId: string, materialId: string) =>
  needs(scopeId).byMaterial.get(materialId)?.need;

describe('15.2 calculations', () => {
  it('1. legendary pelt counts once', () => {
    const items = getScopeItems('outfit:bear_hunter', noGoals);
    const users = items.filter((i) => i.recipe.some((e) => e.materialId === 'legendary_bear_pelt'));
    expect(users.length).toBe(3);
    expect(needOf('outfit:bear_hunter', 'legendary_bear_pelt')).toBe(1);
  });

  it('2. status and shortfall', () => {
    const gloves = item('boar_riding_gloves');
    expect(itemStatus(gloves, { perfect_boar: 1, perfect_rabbit: 2 }, {})).toBe('ready');
    expect(itemStatus(gloves, { perfect_boar: 1, perfect_rabbit: 1 }, {})).toBe('missing');
    expect(shortfall(gloves, { perfect_boar: 1, perfect_rabbit: 1 })).toBe(1);
    expect(itemStatus(gloves, {}, { boar_riding_gloves: { at: '', deducted: {} } })).toBe(
      'crafted',
    );
  });

  it('3/4/5. pure craft transitions', () => {
    const s: UserState = { ...createInitialState(), stock: { perfect_boar: 1, perfect_rabbit: 1 } };
    const r = applyMarkCrafted(s, 'boar_riding_gloves', '2026-01-01T00:00:00.000Z');
    expect(r.changed).toBe(true);
    expect(r.state.stock).toEqual({ perfect_boar: 0, perfect_rabbit: 0 });
    expect(r.deducted).toEqual({ perfect_boar: 1, perfect_rabbit: 1 });
    expect(s.stock).toEqual({ perfect_boar: 1, perfect_rabbit: 1 }); // input untouched
    expect(applyMarkCrafted(r.state, 'boar_riding_gloves', 'x').changed).toBe(false);
    const u = applyUnmarkCrafted(r.state, 'boar_riding_gloves');
    expect(u.state.stock).toEqual({ perfect_boar: 1, perfect_rabbit: 1 });
    expect(u.state.crafted).toEqual({});

    const s2: UserState = { ...createInitialState(), stock: { legendary_bear_pelt: 1 } };
    const r2 = applyMarkCrafted(s2, 'legendary_bear_head_hat', 'now');
    expect(r2.state.stock.legendary_bear_pelt).toBe(1);
    expect(r2.deducted).toEqual({});
  });

  it('6. crafted items are not counted', () => {
    const s: UserState = { ...createInitialState(), stock: { legendary_bear_pelt: 1 } };
    const after = applyMarkCrafted(s, 'legendary_bear_head_hat', 'now').state;
    const n = needs('outfit:bear_hunter', after.stock, after.crafted);
    expect(n.byMaterial.get('legendary_bear_pelt')?.remaining).toBe(0);
    expect(n.byMaterial.get('legendary_bear_pelt')?.have).toBe(1);
    expect(n.byMaterial.get('perfect_bison')?.need).toBe(1);
    expect(n.byMaterial.get('perfect_bull')?.need).toBe(1);
  });

  it('8. goals scope', () => {
    const g = getScopeItems('goals', { items: ['moccasins'], outfits: ['wrangler'] });
    expect(g).toHaveLength(6);
    const ids = g.map((i) => i.id);
    expect(ids).toContain('moccasins');
    expect(ids).toContain('two_toned_moccasins');
    // No duplicates when a goal item is also an outfit part.
    expect(
      getScopeItems('goals', { items: ['two_toned_moccasins'], outfits: ['wrangler'] }),
    ).toHaveLength(5);
  });

  it('lock and outfit progress', () => {
    const legend = { ...item('badger_mountain_hat'), prerequisiteItemIds: ['a', 'b', 'c', 'd', 'e', 'f'] };
    expect(isLocked(legend, {})).toBe(true);
    expect(prerequisiteProgress(legend, {})).toEqual({ done: 0, total: 6 });
    const all = Object.fromEntries(
      legend.prerequisiteItemIds.map((id) => [id, { at: '', deducted: {} }]),
    );
    expect(isLocked(legend, all)).toBe(false);
    expect(prerequisiteProgress(legend, all)).toEqual({ done: 6, total: 6 });
    const bear = outfitsById.get('bear_hunter')!;
    expect(outfitProgress(bear, {})).toEqual({ craftedParts: 0, totalParts: 4, complete: false });
  });

  it('stock helpers', () => {
    expect(clampStock(-3)).toBe(0);
    expect(clampStock(1200)).toBe(999);
    expect(clampStock(2.7)).toBe(2);
    expect(clampStock(Number.NaN)).toBe(0);
    const s = applySetStock(createInitialState(), 'perfect_boar', 5);
    expect(s.stock).toEqual({ perfect_boar: 5 });
    expect(applySetStock(s, 'perfect_boar', 0).stock).toEqual({});
  });

  it('extra stock never yields negative remaining', () => {
    const n = needs('outfit:bear_hunter', { perfect_rabbit: 50 });
    expect(n.byMaterial.get('perfect_rabbit')?.remaining).toBe(0);
    expect(n.totals).toEqual({ distinct: 4, units: 4 });
  });
});

describe('15.3 reference totals (empty progress)', () => {
  const refs: [string, number, number][] = [
    ['all', 103, 299],
    ['trapper', 77, 273],
    ['trapper_outfits', 50, 118],
    ['fence', 26, 26],
    ['outfit:bear_hunter', 5, 6],
    ['outfit:desperado', 9, 12],
    ['outfit:dreamcatcher', 4, 4],
  ];
  it.each(refs)('%s: distinct %i, units %i', (scopeId, distinct, units) => {
    expect(needs(scopeId).totals).toEqual({ distinct, units });
  });

  it('per-material values for all', () => {
    const n = needs('all').byMaterial;
    const expected = {
      perfect_snake: 15,
      perfect_boar: 10,
      perfect_rat: 16,
      feather_raven: 13,
      perfect_deer: 5,
      perfect_beaver: 9,
    };
    for (const [m, v] of Object.entries(expected)) expect(n.get(m)?.remaining, m).toBe(v);
  });

  it('per-material values for outfit:bear_hunter', () => {
    const n = needs('outfit:bear_hunter').byMaterial;
    const expected = {
      perfect_rabbit: 2,
      legendary_bear_pelt: 1,
      perfect_bison: 1,
      perfect_boar: 1,
      perfect_bull: 1,
    };
    expect(n.size).toBe(5);
    for (const [m, v] of Object.entries(expected)) expect(n.get(m)?.remaining, m).toBe(v);
  });
});

describe('scopes', () => {
  it('lists all scopes from 7.5', () => {
    expect(scopes.filter((s) => s.id.startsWith('outfit:'))).toHaveLength(16);
    expect(scopes.filter((s) => s.id.startsWith('trapper_cat:'))).toHaveLength(8);
    expect(scopeGroups.map((g) => g.label)).toEqual([
      'Общее',
      'Охотник',
      'Костюмы',
      'Скупщик',
    ]);
    for (const id of ['all', 'goals', 'trapper', 'fence', 'outfit:wrangler']) {
      expect(scopeExists(id)).toBe(true);
    }
    expect(scopeExists('outfit:nope')).toBe(false);
  });

  it('returns scope items', () => {
    expect(getScopeItems('all', noGoals)).toHaveLength(141);
    expect(getScopeItems('trapper', noGoals)).toHaveLength(123);
    expect(getScopeItems('fence', noGoals)).toHaveLength(18);
    expect(getScopeItems('goals', noGoals)).toHaveLength(0);
    expect(getScopeItems('unknown', noGoals)).toHaveLength(0);
    const cats = scopes.filter((s) => s.id.startsWith('trapper_cat:'));
    const sum = cats.reduce((acc, s) => acc + getScopeItems(s.id, noGoals).length, 0);
    expect(sum).toBe(123);
    expect(getScopeItems('outfit:bear_hunter', noGoals).map((i) => i.id)).toEqual(
      outfitsById.get('bear_hunter')!.itemIds,
    );
  });
});

describe('15.2.9 search', () => {
  it('normalizes', () => {
    expect(normalize('  Чёрный   МЕДВЕДЬ ')).toBe('черный медведь');
  });

  it('ё and е give the same result', () => {
    const a = search('чёрн');
    const b = search('черн');
    expect(a).toEqual(b);
    expect(a.animals.map((x) => x.nameRu)).toContain('Чёрный медведь');
  });

  it('finds beaver everywhere', () => {
    const r = search('бобр');
    expect(r.animals.map((x) => x.nameRu)).toContain('Бобр');
    expect(r.materials.map((x) => x.nameRu)).toContain('Идеальная шкура бобра');
    expect(r.items.length).toBeGreaterThan(0);
    for (const i of r.items) expect(normalize(i.nameRu + ' ' + i.nameEn)).toContain('бобр');
  });

  it('requires 2 characters and limits groups', () => {
    expect(search('б')).toEqual({ outfits: [], items: [], animals: [], materials: [] });
    const r = search('ая');
    for (const g of Object.values(r)) expect(g.length).toBeLessThanOrEqual(20);
  });

  it('sorts word-start matches first, then alphabetically', () => {
    const r = search('медвед');
    const names = r.animals.map((a) => a.nameRu);
    // All animal names here match at a word start, so plain ru alphabetical order.
    expect(names).toEqual([...names].sort((x, y) => x.localeCompare(y, 'ru')));
    const fake = {
      outfits: [],
      animals: [],
      materials: [],
      items: [
        { nameRu: 'Абвгд', nameEn: '' },
        { nameRu: 'Где-то', nameEn: '' },
        { nameRu: 'Вот гдеты', nameEn: '' },
      ],
    } as unknown as Parameters<typeof search>[1];
    expect(search('гд', fake).items.map((i) => i.nameRu)).toEqual(['Вот гдеты', 'Где-то', 'Абвгд']);
  });
});
