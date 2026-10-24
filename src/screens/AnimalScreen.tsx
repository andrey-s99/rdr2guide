import type { ComponentChildren } from 'preact';
import { AnimalTypeIcon, DangerBadge, EpilogueBadge } from '../components/AnimalRow';
import { EnName } from '../components/EnName';
import { ExternalLink } from '../components/ExternalLink';
import { MaterialRow } from '../components/MaterialRow';
import { PaperCard } from '../components/PaperCard';
import { SectionHeader } from '../components/SectionHeader';
import {
  animalTypeLabelRu,
  animalsById,
  itemsByMaterial,
  materialsByAnimal,
  meta,
  regionsById,
  sizeLabelRu,
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
      <PaperCard
        as="article"
        class="animal-card"
        title={animal.nameRu}
        subtitle={<EnName text={animal.nameEn} />}
      >
        <div class="animal-card__meta">
          <span class="animal-card__type">
            <AnimalTypeIcon type={animal.type} size={20} />
            {animalTypeLabelRu[animal.type]}
          </span>
          <span class="animal-card__size">Размер: {sizeLabelRu[animal.size]}</span>
        </div>
        {(animal.danger !== 'safe' || animal.availability === 'epilogue') && (
          <div class="animal-card__badges">
            <DangerBadge danger={animal.danger} />
            {animal.availability === 'epilogue' && <EpilogueBadge />}
          </div>
        )}
        {animal.availabilityNoteRu && <p class="animal-card__note">{animal.availabilityNoteRu}</p>}

        {(animal.habitatRu || animal.regions.length > 0) && (
          <Block title="Где искать">
            {animal.habitatRu && <p>{animal.habitatRu}</p>}
            {animal.regions.length > 0 && (
              <div class="animal-card__regions">
                {animal.regions.map((r) => (
                  <span key={r} class="tag">
                    {regionsById.get(r)?.nameRu ?? r}
                  </span>
                ))}
              </div>
            )}
          </Block>
        )}
        {animal.perfectKillRu && (
          <Block title={legendary ? 'Тактика' : 'Чем убивать для идеальной шкуры'}>
            <p>{animal.perfectKillRu}</p>
          </Block>
        )}
        {animal.behaviorRu && (
          <Block title="Повадки и советы">
            <p>{animal.behaviorRu}</p>
          </Block>
        )}
        {legendary && animal.unlockRu && (
          <Block title="Когда доступен">
            <p>{animal.unlockRu}</p>
          </Block>
        )}
        {links.length > 0 && (
          <Block title="Карты и гайды">
            <div class="animal-card__links">
              {links.map((link) => (
                <ExternalLink key={link.url} href={link.url} variant="button">
                  {link.labelRu}
                </ExternalLink>
              ))}
            </div>
          </Block>
        )}
      </PaperCard>

      {mats.length > 0 && (
        <section class="animal-materials">
          <SectionHeader title="Материалы с этого зверя" />
          <div class="animal-materials__list">
            {mats.map((m) => (
              <MaterialRow
                key={m.id}
                materialId={m.id}
                need={needs.byMaterial.get(m.id)?.need ?? 0}
                note={m.sourceRu}
                usedIn={itemsByMaterial.get(m.id) ?? []}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
