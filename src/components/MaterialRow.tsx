import { useId, useState } from 'preact/hooks';
import { materialAnimal, materialsById, vendorsById } from '../data';
import type { Item } from '../data/types';
import { ChevronIcon } from '../icons';
import { itemStatus, shortfall, stockOf } from '../logic/calc';
import { state } from '../state/store';
import { AppLink } from './AppLink';
import { StatusBadge } from './StatusBadge';
import { Stepper } from './Stepper';

export interface MaterialRowProps {
  materialId: string;
  /** need(m) for the current scope (7.4); remaining = max(0, need − stock). */
  need: number;
  /** Optional text under the name, e.g. material.sourceEn. */
  note?: string;
  /** Show "Where to hunt: <animal> →" link (none for special materials). */
  showAnimalLink?: boolean;
  /** Items using this material; when given, tapping the row expands "Used for". */
  usedIn?: readonly Item[];
  defaultOpen?: boolean;
}

/** Material line for summary / outfit / animal screens (SPEC 9.2, 9.8, 9.9). */
export function MaterialRow({
  materialId,
  need,
  note,
  showAnimalLink = false,
  usedIn,
  defaultOpen = false,
}: MaterialRowProps) {
  const [open, setOpen] = useState(defaultOpen);
  const listId = useId();
  const { stock, crafted } = state.value;
  const m = materialsById.get(materialId);
  const have = stockOf(stock, materialId);
  const remaining = Math.max(0, need - have);
  const animal = showAnimalLink ? materialAnimal(materialId) : null;
  const expandable = !!usedIn && usedIn.length > 0;

  const info = (
    <>
      <span class="material-row__name">{m?.nameEn ?? materialId}</span>
      <span class="material-row__counts num">
        need {need} · have {have}
      </span>
    </>
  );

  return (
    <div class={remaining === 0 ? 'material-row material-row--done' : 'material-row'}>
      <div class="material-row__top">
        {expandable ? (
          <button
            type="button"
            class="material-row__info material-row__toggle"
            aria-expanded={open}
            aria-controls={listId}
            onClick={() => setOpen(!open)}
          >
            {info}
            <span class="material-row__more">
              Used for
              <ChevronIcon direction={open ? 'up' : 'down'} size={14} />
            </span>
          </button>
        ) : (
          <div class="material-row__info">{info}</div>
        )}
        <span
          class="material-row__remaining num"
          aria-label={remaining > 0 ? `Still to collect: ${remaining}` : 'Collected'}
        >
          {remaining}
        </span>
        <Stepper materialId={materialId} />
      </div>
      {note && <p class="material-row__note">{note}</p>}
      {animal && (
        <AppLink to={`/animal/${animal.id}`} class="material-row__animal">
          Where to hunt: {animal.nameEn}
          <ChevronIcon size={14} />
        </AppLink>
      )}
      {expandable && open && (
        <ul class="material-row__uses" id={listId}>
          {usedIn.map((item) => {
            const status = itemStatus(item, stock, crafted);
            const qty = item.recipe
              .filter((e) => e.materialId === materialId)
              .reduce((s, e) => s + e.qty, 0);
            return (
              <li key={item.id}>
                <AppLink
                  to={`/item/${item.id}`}
                  class={status === 'crafted' ? 'use-row use-row--done' : 'use-row'}
                >
                  <span class="use-row__main">
                    <span class="use-row__name">{item.nameEn}</span>
                    <span class="use-row__vendor">
                      {vendorsById.get(item.vendorId)?.nameEn ?? item.vendorId} · ×{qty}
                    </span>
                  </span>
                  <StatusBadge status={status} missing={shortfall(item, stock)} />
                </AppLink>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
