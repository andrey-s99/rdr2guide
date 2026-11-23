import metaJson from '@data/meta.json';
import regionsJson from '@data/regions.json';
import vendorsJson from '@data/vendors.json';
import categoriesJson from '@data/categories.json';
import animalsJson from '@data/animals.json';
import materialsJson from '@data/materials.json';
import itemsJson from '@data/items.json';
import outfitsJson from '@data/outfits.json';
import enJson from './en.json';
import challengesJson from './challenges.json';
import pearsonJson from './pearson.json';
import { type PearsonData, withPearson } from './pearson';
import type {
  Animal,
  Category,
  CategoryId,
  ChallengeCategory,
  ChallengeCategoryId,
  EnglishTexts,
  Item,
  Link,
  Material,
  Meta,
  Outfit,
  Region,
  RegionId,
  Vendor,
  VendorId,
} from './types';
import type { Dataset } from './dataset';

export type * from './types';
export type { Dataset } from './dataset';

/** English texts for the game data (the original data/*.json descriptions are Russian). */
export const english = enJson as EnglishTexts;

type RawLink = Omit<Link, 'labelEn'>;

function withLabels(links: RawLink[], labels: string[] | undefined): Link[] {
  return links.map((l, i) => ({ ...l, labelEn: labels?.[i] ?? l.url }));
}

/** Merges src/data/en.json into the raw game data. Missing texts become ''. */
export function localizeDataset(raw: Dataset, en: EnglishTexts): Dataset {
  const rawMeta = raw.meta as Omit<Meta, 'notesEn' | 'globalMapLinks'> & {
    globalMapLinks: RawLink[];
  };
  return {
    meta: {
      ...rawMeta,
      notesEn: en.meta.notes,
      globalMapLinks: withLabels(rawMeta.globalMapLinks, en.meta.globalMapLinks),
    },
    regions: raw.regions,
    vendors: raw.vendors.map((v) => ({
      ...v,
      locationsEn: en.vendors[v.id]?.locations ?? [],
      rulesEn: en.vendors[v.id]?.rules ?? [],
    })),
    categories: raw.categories.map((c) => ({ ...c, nameEn: en.categories[c.id] ?? c.id })),
    animals: raw.animals.map((a) => {
      const t = en.animals[a.id];
      return {
        ...a,
        habitatEn: t?.habitat ?? '',
        perfectKillEn: t?.perfectKill ?? '',
        behaviorEn: t?.behavior ?? '',
        ...(t?.unlock !== undefined ? { unlockEn: t.unlock } : {}),
        availabilityNoteEn: t?.availabilityNote ?? '',
        links: withLabels(a.links, t?.links),
      };
    }),
    materials: raw.materials.map((m) => ({ ...m, sourceEn: en.materials[m.id] ?? '' })),
    items: raw.items.map((i) => {
      const t = en.items[i.id];
      return {
        ...i,
        requirementEn: t?.requirement ?? '',
        effectEn: t?.effect ?? '',
        campSpotEn: '',
        dataNoteEn: t?.dataNote ?? '',
      };
    }),
    outfits: raw.outfits,
  };
}

const rawDataset = withPearson(
  {
  meta: metaJson,
  regions: regionsJson,
  vendors: vendorsJson,
  categories: categoriesJson,
  animals: animalsJson,
  materials: materialsJson,
  items: itemsJson,
  outfits: outfitsJson,
  } as unknown as Dataset,
  pearsonJson as unknown as PearsonData,
);

const localized = localizeDataset(rawDataset, english);

export const meta: Meta = localized.meta;
export const regions: Region[] = localized.regions;
export const vendors: Vendor[] = localized.vendors;
export const categories: Category[] = localized.categories;
export const animals: Animal[] = localized.animals;
export const materials: Material[] = localized.materials;
export const items: Item[] = localized.items;
export const outfits: Outfit[] = localized.outfits;

/** The 9 challenge categories × 10 ranks (src/data/challenges.json). */
export const challengeCategories = challengesJson as unknown as ChallengeCategory[];
export const challengeCategoriesById: ReadonlyMap<ChallengeCategoryId, ChallengeCategory> =
  new Map(challengeCategories.map((c) => [c.id, c]));

export const dataset: Dataset = {
  meta,
  regions,
  vendors,
  categories,
  animals,
  materials,
  items,
  outfits,
};

function indexById<T extends { id: string }>(list: T[]): Map<string, T> {
  return new Map(list.map((x) => [x.id, x]));
}

