import type { ComponentChildren } from 'preact';
import { ExternalIcon } from '../icons';

export interface ExternalLinkProps {
  href: string;
  children: ComponentChildren;
  /** 'button' — outlined button (links block), 'inline' — text link. */
  variant?: 'button' | 'inline';
  class?: string;
}

/** Link that opens in the external browser (SPEC 9.8), with an "external" icon. */
export function ExternalLink({
  href,
  children,
  variant = 'inline',
  class: cls,
}: ExternalLinkProps) {
  const base = variant === 'button' ? 'btn btn--secondary ext-link ext-link--button' : 'ext-link';
  return (
    <a class={cls ? `${base} ${cls}` : base} href={href} target="_blank" rel="noopener">
      <span class="ext-link__text">{children}</span>
      <ExternalIcon size={16} />
      <span class="visually-hidden"> (откроется в браузере)</span>
    </a>
  );
}
