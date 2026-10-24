import type { ComponentChildren } from 'preact';
import { useLayoutEffect } from 'preact/hooks';
import {
  activeTab,
  buildPath,
  goBack,
  navigate,
  type Route,
  type RouteName,
  type SectionTab,
  sectionOf,
  takeScrollTarget,
} from '../router';
import { BottomNav } from './BottomNav';
import { ConfirmHost } from './ConfirmDialog';
import { type SegmentOption, SegmentedControl } from './SegmentedControl';
import { TopBar } from './TopBar';

export const SECTION_TITLES: Record<SectionTab, string> = {
  trapper: 'Охотник',
  pearson: 'Пирсон',
  fence: 'Скупщик',
  animals: 'Звери',
  summary: 'Сводка',
};

/** Labels shown next to the back button on non-section screens. */
const SCREEN_LABELS: Partial<Record<RouteName, string>> = {
  item: 'Предмет',
  outfit: 'Костюм',
  animal: 'Зверь',
  vendor: 'Торговец',
  search: 'Поиск',
  settings: 'Настройки',
};

export type AnimalsTab = 'regular' | 'legendary' | 'birds';

export const ANIMAL_TABS: SegmentOption<AnimalsTab>[] = [
  { value: 'regular', label: 'Обычные' },
  { value: 'legendary', label: 'Легендарные' },
  { value: 'birds', label: 'Птицы' },
];

export function animalsTabOf(route: Route): AnimalsTab {
  const t = route.query.tab;
  return t === 'legendary' || t === 'birds' ? t : 'regular';
}

/** Sub-section switchers: option value is the target path. */
const SUBNAV: Partial<Record<SectionTab, { label: string; options: SegmentOption<string>[] }>> = {
  trapper: {
    label: 'Подразделы Охотника',
    options: [
      { value: '/trapper/outfits', label: 'Костюмы' },
      { value: '/trapper/items', label: 'Предметы' },
    ],
  },
  pearson: {
    label: 'Подразделы Пирсона',
    options: [
      { value: '/pearson/satchels', label: 'Сумки' },
      { value: '/pearson/camp', label: 'Лагерь' },
    ],
  },
  fence: {
    label: 'Подразделы Скупщика',
    options: [
      { value: '/fence/trinkets', label: 'Безделушки' },
      { value: '/fence/talismans', label: 'Талисманы' },
    ],
  },
};

function SubNav({ route, section }: { route: Route; section: SectionTab }) {
  if (section === 'animals') {
    return (
      <SegmentedControl
        ariaLabel="Виды зверей"
        options={ANIMAL_TABS}
        value={animalsTabOf(route)}
        onChange={(tab) => navigate(buildPath('/animals', { ...route.query, tab }))}
      />
    );
  }
  const def = SUBNAV[section];
  if (!def) return null;
  return (
    <SegmentedControl
      ariaLabel={def.label}
      options={def.options}
      value={route.path}
      onChange={(path) => navigate(path)}
    />
  );
}

export interface AppShellProps {
  route: Route;
  goalsCount: number;
  /** Rendered above the bottom navigation (undo toast). */
  toast?: ComponentChildren;
  children: ComponentChildren;
}

export function AppShell({ route, goalsCount, toast, children }: AppShellProps) {
  const section = sectionOf(route.name);
  const tab = activeTab.value;

  // Restore (back/forward) or reset (new navigation) scroll after the screen rendered.
  useLayoutEffect(() => {
    window.scrollTo(0, takeScrollTarget(route.key));
  }, [route.key]);

  return (
    <div class="app">
      <TopBar
        title={section ? SECTION_TITLES[section] : (SCREEN_LABELS[route.name] ?? '')}
        onBack={section ? undefined : goBack}
        goalsCount={goalsCount}
      />
      <main class="app-main" id="main">
        {section && section !== 'summary' && (
          <div class="app-subnav">
            <div class="column">
              <SubNav route={route} section={section} />
            </div>
          </div>
        )}
        <div class="column">{children}</div>
      </main>
      <div class="toast-slot" aria-live="polite">
        {toast}
      </div>
      <BottomNav active={tab} />
      <ConfirmHost />
    </div>
  );
}
