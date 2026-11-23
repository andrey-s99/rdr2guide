// Summary scopes (SPEC 7.5).
import {
  categoriesById,
  items,
  outfitItems,
  outfits,
  outfitsById,
  vendorCategories,
} from '../data';
import type { Item } from '../data/types';

export type ScopeGroupLabel = 'General' | 'Trapper' | 'Outfits' | 'Pearson' | 'Fence';

export interface ScopeDef {
  id: string;
  labelEn: string;
  group: ScopeGroupLabel;
}

export interface Goals {
  items: readonly string[];
  outfits: readonly string[];
}

export const DEFAULT_SCOPE = 'all';
export const GOALS_SCOPE = 'goals';

/** All scopes in display order (for the <select> with optgroups). */
export const scopes: readonly ScopeDef[] = [
  { id: 'all', labelEn: 'Everything', group: 'General' },
  { id: 'goals', labelEn: 'Goals', group: 'General' },
  { id: 'trapper', labelEn: 'Trapper: everything', group: 'Trapper' },
  { id: 'trapper_outfits', labelEn: 'Trapper: all outfits', group: 'Trapper' },
  ...vendorCategories('trapper').map((c): ScopeDef => ({
    id: `trapper_cat:${c.id}`,
    labelEn: `Trapper: ${c.nameEn}`,
    group: 'Trapper',
  })),
  ...outfits.map((o): ScopeDef => ({
    id: `outfit:${o.id}`,
    labelEn: `Outfit: ${o.nameEn}`,
    group: 'Outfits',
  })),
  { id: 'pearson', labelEn: 'Pearson: satchels', group: 'Pearson' },
  { id: 'fence', labelEn: 'Fence: everything', group: 'Fence' },
];

const scopesById = new Map(scopes.map((s) => [s.id, s]));

export const scopeGroupOrder: readonly ScopeGroupLabel[] = [
  'General',
  'Trapper',
  'Outfits',
  'Pearson',
  'Fence',
];

/** Scopes grouped for optgroups, in display order. */
export const scopeGroups: readonly { label: ScopeGroupLabel; scopes: ScopeDef[] }[] =
  scopeGroupOrder.map((label) => ({ label, scopes: scopes.filter((s) => s.group === label) }));

export function scopeExists(scopeId: string): boolean {
  return scopesById.has(scopeId);
}

export function getScope(scopeId: string): ScopeDef | undefined {
  return scopesById.get(scopeId);
}

/** Russian label of a scope, or the id itself if unknown. */
export function scopeLabel(scopeId: string): string {
  return scopesById.get(scopeId)?.labelEn ?? scopeId;
}

function itemsInSet(ids: ReadonlySet<string>): Item[] {
  return items.filter((i) => ids.has(i.id));
}

/** Union of all outfit parts (no duplicates, items.json order). */
export function outfitPartIds(outfitIds: readonly string[]): Set<string> {
  const ids = new Set<string>();
  for (const oid of outfitIds) {
    for (const id of outfitsById.get(oid)?.itemIds ?? []) ids.add(id);
  }
  return ids;
}

/** Items of a scope. Unknown scopes return an empty list. */
export function getScopeItems(scopeId: string, goals: Goals): Item[] {
  if (scopeId.startsWith('outfit:')) {
    // Keeps outfit part order.
    return outfitItems(scopeId.slice('outfit:'.length));
  }
  if (scopeId.startsWith('trapper_cat:')) {
    const cat = categoriesById.get(scopeId.slice('trapper_cat:'.length) as Item['category']);
    if (!cat || cat.vendorId !== 'trapper') return [];
    return items.filter((i) => i.category === cat.id);
  }
  switch (scopeId) {
    case 'all':
      return items.slice();
    case 'trapper':
      return items.filter((i) => i.vendorId === 'trapper');
    case 'trapper_outfits':
      return itemsInSet(outfitPartIds(outfits.map((o) => o.id)));
    case 'pearson':
      return items.filter((i) => i.vendorId === 'pearson');
    case 'fence':
      return items.filter((i) => i.vendorId === 'fence');
    case 'goals': {
      const ids = outfitPartIds(goals.outfits);
      for (const id of goals.items) ids.add(id);
      return itemsInSet(ids);
    }
    default:
      return [];
  }
}
