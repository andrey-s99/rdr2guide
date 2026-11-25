import { AppLink } from '../components/AppLink';
import { confirm } from '../components/ConfirmDialog';
import { GoalStar } from '../components/GoalStar';
import { ItemRow } from '../components/ItemRow';
import { MaterialRow } from '../components/MaterialRow';
import { PaperCard } from '../components/PaperCard';
import { ProgressBar } from '../components/ProgressBar';
import { SectionHeader } from '../components/SectionHeader';
import { outfitItems, outfitsById } from '../data';
import { CheckIcon, ChevronIcon } from '../icons';
import { isCrafted, outfitProgress } from '../logic/calc';
import { kindsWord } from '../logic/summary';
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
      title: `Mark ${uncrafted} ${partsWord(uncrafted)} as crafted?`,
      body: 'Materials will be deducted from your stock',
      confirmLabel: 'Mark',
    });
    if (ok) markOutfitCrafted(outfit.id);
  };

  return (
    <div class="screen trapper-screen">
      <PaperCard as="article" muted={complete} class="outfit-head">
        <header class="paper-card__head">
          <h2 class="paper-card__title">
            <span>{outfit.nameEn}</span>
          </h2>
        </header>
        <div class="outfit-head__star">
          <GoalStar kind="outfit" id={outfit.id} name={outfit.nameEn} />
        </div>
        <div class="outfit-card__progress">
          <span class="outfit-card__parts num">
            {craftedParts} / {totalParts} {partsWord(totalParts)}
          </span>
          {complete && (
            <span class="outfit-card__done">
              <CheckIcon size={16} strokeWidth={2} />
              Complete
            </span>
          )}
        </div>
        <ProgressBar
          value={craftedParts}
          max={totalParts}
          ariaLabel={`Parts crafted: ${craftedParts} of ${totalParts}`}
        />
      </PaperCard>

      <section class="trapper-group">
        <SectionHeader title="Outfit parts" extra={`${craftedParts} of ${totalParts} crafted`} />
        <div class="list trapper-bleed">
          {parts.map((item) => (
            <ItemRow key={item.id} item={item} showOutfits={false} showRecipe={false} />
          ))}
        </div>
      </section>

      {uncrafted > 0 && (
        <button type="button" class="btn btn--primary btn--block" onClick={onMarkAll}>
          Mark whole outfit as crafted
        </button>
      )}

      <section class="trapper-group">
        <SectionHeader title="What to collect" />
        {needs.rows.length === 0 ? (
          <p class="muted trapper-note">All parts are crafted, nothing left to collect.</p>
        ) : (
          <>
            <div class="list trapper-bleed">
              {needs.rows.map((row) => (
                <MaterialRow
                  key={`${row.vendorId}:${row.materialId}`}
                  vendorId={row.vendorId}
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
              Still to collect: <strong class="num">{needs.totals.units}</strong>,{' '}
              <strong class="num">{needs.totals.distinct}</strong>{' '}
              {kindsWord(needs.totals.distinct)}
            </p>
          </>
        )}
      </section>

      <AppLink to={`/summary?scope=${scopeId}`} class="link-row">
        Open in summary
        <ChevronIcon size={18} />
      </AppLink>
    </div>
  );
}
