import type { StatusFilter } from '../logic/filters';

export type { StatusFilter } from '../logic/filters';

export interface ChipOption<T extends string> {
  value: T;
  label: string;
  /** Optional counter shown after the label. */
  count?: number;
}

interface CommonProps<T extends string> {
  options: ChipOption<T>[];
  ariaLabel: string;
  /** Single horizontally scrolling row instead of wrapping. */
  scroll?: boolean;
  class?: string;
}

export interface SingleChipsProps<T extends string> extends CommonProps<T> {
  multiple?: false;
  value: T;
  onChange: (value: T) => void;
}

/** Multi-select: empty selection means "all". */
export interface MultiChipsProps<T extends string> extends CommonProps<T> {
  multiple: true;
  value: T[];
  onChange: (value: T[]) => void;
}

export type FilterChipsProps<T extends string> = SingleChipsProps<T> | MultiChipsProps<T>;

export const STATUS_FILTER_OPTIONS: ChipOption<StatusFilter>[] = [
  { value: 'all', label: 'Все' },
  { value: 'not_crafted', label: 'Не сделано' },
  { value: 'ready', label: 'Готово к крафту' },
  { value: 'crafted', label: 'Сделано' },
];

export const DEFAULT_STATUS_FILTER: StatusFilter = 'not_crafted';

export function FilterChips<T extends string>(props: FilterChipsProps<T>) {
  const { options, ariaLabel, scroll, class: cls } = props;
  const isSelected = (v: T) => (props.multiple ? props.value.includes(v) : props.value === v);
  const toggle = (v: T) => {
    if (props.multiple) {
      const next = props.value.includes(v)
        ? props.value.filter((x) => x !== v)
        : [...props.value, v];
      props.onChange(next);
    } else {
      props.onChange(v);
    }
  };
  const classes = ['chips', scroll && 'chips--scroll', cls].filter(Boolean).join(' ');
  return (
    <div class={classes} role="group" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          class="chip"
          aria-pressed={isSelected(opt.value)}
          onClick={() => toggle(opt.value)}
        >
          {opt.label}
          {opt.count !== undefined && <span class="chip__count">{opt.count}</span>}
        </button>
      ))}
    </div>
  );
}
