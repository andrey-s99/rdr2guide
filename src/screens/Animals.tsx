import { useComputed } from '@preact/signals';
import { AnimalRow } from '../components/AnimalRow';
import type { AnimalsTab } from '../components/AppShell';
import { EmptyState } from '../components/EmptyState';
import { FilterChips, type ChipOption } from '../components/FilterChips';
import { animals, materialsByAnimal, regions } from '../data';
import type { Animal, RegionId } from '../data/types';
import { stockOf, sumRemaining } from '../logic/calc';
import { sessionSignal } from '../state/session';
import { needsForScope, state } from '../state/store';
import '../styles/screens/animals.css';

const TITLES: Record<AnimalsTab, string> = {
  regular: 'Обычные звери',
  legendary: 'Легендарные звери',
  birds: 'Птицы',
};

const ICONS: Record<AnimalsTab, string> = { regular: 'paw', legendary: 'legendary', birds: 'bird' };

const TYPE_OF_TAB: Record<AnimalsTab, Animal['type']> = {
  regular: 'regular',
  legendary: 'legendary',
  birds: 'bird',
};

const REGION_OPTIONS: ChipOption<RegionId>[] = regions.map((r) => ({
  value: r.id,
  label: r.nameRu,
}));

/** Region filter is shared by all three tabs for the session (empty = all regions). */
export const animalRegionFilter = sessionSignal<RegionId[]>('animals:regions', []);
/** «Только нужные», on by default. */
export const animalOnlyNeeded = sessionSignal<boolean>('animals:only-needed', true);

interface AnimalEntry {
  animal: Animal;
  need: number;
  peltInStock?: boolean;
}

export interface AnimalsProps {
  tab: AnimalsTab;
}

/** SPEC 9.7: animal list for one tab (regular / legendary / birds). */
export function Animals({ tab }: AnimalsProps) {
  const type = TYPE_OF_TAB[tab];
  const selectedRegions = animalRegionFilter.value;
  const onlyNeeded = animalOnlyNeeded.value;

  // Needs of the «all» scope, computed once per state change.
  const needs = useComputed(() => needsForScope('all', state.value));
  const stock = state.value.stock;

  const inRegions = animals.filter(
    (a) =>
      a.type === type &&
      (selectedRegions.length === 0 || a.regions.some((r) => selectedRegions.includes(r))),
  );

  const entries: AnimalEntry[] = inRegions.map((animal) => {
    const mats = materialsByAnimal.get(animal.id) ?? [];
    const need = sumRemaining(
      needs.value,
      mats.map((m) => m.id),
    );
    if (animal.type !== 'legendary') return { animal, need };
    const pelt = mats.find((m) => m.kind === 'legendary_pelt');
    return { animal, need, peltInStock: pelt ? stockOf(stock, pelt.id) >= 1 : false };
  });

  const visible = onlyNeeded ? entries.filter((e) => e.need > 0) : entries;

  visible.sort((a, b) => {
    // Legendary: not yet obtained first, then by need.
    if (a.peltInStock !== b.peltInStock) return a.peltInStock ? 1 : -1;
    if (a.need !== b.need) return b.need - a.need;
    return a.animal.nameRu.localeCompare(b.animal.nameRu, 'ru');
  });

  let empty: string | null = null;
  if (visible.length === 0) {
    if (inRegions.length > 0) empty = 'Все звери из этого списка уже не нужны';
    else empty = 'В выбранных регионах таких животных нет';
  }

  return (
    <div class="screen screen--flush animals">
      <div class="animals__controls">
        <h2 class="screen-title">{TITLES[tab]}</h2>
        <FilterChips<RegionId>
          multiple
          scroll
          ariaLabel="Регионы"
          options={REGION_OPTIONS}
          value={selectedRegions}
          onChange={(v) => (animalRegionFilter.value = v)}
        />
        <label class="switch">
          <span>Только нужные</span>
          <input
            type="checkbox"
            role="switch"
            class="switch__input"
            checked={onlyNeeded}
            onChange={(e) =>
              (animalOnlyNeeded.value = (e.currentTarget as HTMLInputElement).checked)
            }
          />
        </label>
      </div>
      {empty ? (
        <EmptyState icon={ICONS[tab]} text={empty} />
      ) : (
        <div class="list">
          {visible.map((e) => (
            <AnimalRow
              key={e.animal.id}
              animal={e.animal}
              need={e.need}
              peltInStock={e.peltInStock}
            />
          ))}
        </div>
      )}
    </div>
  );
}
