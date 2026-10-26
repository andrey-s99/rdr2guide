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

export type ScopeGroupLabel = 'Общее' | 'Охотник' | 'Костюмы' | 'Скупщик';

export interface ScopeDef {
  id: string;
  labelRu: string;
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
  { id: 'all', labelRu: 'Всё', group: 'Общее' },
  { id: 'goals', labelRu: 'Цели', group: 'Общее' },
  { id: 'trapper', labelRu: 'Охотник: всё', group: 'Охотник' },
  { id: 'trapper_outfits', labelRu: 'Охотник: все костюмы', group: 'Охотник' },
  ...vendorCategories('trapper').map((c): ScopeDef => ({
    id: `trapper_cat:${c.id}`,
    labelRu: `Охотник: ${c.nameRu}`,
    group: 'Охотник',
  })),
  ...outfits.map((o): ScopeDef => ({
    id: `outfit:${o.id}`,
    labelRu: `Костюм: ${o.nameRu}`,
    group: 'Костюмы',
  })),
  { id: 'fence', labelRu: 'Скупщик: всё', group: 'Скупщик' },
];

const scopesById = new Map(scopes.map((s) => [s.id, s]));

export const scopeGroupOrder: readonly ScopeGroupLabel[] = [
  'Общее',
  'Охотник',
  'Костюмы',
  'Скупщик',
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
  return scopesById.get(scopeId)?.labelRu ?? scopeId;
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
