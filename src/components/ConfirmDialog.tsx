import { signal } from '@preact/signals';
import type { ComponentChildren } from 'preact';
import { useEffect, useId, useRef } from 'preact/hooks';

export interface ConfirmOptions {
  title: string;
  body?: ComponentChildren;
  /** Default «Да». */
  confirmLabel?: string;
  /** Default «Отмена». */
  cancelLabel?: string;
  /** Destructive action: red confirm button, initial focus on «Отмена». */
  danger?: boolean;
}

export interface ConfirmDialogProps extends ConfirmOptions {
  onConfirm: () => void;
  onCancel: () => void;
  children?: ComponentChildren;
}

/** Accessible modal (role=dialog, aria-modal, Escape/backdrop cancel, focus trap). */
export function ConfirmDialog({
  title,
  body,
  children,
  confirmLabel = 'Да',
  cancelLabel = 'Отмена',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);
  const confirmBtn = useRef<HTMLButtonElement>(null);
  const cancelBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    (danger ? cancelBtn : confirmBtn).current?.focus();
    return () => {
      if (previous && document.contains(previous)) previous.focus();
    };
  }, [danger]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
      return;
    }
    if (e.key !== 'Tab' || !panel.current) return;
    const focusable = Array.from(
      panel.current.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea'),
    ).filter((el) => !el.hasAttribute('disabled'));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const content = children ?? body;
  return (
    <div class="dialog-layer" onClick={onCancel} onKeyDown={onKeyDown}>
      <div
        ref={panel}
        class="paper-card dialog-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={content ? `${id}-body` : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 class="dialog-panel__title" id={`${id}-title`}>
          {title}
        </h2>
        {content && (
          <div class="dialog-panel__body" id={`${id}-body`}>
            {content}
          </div>
        )}
        <div class="dialog__actions">
          <button ref={cancelBtn} type="button" class="btn btn--secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            ref={confirmBtn}
            type="button"
            class={danger ? 'btn btn--danger-fill' : 'btn btn--primary'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

interface PendingConfirm {
  id: number;
  options: ConfirmOptions;
  resolve: (ok: boolean) => void;
}

const pending = signal<PendingConfirm | null>(null);
let nextId = 1;

/**
 * Opens the shared confirmation dialog (rendered by <ConfirmHost/> in AppShell).
 * Resolves true on confirm, false on cancel. A new call cancels the previous one.
 */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  pending.value?.resolve(false);
  return new Promise<boolean>((resolve) => {
    pending.value = { id: nextId++, options, resolve };
  });
}

function settle(ok: boolean): void {
  const p = pending.value;
  if (!p) return;
  pending.value = null;
  p.resolve(ok);
}

/** Renders the dialog requested via confirm(). Mount once (AppShell). */
export function ConfirmHost() {
  const p = pending.value;
  if (!p) return null;
  return (
    <ConfirmDialog
      key={p.id}
      {...p.options}
      onConfirm={() => settle(true)}
      onCancel={() => settle(false)}
    />
  );
}
