import { useState } from 'preact/hooks';
import type { Item } from '../data/types';
import { WarningIcon } from '../icons';

type Confidence = Item['dataConfidence'];

const CONFIDENCE_TITLE: Record<Exclude<Confidence, 'high'>, string> = {
  medium: 'Источники расходятся',
  low: 'Данные из одного источника',
};

export interface DataWarningProps {
  confidence: Confidence;
  /** Explanation (item.dataNoteRu). */
  note: string;
  /** 'icon' — small warning button revealing the note; 'banner' — yellow plate (item card). */
  variant?: 'icon' | 'banner';
}

/** Disputed-data marker for dataConfidence medium/low (SPEC 6.1, 9.4). Renders nothing for high. */
export function DataWarning({ confidence, note, variant = 'icon' }: DataWarningProps) {
  const [open, setOpen] = useState(false);
  if (confidence === 'high') return null;
  const title = CONFIDENCE_TITLE[confidence];
  if (variant === 'banner') {
    return (
      <div class="notice data-warning-banner" role="note">
        <WarningIcon size={22} />
        <div>
          <div class="notice__title">Данные спорные: {title.toLowerCase()}</div>
          {note && <p class="notice__text">{note}</p>}
        </div>
      </div>
    );
  }
  return (
    <>
      <button
        type="button"
        class="data-warning"
        aria-label={`Данные спорные: ${title.toLowerCase()}`}
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen(!open);
        }}
      >
        <WarningIcon size={16} />
      </button>
      {open && (
        <span class="data-warning__note" role="note">
          <strong>{title}.</strong> {note}
        </span>
      )}
    </>
  );
}
