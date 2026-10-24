import { AppLink } from '../components/AppLink';
import { confirm } from '../components/ConfirmDialog';
import { EnName } from '../components/EnName';
import { GoalStar } from '../components/GoalStar';
import { ItemRow } from '../components/ItemRow';
import { MaterialRow } from '../components/MaterialRow';
import { PaperCard } from '../components/PaperCard';
import { ProgressBar } from '../components/ProgressBar';
import { SectionHeader } from '../components/SectionHeader';
import { outfitItems, outfitsById } from '../data';
import { CheckIcon, ChevronIcon } from '../icons';
import { isCrafted, outfitProgress } from '../logic/calc';
import { markOutfitCrafted, needsForScope, partsWord, state } from '../state/store';
import '../styles/screens/trapper.css';
import { NotFound } from './NotFound';

export interface OutfitScreenProps {
  id: string;
}

/** Outfit card `#/outfit/<id>` (SPEC 9.2). */
export function OutfitScreen({ id }: OutfitScreenProps) {
  const outfit = outfitsById.get(id);
  if (!outfit) return <NotFound />;

  const s = state.value;
  const parts = outfitItems(outfit.id);
  const { craftedParts, totalParts, complete } = outfitProgress(outfit, s.crafted);
  const uncrafted = parts.filter((p) => !isCrafted(p.id, s.crafted)).length;
  const scopeId = `outfit:${outfit.id}`;
  const needs = needsForScope(scopeId, s);

  const onMarkAll = async () => {
    const ok = await confirm({
      title: `Отметить ${uncrafted} ${partsWord(uncrafted)} изготовленными?`,
      body: 'Материалы будут списаны из запасов',
      confirmLabel: 'Отметить',
    });
    if (ok) markOutfitCrafted(outfit.id);
  };

  return (
    <div class="screen trapper-screen">
      <PaperCard as="article" muted={complete} class="outfit-head">
        <header class="paper-card__head">
          <h2 class="paper-card__title">
            <span>{outfit.nameRu}</span>
          </h2>
          <EnName text={outfit.nameEn} class="paper-card__subtitle outfit-head__en" />
        </header>
        <div class="outfit-head__star">
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
      </PaperCard>

      <section class="trapper-group">
        <SectionHeader title="Части костюма" extra={`сделано ${craftedParts} из ${totalParts}`} />
        <div class="list trapper-bleed">
          {parts.map((item) => (
            <ItemRow key={item.id} item={item} showOutfits={false} showRecipe={false} />
          ))}
        </div>
      </section>

      {uncrafted > 0 && (
        <button type="button" class="btn btn--primary btn--block" onClick={onMarkAll}>
          Отметить весь костюм изготовленным
        </button>
      )}

      <section class="trapper-group">
        <SectionHeader title="Что нужно добыть" />
        {needs.rows.length === 0 ? (
          <p class="muted trapper-note">Все части изготовлены, добывать ничего не нужно.</p>
        ) : (
          <>
            <div class="list trapper-bleed">
              {needs.rows.map((row) => (
                <MaterialRow
                  key={row.materialId}
                  materialId={row.materialId}
                  need={row.need}
                  showAnimalLink
                  usedIn={parts.filter((p) =>
                    p.recipe.some((e) => e.materialId === row.materialId),
                  )}
                />
              ))}
            </div>
            <p class="trapper-total">
              Осталось добыть: <strong class="num">{needs.totals.units}</strong> шт.,{' '}
              <strong class="num">{needs.totals.distinct}</strong> видов материалов
            </p>
          </>
        )}
      </section>

      <AppLink to={`/summary?scope=${scopeId}`} class="link-row">
        Открыть в сводке
        <ChevronIcon size={18} />
      </AppLink>
    </div>
  );
}
