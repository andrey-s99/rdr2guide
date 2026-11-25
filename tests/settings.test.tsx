import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { effect } from '@preact/signals';
import { ConfirmHost } from '../src/components/ConfirmDialog';
import {
  IMPORT_CONFIRM_TITLE,
  IMPORT_DONE,
  RESET_FINAL_LABEL,
  Settings,
} from '../src/screens/Settings';
import type { UserState } from '../src/data/types';
import { emptyStocks } from '../src/logic/calc';
import { createInitialState } from '../src/state/persist';
import { resetAll, resetStoreForTests, state } from '../src/state/store';
import { applyTheme } from '../src/theme';

const progress: UserState = {
  ...createInitialState(),
  crafted: {
    boar_riding_gloves: {
      at: '2026-10-01T10:00:00.000Z',
      deducted: { perfect_boar: 1, perfect_rabbit: 2 },
    },
  },
  stock: { trapper: { perfect_beaver: 3 }, pearson: { perfect_cougar: 1 }, fence: {} },
  goals: { items: ['boar_riding_gloves'], outfits: [] },
  challenges: { bandit: 2, herbalist: 10 },
  settings: { theme: 'paper' },
};

let createdBlobs: Blob[] = [];

function readBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsText(blob);
  });
}

function renderSettings() {
  return render(
    <>
      <Settings />
      <ConfirmHost />
    </>,
  );
}

function chooseFile(text: string) {
  const input = screen.getByTestId('backup-file') as HTMLInputElement;
  const file = new File([text], 'backup.json', { type: 'application/json' });
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  fireEvent.change(input);
}

beforeEach(() => {
  resetStoreForTests();
  createdBlobs = [];
  vi.stubGlobal(
    'URL',
    Object.assign(URL, {
      createObjectURL: vi.fn((b: Blob) => {
        createdBlobs.push(b);
        return 'blob:test';
      }),
      revokeObjectURL: vi.fn(),
    }),
  );
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Settings (9.13)', () => {
  it('theme switch sets data-theme', () => {
    const stop = effect(() => {
      applyTheme(state.value.settings.theme);
    });
    renderSettings();
    fireEvent.click(screen.getByRole('tab', { name: 'Paper' }));
    expect(state.value.settings.theme).toBe('paper');
    expect(document.documentElement.dataset.theme).toBe('paper');
    fireEvent.click(screen.getByRole('tab', { name: 'Night' }));
    expect(document.documentElement.dataset.theme).toBe('night');
    stop();
  });

  it('has no language switch: the UI is English only', () => {
    renderSettings();
    expect(screen.queryByRole('switch')).toBeNull();
    expect(document.body.textContent).not.toMatch(/[А-Яа-яЁё]/);
  });

  it('export → reset → import restores the state completely (M7)', async () => {
    state.value = structuredClone(progress);
    renderSettings();

    fireEvent.click(screen.getByRole('button', { name: 'Save backup' }));
    expect(createdBlobs).toHaveLength(1);
    const text = await readBlob(createdBlobs[0]);

    act(() => resetAll());
    expect(state.value.crafted).toEqual({});
    expect(state.value.stock).toEqual(emptyStocks());

    chooseFile(text);
    const dialog = await screen.findByRole('dialog', { name: IMPORT_CONFIRM_TITLE });
    expect(dialog).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Replace' }));

    await screen.findByText(IMPORT_DONE);
    expect(state.value).toEqual(progress);
  });

  it('a broken file shows an error and keeps the state', async () => {
    state.value = structuredClone(progress);
    renderSettings();
    chooseFile('{ not json');
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Your current progress was not changed');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(state.value).toEqual(progress);

    chooseFile(JSON.stringify({ app: 'other', state: {} }));
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain(
        "This is not a Hunter's Journal backup",
      ),
    );
    expect(state.value).toEqual(progress);
  });

  it('reset requires two confirmations', async () => {
    state.value = structuredClone(progress);
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Reset progress' }));
    await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    await screen.findByRole('button', { name: RESET_FINAL_LABEL });
    expect(state.value.stock).toEqual(progress.stock);
    fireEvent.click(screen.getByRole('button', { name: RESET_FINAL_LABEL }));
    await waitFor(() => expect(state.value.stock).toEqual(emptyStocks()));
    expect(state.value.crafted).toEqual({});
    expect(state.value.goals).toEqual({ items: [], outfits: [] });
    expect(state.value.settings).toEqual(progress.settings);
  });

  it('shows data info and the disputed items list', () => {
    renderSettings();
    expect(screen.getByText(/Data version/)).toBeTruthy();
    expect(screen.getByText(/App version/)).toBeTruthy();
    const toggle = screen.queryByRole('button', { name: 'Show list' });
    if (toggle) {
      fireEvent.click(toggle);
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
      expect(document.querySelectorAll('.settings-disputed__list a').length).toBeGreaterThan(0);
    }
  });
});
