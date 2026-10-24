import { ItemRow } from '../components/ItemRow';
import { itemsByCategory } from '../data';
import { SummaryButton, VendorInfoLink, VendorListScreen } from './VendorList';

/** Скупщик → Безделушки (SPEC 9.6). */
export function FenceTrinkets() {
  const items = itemsByCategory.get('trinket') ?? [];
  return (
    <VendorListScreen
      screenKey="fence-trinkets"
      title="Безделушки"
      items={items}
      icon="trinket"
      top={<VendorInfoLink vendorId="fence" label="Как работает Скупщик →" />}
      renderList={(list) => (
        <div class="list">
          {list.map((item) => (
            <ItemRow key={item.id} item={item} note={item.effectRu} showPrice={false} />
          ))}
        </div>
      )}
      bottom={<SummaryButton scope="fence" label="Сводка по Скупщику" />}
    />
  );
}
