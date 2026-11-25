// Summary screen grouping and sorting (SPEC 9.9). Pure functions.
import { animalsById, itemsByMaterial, materialsById, regions as allRegions } from '../data';
import type { Animal, Item, Material, Region, VendorId } from '../data/types';
import { VENDOR_IDS, type MaterialNeed } from './calc';

export type SummaryGroupMode = 'animal' | 'region' | 'flat';

export const SUMMARY_GROUP_MODES: readonly SummaryGroupMode[] = ['animal', 'region', 'flat'];

export const SPECIAL_GROUP_ID = 'special';
export const SPECIAL_GROUP_TITLE = 'Special items';

export function isSummaryGroupMode(x: unknown): x is SummaryGroupMode {
  return x === 'animal' || x === 'region' || x === 'flat';
}

/** Materials of one animal (or the special-materials group when `animal` is null). */
export interface MaterialGroup {
  /** Animal id or SPECIAL_GROUP_ID. */
  id: string;
  animal: Animal | null;
  title: string;
  rows: MaterialNeed[];
  /** Σ remaining of the group's rows. */
  remaining: number;
}

/** A region with its animal groups; `region` is null for the trailing special group. */
export interface RegionGroup {
  /** Region id or SPECIAL_GROUP_ID. */
  id: string;
  region: Region | null;
  title: string;
  groups: MaterialGroup[];
  remaining: number;
}

export interface SummaryLookups {
  material: (id: string) => Material | undefined;
  animal: (id: string) => Animal | undefined;
  regions: readonly Region[];
}

const defaultLookups: SummaryLookups = {
  material: (id) => materialsById.get(id),
  animal: (id) => animalsById.get(id),
  regions: allRegions,
};

const collator = new Intl.Collator('en');

/** Same material for several vendors: Trapper, then Pearson, then Fence. */
function compareVendors(a: MaterialNeed, b: MaterialNeed): number {
  return VENDOR_IDS.indexOf(a.vendorId) - VENDOR_IDS.indexOf(b.vendorId);
}

function nameOf(id: string, lookups: SummaryLookups): string {
  return lookups.material(id)?.nameEn ?? id;
}

/** Rows shown on screen: need > 0, and remaining > 0 unless "Show collected" is on. */
export function visibleRows(rows: readonly MaterialNeed[], showCollected: boolean): MaterialNeed[] {
  return rows.filter((r) => r.need > 0 && (showCollected || r.remaining > 0));
}

/** Flat list: remaining desc, then material nameEn. */
export function sortFlat(
  rows: readonly MaterialNeed[],
  lookups: SummaryLookups = defaultLookups,
): MaterialNeed[] {
  return [...rows].sort(
    (a, b) =>
      b.remaining - a.remaining ||
      collator.compare(nameOf(a.materialId, lookups), nameOf(b.materialId, lookups)) ||
      compareVendors(a, b),
  );
}

/** Group order: total remaining desc, then title (nameEn). */
function compareGroups(a: { remaining: number; title: string }, b: typeof a): number {
  return b.remaining - a.remaining || collator.compare(a.title, b.title);
}

function sumRows(rows: readonly MaterialNeed[]): number {
  return rows.reduce((s, r) => s + r.remaining, 0);
}

/** Rows in materials.json order (stable data order inside a group). */
function inDataOrder(rows: MaterialNeed[], order: ReadonlyMap<string, number>): MaterialNeed[] {
  return rows.sort(
    (a, b) =>
      (order.get(a.materialId) ?? Infinity) - (order.get(b.materialId) ?? Infinity) ||
      compareVendors(a, b),
  );
}

let materialOrder: Map<string, number> | null = null;
function defaultMaterialOrder(): ReadonlyMap<string, number> {
  if (!materialOrder) materialOrder = new Map([...materialsById.keys()].map((id, i) => [id, i]));
  return materialOrder;
}

interface Split {
  byAnimal: Map<string, { animal: Animal; rows: MaterialNeed[] }>;
  special: MaterialNeed[];
}

