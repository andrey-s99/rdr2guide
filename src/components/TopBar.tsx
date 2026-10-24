import type { ComponentChildren } from 'preact';
import { BackIcon, SearchIcon, SettingsIcon, StarIcon } from '../icons';
import { navigate } from '../router';

export interface TopBarProps {
  /** Section title (Ruslan Display) or, with `onBack`, a small screen label. */
  title: string;
  /** When set, a back button is shown instead of the section title. */
  onBack?: () => void;
  /** Number of goals shown on the star badge (hidden when 0). */
  goalsCount: number;
  /** Optional custom content replacing the title (e.g. a search field). */
  children?: ComponentChildren;
}

export function TopBar({ title, onBack, goalsCount, children }: TopBarProps) {
  return (
    <header class="app-header">
      <div class={`app-header__inner column${onBack ? ' app-header__inner--back' : ''}`}>
        <div class="app-header__lead">
          {onBack && (
            <button type="button" class="icon-btn" aria-label="Назад" onClick={onBack}>
              <BackIcon />
            </button>
          )}
          {children ??
            (onBack ? (
              <span class="app-header__subtitle">{title}</span>
            ) : (
              <h1 class="app-header__title">{title}</h1>
            ))}
        </div>
        <nav class="app-header__actions" aria-label="Быстрые действия">
          <button
            type="button"
            class="icon-btn"
            aria-label="Поиск"
            onClick={() => navigate('/search')}
          >
            <SearchIcon />
          </button>
          <button
            type="button"
            class="icon-btn"
            aria-label={goalsCount > 0 ? `Цели: ${goalsCount}` : 'Цели'}
            onClick={() => navigate('/summary?scope=goals')}
          >
            <StarIcon filled={goalsCount > 0} class={goalsCount > 0 ? 'text-brass' : undefined} />
            {goalsCount > 0 && (
              <span class="count-badge" aria-hidden="true">
                {goalsCount > 99 ? '99+' : goalsCount}
              </span>
            )}
          </button>
          <button
            type="button"
            class="icon-btn"
            aria-label="Настройки"
            onClick={() => navigate('/settings')}
          >
            <SettingsIcon />
          </button>
        </nav>
      </div>
    </header>
  );
}
