import type { ComponentChildren } from 'preact';
import { ChevronIcon, Icon } from '../icons';

export interface SectionHeaderProps {
  title: string;
  /** Icon name from src/icons (e.g. category.icon). */
  icon?: string;
  /** Right-side text, e.g. «сделано 3 из 12». */
  extra?: ComponentChildren;
  /** When provided, the header becomes a toggle button for a collapsible group. */
  open?: boolean;
  onToggle?: () => void;
  /** id of the controlled region (for aria-controls). */
  controls?: string;
}

export function SectionHeader({
  title,
  icon,
  extra,
  open,
  onToggle,
  controls,
}: SectionHeaderProps) {
  const content = (
    <>
      {icon && (
        <span class="section-header__icon">
          <Icon name={icon} size={20} />
        </span>
      )}
      <span class="section-header__title">{title}</span>
      {extra !== undefined && <span class="section-header__extra">{extra}</span>}
      {onToggle && <ChevronIcon direction="down" size={18} class="section-header__chevron" />}
    </>
  );
  if (onToggle) {
    return (
      <h3>
        <button
          type="button"
          class="section-header"
          aria-expanded={open ?? true}
          aria-controls={controls}
          onClick={onToggle}
        >
          {content}
        </button>
      </h3>
    );
  }
  return <h3 class="section-header">{content}</h3>;
}
