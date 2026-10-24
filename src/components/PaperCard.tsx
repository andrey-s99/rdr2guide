import type { ComponentChildren } from 'preact';

export interface PaperCardProps {
  /** Centered title with ornamental rules (Ruslan Display). */
  title?: ComponentChildren;
  /** Small line under the title, e.g. English name. */
  subtitle?: ComponentChildren;
  /** Muted look, e.g. for a completed outfit. */
  muted?: boolean;
  /** Makes the whole card a link (hash href like '#/outfit/x'). */
  href?: string;
  /** Root element tag when not a link. */
  as?: 'section' | 'article' | 'div';
  class?: string;
  children?: ComponentChildren;
}

/** Old-catalogue "page": textured paper, double brass frame (SPEC 10.3). */
export function PaperCard({
  title,
  subtitle,
  muted,
  href,
  as = 'section',
  class: cls,
  children,
}: PaperCardProps) {
  const classes = ['paper-card', muted && 'paper-card--muted', href && 'paper-card--link', cls]
    .filter(Boolean)
    .join(' ');
  const head =
    title || subtitle ? (
      <header class="paper-card__head">
        {title && (
          <h2 class="paper-card__title">
            <span>{title}</span>
          </h2>
        )}
        {subtitle && <p class="paper-card__subtitle">{subtitle}</p>}
      </header>
    ) : null;
  if (href) {
    return (
      <a class={classes} href={href}>
        {head}
        {children}
      </a>
    );
  }
  const Tag = as;
  return (
    <Tag class={classes}>
      {head}
      {children}
    </Tag>
  );
}
