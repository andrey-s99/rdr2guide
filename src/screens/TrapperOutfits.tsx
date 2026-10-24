import { AppLink } from '../components/AppLink';
import { EmptyState } from '../components/EmptyState';
import { FilterChips, STATUS_FILTER_OPTIONS, type StatusFilter } from '../components/FilterChips';
import { OutfitCard } from '../components/OutfitCard';
import { outfits } from '../data';
import type { Outfit, UserState } from '../data/types';
import { ChevronIcon } from '../icons';
import { outfitProgress } from '../logic/calc';
import { statusFilterSignal } from '../state/session';
import { needsForScope, state } from '../state/store';
import '../styles/screens/trapper.css';

export type OutfitStatus = 'crafted' | 'ready' | 'missing';

/**
 * Outfit-level status for the filter chips:
 * crafted — all parts crafted; ready — nothing left to hunt for the remaining parts
 * (needs of `outfit:<id>` are covered by the stock); missing — otherwise.
 */
export function outfitStatus(outfit: Outfit, s: UserState): OutfitStatus {
  if (outfitProgress(outfit, s.crafted).complete) return 'crafted';
  return needsForScope(`outfit:${outfit.id}`, s).totals.units === 0 ? 'ready' : 'missing';
}

function matches(status: OutfitStatus, filter: StatusFilter): boolean {
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

const EMPTY_TEXT: Record<StatusFilter, string> = {
  all: 'Здесь пока пусто',
  not_crafted: 'Здесь пока пусто — все костюмы собраны',
  ready: 'Пока нет костюмов, для которых всё добыто',
  crafted: 'Пока нет собранных костюмов',
};

/** Охотник → Костюмы (SPEC 9.1). */
export function TrapperOutfits() {
  const filter = statusFilterSignal('trapper-outfits');
  const s = state.value;
  const statuses = new Map(outfits.map((o) => [o.id, outfitStatus(o, s)]));
  const visible = outfits.filter((o) => matches(statuses.get(o.id)!, filter.value));
  const options = STATUS_FILTER_OPTIONS.map((opt) => ({
    ...opt,
    count: outfits.filter((o) => matches(statuses.get(o.id)!, opt.value)).length,
  }));

  return (
    <div class="screen trapper-screen">
      <AppLink to="/vendor/trapper" class="link-row">
        Где найти Охотника и как он работает
        <ChevronIcon size={18} />
      </AppLink>
      <FilterChips
        ariaLabel="Фильтр костюмов"
        scroll
        options={options}
        value={filter.value}
        onChange={(v) => (filter.value = v)}
      />
      {visible.length === 0 ? (
        <EmptyState icon="hat" text={EMPTY_TEXT[filter.value]} />
      ) : (
        <div class="trapper-outfits__list">
          {visible.map((o) => (
            <OutfitCard key={o.id} outfit={o} />
          ))}
        </div>
      )}
      <AppLink
        to="/summary?scope=trapper_outfits"
        class="btn btn--secondary btn--block trapper-summary-btn"
      >
        Сводка по всем костюмам
      </AppLink>
    </div>
  );
}
