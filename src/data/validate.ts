import type { Dataset } from './dataset';

/** Expected counts from SPEC table 6.3 / 15.1. */
export const EXPECTED_COUNTS = {
  regions: 5,
  vendors: 2,
  categories: 10,
  animals: 77,
  materials: 103,
  items: 141,
  outfits: 16,
  itemsByVendor: { trapper: 123, fence: 18 },
  animalsByType: { regular: 36, bird: 25, legendary: 16 },
} as const;

function checkUniqueIds(name: string, list: { id: string }[], errors: string[]): void {
  const seen = new Set<string>();
  for (const x of list) {
    if (seen.has(x.id)) errors.push(`${name}: duplicate id "${x.id}"`);
    seen.add(x.id);
  }
}

function countBy<T>(list: T[], key: (x: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const x of list) out[key(x)] = (out[key(x)] ?? 0) + 1;
  return out;
}

/** Runs all integrity checks from SPEC 6.4. Returns a list of error messages (empty = valid). */
export function validateDataset(d: Dataset): string[] {
  const errors: string[] = [];

  // 1. Unique ids per file.
  checkUniqueIds('regions', d.regions, errors);
  checkUniqueIds('vendors', d.vendors, errors);
  checkUniqueIds('categories', d.categories, errors);
  checkUniqueIds('animals', d.animals, errors);
  checkUniqueIds('materials', d.materials, errors);
  checkUniqueIds('items', d.items, errors);
  checkUniqueIds('outfits', d.outfits, errors);

  const regionIds = new Set<string>(d.regions.map((r) => r.id));
  const animalIds = new Set(d.animals.map((a) => a.id));
  const materialIds = new Set(d.materials.map((m) => m.id));
  const itemIds = new Set(d.items.map((i) => i.id));
  const categoriesById = new Map<string, { vendorId: string }>(d.categories.map((c) => [c.id, c]));
  const outfitsById = new Map(d.outfits.map((o) => [o.id, o]));

  // 2. Recipes.
  const usedMaterials = new Set<string>();
  for (const item of d.items) {
    if (!Array.isArray(item.recipe) || item.recipe.length === 0) {
      errors.push(`items: "${item.id}" has an empty recipe`);
      continue;
    }
    for (const entry of item.recipe) {
      if (!materialIds.has(entry.materialId)) {
        errors.push(`items: "${item.id}" uses unknown material "${entry.materialId}"`);
      }
      if (!Number.isInteger(entry.qty) || entry.qty < 1) {
        errors.push(`items: "${item.id}" has invalid qty ${String(entry.qty)} for "${entry.materialId}"`);
      }
      usedMaterials.add(entry.materialId);
    }
  }

  // 3. Material -> animal.
  const sourceAnimals = new Set<string>();
  for (const m of d.materials) {
    if (m.animalId === null) continue;
    if (!animalIds.has(m.animalId)) {
      errors.push(`materials: "${m.id}" references unknown animal "${m.animalId}"`);
    }
    sourceAnimals.add(m.animalId);
  }

  // 4. Animal regions.
  for (const a of d.animals) {
    if (!Array.isArray(a.regions) || a.regions.length === 0) {
      errors.push(`animals: "${a.id}" has no regions`);
    }
    for (const r of a.regions ?? []) {
      if (!regionIds.has(r)) errors.push(`animals: "${a.id}" references unknown region "${r}"`);
    }
  }

  // 5. Item category exists and belongs to the same vendor.
  for (const item of d.items) {
    const cat = categoriesById.get(item.category);
    if (!cat) {
      errors.push(`items: "${item.id}" has unknown category "${item.category}"`);
    } else if (cat.vendorId !== item.vendorId) {
      errors.push(
        `items: "${item.id}" vendor "${item.vendorId}" does not match category "${item.category}" vendor "${cat.vendorId}"`,
      );
    }
  }

  // 6. Outfit items exist; item.outfitIds consistent both ways.
  for (const o of d.outfits) {
    for (const id of o.itemIds) {
      if (!itemIds.has(id)) errors.push(`outfits: "${o.id}" references unknown item "${id}"`);
      const item = d.items.find((i) => i.id === id);
      if (item && !item.outfitIds.includes(o.id)) {
        errors.push(`items: "${id}" is part of outfit "${o.id}" but outfitIds does not list it`);
      }
    }
  }
  for (const item of d.items) {
    for (const oid of item.outfitIds) {
      const outfit = outfitsById.get(oid);
      if (!outfit) errors.push(`items: "${item.id}" references unknown outfit "${oid}"`);
      else if (!outfit.itemIds.includes(item.id)) {
        errors.push(`items: "${item.id}" lists outfit "${oid}" but the outfit does not include it`);
      }
    }
  }

  // 7. Prerequisites exist.
  for (const item of d.items) {
    for (const pid of item.prerequisiteItemIds) {
      if (!itemIds.has(pid)) {
        errors.push(`items: "${item.id}" references unknown prerequisite "${pid}"`);
      }
    }
  }

  // 8. Every material is used; every animal is a source.
  for (const m of d.materials) {
    if (!usedMaterials.has(m.id)) errors.push(`materials: "${m.id}" is not used in any recipe`);
  }
  for (const a of d.animals) {
    if (!sourceAnimals.has(a.id)) errors.push(`animals: "${a.id}" is not a source of any material`);
  }

  // 9. Counts.
  const counts: [string, number, number][] = [
    ['regions', d.regions.length, EXPECTED_COUNTS.regions],
    ['vendors', d.vendors.length, EXPECTED_COUNTS.vendors],
    ['categories', d.categories.length, EXPECTED_COUNTS.categories],
    ['animals', d.animals.length, EXPECTED_COUNTS.animals],
    ['materials', d.materials.length, EXPECTED_COUNTS.materials],
    ['items', d.items.length, EXPECTED_COUNTS.items],
    ['outfits', d.outfits.length, EXPECTED_COUNTS.outfits],
  ];
  const byVendor = countBy(d.items, (i) => i.vendorId);
  for (const [k, v] of Object.entries(EXPECTED_COUNTS.itemsByVendor)) {
    counts.push([`items (${k})`, byVendor[k] ?? 0, v]);
  }
  const byType = countBy(d.animals, (a) => a.type);
  for (const [k, v] of Object.entries(EXPECTED_COUNTS.animalsByType)) {
    counts.push([`animals (${k})`, byType[k] ?? 0, v]);
  }
  for (const [name, actual, expected] of counts) {
    if (actual !== expected) errors.push(`${name}: expected ${expected}, got ${actual}`);
  }

  return errors;
}
