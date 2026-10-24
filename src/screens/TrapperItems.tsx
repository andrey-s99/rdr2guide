import { EmptyState } from '../components/EmptyState';
import { FilterChips, STATUS_FILTER_OPTIONS } from '../components/FilterChips';
import { ItemRow } from '../components/ItemRow';
import { SectionHeader } from '../components/SectionHeader';
import { itemsByCategory, itemsByVendor, vendorCategories } from '../data';
import { craftedProgress } from '../logic/calc';
import { filterByStatus, statusFilterCounts } from '../logic/filters';
import { sessionSignal, statusFilterSignal } from '../state/session';
import { state } from '../state/store';
import '../styles/screens/trapper.css';

/** Охотник → Предметы (SPEC 9.3). */
export function TrapperItems() {
  const filter = statusFilterSignal('trapper-items');
  const collapsed = sessionSignal<readonly string[]>('trapper-items:collapsed', []);
  const { stock, crafted } = state.value;
  const all = itemsByVendor.get('trapper') ?? [];
  const counts = statusFilterCounts(all, stock, crafted);
  const options = STATUS_FILTER_OPTIONS.map((opt) => ({ ...opt, count: counts[opt.value] }));

  const groups = vendorCategories('trapper')
    .map((category) => {
      const list = itemsByCategory.get(category.id) ?? [];
      return {
        category,
        progress: craftedProgress(list, crafted),
        visible: filterByStatus(list, filter.value, stock, crafted),
      };
    })
    .filter((g) => g.visible.length > 0);

  const toggle = (id: string) => {
    const cur = collapsed.value;
    collapsed.value = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
  };

  return (
    <div class="screen trapper-screen">
      <FilterChips
        ariaLabel="Фильтр предметов"
        scroll
        options={options}
        value={filter.value}
        onChange={(v) => (filter.value = v)}
      />
      {groups.length === 0 ? (
        <EmptyState
          icon="hat"
          text={
            filter.value === 'not_crafted'
              ? 'Здесь пока пусто — всё изготовлено'
              : filter.value === 'ready'
                ? 'Пока нет предметов, для которых всё добыто'
                : 'Здесь пока пусто'
          }
        />
      ) : (
        groups.map(({ category, progress, visible }) => {
          const open = !collapsed.value.includes(category.id);
          const regionId = `trapper-items-${category.id}`;
          return (
            <section key={category.id} class="trapper-group">
              <SectionHeader
                title={category.nameRu}
                icon={category.icon}
                extra={`сделано ${progress.done} из ${progress.total}`}
                open={open}
                onToggle={() => toggle(category.id)}
                controls={regionId}
              />
              {open && (
                <div class="list trapper-bleed" id={regionId}>
                  {visible.map((item) => (
                    <ItemRow key={item.id} item={item} />
                  ))}
                </div>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
