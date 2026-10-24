import { CheckIcon, LockIcon } from '../icons';
import type { ItemStatus } from '../logic/calc';

export interface StatusBadgeProps {
  status: ItemStatus;
  /** Units missing (shown for 'missing' as «Не хватает N»). */
  missing?: number;
  class?: string;
}

/** Item status (SPEC 7.2): «Сделано» / «Готово к крафту» / «Не хватает N». */
export function StatusBadge({ status, missing = 0, class: cls }: StatusBadgeProps) {
  const extra = cls ? ` ${cls}` : '';
  if (status === 'crafted') {
    return (
      <span class={`badge badge--ok status-badge${extra}`}>
        <CheckIcon size={14} strokeWidth={2} />
        Сделано
      </span>
    );
  }
  if (status === 'ready') {
    return <span class={`badge badge--brass status-badge${extra}`}>Готово к крафту</span>;
  }
  return (
    <span
      class={`badge status-badge status-badge--missing${extra}`}
    >{`Не хватает ${missing}`}</span>
  );
}

export interface LockBadgeProps {
  /** Crafted prerequisites. */
  done: number;
  /** All prerequisites. */
  total: number;
  class?: string;
}

/** Informational lock marker (SPEC 7.2): prerequisites not crafted yet. */
export function LockBadge({ done, total, class: cls }: LockBadgeProps) {
  return (
    <span
      class={cls ? `badge badge--warn lock-badge ${cls}` : 'badge badge--warn lock-badge'}
      title="Сначала изготовьте другие предметы"
    >
      <LockIcon size={14} />
      {`Сначала другие ${done}/${total}`}
    </span>
  );
}