function splitByAnimal(rows: readonly MaterialNeed[], lookups: SummaryLookups): Split {
  const byAnimal: Split['byAnimal'] = new Map();
  const special: MaterialNeed[] = [];
  for (const row of rows) {
    const animalId = lookups.material(row.materialId)?.animalId ?? null;
    const animal = animalId === null ? undefined : lookups.animal(animalId);
    if (!animal) {
      special.push(row);
      continue;
    }
    const entry = byAnimal.get(animal.id);
    if (entry) entry.rows.push(row);
    else byAnimal.set(animal.id, { animal, rows: [row] });
  }
  return { byAnimal, special };
}

function makeAnimalGroups(
  byAnimal: Split['byAnimal'],
  order: ReadonlyMap<string, number>,
): MaterialGroup[] {
  const groups: MaterialGroup[] = [];
  for (const { animal, rows } of byAnimal.values()) {
    groups.push({
      id: animal.id,
      animal,
      title: animal.nameEn,
      rows: inDataOrder(rows, order),
      remaining: sumRows(rows),
    });
  }
  return groups;
}

function makeSpecialGroup(rows: MaterialNeed[], order: ReadonlyMap<string, number>): MaterialGroup {
  return {
    id: SPECIAL_GROUP_ID,
    animal: null,
    title: SPECIAL_GROUP_TITLE,
    rows: inDataOrder(rows, order),
    remaining: sumRows(rows),
  };
}

/**
 * "By animal": one group per animal plus "Special items" (animalId = null).
 * Groups are sorted by Σ remaining desc, then nameEn; rows keep materials.json order.
 */
export function groupByAnimal(
  rows: readonly MaterialNeed[],
  lookups: SummaryLookups = defaultLookups,
  order: ReadonlyMap<string, number> = defaultMaterialOrder(),
): MaterialGroup[] {
  const { byAnimal, special } = splitByAnimal(rows, lookups);
  const groups = makeAnimalGroups(byAnimal, order);
  if (special.length > 0) groups.push(makeSpecialGroup(special, order));
  return groups.sort(compareGroups);
}

/**
 * "By region": groups by animal.regions[0] in regions.json order, animal groups inside
 * (sorted as in groupByAnimal); special materials form the last group.
 */
export function groupByRegion(
  rows: readonly MaterialNeed[],
  lookups: SummaryLookups = defaultLookups,
  order: ReadonlyMap<string, number> = defaultMaterialOrder(),
): RegionGroup[] {
  const { byAnimal, special } = splitByAnimal(rows, lookups);
  const animalGroups = makeAnimalGroups(byAnimal, order);
  const result: RegionGroup[] = [];
  for (const region of lookups.regions) {
    const groups = animalGroups
      .filter((g) => g.animal?.regions[0] === region.id)
      .sort(compareGroups);
    if (groups.length === 0) continue;
    result.push({
      id: region.id,
      region,
      title: region.nameEn,
      groups,
      remaining: groups.reduce((s, g) => s + g.remaining, 0),
    });
  }
  if (special.length > 0) {
    const group = makeSpecialGroup(special, order);
    result.push({
      id: SPECIAL_GROUP_ID,
      region: null,
      title: SPECIAL_GROUP_TITLE,
      groups: [group],
      remaining: group.remaining,
    });
  }
  return result;
}

/** Items of the current scope that use a material (for the "used for" list), optionally of one vendor. */
export function usedInScope(
  materialId: string,
  scopeItemIds: ReadonlySet<string>,
  vendorId?: VendorId,
  byMaterial: ReadonlyMap<string, readonly Item[]> = itemsByMaterial,
): Item[] {
  return (byMaterial.get(materialId) ?? []).filter(
    (i) => scopeItemIds.has(i.id) && (vendorId === undefined || i.vendorId === vendorId),
  );
}

/** English plural: plural(n, 'item', 'items'). */
export function plural(n: number, one: string, many: string): string {
  return Math.abs(n) === 1 ? one : many;
}

/** Word after a count: "110 material types", "1 material type". */
export function kindsWord(n: number): string {
  return plural(n, 'material type', 'material types');
}

/** "Crafted X of Y items". */
export function craftedText(done: number, total: number): string {
  return `Crafted ${done} of ${total} ${plural(total, 'item', 'items')}`;
}
