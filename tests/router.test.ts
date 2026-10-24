import { describe, expect, it } from 'vitest';
import { buildPath, parseHash, sectionOf } from '../src/router';

describe('parseHash', () => {
  it('parses static section routes', () => {
    const r = parseHash('#/trapper/outfits');
    expect(r?.name).toBe('trapper-outfits');
    expect(r?.segments).toEqual(['trapper', 'outfits']);
    expect(r?.key).toBe('/trapper/outfits');
    expect(parseHash('#/fence/talismans')?.name).toBe('fence-talismans');
    expect(parseHash('#/settings')?.name).toBe('settings');
  });

  it('parses query parameters', () => {
    const r = parseHash('#/animals?tab=legendary');
    expect(r?.name).toBe('animals');
    expect(r?.query).toEqual({ tab: 'legendary' });
    expect(r?.key).toBe('/animals?tab=legendary');

    const s = parseHash('#/summary?scope=outfit:bear_hunter&group=region');
    expect(s?.name).toBe('summary');
    expect(s?.query).toEqual({ scope: 'outfit:bear_hunter', group: 'region' });
  });

  it('decodes search query', () => {
    const r = parseHash('#/search?q=' + encodeURIComponent('Ёжик шкура'));
    expect(r?.name).toBe('search');
    expect(r?.query.q).toBe('Ёжик шкура');
  });

  it('parses id routes', () => {
    expect(parseHash('#/item/beaver_hat')).toMatchObject({ name: 'item', id: 'beaver_hat' });
    expect(parseHash('#/outfit/bear_hunter')).toMatchObject({ name: 'outfit', id: 'bear_hunter' });
    expect(parseHash('#/animal/beaver')).toMatchObject({ name: 'animal', id: 'beaver' });
    expect(parseHash('#/vendor/trapper')).toMatchObject({ name: 'vendor', id: 'trapper' });
  });

  it('tolerates missing # or leading slash and trailing slashes', () => {
    expect(parseHash('/pearson/camp')?.name).toBe('pearson-camp');
    expect(parseHash('#pearson/camp/')?.name).toBe('pearson-camp');
  });

  it('returns null for unknown routes', () => {
    expect(parseHash('')).toBeNull();
    expect(parseHash('#/')).toBeNull();
    expect(parseHash('#/nope')).toBeNull();
    expect(parseHash('#/item')).toBeNull();
    expect(parseHash('#/item/a/b')).toBeNull();
    expect(parseHash('#/trapper')).toBeNull();
  });
});

describe('router helpers', () => {
  it('maps routes to sections', () => {
    expect(sectionOf('trapper-items')).toBe('trapper');
    expect(sectionOf('animals')).toBe('animals');
    expect(sectionOf('item')).toBeNull();
    expect(sectionOf('settings')).toBeNull();
  });

  it('builds paths skipping empty params', () => {
    expect(buildPath('/summary', { scope: 'all', group: undefined })).toBe('/summary?scope=all');
    expect(buildPath('/animals')).toBe('/animals');
  });
});
