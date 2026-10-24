import type { Outfit } from '../data/types';
import { CheckIcon } from '../icons';
import { outfitProgress } from '../logic/calc';
import { needsForScope, partsWord, state } from '../state/store';
import { AppLink } from './AppLink';
import { EnName } from './EnName';
import { GoalStar } from './GoalStar';
import { ProgressBar } from './ProgressBar';

export interface OutfitCardProps {
  outfit: Outfit;
}

/** Outfit catalogue card (SPEC 9.1). Whole card opens #/outfit/<id>; the star doesn't. */
export function OutfitCard({ outfit }: OutfitCardProps) {
  const s = state.value;
  const { craftedParts, totalParts, complete } = outfitProgress(outfit, s.crafted);
  const units = complete ? 0 : needsForScope(`outfit:${outfit.id}`, s).totals.units;
  return (
    <article
      class={complete ? 'paper-card outfit-card paper-card--muted' : 'paper-card outfit-card'}
    >
      <header class="paper-card__head outfit-card__head">
        <h2 class="paper-card__title">
          <AppLink to={`/outfit/${outfit.id}`} class="outfit-card__link">
            {outfit.nameRu}
          </AppLink>
        </h2>
        <EnName text={outfit.nameEn} class="paper-card__subtitle" />
      </header>
      <div class="outfit-card__star">
        <GoalStar kind="outfit" id={outfit.id} name={outfit.nameRu} />
      </div>
      <div class="outfit-card__progress">
        <span class="outfit-card__parts num">
          {craftedParts} / {totalParts} {partsWord(totalParts)}
        </span>
        {complete && (
          <span class="outfit-card__done">
            <CheckIcon size={16} strokeWidth={2} />
            Собран
          </span>
        )}
      </div>
      <ProgressBar
        value={craftedParts}
        max={totalParts}
        ariaLabel={`Изготовлено частей: ${craftedParts} из ${totalParts}`}
      />
      {!complete && (
        <p class="outfit-card__remaining">
          Осталось добыть: <strong class="num">{units}</strong> шт.
        </p>
      )}
    </article>
  );
}
