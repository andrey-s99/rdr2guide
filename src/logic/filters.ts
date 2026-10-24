// Pure list filters used by the status chips (SPEC 9: «Все», «Не сделано», «Готово к крафту», «Сделано»).
import type { Item } from '../data/types';
import { itemStatus, type Crafted, type ItemStatus, type Stock } from './calc';

export type StatusFilter = 'all' | 'not_crafted' | 'ready' | 'crafted';

/** Whether an item status passes a status filter. */
export function matchesStatusFilter(status: ItemStatus, filter: StatusFilter): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'not_crafted':
      return status !== 'crafted';
    case 'ready':
      return status === 'ready';
    case 'crafted':
      return status === 'crafted';
  }
}

/** Keeps the items whose status (7.2) matches the filter, preserving order. */
export function filterByStatus<T extends Item>(
  list: readonly T[],
  filter: StatusFilter,
  stock: Stock,
  crafted: Crafted,
): T[] {
  if (filter === 'all') return [...list];
  return list.filter((item) => matchesStatusFilter(itemStatus(item, stock, crafted), filter));
}

/** Counts per filter value (for chip counters). */
export function statusFilterCounts(
  list: readonly Item[],
  stock: Stock,
  crafted: Crafted,
): Record<StatusFilter, number> {
  const counts: Record<StatusFilter, number> = { all: 0, not_crafted: 0, ready: 0, crafted: 0 };
  for (const item of list) {
    const s = itemStatus(item, stock, crafted);
    counts.all += 1;
    if (s === 'crafted') counts.crafted += 1;
    else {
      counts.not_crafted += 1;
      if (s === 'ready') counts.ready += 1;
    }
  }
  return counts;
}
