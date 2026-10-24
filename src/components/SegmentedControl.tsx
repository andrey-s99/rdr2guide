export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible name of the group, in Russian. */
  ariaLabel: string;
  /** 'tabs' — underlined sub-section switcher; 'boxed' — compact in-content switcher. */
  variant?: 'tabs' | 'boxed';
  class?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  variant = 'tabs',
  class: cls,
}: SegmentedControlProps<T>) {
  const classes = ['segmented', variant === 'boxed' && 'segmented--boxed', cls]
    .filter(Boolean)
    .join(' ');
  return (
    <div class={classes} role="tablist" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          class="segmented__option"
          aria-selected={opt.value === value}
          tabIndex={opt.value === value ? 0 : -1}
          onClick={() => onChange(opt.value)}
          onKeyDown={(e) => {
            if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
            const i = options.findIndex((o) => o.value === value);
            const step = e.key === 'ArrowRight' ? 1 : -1;
            const next = options[(i + step + options.length) % options.length];
            onChange(next.value);
            const parent = (e.currentTarget as HTMLElement).parentElement;
            requestAnimationFrame(() =>
              parent?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus(),
            );
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
