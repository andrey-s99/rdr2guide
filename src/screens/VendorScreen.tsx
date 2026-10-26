import { AppLink } from '../components/AppLink';
import { EnName } from '../components/EnName';
import { PaperCard } from '../components/PaperCard';
import { ProgressBar } from '../components/ProgressBar';
import { itemsByVendor, materialsById, vendorsById } from '../data';
import type { Material, VendorId } from '../data/types';
import { ChevronIcon } from '../icons';
import { craftedProgress } from '../logic/calc';
import { state } from '../state/store';
import '../styles/screens/vendors.css';
import { NotFound } from './NotFound';

export interface VendorScreenProps {
  id: string;
}

interface SubLink {
  label: string;
  to: string;
}

const SUB_LINKS: Record<VendorId, SubLink[]> = {
  trapper: [
    { label: 'Костюмы', to: '/trapper/outfits' },
    { label: 'Предметы', to: '/trapper/items' },
  ],
  fence: [
    { label: 'Безделушки', to: '/fence/trinkets' },
    { label: 'Талисманы', to: '/fence/talismans' },
  ],
};

/** Non-hunting ingredients (kind `special`) used by the vendor's recipes, with the items they go into. */
function specialIngredients(vendorId: VendorId): { material: Material; usedIn: string[] }[] {
  const byId = new Map<string, { material: Material; usedIn: string[] }>();
  for (const item of itemsByVendor.get(vendorId) ?? []) {
    for (const { materialId } of item.recipe) {
      const material = materialsById.get(materialId);
      if (material?.kind !== 'special') continue;
      const entry = byId.get(materialId) ?? { material, usedIn: [] };
      entry.usedIn.push(item.nameRu);
      byId.set(materialId, entry);
    }
  }
  return [...byId.values()];
}

/** О торговце `#/vendor/<id>` (SPEC 9.11). */
export function VendorScreen({ id }: VendorScreenProps) {
  const vendor = vendorsById.get(id as VendorId);
  if (!vendor) return <NotFound />;
  const { done, total } = craftedProgress(itemsByVendor.get(vendor.id) ?? [], state.value.crafted);
  const specials = specialIngredients(vendor.id);
  const links: SubLink[] = [
    ...SUB_LINKS[vendor.id],
    { label: 'Сводка по торговцу', to: `/summary?scope=${vendor.id}` },
  ];

  return (
    <div class="screen">
      <PaperCard as="article" title={vendor.nameRu} subtitle={<EnName text={vendor.nameEn} />}>
        <div class="vendor-page">
          <ProgressBar value={done} max={total} label={`Изготовлено ${done} из ${total}`} />
          {vendor.locationsRu.length > 0 && (
            <section class="vendor-page__block">
              <h3 class="vendor-page__heading">Где найти</h3>
              <ul class="vendor-page__list">
                {vendor.locationsRu.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            </section>
          )}
          {vendor.rulesRu.length > 0 && (
            <section class="vendor-page__block">
              <h3 class="vendor-page__heading">Как работает</h3>
              <ul class="vendor-page__list">
                {vendor.rulesRu.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            </section>
          )}
          {specials.length > 0 && (
            <section class="vendor-page__block">
              <h3 class="vendor-page__heading">Вещи не с охоты</h3>
              <ul class="vendor-page__list">
                {specials.map(({ material, usedIn }) => (
                  <li key={material.id}>
                    <strong>{material.nameRu}</strong> (для: {usedIn.join(', ')}). {material.sourceRu}
                  </li>
                ))}
              </ul>
            </section>
          )}
          <nav class="vendor-page__links" aria-label="Разделы торговца">
            {links.map((l) => (
              <AppLink key={l.to} to={l.to} class="vendor-page__link">
                <span>{l.label}</span>
                <ChevronIcon direction="right" size={18} />
              </AppLink>
            ))}
          </nav>
        </div>
      </PaperCard>
    </div>
  );
}
