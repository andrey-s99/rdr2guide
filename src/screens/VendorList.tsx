// Shared building blocks of the Fence list screens (SPEC 9.5, 9.6).
import type { ComponentChildren } from 'preact';
import { AppLink } from '../components/AppLink';
import { EmptyState } from '../components/EmptyState';
import { FilterChips, STATUS_FILTER_OPTIONS } from '../components/FilterChips';
import type { Item } from '../data/types';
import { filterByStatus, statusFilterCounts, type StatusFilter } from '../logic/filters';
import { statusFilterSignal } from '../state/session';
import { state } from '../state/store';
import '../styles/screens/vendors.css';

const EMPTY_TEXT: Record<StatusFilter, string> = {
  all: 'Здесь пока пусто',
  not_crafted: 'Здесь пока пусто — всё изготовлено',
  ready: 'Пока ничего нельзя изготовить — не хватает материалов',
  crafted: 'Пока ничего не изготовлено',
};

export interface VendorListScreenProps {
  /** Session key for the status filter memory. */
  screenKey: string;
  /** Visually hidden screen heading. */
  title: string;
  /** All items of the screen in data order. */
  items: readonly Item[];
  /** Icon for the empty state. */
  icon: string;
  /** Content above the filter chips (links, reminders). */
  top: ComponentChildren;
  /** Renders the filtered (non-empty) list. */
  renderList: (filtered: Item[]) => ComponentChildren;
  /** Content at the bottom (summary button). */
  bottom?: ComponentChildren;
}

/** Top links + status chips + filtered list + empty state + bottom actions. */
export function VendorListScreen({
  screenKey,
  title,
  items,
  icon,
  top,
  renderList,
  bottom,
}: VendorListScreenProps) {
  const filter = statusFilterSignal(screenKey);
  const { stock, crafted } = state.value;
  const counts = statusFilterCounts(items, stock, crafted);
  const filtered = filterByStatus(items, filter.value, stock, crafted);
  const options = STATUS_FILTER_OPTIONS.map((o) => ({ ...o, count: counts[o.value] }));

  return (
    <div class="screen vendor-list">
      <h2 class="visually-hidden">{title}</h2>
      <div class="vendor-list__top">{top}</div>
      <FilterChips
        options={options}
        value={filter.value}
        onChange={(v) => (filter.value = v)}
        ariaLabel="Фильтр по статусу"
        scroll
      />
      {filtered.length === 0 ? (
        <EmptyState icon={icon} text={EMPTY_TEXT[filter.value]} />
      ) : (
        renderList(filtered)
      )}
      {bottom}
    </div>
  );
}

export interface VendorInfoLinkProps {
  vendorId: string;
  label: string;
}

/** «Как работает …» link row. */
export function VendorInfoLink({ vendorId, label }: VendorInfoLinkProps) {
  return (
    <AppLink to={`/vendor/${vendorId}`} class="link-row">
      {label}
    </AppLink>
  );
}

export interface SummaryButtonProps {
  scope: string;
  label: string;
}

/** Bottom button leading to the summary for a scope. */
export function SummaryButton({ scope, label }: SummaryButtonProps) {
  return (
    <AppLink
      to={`/summary?scope=${encodeURIComponent(scope)}`}
      class="btn btn--secondary btn--block"
    >
      {label}
    </AppLink>
  );
}
