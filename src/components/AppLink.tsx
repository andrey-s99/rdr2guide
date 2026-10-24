import type { ComponentChildren, TargetedMouseEvent } from 'preact';
import { navigate } from '../router';

export interface AppLinkProps {
  /** In-app path like '/item/beaver_hat' (without '#'). */
  to: string;
  class?: string;
  id?: string;
  'aria-label'?: string;
  'aria-current'?: 'page' | 'true';
  onClick?: (e: TargetedMouseEvent<HTMLAnchorElement>) => void;
  children?: ComponentChildren;
}

/** Hash link that navigates through the router (keeps scroll/history handling consistent). */
export function AppLink({ to, children, onClick, ...rest }: AppLinkProps) {
  return (
    <a
      {...rest}
      href={'#' + to}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}
