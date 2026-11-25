import { useState } from 'preact/hooks';
import { stockLabel } from '../data';
import type { VendorId } from '../data/types';
import { MinusIcon, PlusIcon } from '../icons';
import { clampStock, STOCK_MAX, STOCK_MIN, stockOf, vendorStock } from '../logic/calc';
import { setStock, state } from '../state/store';

export interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  /** Subject for aria-labels, e.g. "Beaver" → "Decrease: Beaver". */
  label: string;
  min?: number;
  max?: number;
  class?: string;
}

/** − / number / + control. Typed values commit on blur or Enter (Escape reverts). */
export function NumberStepper({
  value,
  onChange,
  label,
  min = STOCK_MIN,
  max = STOCK_MAX,
  class: cls,
}: NumberStepperProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.trunc(v)));
  const commit = () => {
    if (draft === null) return;
    const parsed = Number.parseInt(draft, 10);
    setDraft(null);
    if (Number.isFinite(parsed)) {
      const next = clamp(parsed);
      if (next !== value) onChange(next);
    }
  };
  return (
    <div
      class={cls ? `stepper ${cls}` : 'stepper'}
      role="group"
      aria-label={`Stock: ${label}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        class="stepper__btn"
        aria-label={`Decrease: ${label}`}
        disabled={value <= min}
        onClick={() => onChange(clamp(value - 1))}
      >
        <MinusIcon size={20} />
      </button>
      <input
        class="stepper__input"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={String(max).length}
        aria-label={`Amount: ${label}`}
        value={draft ?? String(value)}
        onFocus={(e) => (e.currentTarget as HTMLInputElement).select()}
        onInput={(e) => {
          const el = e.currentTarget as HTMLInputElement;
          const digits = el.value.replace(/\D+/g, '');
          if (digits !== el.value) el.value = digits;
          setDraft(digits);
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commit();
            (e.currentTarget as HTMLInputElement).blur();
          } else if (e.key === 'Escape') {
            setDraft(null);
            (e.currentTarget as HTMLInputElement).blur();
          }
        }}
      />
      <button
        type="button"
        class="stepper__btn"
        aria-label={`Increase: ${label}`}
        disabled={value >= max}
        onClick={() => onChange(clamp(value + 1))}
      >
        <PlusIcon size={20} />
      </button>
    </div>
  );
}

export interface StepperProps {
  /** Whose stock: what was sold to the Trapper, donated to Pearson, or kept for the Fence. */
  vendorId: VendorId;
  materialId: string;
  /** Name for aria-labels; defaults to the short material name (plus vendor if shared). */
  label?: string;
  class?: string;
}

/** Stock stepper for a material of one vendor (0..999), bound to the store. */
export function Stepper({ vendorId, materialId, label, class: cls }: StepperProps) {
  const value = stockOf(vendorStock(state.value.stock, vendorId), materialId);
  return (
    <NumberStepper
      class={cls}
      value={value}
      label={label ?? stockLabel(vendorId, materialId)}
      onChange={(v) => setStock(vendorId, materialId, clampStock(v))}
    />
  );
}
