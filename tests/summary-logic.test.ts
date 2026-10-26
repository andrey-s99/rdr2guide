import { describe, expect, it } from 'vitest';
import { itemsById, materialsById, regions } from '../src/data';
import type { Animal, Material, Region } from '../src/data/types';
import { computeNeeds, type MaterialNeed } from '../src/logic/calc';
import { getScopeItems } from '../src/logic/scopes';
import {
  SPECIAL_GROUP_ID,
  craftedText,
  groupByAnimal,
  groupByRegion,
  kindsWord,
  sortFlat,
  usedInScope,
  visibleRows,
  type SummaryLookups,
} from '../src/logic/summary';

const noGoals = { items: [], outfits: [] };

function row(materialId: string, need: number, have = 0): MaterialNeed {
  return { materialId, need, have, remaining: Math.max(0, need - have) };
}

// Small synthetic dataset for precise ordering checks.
const animal = (id: string, nameRu: string, regionIds: Region['id'][]): Animal =>
  ({ id, nameRu, regions: regionIds }) as Animal;
const material = (id: string, nameRu: string, animalId: string | null): Material =>
  ({ id, nameRu, animalId }) as Material;

const tAnimals = [
  animal('beaver', 'Бобр', ['new_hanover', 'lemoyne']),
  animal('alligator', 'Аллигатор', ['lemoyne']),
  animal('cougar', 'Пума', ['new_austin']),
];
const tMaterials = [
  material('beaver_skin', 'Шкура бобра', 'beaver'),
  material('beaver_tail', 'Хвост бобра', 'beaver'),
  material('alligator_skin', 'Шкура аллигатора', 'alligator'),
  material('cougar_skin', 'Шкура пумы', 'cougar'),
  material('stone', 'Камень', null),
];
const lookups: SummaryLookups = {
  material: (id) => tMaterials.find((m) => m.id === id),
  animal: (id) => tAnimals.find((a) => a.id === id),
  regions,
};
const order = new Map(tMaterials.map((m, i) => [m.id, i]));

describe('summary grouping (pure)', () => {
  const rows = [
    row('cougar_skin', 3),
    row('beaver_tail', 1),
    row('stone', 5),
    row('alligator_skin', 2),
    row('beaver_skin', 1),
  ];

  it('groups by animal, sorts groups by Σ remaining desc then nameRu, rows in data order', () => {
    const groups = groupByAnimal(rows, lookups, order);
    expect(groups.map((g) => [g.id, g.remaining])).toEqual([
      [SPECIAL_GROUP_ID, 5],
      ['cougar', 3],
      // Tie at 2: «Аллигатор» before «Бобр».
      ['alligator', 2],
      ['beaver', 2],
    ]);
    expect(groups[3].rows.map((r) => r.materialId)).toEqual(['beaver_skin', 'beaver_tail']);
    expect(groups[0].titleRu).toBe('Особые предметы');
    expect(groups[0].animal).toBeNull();
  });

  it('groups by primary region in regions.json order, special last', () => {
    const groups = groupByRegion(rows, lookups, order);
    expect(groups.map((g) => g.id)).toEqual(['new_hanover', 'lemoyne', 'new_austin', 'special']);
    expect(groups[1].groups.map((g) => g.id)).toEqual(['alligator']);
    expect(groups[0].groups.map((g) => g.id)).toEqual(['beaver']);
    expect(groups.at(-1)?.region).toBeNull();
    expect(groups.map((g) => g.remaining)).toEqual([2, 2, 3, 5]);
  });

  it('flat list sorts by remaining desc, then nameRu', () => {
    // Tie at 1: «Хвост бобра» before «Шкура бобра».
    expect(sortFlat(rows, lookups).map((r) => r.materialId)).toEqual([
      'stone',
      'cougar_skin',
      'alligator_skin',
      'beaver_tail',
      'beaver_skin',
    ]);
  });

  it('visibleRows hides collected rows unless asked', () => {
    const list = [row('a', 2, 2), row('b', 2, 1), row('c', 0)];
    expect(visibleRows(list, false).map((r) => r.materialId)).toEqual(['b']);
    expect(visibleRows(list, true).map((r) => r.materialId)).toEqual(['a', 'b']);
  });

  it('empty input gives no groups', () => {
    expect(groupByAnimal([], lookups, order)).toEqual([]);
    expect(groupByRegion([], lookups, order)).toEqual([]);
  });
});

describe('summary grouping on real data', () => {
  const needs = computeNeeds(getScopeItems('all', noGoals), {}, {});

  it('animal groups cover every row exactly once and are sorted', () => {
    const groups = groupByAnimal(needs.rows);
    const ids = groups.flatMap((g) => g.rows.map((r) => r.materialId));
    expect(ids).toHaveLength(103);
    expect(new Set(ids).size).toBe(103);
    expect(groups.reduce((s, g) => s + g.remaining, 0)).toBe(299);
    for (let i = 1; i < groups.length; i++) {
      expect(groups[i - 1].remaining).toBeGreaterThanOrEqual(groups[i].remaining);
    }
    const special = groups.find((g) => g.id === SPECIAL_GROUP_ID);
    expect(special?.rows.every((r) => materialsById.get(r.materialId)?.animalId === null)).toBe(
      true,
    );
  });

  it('region groups follow regions.json with special last', () => {
    const groups = groupByRegion(needs.rows);
    const regionIds = groups.filter((g) => g.region).map((g) => g.id);
    expect(regionIds).toEqual(regions.map((r) => r.id).filter((id) => regionIds.includes(id)));
    expect(groups.at(-1)?.id).toBe(SPECIAL_GROUP_ID);
    expect(groups.reduce((s, g) => s + g.remaining, 0)).toBe(299);
    for (const g of groups) {
      for (const ag of g.groups) {
        if (ag.animal) expect(ag.animal.regions[0]).toBe(g.id);
      }
    }
  });

  it('flat list starts with the largest remaining', () => {
    const flat = sortFlat(needs.rows);
    expect(flat[0]).toMatchObject({ materialId: 'perfect_rat', remaining: 16 });
  });

  it('usedInScope keeps only items of the scope', () => {
    const scope = new Set(getScopeItems('outfit:bear_hunter', noGoals).map((i) => i.id));
    const used = usedInScope('legendary_bear_pelt', scope);
    expect(used.length).toBeGreaterThan(0);
    expect(used.every((i) => scope.has(i.id) && itemsById.has(i.id))).toBe(true);
    expect(usedInScope('perfect_snake', scope)).toEqual([]);
  });
});

describe('summary texts', () => {
  it('pluralizes material kinds and crafted counter', () => {
    expect(kindsWord(1)).toBe('вид материала');
    expect(kindsWord(4)).toBe('вида материалов');
    expect(kindsWord(110)).toBe('видов материалов');
    expect(kindsWord(11)).toBe('видов материалов');
    expect(craftedText(0, 167)).toBe('Изготовлено 0 из 167 предметов');
    expect(craftedText(1, 21)).toBe('Изготовлено 1 из 21 предмета');
    expect(craftedText(0, 4)).toBe('Изготовлено 0 из 4 предметов');
  });
});
