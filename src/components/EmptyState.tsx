import type { ComponentChildren } from 'preact';
import { Icon } from '../icons';

export interface EmptyStateProps {
  text: string;
  /** Optional icon name from src/icons. */
  icon?: string;
  /** Optional actions below the text. */
  children?: ComponentChildren;
}

export function EmptyState({ text, icon, children }: EmptyStateProps) {
  return (
    <div class="empty-state">
      {icon && (
        <span class="empty-state__icon">
          <Icon name={icon} size={40} strokeWidth={1.2} />
        </span>
      )}
      <p class="empty-state__text">{text}</p>
      {children}
    </div>
  );
}
