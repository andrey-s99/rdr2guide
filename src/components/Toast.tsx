import { toast, undoToast } from '../state/undo';

/** Undo toast shown above the bottom navigation (SPEC 9.10). */
export function Toast() {
  const t = toast.value;
  return (
    <div class="toast-region" role="status" aria-live="polite">
      {t && (
        <div class="toast" key={t.id}>
          <div class="toast__body">
            <div class="toast__title">{t.title}</div>
            {t.detail && <div class="toast__detail">{t.detail}</div>}
          </div>
          {t.undo && (
            <button type="button" class="toast__undo" onClick={undoToast}>
              Отменить
            </button>
          )}
        </div>
      )}
    </div>
  );
}
