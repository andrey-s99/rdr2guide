import type { Dataset } from './dataset';
import type { Category, Item, Vendor } from './types';

/**
 * Pearson's satchels (src/data/pearson.json). The Pearson part was removed from
 * data/*.json earlier; it is restored here without camp upgrades and merged into
 * the raw data set so data/*.json stays untouched.
 */
export interface PearsonData {
  vendor: Vendor;
  category: Category;
  items: Item[];
}

/** Inserts `added` before the first element matching `before` (or at the end). */
function insertBefore<T>(list: T[], added: T[], before: (x: T) => boolean): T[] {
  const i = list.findIndex(before);
  return i < 0 ? [...list, ...added] : [...list.slice(0, i), ...added, ...list.slice(i)];
}

/** Returns the raw data set with Pearson placed between the Trapper and the Fence. */
export function withPearson(raw: Dataset, pearson: PearsonData): Dataset {
  return {
    ...raw,
    vendors: insertBefore(raw.vendors, [pearson.vendor], (v) => v.id === 'fence'),
    categories: insertBefore(raw.categories, [pearson.category], (c) => c.vendorId === 'fence'),
    items: insertBefore(raw.items, pearson.items, (i) => i.vendorId === 'fence'),
  };
}
