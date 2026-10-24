import { ItemRow } from '../components/ItemRow';
import { SectionHeader } from '../components/SectionHeader';
import { itemsByCategory } from '../data';
import type { Item } from '../data/types';
import { craftedProgress } from '../logic/calc';
import { state } from '../state/store';
import { PearsonTop } from './PearsonTop';
import { SummaryButton, VendorListScreen } from './VendorList';

const NO_SPOT = 'Другое';

export interface CampGroup {
  spot: string;
  items: Item[];
}

/** Groups items by campSpotRu in order of first appearance (SPEC 9.5). */
export function groupByCampSpot(list: readonly Item[]): CampGroup[] {
  const groups = new Map<string, Item[]>();
  for (const item of list) {
    const spot = item.campSpotRu || NO_SPOT;
    const g = groups.get(spot);
    if (g) g.push(item);
    else groups.set(spot, [item]);
  }
  return [...groups].map(([spot, items]) => ({ spot, items }));
}

/** Пирсон → Лагерь (SPEC 9.5). */
export function PearsonCamp() {
  const all = itemsByCategory.get('camp') ?? [];
  const { crafted } = state.value;
  // Group order and counters come from the full data, the filter only hides rows.
  const fullGroups = groupByCampSpot(all);
  return (
    <VendorListScreen
      screenKey="pearson-camp"
      title="Лагерь"
      items={all}
      icon="camp"
      top={<PearsonTop />}
      renderList={(list) => {
        const visible = new Set(list.map((i) => i.id));
        return fullGroups.map((group) => {
          const rows = group.items.filter((i) => visible.has(i.id));
          if (rows.length === 0) return null;
          const { done, total } = craftedProgress(group.items, crafted);
          return (
            <section key={group.spot} class="vendor-list__group">
              <SectionHeader title={group.spot} icon="camp" extra={`сделано ${done} из ${total}`} />
              <div class="list">
                {rows.map((item) => (
                  <ItemRow key={item.id} item={item} note={item.campSpotRu} />
                ))}
              </div>
            </section>
          );
        });
      }}
      bottom={<SummaryButton scope="pearson" label="Сводка по Пирсону" />}
    />
  );
}
