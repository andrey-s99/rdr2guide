import { materialAnimal, materialsById, qualityLabelRu } from '../data';
import type { Item } from '../data/types';
import { ChevronIcon } from '../icons';
import { hasEnough } from '../logic/calc';
import { state } from '../state/store';
import { AppLink } from './AppLink';
import { EnName } from './EnName';
import { Stepper } from './Stepper';

export interface RecipeTableProps {
  item: Item;
}

/** Recipe block of the item card (SPEC 9.4 block 5). */
export function RecipeTable({ item }: RecipeTableProps) {
  const stock = state.value.stock;
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
              <span class="recipe-row__name">{m?.nameRu ?? entry.materialId}</span>
              {m && <span class={qualityTag}>{qualityLabelRu[m.quality]}</span>}
              {m && !m.consumedOnCraft && <span class="recipe-row__keep">не расходуется</span>}
            </div>
            {m && <EnName text={m.nameEn} />}
            <div class="recipe-row__line">
              <span class="recipe-row__need">
                <span class="muted">нужно</span>{' '}
                <strong class={enough ? 'num recipe-row__qty--ok' : 'num'}>{entry.qty}</strong>
              </span>
              <span class="recipe-row__have">
                <span class="muted">есть</span>
                <Stepper materialId={entry.materialId} />
              </span>
            </div>
            {m?.kind === 'special' && m.sourceRu && (
              <p class="recipe-row__source">
                <span class="muted">Где взять:</span> {m.sourceRu}
              </p>
            )}
            {animal && (
              <AppLink to={`/animal/${animal.id}`} class="recipe-row__where">
                Где добыть: {animal.nameRu}
                <ChevronIcon size={16} />
              </AppLink>
            )}
          </li>
        );
      })}
    </ul>
  );
}
