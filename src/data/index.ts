import metaJson from '@data/meta.json';
import regionsJson from '@data/regions.json';
import vendorsJson from '@data/vendors.json';
import categoriesJson from '@data/categories.json';
import animalsJson from '@data/animals.json';
import materialsJson from '@data/materials.json';
import itemsJson from '@data/items.json';
import outfitsJson from '@data/outfits.json';
import type {
  Animal,
  Category,
  CategoryId,
  Item,
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

export const meta = metaJson as unknown as Meta;
export const regions = regionsJson as unknown as Region[];
export const vendors = vendorsJson as unknown as Vendor[];
export const categories = categoriesJson as unknown as Category[];
export const animals = animalsJson as unknown as Animal[];
export const materials = materialsJson as unknown as Material[];
export const items = itemsJson as unknown as Item[];
export const outfits = outfitsJson as unknown as Outfit[];

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

export const qualityLabelRu: Record<Material['quality'], string> = {
  perfect: 'идеальная',
  any: 'любая',
  legendary: 'легендарная',
};

export const animalTypeLabelRu: Record<Animal['type'], string> = {
  regular: 'Обычное животное',
  bird: 'Птица',
  legendary: 'Легендарный зверь',
};

export const sizeLabelRu: Record<Animal['size'], string> = {
  small: 'мелкий',
  medium: 'средний',
  large: 'крупный',
};

/**
 * Short material name for chips and toasts, e.g. «Бобр», «Олень (туша)».
 * Skins use the animal name; carcasses/antlers add a hint; other kinds use the material name.
 */
export function materialShortName(materialId: string): string {
  const m = materialsById.get(materialId);
  if (!m) return materialId;
  const animal = m.animalId ? animalsById.get(m.animalId) : undefined;
  if (!animal) return m.nameRu;
  switch (m.kind) {
    case 'skin':
      return animal.nameRu;
    case 'carcass':
      return `${animal.nameRu} (туша)`;
    case 'antler':
      return `${animal.nameRu} (рога)`;
    default:
      return m.nameRu;
  }
}
