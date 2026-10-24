import type { ComponentChildren } from 'preact';
import { categoriesById, materialShortName, outfitsById } from '../data';
import type { Item } from '../data/types';
import { Icon } from '../icons';
import { hasEnough, isLocked, itemStatus, prerequisiteProgress, shortfall } from '../logic/calc';
import { state } from '../state/store';
import { AppLink } from './AppLink';
import { CraftCheckbox } from './Checkbox';
import { DataWarning } from './DataWarning';
import { EnName } from './EnName';
import { GoalStar } from './GoalStar';
import { LockBadge, StatusBadge } from './StatusBadge';

export interface ItemRowProps {
  item: Item;
  /** Second line under the name: requirementRu / effectRu / campSpotRu. Empty is hidden. */
  note?: string;
  /** Extra content at the bottom of the main column. */
  extra?: ComponentChildren;
  /** Recipe mini-chips «Бобр ×2» (default true). */
  showRecipe?: boolean;
  /** Outfit tags (default true; hide inside an outfit card). */
  showOutfits?: boolean;
  /** Price (default true; null prices are never shown). */
  showPrice?: boolean;
}

/** Item list row (SPEC 9.3). The whole row opens the item card; star and checkbox don't. */
export function ItemRow({
  item,
  note,
  extra,
  showRecipe = true,
  showOutfits = true,
  showPrice = true,
}: ItemRowProps) {
  const { stock, crafted } = state.value;
  const status = itemStatus(item, stock, crafted);
  const done = status === 'crafted';
  const locked = !done && isLocked(item, crafted);
  const prereq = locked ? prerequisiteProgress(item, crafted) : null;
  const category = categoriesById.get(item.category);
  const outfitNames = showOutfits
    ? item.outfitIds.map((id) => outfitsById.get(id)?.nameRu).filter((n): n is string => !!n)
    : [];

  return (
    <div class={done ? 'list-row item-row list-row--done' : 'list-row item-row'}>
      <span class="list-row__icon">{category && <Icon name={category.icon} size={26} />}</span>
      <div class="list-row__main">
        <AppLink to={`/item/${item.id}`} class="list-row__link list-row__title clamp-2">
          {item.nameRu}
        </AppLink>
        <EnName text={item.nameEn} />
        {note && <p class="list-row__note">{note}</p>}
        <div class="list-row__meta">
          {showPrice && item.price !== null && <span class="price">${item.price}</span>}
          <StatusBadge status={status} missing={shortfall(item, stock)} />
          {prereq && <LockBadge done={prereq.done} total={prereq.total} />}
          {outfitNames.map((n) => (
            <span key={n} class="tag tag--brass item-row__outfit">
              {n}
            </span>
          ))}
          <DataWarning confidence={item.dataConfidence} note={item.dataNoteRu} />
        </div>
        {showRecipe && item.recipe.length > 0 && (
          <ul class="tags item-row__recipe" aria-label="Рецепт">
            {item.recipe.map((e) => (
              <li
                key={e.materialId}
                class={!done && hasEnough(e.materialId, e.qty, stock) ? 'tag tag--ok' : 'tag'}
              >
                {materialShortName(e.materialId)} ×{e.qty}
              </li>
            ))}
          </ul>
        )}
        {extra}
      </div>
      <div class="list-row__actions">
        <GoalStar kind="item" id={item.id} name={item.nameRu} />
        <CraftCheckbox itemId={item.id} />
      </div>
    </div>
  );
}
