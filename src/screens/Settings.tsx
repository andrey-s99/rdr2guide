import { useId, useRef, useState } from 'preact/hooks';
import { AppLink } from '../components/AppLink';
import { confirm } from '../components/ConfirmDialog';
import { ExternalLink } from '../components/ExternalLink';
import { type SegmentOption, SegmentedControl } from '../components/SegmentedControl';
import { disputedItems, meta } from '../data';
import type { UserState } from '../data/types';
import { backupFileName, parseBackup, serializeBackup } from '../state/persist';
import { importState, resetAll, setSettings, state } from '../state/store';
import '../styles/screens/settings.css';

type Theme = UserState['settings']['theme'];

const THEME_OPTIONS: SegmentOption<Theme>[] = [
  { value: 'night', label: 'Night' },
  { value: 'paper', label: 'Paper' },
  { value: 'system', label: 'System' },
];

export const IMPORT_CONFIRM_TITLE = 'Replace your current progress with the data from the file?';
export const IMPORT_DONE = 'Backup loaded';
export const RESET_DONE = 'Progress reset';
export const RESET_FINAL_LABEL = 'Yes, delete everything';

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
        Items marked "disputed data": <span class="num">{count}</span>
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
            {open ? 'Hide list' : 'Show list'}
          </button>
          {open && (
            <ul id={listId} class="list settings-disputed__list">
              {disputedItems.map((item) => (
                <li key={item.id}>
                  <AppLink to={`/item/${item.id}`} class="list-row">
                    <span class="list-row__main">
                      <span class="list-row__title clamp-2">{item.nameEn}</span>
                      {item.dataNoteEn && <span class="list-row__note">{item.dataNoteEn}</span>}
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
  const { theme } = state.value.settings;
  const fileInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>(null);

  const onImportFile = async (input: HTMLInputElement) => {
    const file = input.files?.[0];
    input.value = ''; // allow choosing the same file again
    if (!file) return;
    let text: string;
    try {
      text = await readFileText(file);
    } catch {
      setStatus({ kind: 'error', text: 'Could not read the file.' });
      return;
    }
    const parsed = parseBackup(text);
    if (!parsed.ok) {
      setStatus({ kind: 'error', text: `${parsed.error} Your current progress was not changed.` });
      return;
    }
    const ok = await confirm({ title: IMPORT_CONFIRM_TITLE, confirmLabel: 'Replace' });
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
      title: 'Reset progress?',
      body: 'Crafted marks, stock, goals and challenge progress will be deleted. Settings stay.',
      confirmLabel: 'Reset',
      danger: true,
    });
    if (!first) return;
    const second = await confirm({
      title: 'Delete all progress permanently?',
      body: 'If needed, save a backup first.',
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
          Appearance
        </h2>
        <div class="settings-field">
          <span class="settings-field__label">Theme</span>
          <SegmentedControl
            ariaLabel="Theme"
            variant="boxed"
            options={THEME_OPTIONS}
            value={theme}
            onChange={(t) => setSettings({ theme: t })}
          />
        </div>
      </section>

      <section class="settings-group" aria-labelledby="settings-backup">
        <h2 id="settings-backup" class="settings-group__title">
          Progress
        </h2>
        <p class="muted settings-group__hint">
          Progress is stored only on this device. A backup is a file you can move to another phone
          or keep in case the browser data is cleared.
        </p>
        <button
          type="button"
          class="btn btn--secondary btn--block"
          onClick={() => {
            setStatus(null);
            downloadBackup();
          }}
        >
          Save backup
        </button>
        <button
          type="button"
          class="btn btn--secondary btn--block"
          onClick={() => fileInput.current?.click()}
        >
          Load backup
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          class="visually-hidden"
          tabIndex={-1}
          aria-label="Backup file"
          data-testid="backup-file"
          onChange={(e) => void onImportFile(e.currentTarget)}
        />
        <button type="button" class="btn btn--danger btn--block" onClick={() => void onReset()}>
          Reset progress
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
          About the data
        </h2>
        <p>
          Data version: <span class="num">{meta.dataVersion}</span>
        </p>
        {meta.notesEn && <p class="muted">{meta.notesEn}</p>}
        <DisputedList />
        {meta.sources.length > 0 && (
          <>
            <h3 class="settings-group__subtitle">Sources</h3>
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
        App version: <span class="num">{__APP_VERSION__}</span>
      </p>
    </div>
  );
}
