import { ItemRow } from '../components/ItemRow';
import { itemsByCategory } from '../data';
import { SummaryButton, VendorInfoLink, VendorListScreen } from './VendorList';

/** Fence → Trinkets (SPEC 9.6). */
export function FenceTrinkets() {
  const items = itemsByCategory.get('trinket') ?? [];
  return (
    <VendorListScreen
      screenKey="fence-trinkets"
      title="Trinkets"
      items={items}
      icon="trinket"
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
