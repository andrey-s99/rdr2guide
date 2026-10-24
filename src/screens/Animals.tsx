import type { AnimalsTab } from '../components/AppShell';
import { EmptyState } from '../components/EmptyState';

const TITLES: Record<AnimalsTab, string> = {
  regular: 'Обычные звери',
  legendary: 'Легендарные звери',
  birds: 'Птицы',
};

const ICONS: Record<AnimalsTab, string> = { regular: 'paw', legendary: 'legendary', birds: 'bird' };

export interface AnimalsProps {
  tab: AnimalsTab;
}

export function Animals({ tab }: AnimalsProps) {
  return (
    <div class="screen">
      <h2 class="screen-title">{TITLES[tab]}</h2>
      <EmptyState icon={ICONS[tab]} text="Раздел появится в следующей версии" />
    </div>
  );
}
