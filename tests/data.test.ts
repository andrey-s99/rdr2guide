import { describe, expect, it } from 'vitest';
import {
  animals,
  dataset,
  items,
  itemsByMaterial,
  itemsById,
  materials,
  materialsByAnimal,
  materialShortName,
  outfits,
  regions,
} from '../src/data';
import type { Dataset } from '../src/data/dataset';
import { validateDataset } from '../src/data/validate';

const clone = (): Dataset => JSON.parse(JSON.stringify(dataset)) as Dataset;

describe('data integrity (SPEC 6.4)', () => {
  it('passes all validation checks', () => {
    expect(validateDataset(dataset)).toEqual([]);
  });

  it('has the expected counts (15.1)', () => {
    expect(items).toHaveLength(167);
    expect(items.filter((i) => i.vendorId === 'trapper')).toHaveLength(123);
    expect(items.filter((i) => i.vendorId === 'pearson')).toHaveLength(26);
    expect(items.filter((i) => i.vendorId === 'fence')).toHaveLength(18);
    expect(materials).toHaveLength(110);
    expect(animals).toHaveLength(77);
    expect(animals.filter((a) => a.type === 'regular')).toHaveLength(36);
    expect(animals.filter((a) => a.type === 'bird')).toHaveLength(25);
    expect(animals.filter((a) => a.type === 'legendary')).toHaveLength(16);
    expect(outfits).toHaveLength(16);
    expect(regions).toHaveLength(5);
  });

  it('has consistent consumedOnCraft / animalId rules', () => {
    for (const m of materials) {
      expect(m.consumedOnCraft, m.id).toBe(m.kind !== 'legendary_pelt');
      expect(m.animalId === null, m.id).toBe(m.kind === 'special');
    }
  });

  it('builds indexes', () => {
    expect(itemsById.get('boar_riding_gloves')?.vendorId).toBe('trapper');
    for (const m of materials) expect(itemsByMaterial.get(m.id)?.length, m.id).toBeGreaterThan(0);
    for (const a of animals) expect(materialsByAnimal.get(a.id)?.length, a.id).toBeGreaterThan(0);
    expect(materialShortName('perfect_beaver')).toBe('Бобр');
  });

  describe('validator detects errors', () => {
    it('duplicate ids', () => {
      const d = clone();
      d.items.push({ ...d.items[0] });
      expect(validateDataset(d).some((e) => e.includes('duplicate id'))).toBe(true);
    });
    it('unknown material, bad qty, empty recipe', () => {
      const d = clone();
      d.items[0].recipe = [{ materialId: 'nope', qty: 0 }];
      d.items[1].recipe = [];
      const errors = validateDataset(d);
      expect(errors.some((e) => e.includes('unknown material'))).toBe(true);
      expect(errors.some((e) => e.includes('invalid qty'))).toBe(true);
      expect(errors.some((e) => e.includes('empty recipe'))).toBe(true);
    });
    it('unknown animal / region / category / vendor mismatch', () => {
      const d = clone();
      d.materials[0].animalId = 'nope';
      (d.animals[0].regions as string[]) = ['mars'];
      d.items[0].vendorId = 'fence';
      const errors = validateDataset(d);
      expect(errors.some((e) => e.includes('unknown animal'))).toBe(true);
      expect(errors.some((e) => e.includes('unknown region'))).toBe(true);
      expect(errors.some((e) => e.includes('does not match category'))).toBe(true);
    });
    it('outfit consistency and prerequisites', () => {
      const d = clone();
      d.outfits[0].itemIds = d.outfits[0].itemIds.slice(1);
      d.items[0].prerequisiteItemIds = ['nope'];
      const errors = validateDataset(d);
      expect(errors.some((e) => e.includes('does not include it'))).toBe(true);
      expect(errors.some((e) => e.includes('unknown prerequisite'))).toBe(true);
    });
    it('unused materials, sourceless animals and counts', () => {
      const d = clone();
      d.materials.push({ ...d.materials[0], id: 'unused', animalId: null });
      d.animals.push({ ...d.animals[0], id: 'lonely' });
      const errors = validateDataset(d);
      expect(errors.some((e) => e.includes('"unused" is not used'))).toBe(true);
      expect(errors.some((e) => e.includes('"lonely" is not a source'))).toBe(true);
      expect(errors.some((e) => e.startsWith('materials: expected 110'))).toBe(true);
    });
  });
});
