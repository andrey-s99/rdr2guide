import { materialAnimal, materialsById, qualityLabel } from '../data';
import type { Item } from '../data/types';
import { ChevronIcon } from '../icons';
import { hasEnough, vendorStock } from '../logic/calc';
import { state } from '../state/store';
import { AppLink } from './AppLink';
import { Stepper } from './Stepper';

export interface RecipeTableProps {
  item: Item;
}

/** Recipe block of the item card (SPEC 9.4 block 5). */
export function RecipeTable({ item }: RecipeTableProps) {
  // The vendor crafts only from its own stock (pelts sold to the Trapper / given to Pearson).
  const stock = vendorStock(state.value.stock, item.vendorId);
  return (
    <ul class="recipe-table">
      {item.recipe.map((entry) => {
        const m = materialsById.get(entry.materialId);
        const animal = materialAnimal(entry.materialId);
        const enough = hasEnough(entry.materialId, entry.qty, stock);
        const qualityTag =
          m?.quality === 'legendary'
            ? 'tag tag--brass'
            : m?.quality === 'perfect'
              ? 'tag tag--ok'
              : 'tag';
        return (
          <li key={entry.materialId} class="recipe-row">
            <div class="recipe-row__head">
              <span class="recipe-row__name">{m?.nameEn ?? entry.materialId}</span>
              {m && <span class={qualityTag}>{qualityLabel[m.quality]}</span>}
              {m && !m.consumedOnCraft && <span class="recipe-row__keep">not consumed</span>}
            </div>
            <div class="recipe-row__line">
              <span class="recipe-row__need">
                <span class="muted">need</span>{' '}
                <strong class={enough ? 'num recipe-row__qty--ok' : 'num'}>{entry.qty}</strong>
              </span>
              <span class="recipe-row__have">
                <span class="muted">have</span>
                <Stepper vendorId={item.vendorId} materialId={entry.materialId} />
              </span>
            </div>
            {m?.kind === 'special' && m.sourceEn && (
              <p class="recipe-row__source">
                <span class="muted">Where to get:</span> {m.sourceEn}
              </p>
            )}
            {animal && (
              <AppLink to={`/animal/${animal.id}`} class="recipe-row__where">
                Where to hunt: {animal.nameEn}
                <ChevronIcon size={16} />
              </AppLink>
            )}
          </li>
        );
      })}
    </ul>
  );
}
