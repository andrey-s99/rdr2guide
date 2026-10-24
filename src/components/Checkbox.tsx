import { itemsById } from '../data';
import { CheckIcon } from '../icons';
import { isCrafted } from '../logic/calc';
import { state, toggleCrafted } from '../state/store';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Accessible name, e.g. «Изготовлено: Шляпа из бобра». */
  label: string;
  class?: string;
}

/** «Изготовлено» checkbox: real input in a 44×44 hit area, pen-stroke check (SPEC 10.3). */
export function Checkbox({ checked, onChange, label, class: cls }: CheckboxProps) {
  return (
    <label
      class={cls ? `hit craft-check ${cls}` : 'hit craft-check'}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        checked={checked}
        aria-label={label}
        onChange={(e) => onChange((e.currentTarget as HTMLInputElement).checked)}
      />
      <span class="craft-box" aria-hidden="true">
        <CheckIcon strokeWidth={2.2} />
      </span>
    </label>
  );
}

export interface CraftCheckboxProps {
  itemId: string;
  class?: string;
}

/** Checkbox bound to an item's crafted state; toggles via the store (with undo toast). */
export function CraftCheckbox({ itemId, class: cls }: CraftCheckboxProps) {
  const checked = isCrafted(itemId, state.value.crafted);
  const name = itemsById.get(itemId)?.nameRu ?? itemId;
  return (
    <Checkbox
      class={cls}
      checked={checked}
      label={`Изготовлено: ${name}`}
      onChange={() => toggleCrafted(itemId)}
    />
  );
}
