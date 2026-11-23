import { ItemRow } from '../components/ItemRow';
import { itemsByCategory } from '../data';
import { PrerequisitesDone, SummaryButton, VendorInfoLink, VendorListScreen } from './VendorList';

/** Pearson → Satchels (SPEC 9.5, camp upgrades left out). */
export function PearsonSatchels() {
  const items = itemsByCategory.get('satchel') ?? [];
  return (
    <VendorListScreen
      screenKey="pearson-satchels"
      title="Satchels"
      items={items}
      icon="satchel"
      top={
        <>
          <VendorInfoLink vendorId="pearson" label="How Pearson works →" />
          <p class="vendor-list__reminder">Pearson crafts until the end of Chapter 6</p>
        </>
      }
      renderList={(list) => (
        <div class="list">
          {list.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              note={item.effectEn}
              showPrice={false}
              extra={
                <>
                  {item.requirementEn && <p class="list-row__note">Unlock: {item.requirementEn}</p>}
                  <PrerequisitesDone item={item} />
                </>
              }
            />
          ))}
        </div>
      )}
      bottom={<SummaryButton scope="pearson" label="Pearson summary" />}
    />
  );
}
