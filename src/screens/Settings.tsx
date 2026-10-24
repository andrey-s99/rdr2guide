import { EmptyState } from '../components/EmptyState';

export function Settings() {
  return (
    <div class="screen">
      <h2 class="screen-title">Настройки</h2>
      <EmptyState icon="settings" text="Раздел появится в следующей версии" />
    </div>
  );
}
