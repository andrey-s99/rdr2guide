import { AppLink } from '../components/AppLink';
import { confirm } from '../components/ConfirmDialog';
import { DataWarning } from '../components/DataWarning';
import { EnName } from '../components/EnName';
import { GoalStar } from '../components/GoalStar';
import { PaperCard } from '../components/PaperCard';
import { RecipeTable } from '../components/RecipeTable';
import { StatusBadge } from '../components/StatusBadge';
import { categoriesById, itemsById, materialsById, outfitsById, vendorsById } from '../data';
import type { Item, Outfit } from '../data/types';
import { CheckIcon, ChevronIcon, Icon, LockIcon } from '../icons';
import { isCrafted, itemStatus, prerequisiteProgress, shortfall } from '../logic/calc';
import { markCrafted, state, unmarkCrafted } from '../state/store';
import '../styles/screens/trapper.css';
import { NotFound } from './NotFound';

export interface ItemScreenProps {
  id: string;
}

/** Asks for confirmation, then removes the crafted mark returning deducted materials. */
async function confirmUnmark(item: Item): Promise<void> {
  const record = state.value.crafted[item.id];
  if (!record) return;
  const deducted = Object.entries(record.deducted).filter(([, d]) => d > 0);
  const ok =
    deducted.length > 0
      ? await confirm({
          title: 'Вернуть списанные материалы в запасы?',
          body: (
            <ul class="item-unmark-list">
              {deducted.map(([m, d]) => (
                <li key={m}>
                  {materialsById.get(m)?.nameRu ?? m}: <span class="num">+{d}</span>
                </li>
              ))}
            </ul>
          ),
          confirmLabel: 'Снять отметку',
        })
      : await confirm({
          title: 'Снять отметку «изготовлено»?',
          body: 'При изготовлении ничего не списывалось, в запасы ничего не вернётся.',
          confirmLabel: 'Снять отметку',
        });
  if (ok) unmarkCrafted(item.id);
}

/** Item card `#/item/<id>` (SPEC 9.4). Works for items of every vendor. */
export function ItemScreen({ id }: ItemScreenProps) {
  const item = itemsById.get(id);
  if (!item) return <NotFound />;

  const { stock, crafted } = state.value;
  const status = itemStatus(item, stock, crafted);
  const done = status === 'crafted';
  const category = categoriesById.get(item.category);
  const vendor = vendorsById.get(item.vendorId);
  const prereqs = item.prerequisiteItemIds
    .map((pid) => itemsById.get(pid))
    .filter((p): p is Item => p !== undefined);
  const prereqProgress = prerequisiteProgress(item, crafted);
  const itemOutfits = item.outfitIds
    .map((oid) => outfitsById.get(oid))
    .filter((o): o is Outfit => o !== undefined);
  const hasCondition = item.requirementRu !== '' || prereqs.length > 0;

  return (
    <div class="screen trapper-screen">
      <PaperCard as="article" class="item-card">
        <header class="paper-card__head item-card__head">
          {category && (
            <span class="item-card__icon">
              <Icon name={category.icon} size={40} strokeWidth={1.3} />
            </span>
          )}
          <h2 class="paper-card__title">
            <span>{item.nameRu}</span>
          </h2>
          <EnName text={item.nameEn} class="paper-card__subtitle item-card__en" />
          <p class="item-card__vendor">
            {[vendor?.nameRu, category?.nameRu].filter(Boolean).join(' · ')}
          </p>
          <div class="item-card__meta">
            {item.price !== null && <span class="price item-card__price">${item.price}</span>}
            <StatusBadge status={status} missing={shortfall(item, stock)} />
          </div>
          <div class="item-card__star">
            <GoalStar kind="item" id={item.id} name={item.nameRu} />
          </div>
        </header>

        <DataWarning confidence={item.dataConfidence} note={item.dataNoteRu} variant="banner" />

        {hasCondition && (
          <section class="item-card__block">
            <h3 class="item-card__label">Условие</h3>
            {item.requirementRu && <p>{item.requirementRu}</p>}
            {prereqs.length > 0 && (
              <div class="item-card__prereq">
                <p class="item-card__prereq-title">
                  <LockIcon size={16} />
                  Сначала изготовьте: {prereqProgress.done} из {prereqProgress.total}
                </p>
                <ul class="item-card__links">
                  {prereqs.map((p) => {
                    const pDone = isCrafted(p.id, crafted);
                    return (
                      <li key={p.id}>
                        <AppLink
                          to={`/item/${p.id}`}
                          class={
                            pDone ? 'item-card__link item-card__link--done' : 'item-card__link'
                          }
                        >
                          <span class="item-card__link-mark" aria-hidden="true">
                            {pDone && <CheckIcon size={16} strokeWidth={2} />}
                          </span>
                          <span class="item-card__link-text">{p.nameRu}</span>
                          <span class="visually-hidden">
                            {pDone ? ' (изготовлено)' : ' (не изготовлено)'}
                          </span>
                          <ChevronIcon size={16} />
                        </AppLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </section>
        )}

        {item.effectRu && (
          <section class="item-card__block">
            <h3 class="item-card__label">Эффект</h3>
            <p>{item.effectRu}</p>
          </section>
        )}

        {item.campSpotRu && (
          <section class="item-card__block">
            <h3 class="item-card__label">Место в лагере</h3>
            <p>{item.campSpotRu}</p>
          </section>
        )}

        {item.recipe.length > 0 && (
          <section class="item-card__block">
            <h3 class="item-card__label">Рецепт</h3>
            <RecipeTable item={item} />
          </section>
        )}

        {itemOutfits.length > 0 && (
          <section class="item-card__block">
            <h3 class="item-card__label">Входит в костюмы</h3>
            <ul class="item-card__links">
              {itemOutfits.map((o) => (
                <li key={o.id}>
                  <AppLink to={`/outfit/${o.id}`} class="item-card__link">
                    <span class="item-card__link-text">{o.nameRu}</span>
                    <ChevronIcon size={16} />
                  </AppLink>
                </li>
              ))}
            </ul>
          </section>
        )}
      </PaperCard>

      {done ? (
        <button
          type="button"
          class="btn btn--secondary btn--block item-card__action"
          onClick={() => void confirmUnmark(item)}
        >
          Снять отметку
        </button>
      ) : (
        <button
          type="button"
          class="btn btn--primary btn--block item-card__action"
          onClick={() => markCrafted(item.id)}
        >
          Отметить изготовленным
        </button>
      )}
    </div>
  );
}
