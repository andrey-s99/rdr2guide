import { describe, expect, it } from 'vitest';
import { itemsById } from '../src/data';
import type { Item } from '../src/data/types';
import { filterByStatus, matchesStatusFilter, statusFilterCounts } from '../src/logic/filters';

const gloves = itemsById.get('boar_riding_gloves') as Item;
const others = [...itemsById.values()].filter((i) => i.id !== gloves.id).slice(0, 3);
const list = [gloves, ...others];
const crafted = { [others[0].id]: { at: '2026-01-01T00:00:00Z', deducted: {} } };
const stock = { perfect_boar: 1, perfect_rabbit: 2 };

describe('status filters', () => {
  it('matchesStatusFilter', () => {
    expect(matchesStatusFilter('crafted', 'all')).toBe(true);
    expect(matchesStatusFilter('crafted', 'not_crafted')).toBe(false);
    expect(matchesStatusFilter('ready', 'not_crafted')).toBe(true);
    expect(matchesStatusFilter('missing', 'not_crafted')).toBe(true);
    expect(matchesStatusFilter('missing', 'ready')).toBe(false);
    expect(matchesStatusFilter('crafted', 'crafted')).toBe(true);
  });

  it('filterByStatus keeps order and filters by 7.2 status', () => {
    expect(filterByStatus(list, 'all', stock, crafted)).toEqual(list);
    expect(filterByStatus(list, 'crafted', stock, crafted)).toEqual([others[0]]);
    expect(filterByStatus(list, 'not_crafted', stock, crafted)).toEqual([
      gloves,
      others[1],
      others[2],
    ]);
    expect(filterByStatus(list, 'ready', stock, crafted).map((i) => i.id)).toContain(gloves.id);
    expect(filterByStatus(list, 'ready', {}, crafted)).toEqual([]);
  });

  it('statusFilterCounts', () => {
    const c = statusFilterCounts(list, stock, crafted);
    expect(c.all).toBe(4);
    expect(c.crafted).toBe(1);
    expect(c.not_crafted).toBe(3);
    expect(c.ready).toBeGreaterThanOrEqual(1);
  });
});
