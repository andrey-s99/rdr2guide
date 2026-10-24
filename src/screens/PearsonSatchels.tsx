import { ItemRow } from '../components/ItemRow';
import { itemsByCategory } from '../data';
import { PearsonTop } from './PearsonTop';
import { PrerequisitesDone, SummaryButton, VendorListScreen } from './VendorList';

/** Пирсон → Сумки (SPEC 9.5). */
export function PearsonSatchels() {
  const items = itemsByCategory.get('satchel') ?? [];
  return (
    <VendorListScreen
      screenKey="pearson-satchels"
      title="Сумки"
      items={items}
      icon="satchel"
      top={<PearsonTop />}
      renderList={(list) => (
        <div class="list">
          {list.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              note={item.requirementRu}
              extra={<PrerequisitesDone item={item} />}
            />
          ))}
        </div>
      )}
      bottom={<SummaryButton scope="pearson" label="Сводка по Пирсону" />}
    />
  );
}