export const itemsById: ReadonlyMap<string, Item> = indexById(items);
export const materialsById: ReadonlyMap<string, Material> = indexById(materials);
export const animalsById: ReadonlyMap<string, Animal> = indexById(animals);
export const outfitsById: ReadonlyMap<string, Outfit> = indexById(outfits);
export const categoriesById: ReadonlyMap<CategoryId, Category> = new Map(
  categories.map((c) => [c.id, c]),
);
export const vendorsById: ReadonlyMap<VendorId, Vendor> = new Map(vendors.map((v) => [v.id, v]));
export const regionsById: ReadonlyMap<RegionId, Region> = new Map(regions.map((r) => [r.id, r]));

/** materialId -> items whose recipe uses it (in items.json order). */
export const itemsByMaterial: ReadonlyMap<string, Item[]> = (() => {
  const map = new Map<string, Item[]>(materials.map((m) => [m.id, []]));
  for (const item of items) {
    for (const entry of item.recipe) {
      const list = map.get(entry.materialId);
      if (list) list.push(item);
      else map.set(entry.materialId, [item]);
    }
  }
  return map;
})();

/** materialId -> vendors whose recipes use it (vendors.json order). */
export const materialVendors: ReadonlyMap<string, VendorId[]> = new Map(
  materials.map((m) => [
    m.id,
    vendors
      .map((v) => v.id)
      .filter((v) => (itemsByMaterial.get(m.id) ?? []).some((i) => i.vendorId === v)),
  ]),
);

/** Whether more than one vendor uses a material (each keeps its own stock of it). */
export function isSharedMaterial(materialId: string): boolean {
  return (materialVendors.get(materialId)?.length ?? 0) > 1;
}

/** "Beaver", or "Beaver (Pearson)" when several vendors keep their own stock of it. */
export function stockLabel(vendorId: VendorId, materialId: string): string {
  const name = materialShortName(materialId);
  if (!isSharedMaterial(materialId)) return name;
  return `${name} (${vendorsById.get(vendorId)?.nameEn ?? vendorId})`;
}

/** animalId -> materials obtained from it (in materials.json order). */
export const materialsByAnimal: ReadonlyMap<string, Material[]> = (() => {
  const map = new Map<string, Material[]>(animals.map((a) => [a.id, []]));
  for (const m of materials) {
    if (m.animalId === null) continue;
    const list = map.get(m.animalId);
    if (list) list.push(m);
    else map.set(m.animalId, [m]);
  }
  return map;
})();

/** vendorId -> items (items.json order). */
export const itemsByVendor: ReadonlyMap<VendorId, Item[]> = new Map(
  vendors.map((v) => [v.id, items.filter((i) => i.vendorId === v.id)]),
);

/** categoryId -> items (items.json order). */
export const itemsByCategory: ReadonlyMap<CategoryId, Item[]> = new Map(
  categories.map((c) => [c.id, items.filter((i) => i.category === c.id)]),
);

/** Items of an outfit in `itemIds` order (unknown ids are skipped). */
export function outfitItems(outfitId: string): Item[] {
  const outfit = outfitsById.get(outfitId);
  if (!outfit) return [];
  return outfit.itemIds.map((id) => itemsById.get(id)).filter((i): i is Item => i !== undefined);
}

/** Categories of a vendor in `vendor.categories` order. */
export function vendorCategories(vendorId: VendorId): Category[] {
  const vendor = vendorsById.get(vendorId);
  if (!vendor) return [];
  return vendor.categories
    .map((id) => categoriesById.get(id))
    .filter((c): c is Category => c !== undefined);
}

/** Animal a material comes from, or null for special materials. */
export function materialAnimal(materialId: string): Animal | null {
  const m = materialsById.get(materialId);
  if (!m || m.animalId === null) return null;
  return animalsById.get(m.animalId) ?? null;
}

/** Items with disputed data (dataConfidence medium/low). */
export const disputedItems: Item[] = items.filter((i) => i.dataConfidence !== 'high');

export const qualityLabel: Record<Material['quality'], string> = {
  perfect: 'perfect',
  any: 'any',
  legendary: 'legendary',
};

export const animalTypeLabel: Record<Animal['type'], string> = {
  regular: 'Animal',
  bird: 'Bird',
  legendary: 'Legendary animal',
};

export const sizeLabel: Record<Animal['size'], string> = {
  small: 'small',
  medium: 'medium',
  large: 'large',
};

/**
 * Short material name for chips and toasts, e.g. "Beaver", "Deer (carcass)".
 * Skins use the animal name; carcasses/antlers add a hint; other kinds use the material name.
 */
export function materialShortName(materialId: string): string {
  const m = materialsById.get(materialId);
  if (!m) return materialId;
  const animal = m.animalId ? animalsById.get(m.animalId) : undefined;
  if (!animal) return m.nameEn;
  switch (m.kind) {
    case 'skin':
      return animal.nameEn;
    case 'carcass':
      return `${animal.nameEn} (carcass)`;
    case 'antler':
      return `${animal.nameEn} (antlers)`;
    default:
      return m.nameEn;
  }
}
