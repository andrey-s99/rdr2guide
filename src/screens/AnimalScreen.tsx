import type { ComponentChildren } from 'preact';
import { AnimalTypeIcon, DangerBadge, EpilogueBadge } from '../components/AnimalRow';
import { ExternalLink } from '../components/ExternalLink';
import { MaterialRow } from '../components/MaterialRow';
import { PaperCard } from '../components/PaperCard';
import { SectionHeader } from '../components/SectionHeader';
import {
  animalTypeLabel,
  animalsById,
  itemsByMaterial,
  materialsByAnimal,
  meta,
  regionsById,
  sizeLabel,
} from '../data';
import type { Link } from '../data/types';
import { needsForScope, state } from '../state/store';
import { NotFound } from './NotFound';
import '../styles/screens/animals.css';

export interface AnimalScreenProps {
  id: string;
}

function Block({ title, children }: { title: string; children: ComponentChildren }) {
  return (
    <section class="animal-card__block">
      <h3 class="animal-card__heading">{title}</h3>
      {children}
    </section>
  );
}

/** Animal links first, then global map links (duplicates by url are skipped). */
function mapLinks(own: readonly Link[]): Link[] {
  const seen = new Set<string>();
  const out: Link[] = [];
  for (const link of [...own, ...meta.globalMapLinks]) {
    if (seen.has(link.url)) continue;
    seen.add(link.url);
    out.push(link);
  }
  return out;
}

/** SPEC 9.8: animal card. */
export function AnimalScreen({ id }: AnimalScreenProps) {
  const animal = animalsById.get(id);
  if (!animal) return <NotFound />;

  const legendary = animal.type === 'legendary';
  const mats = materialsByAnimal.get(animal.id) ?? [];
  const needs = needsForScope('all', state.value);
  const links = mapLinks(animal.links);

  return (
    <div class="screen animal-screen">
      <PaperCard as="article" class="animal-card" title={animal.nameEn}>
        <div class="animal-card__meta">
          <span class="animal-card__type">
            <AnimalTypeIcon type={animal.type} size={20} />
            {animalTypeLabel[animal.type]}
          </span>
          <span class="animal-card__size">Size: {sizeLabel[animal.size]}</span>
        </div>
        {(animal.danger !== 'safe' || animal.availability === 'epilogue') && (
          <div class="animal-card__badges">
            <DangerBadge danger={animal.danger} />
            {animal.availability === 'epilogue' && <EpilogueBadge />}
          </div>
        )}
        {animal.availabilityNoteEn && <p class="animal-card__note">{animal.availabilityNoteEn}</p>}

        {(animal.habitatEn || animal.regions.length > 0) && (
          <Block title="Where to find">
            {animal.habitatEn && <p>{animal.habitatEn}</p>}
            {animal.regions.length > 0 && (
              <div class="animal-card__regions">
                {animal.regions.map((r) => (
                  <span key={r} class="tag">
                    {regionsById.get(r)?.nameEn ?? r}
                  </span>
                ))}
              </div>
            )}
          </Block>
        )}
        {animal.perfectKillEn && (
          <Block title={legendary ? 'Tactics' : 'How to get a perfect pelt'}>
            <p>{animal.perfectKillEn}</p>
          </Block>
        )}
        {animal.behaviorEn && (
          <Block title="Behavior and tips">
            <p>{animal.behaviorEn}</p>
          </Block>
        )}
        {legendary && animal.unlockEn && (
          <Block title="When available">
            <p>{animal.unlockEn}</p>
          </Block>
        )}
        {links.length > 0 && (
          <Block title="Maps and guides">
            <div class="animal-card__links">
              {links.map((link) => (
                <ExternalLink key={link.url} href={link.url} variant="button">
                  {link.labelEn}
                </ExternalLink>
              ))}
            </div>
          </Block>
        )}
      </PaperCard>

      {mats.length > 0 && (
        <section class="animal-materials">
          <SectionHeader title="Materials from this animal" />
          <div class="animal-materials__list">
            {mats.map((m) => (
              <MaterialRow
                key={m.id}
                materialId={m.id}
                need={needs.byMaterial.get(m.id)?.need ?? 0}
                note={m.sourceEn}
                usedIn={itemsByMaterial.get(m.id) ?? []}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
