import type { ComponentChildren } from 'preact';
import { regionsById } from '../data';
import type { Animal } from '../data/types';
import { BirdIcon, CheckIcon, LegendaryIcon, PawIcon, WarningIcon } from '../icons';
import { AppLink } from './AppLink';

export interface AnimalRowProps {
  animal: Animal;
  /** Σ remaining of its materials (area `all`) → badge "need N". Ignored for legendary when `peltInStock` is set. */
  need?: number;
  /** Legendary only: pelt is in stock → "Pelt at Trapper ✓", otherwise "Not taken". */
  peltInStock?: boolean;
  /** Extra line under the name (e.g. other regions in the summary). */
  note?: ComponentChildren;
  /** Show region chips (default true). */
  showRegions?: boolean;
}

const DANGER_LABEL = { aggressive: 'Aggressive', dangerous: 'Dangerous' } as const;

export function AnimalTypeIcon({ type, size = 26 }: { type: Animal['type']; size?: number }) {
  if (type === 'legendary') return <LegendaryIcon size={size} />;
  if (type === 'bird') return <BirdIcon size={size} />;
  return <PawIcon size={size} />;
}

/** Danger badge: aggressive — yellow, dangerous — red; nothing for safe. */
export function DangerBadge({ danger }: { danger: Animal['danger'] }) {
  if (danger === 'safe') return null;
  return (
    <span class={danger === 'dangerous' ? 'badge badge--danger' : 'badge badge--warn'}>
      <WarningIcon size={14} />
      {DANGER_LABEL[danger]}
    </span>
  );
}

export function EpilogueBadge() {
  return <span class="badge badge--epilogue">Epilogue</span>;
}

/** Animal list row (SPEC 9.7). The whole row opens #/animal/<id>. */
export function AnimalRow({ animal, need, peltInStock, note, showRegions = true }: AnimalRowProps) {
  let right: ComponentChildren = null;
  if (animal.type === 'legendary' && peltInStock !== undefined) {
    right = peltInStock ? (
      <span class="badge badge--ok">
        Pelt at Trapper <CheckIcon size={14} strokeWidth={2} />
      </span>
    ) : (
      <span class="badge">Not taken</span>
    );
  } else if (need !== undefined) {
    right =
      need > 0 ? (
        <span class="badge badge--accent num">need {need}</span>
      ) : (
        <span class="badge badge--ok">enough</span>
      );
  }
  return (
    <AppLink to={`/animal/${animal.id}`} class="list-row animal-row">
      <span class="list-row__icon">
        <AnimalTypeIcon type={animal.type} />
      </span>
      <span class="list-row__main">
        <span class="list-row__title clamp-2">{animal.nameEn}</span>
        {note && <span class="list-row__note">{note}</span>}
        <span class="list-row__meta">
          {showRegions &&
            animal.regions.map((r) => (
              <span key={r} class="tag">
                {regionsById.get(r)?.nameEn ?? r}
              </span>
            ))}
          <DangerBadge danger={animal.danger} />
          {animal.availability === 'epilogue' && <EpilogueBadge />}
        </span>
      </span>
      {right && <span class="list-row__aside">{right}</span>}
    </AppLink>
  );
}
