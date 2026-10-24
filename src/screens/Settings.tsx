import { useId, useRef, useState } from 'preact/hooks';
import { AppLink } from '../components/AppLink';
import { confirm } from '../components/ConfirmDialog';
import { EnName } from '../components/EnName';
import { ExternalLink } from '../components/ExternalLink';
import { type SegmentOption, SegmentedControl } from '../components/SegmentedControl';
import { disputedItems, meta } from '../data';
import type { UserState } from '../data/types';
import { backupFileName, parseBackup, serializeBackup } from '../state/persist';
import { importState, resetAll, setSettings, state } from '../state/store';
import '../styles/screens/settings.css';

type Theme = UserState['settings']['theme'];

const THEME_OPTIONS: SegmentOption<Theme>[] = [
  { value: 'night', label: 'Ночь' },
  { value: 'paper', label: 'Бумага' },
  { value: 'system', label: 'Как в системе' },
];

export const IMPORT_CONFIRM_TITLE = 'Заменить текущий прогресс данными из файла?';
export const IMPORT_DONE = 'Резервная копия загружена';
export const RESET_DONE = 'Прогресс сброшен';
export const RESET_FINAL_LABEL = 'Да, удалить всё';

/** Starts a browser download of the current state as a backup file (SPEC 11.2). */
export function downloadBackup(now: Date = new Date()): void {
  const blob = new Blob([serializeBackup(state.value, now)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = backupFileName(now);
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Reads a File as text (FileReader works everywhere, including older WebViews). */
export function readFileText(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.readAsText(file);
  });
}

type Status = { kind: 'ok' | 'error'; text: string } | null;

function sourceLabel(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

function DisputedList() {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const count = disputedItems.length;
  return (
    <div class="settings-disputed">
      <p>
        Предметов с пометкой «данные спорные»: <span class="num">{count}</span>
      </p>
      {count > 0 && (
        <>
          <button
            type="button"
            class="btn btn--secondary"
            aria-expanded={open}
            aria-controls={listId}
            onClick={() => setOpen(!open)}
          >
            {open ? 'Скрыть список' : 'Показать список'}
          </button>
          {open && (
            <ul id={listId} class="list settings-disputed__list">
              {disputedItems.map((item) => (
                <li key={item.id}>
                  <AppLink to={`/item/${item.id}`} class="list-row">
                    <span class="list-row__main">
                      <span class="list-row__title clamp-2">{item.nameRu}</span>
                      <EnName text={item.nameEn} />
                      {item.dataNoteRu && <span class="list-row__note">{item.dataNoteRu}</span>}
                    </span>
                  </AppLink>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

/** Settings screen (SPEC 9.13). */
export function Settings() {
  const { theme, showEnglish } = state.value.settings;
  const fileInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>(null);
  const englishId = useId();

  const onImportFile = async (input: HTMLInputElement) => {
    const file = input.files?.[0];
    input.value = ''; // allow choosing the same file again
    if (!file) return;
    let text: string;
    try {
      text = await readFileText(file);
    } catch {
      setStatus({ kind: 'error', text: 'Не удалось прочитать файл.' });
      return;
    }
    const parsed = parseBackup(text);
    if (!parsed.ok) {
      setStatus({ kind: 'error', text: `${parsed.error} Текущий прогресс не изменён.` });
      return;
    }
    const ok = await confirm({ title: IMPORT_CONFIRM_TITLE, confirmLabel: 'Заменить' });
    if (!ok) {
      setStatus(null);
      return;
    }
    importState(parsed.state);
    setStatus({ kind: 'ok', text: IMPORT_DONE });
  };

  const onReset = async () => {
    setStatus(null);
    const first = await confirm({
      title: 'Сбросить прогресс?',
      body: 'Отметки «изготовлено», запасы и цели будут удалены. Настройки останутся.',
      confirmLabel: 'Сбросить',
      danger: true,
    });
    if (!first) return;
    const second = await confirm({
      title: 'Удалить весь прогресс без возможности восстановления?',
      body: 'Если нужно, сначала сохраните резервную копию.',
      confirmLabel: RESET_FINAL_LABEL,
      danger: true,
    });
    if (!second) return;
    resetAll();
    setStatus({ kind: 'ok', text: RESET_DONE });
  };

  return (
    <div class="screen settings">
      <section class="settings-group" aria-labelledby="settings-look">
        <h2 id="settings-look" class="settings-group__title">
          Оформление
        </h2>
        <div class="settings-field">
          <span class="settings-field__label">Тема</span>
          <SegmentedControl
            ariaLabel="Тема"
            variant="boxed"
            options={THEME_OPTIONS}
            value={theme}
            onChange={(t) => setSettings({ theme: t })}
          />
        </div>
        <label class="switch settings-field" for={englishId}>
          <span>Показывать английские названия</span>
          <input
            id={englishId}
            type="checkbox"
            role="switch"
            class="switch__input"
            checked={showEnglish}
            onChange={(e) => setSettings({ showEnglish: e.currentTarget.checked })}
          />
        </label>
      </section>

      <section class="settings-group" aria-labelledby="settings-backup">
        <h2 id="settings-backup" class="settings-group__title">
          Прогресс
        </h2>
        <p class="muted settings-group__hint">
          Прогресс хранится только на этом устройстве. Резервная копия — файл, который можно
          перенести на другой телефон или сохранить на случай очистки браузера.
        </p>
        <button
          type="button"
          class="btn btn--secondary btn--block"
          onClick={() => {
            setStatus(null);
            downloadBackup();
          }}
        >
          Сохранить резервную копию
        </button>
        <button
          type="button"
          class="btn btn--secondary btn--block"
          onClick={() => fileInput.current?.click()}
        >
          Загрузить резервную копию
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          class="visually-hidden"
          tabIndex={-1}
          aria-label="Файл резервной копии"
          data-testid="backup-file"
          onChange={(e) => void onImportFile(e.currentTarget)}
        />
        <button type="button" class="btn btn--danger btn--block" onClick={() => void onReset()}>
          Сбросить прогресс
        </button>
        <div aria-live="polite">
          {status && (
            <p
              class={
                status.kind === 'error'
                  ? 'settings-status settings-status--error'
                  : 'settings-status'
              }
              role={status.kind === 'error' ? 'alert' : 'status'}
            >
              {status.text}
            </p>
          )}
        </div>
      </section>

      <section class="settings-group" aria-labelledby="settings-data">
        <h2 id="settings-data" class="settings-group__title">
          О данных
        </h2>
        <p>
          Версия данных: <span class="num">{meta.dataVersion}</span>
        </p>
        {meta.notesRu && <p class="muted">{meta.notesRu}</p>}
        <DisputedList />
        {meta.sources.length > 0 && (
          <>
            <h3 class="settings-group__subtitle">Источники</h3>
            <ul class="settings-sources">
              {meta.sources.map((url) => (
                <li key={url}>
                  <ExternalLink href={url}>{sourceLabel(url)}</ExternalLink>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <p class="muted settings-version">
        Версия приложения: <span class="num">{__APP_VERSION__}</span>
      </p>
    </div>
  );
}
