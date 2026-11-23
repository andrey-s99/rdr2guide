import { AppLink } from '../components/AppLink';
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
    { label: 'Outfits', to: '/trapper/outfits' },
    { label: 'Items', to: '/trapper/items' },
  ],
  fence: [
    { label: 'Trinkets', to: '/fence/trinkets' },
    { label: 'Talismans', to: '/fence/talismans' },
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
      entry.usedIn.push(item.nameEn);
      byId.set(materialId, entry);
    }
  }
  return [...byId.values()];
}

/** About a vendor `#/vendor/<id>` (SPEC 9.11). */
export function VendorScreen({ id }: VendorScreenProps) {
  const vendor = vendorsById.get(id as VendorId);
  if (!vendor) return <NotFound />;
  const { done, total } = craftedProgress(itemsByVendor.get(vendor.id) ?? [], state.value.crafted);
  const specials = specialIngredients(vendor.id);
  const links: SubLink[] = [
    ...SUB_LINKS[vendor.id],
    { label: 'Vendor summary', to: `/summary?scope=${vendor.id}` },
  ];

  return (
    <div class="screen">
      <PaperCard as="article" title={vendor.nameEn}>
        <div class="vendor-page">
          <ProgressBar value={done} max={total} label={`Crafted ${done} of ${total}`} />
          {vendor.locationsEn.length > 0 && (
            <section class="vendor-page__block">
              <h3 class="vendor-page__heading">Where to find</h3>
              <ul class="vendor-page__list">
                {vendor.locationsEn.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            </section>
          )}
          {vendor.rulesEn.length > 0 && (
            <section class="vendor-page__block">
              <h3 class="vendor-page__heading">How it works</h3>
              <ul class="vendor-page__list">
                {vendor.rulesEn.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            </section>
          )}
          {specials.length > 0 && (
            <section class="vendor-page__block">
              <h3 class="vendor-page__heading">Items not from hunting</h3>
              <ul class="vendor-page__list">
                {specials.map(({ material, usedIn }) => (
                  <li key={material.id}>
                    <strong>{material.nameEn}</strong> (for: {usedIn.join(', ')}).{' '}
                    {material.sourceEn}
                  </li>
                ))}
              </ul>
            </section>
          )}
          <nav class="vendor-page__links" aria-label="Vendor sections">
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
