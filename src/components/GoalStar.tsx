import { itemsById, outfitsById } from '../data';
import { StarIcon } from '../icons';
import { goalItemIds, goalOutfitIds, toggleGoalItem, toggleGoalOutfit } from '../state/store';

export interface GoalStarProps {
  kind: 'item' | 'outfit';
  id: string;
  /** Display name for the aria-label; looked up from data when omitted. */
  name?: string;
  class?: string;
}

/** Goal star toggle (44×44, aria-pressed). Does not open the row's card. */
export function GoalStar({ kind, id, name, class: cls }: GoalStarProps) {
  const on = kind === 'item' ? goalItemIds.value.has(id) : goalOutfitIds.value.has(id);
  const label =
    name ?? (kind === 'item' ? itemsById.get(id)?.nameRu : outfitsById.get(id)?.nameRu) ?? id;
  return (
    <button
      type="button"
      class={['hit', 'goal-btn', cls].filter(Boolean).join(' ')}
      aria-pressed={on}
      aria-label={`Цель: ${label}`}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (kind === 'item') toggleGoalItem(id);
        else toggleGoalOutfit(id);
      }}
    >
      <StarIcon filled={on} class={on ? 'goal-star goal-star--on' : 'goal-star'} />
    </button>
  );
}
