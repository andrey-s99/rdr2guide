// Search (SPEC 7.7).
import { animals, items, materials, outfits } from '../data';
import type { Animal, Item, Material, Outfit } from '../data/types';

export const SEARCH_MIN_LENGTH = 2;
export const SEARCH_GROUP_LIMIT = 20;

/** Lower case, ё → е, trim, collapse repeated whitespace. */
export function normalize(text: string): string {
  return text.toLowerCase().replace(/ё/g, 'е').trim().replace(/\s+/g, ' ');
}

export function isSearchable(query: string): boolean {
  return normalize(query).length >= SEARCH_MIN_LENGTH;
}

interface Named {
  nameRu: string;
  nameEn: string;
}

export interface SearchSource {
  outfits: readonly Outfit[];
  items: readonly Item[];
  animals: readonly Animal[];
  materials: readonly Material[];
}

export interface SearchResults {
  outfits: Outfit[];
  items: Item[];
  animals: Animal[];
  materials: Material[];
}

const defaultSource: SearchSource = { outfits, items, animals, materials };

const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;

/** 0 = no match, 1 = substring match, 2 = match at the start of a word. */
function matchRank(name: string, q: string): number {
  const text = normalize(name);
  let idx = text.indexOf(q);
  if (idx < 0) return 0;
  while (idx >= 0) {
    if (idx === 0 || !LETTER_OR_DIGIT.test(text[idx - 1])) return 2;
    idx = text.indexOf(q, idx + 1);
  }
  return 1;
}

function searchGroup<T extends Named>(list: readonly T[], q: string, limit: number): T[] {
  const hits: { x: T; rank: number }[] = [];
  for (const x of list) {
    const rank = Math.max(matchRank(x.nameRu, q), matchRank(x.nameEn, q));
    if (rank > 0) hits.push({ x, rank });
  }
  hits.sort((a, b) => b.rank - a.rank || a.x.nameRu.localeCompare(b.x.nameRu, 'ru'));
  return hits.slice(0, limit).map((h) => h.x);
}

export function emptyResults(): SearchResults {
  return { outfits: [], items: [], animals: [], materials: [] };
}

/** Grouped search; queries shorter than 2 characters return empty groups. */
export function search(
  query: string,
  source: SearchSource = defaultSource,
  limit = SEARCH_GROUP_LIMIT,
): SearchResults {
  const q = normalize(query);
  if (q.length < SEARCH_MIN_LENGTH) return emptyResults();
  return {
    outfits: searchGroup(source.outfits, q, limit),
    items: searchGroup(source.items, q, limit),
    animals: searchGroup(source.animals, q, limit),
    materials: searchGroup(source.materials, q, limit),
  };
}

export function resultCount(r: SearchResults): number {
  return r.outfits.length + r.items.length + r.animals.length + r.materials.length;
}
