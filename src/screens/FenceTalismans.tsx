import { ItemRow } from '../components/ItemRow';
import { itemsByCategory } from '../data';
import { SummaryButton, VendorInfoLink, VendorListScreen } from './VendorList';

/** Fence → Talismans (SPEC 9.6). */
export function FenceTalismans() {
  const items = itemsByCategory.get('talisman') ?? [];
  return (
    <VendorListScreen
      screenKey="fence-talismans"
      title="Talismans"
      items={items}
      icon="talisman"
      top={<VendorInfoLink vendorId="fence" label="How the Fence works →" />}
      renderList={(list) => (
        <div class="list">
          {list.map((item) => (
            <ItemRow key={item.id} item={item} note={item.effectEn} showPrice={false} />
          ))}
        </div>
      )}
      bottom={<SummaryButton scope="fence" label="Fence summary" />}
    />
  );
}
