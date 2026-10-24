export interface ProgressBarProps {
  value: number;
  max: number;
  /** Visible caption above the bar, e.g. «Изготовлено 3 из 12». */
  label?: string;
  /** Accessible name when there is no visible label. */
  ariaLabel?: string;
  /** Bar color: brass by default, 'ok' — green; 'auto' — green when complete. */
  tone?: 'brass' | 'ok' | 'auto';
  class?: string;
}

export function ProgressBar({
  value,
  max,
  label,
  ariaLabel,
  tone = 'auto',
  class: cls,
}: ProgressBarProps) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const ok = tone === 'ok' || (tone === 'auto' && max > 0 && value >= max);
  const bar = (
    <div
      class={ok ? 'progress progress--ok' : 'progress'}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label ?? ariaLabel}
    >
      <div class="progress__bar" style={{ transform: `scaleX(${ratio})` }} />
    </div>
  );
  if (!label) return cls ? <div class={cls}>{bar}</div> : bar;
  return (
    <div class={cls ? `progress-block ${cls}` : 'progress-block'}>
      <div class="progress-block__label">{label}</div>
      {bar}
    </div>
  );
}
