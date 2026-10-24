import { ItemRow } from '../components/ItemRow';
import { itemsByCategory } from '../data';
import { SummaryButton, VendorInfoLink, VendorListScreen } from './VendorList';

/** Скупщик → Талисманы (SPEC 9.6). */
export function FenceTalismans() {
  const items = itemsByCategory.get('talisman') ?? [];
  return (
    <VendorListScreen
      screenKey="fence-talismans"
      title="Талисманы"
      items={items}
      icon="talisman"
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
