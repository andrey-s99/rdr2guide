import type { ComponentChildren } from 'preact';
import { useMemo } from 'preact/hooks';
import { AnimalRow } from '../components/AnimalRow';
import { AppLink } from '../components/AppLink';
import { EmptyState } from '../components/EmptyState';
import { EnName } from '../components/EnName';
import { SectionHeader } from '../components/SectionHeader';
import { animalsById, categoriesById, itemsByMaterial, materialAnimal } from '../data';
import type { Item, Material, Outfit } from '../data/types';
import { Icon } from '../icons';
import { isSearchable, resultCount, search } from '../logic/search';
import '../styles/screens/search.css';

export interface SearchProps {
  /** Query from `?q=`. */
  q: string;
}

export const SEARCH_HINT = 'Введите название вещи, зверя или шкуры';
export const SEARCH_NOTHING = 'Ничего не найдено';

interface ResultRowProps {
  to: string | null;
  icon: string;
  nameRu: string;
  nameEn: string;
  note?: ComponentChildren;
}

/** Generic search result row; the whole row opens the target card. */
function ResultRow({ to, icon, nameRu, nameEn, note }: ResultRowProps) {
  const body = (
    <>
      <span class="list-row__icon">
        <Icon name={icon} size={26} />
      </span>
      <span class="list-row__main">
        <span class="list-row__title clamp-2">{nameRu}</span>
        <EnName text={nameEn} />
        {note && <span class="search-row__kind">{note}</span>}
      </span>
    </>
  );
  if (!to) return <div class="list-row">{body}</div>;
  return (
    <AppLink to={to} class="list-row">
      {body}
    </AppLink>
  );
}

/**
 * Card a material result opens: its animal, or for special materials (animalId null)
 * the first item whose recipe uses it.
 */
export function materialTarget(m: Material): { to: string; label: string } | null {
  const animal = materialAnimal(m.id);
  if (animal) return { to: `/animal/${animal.id}`, label: animal.nameRu };
  const item = itemsByMaterial.get(m.id)?.[0];
  if (item) return { to: `/item/${item.id}`, label: `Нужно для: ${item.nameRu}` };
  return null;
}

function OutfitResult({ outfit }: { outfit: Outfit }) {
  return (
    <ResultRow
      to={`/outfit/${outfit.id}`}
      icon="coat"
      nameRu={outfit.nameRu}
      nameEn={outfit.nameEn}
      note="Костюм"
    />
  );
}

function ItemResult({ item }: { item: Item }) {
  const category = categoriesById.get(item.category);
  return (
    <ResultRow
      to={`/item/${item.id}`}
      icon={category?.icon ?? 'trinket'}
      nameRu={item.nameRu}
      nameEn={item.nameEn}
      note={category?.nameRu}
    />
  );
}

function MaterialResult({ material }: { material: Material }) {
  const target = materialTarget(material);
  const animal = material.animalId ? animalsById.get(material.animalId) : undefined;
  const icon =
    animal?.type === 'bird'
      ? 'bird'
      : animal?.type === 'legendary'
        ? 'legendary'
        : animal
          ? 'paw'
          : 'trinket';
  return (
    <ResultRow
      to={target?.to ?? null}
      icon={icon}
      nameRu={material.nameRu}
      nameEn={material.nameEn}
      note={target?.label}
    />
  );
}

function Group({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ComponentChildren;
}) {
  if (count === 0) return null;
  return (
    <section class="search-group">
      <SectionHeader title={title} extra={<span class="search-group__count">{count}</span>} />
      <div class="list">{children}</div>
    </section>
  );
}

/** Search screen (SPEC 9.12). The input lives in the top bar (SearchField). */
export function Search({ q }: SearchProps) {
  const results = useMemo(() => search(q), [q]);

  if (!isSearchable(q)) {
    return (
      <div class="screen">
        <EmptyState icon="search" text={SEARCH_HINT} />
      </div>
    );
  }
  if (resultCount(results) === 0) {
    return (
      <div class="screen">
        <EmptyState icon="search" text={SEARCH_NOTHING} />
      </div>
    );
  }
  return (
    <div class="screen screen--flush search-results" aria-live="polite">
      <Group title="Костюмы" count={results.outfits.length}>
        {results.outfits.map((o) => (
          <OutfitResult key={o.id} outfit={o} />
        ))}
      </Group>
      <Group title="Предметы" count={results.items.length}>
        {results.items.map((i) => (
          <ItemResult key={i.id} item={i} />
        ))}
      </Group>
      <Group title="Животные" count={results.animals.length}>
        {results.animals.map((a) => (
          <AnimalRow key={a.id} animal={a} />
        ))}
      </Group>
      <Group title="Материалы" count={results.materials.length}>
        {results.materials.map((m) => (
          <MaterialResult key={m.id} material={m} />
        ))}
      </Group>
    </div>
  );
}
