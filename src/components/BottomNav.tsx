import type { FunctionComponent } from 'preact';
import { HatIcon, type IconProps, LedgerIcon, PawIcon, TrinketIcon } from '../icons';
import { navigate, type SectionTab, tabPath } from '../router';

interface TabDef {
  id: SectionTab;
  label: string;
  icon: FunctionComponent<IconProps>;
}

export const TABS: TabDef[] = [
  { id: 'trapper', label: 'Охотник', icon: HatIcon },
  { id: 'fence', label: 'Скупщик', icon: TrinketIcon },
  { id: 'animals', label: 'Звери', icon: PawIcon },
  { id: 'summary', label: 'Сводка', icon: LedgerIcon },
];

export interface BottomNavProps {
  active: SectionTab;
}

export function BottomNav({ active }: BottomNavProps) {
  return (
    <nav class="app-nav" aria-label="Разделы">
      <ul class="app-nav__list column">
        {TABS.map(({ id, label, icon: Icon }) => (
          <li key={id}>
            <a
              class="nav-tab"
              href={'#' + tabPath(id)}
              aria-current={active === id ? 'page' : undefined}
              onClick={(e) => {
                e.preventDefault();
                navigate(tabPath(id));
              }}
            >
              <span class="nav-tab__icon">
                <Icon size={22} />
              </span>
              <span class="nav-tab__label">{label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
