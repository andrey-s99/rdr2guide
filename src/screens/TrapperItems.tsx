import { EmptyState } from '../components/EmptyState';

export function TrapperItems() {
  return (
    <div class="screen">
      <h2 class="screen-title">Предметы Охотника</h2>
      <EmptyState icon="coat" text="Раздел появится в следующей версии" />
    </div>
  );
}
