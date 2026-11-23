import { describe, expect, it } from 'vitest';
import {
  animals,
  challengeCategories,
  dataset,
  english,
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
import { validateChallenges, validateDataset, validateEnglish } from '../src/data/validate';

const clone = (): Dataset => JSON.parse(JSON.stringify(dataset)) as Dataset;

describe('data integrity (SPEC 6.4)', () => {
  it('passes all validation checks', () => {
    expect(validateDataset(dataset)).toEqual([]);
  });

  it('has the expected counts (15.1)', () => {
    expect(items).toHaveLength(141);
    expect(items.filter((i) => i.vendorId === 'trapper')).toHaveLength(123);
    expect(items.filter((i) => i.vendorId === 'fence')).toHaveLength(18);
    expect(materials).toHaveLength(103);
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
    expect(materialShortName('perfect_beaver')).toBe('Beaver');
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
      expect(errors.some((e) => e.startsWith('materials: expected 103'))).toBe(true);
    });
  });
});

describe('English texts (src/data/en.json)', () => {
  it('cover every Russian description in the game data', () => {
    expect(validateEnglish(dataset, english)).toEqual([]);
  });

  it('are merged into the data used by the UI', () => {
    const fence = dataset.vendors.find((v) => v.id === 'fence');
    expect(fence?.rulesEn).toHaveLength(fence?.rulesRu.length ?? -1);
    for (const a of animals) {
      expect(a.habitatEn, a.id).not.toBe('');
      expect(
        a.links.every((l) => l.labelEn !== ''),
        a.id,
      ).toBe(true);
    }
    for (const m of materials) expect(m.sourceEn, m.id).not.toBe('');
    expect(itemsById.get('bear_claw_talisman')?.effectEn).toBe(
      'Lowers the drain speed of your Health core by 10%.',
    );
  });

  it('report missing translations', () => {
    const en = JSON.parse(JSON.stringify(english)) as typeof english;
    delete en.animals.alligator;
    delete en.materials.perfect_beaver;
    const errors = validateEnglish(dataset, en);
    expect(errors.some((e) => e.includes('"alligator" is missing'))).toBe(true);
    expect(errors.some((e) => e.includes('"perfect_beaver" source is empty'))).toBe(true);
  });
});

describe('challenges (src/data/challenges.json)', () => {
  it('has 9 categories × 10 ranks with text and a guide', () => {
    expect(validateChallenges(challengeCategories)).toEqual([]);
    expect(challengeCategories.map((c) => c.id)).toEqual([
      'bandit',
      'explorer',
      'gambler',
      'herbalist',
      'horseman',
      'master_hunter',
      'sharpshooter',
      'survivalist',
      'weapons_expert',
    ]);
  });

  it('detects broken categories', () => {
    const list = JSON.parse(JSON.stringify(challengeCategories)) as typeof challengeCategories;
    list[0].ranks.pop();
    list[1].ranks[2].guide = '';
    const errors = validateChallenges(list);
    expect(errors.some((e) => e.includes('"bandit" must have 10 ranks'))).toBe(true);
    expect(errors.some((e) => e.includes('"explorer" rank 3 has empty text'))).toBe(true);
  });
});
