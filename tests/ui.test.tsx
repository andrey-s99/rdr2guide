import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { effect } from '@preact/signals';
import { disputedItems, itemsById, outfits } from '../src/data';
import type { Item, UserState } from '../src/data/types';
import { ItemRow } from '../src/components/ItemRow';
import { Toast } from '../src/components/Toast';
import { Stepper } from '../src/components/Stepper';
import { GoalStar } from '../src/components/GoalStar';
import { OutfitCard } from '../src/components/OutfitCard';
import { DataWarning } from '../src/components/DataWarning';
import { ConfirmHost, confirm } from '../src/components/ConfirmDialog';
import { createInitialState } from '../src/state/persist';
import { resetStoreForTests, setSettings, state } from '../src/state/store';
import { dismissToast } from '../src/state/undo';
import { applyTheme } from '../src/theme';

const gloves = itemsById.get('boar_riding_gloves') as Item;

/** State with a Trapper stock (these tests use Trapper items). */
const withStock = (stock: Record<string, number>): UserState => ({
  ...createInitialState(),
  stock: { ...createInitialState().stock, trapper: stock },
});

beforeEach(() => {
  resetStoreForTests();
  dismissToast();
});

afterEach(() => {
  cleanup();
});

describe('15.4 UI', () => {
  it('marking an item in a list changes its status and shows a toast; "Undo" restores', () => {
    state.value = withStock({ perfect_boar: 1, perfect_rabbit: 2 });
    render(
      <>
        <ItemRow item={gloves} />
        <Toast />
      </>,
    );
    expect(screen.getByText('Ready to craft')).toBeTruthy();
    const checkbox = screen.getByRole('checkbox', {
      name: `Crafted: ${gloves.nameEn}`,
    }) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    fireEvent.click(checkbox);

    expect(state.value.crafted[gloves.id]).toBeDefined();
    expect(checkbox.checked).toBe(true);
    expect(screen.getByText('Crafted')).toBeTruthy();
    expect(screen.queryByText('Ready to craft')).toBeNull();
    expect(document.querySelector('.toast__title')?.textContent).toBe(`Crafted: ${gloves.nameEn}`);
    expect(document.querySelector('.toast__detail')?.textContent).toBe('Boar −1, Rabbit −2');

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));

    expect(state.value.crafted).toEqual({});
    expect(state.value.stock.trapper).toEqual({ perfect_boar: 1, perfect_rabbit: 2 });
    expect(checkbox.checked).toBe(false);
    expect(screen.getByText('Ready to craft')).toBeTruthy();
    expect(document.querySelector('.toast')).toBeNull();
  });

  it('checkbox click does not open the item card (no navigation)', () => {
    const before = location.hash;
    render(<ItemRow item={gloves} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(location.hash).toBe(before);
  });

  it('switching theme changes data-theme', () => {
    const stop = effect(() => {
      applyTheme(state.value.settings.theme);
    });
    expect(document.documentElement.dataset.theme).toBe('night');
    setSettings({ theme: 'paper' });
    expect(document.documentElement.dataset.theme).toBe('paper');
    setSettings({ theme: 'night' });
    expect(document.documentElement.dataset.theme).toBe('night');
    stop();
  });
});

describe('components', () => {
  it('ItemRow shows the original English name and no Russian text', () => {
    const { container } = render(<ItemRow item={gloves} />);
    expect(screen.queryByText(gloves.nameEn)).toBeTruthy();
    expect(container.textContent).not.toMatch(/[А-Яа-яЁё]/);
  });

  it('Stepper changes stock with buttons and typed input (clamped)', () => {
    render(<Stepper vendorId="trapper" materialId="perfect_boar" label="Boar" />);
    const input = screen.getByRole('textbox', { name: 'Amount: Boar' }) as HTMLInputElement;
    fireEvent.click(screen.getByRole('button', { name: 'Increase: Boar' }));
    expect(state.value.stock.trapper.perfect_boar).toBe(1);
    expect(input.value).toBe('1');
    fireEvent.input(input, { target: { value: '5000' } });
    fireEvent.blur(input);
    expect(state.value.stock.trapper.perfect_boar).toBe(999);
    fireEvent.click(screen.getByRole('button', { name: 'Decrease: Boar' }));
    expect(state.value.stock.trapper.perfect_boar).toBe(998);
  });

  it('GoalStar toggles goals with aria-pressed', () => {
    render(<GoalStar kind="item" id={gloves.id} />);
    const btn = screen.getByRole('button', { name: `Goal: ${gloves.nameEn}` });
    expect(btn.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(btn);
    expect(state.value.goals.items).toEqual([gloves.id]);
    expect(btn.getAttribute('aria-pressed')).toBe('true');
  });

  it('OutfitCard shows parts progress and remaining units', () => {
    const outfit = outfits[0];
    render(<OutfitCard outfit={outfit} />);
    expect(screen.getByText(new RegExp(`^0 / ${outfit.itemIds.length} `))).toBeTruthy();
    expect(screen.getByText(/Still to collect/)).toBeTruthy();
  });

  it('DataWarning reveals the note on tap', () => {
    const item = disputedItems[0];
    render(<DataWarning confidence={item.dataConfidence} note={item.dataNoteRu} />);
    const btn = screen.getByRole('button');
    expect(screen.queryByRole('note')).toBeNull();
    fireEvent.click(btn);
    expect(screen.getByRole('note').textContent).toContain(item.dataNoteRu);
  });

  it('confirm() resolves via ConfirmHost', async () => {
    render(<ConfirmHost />);
    const p = confirm({ title: 'Delete?', confirmLabel: 'Yes, delete everything' });
    const dialog = await screen.findByRole('dialog', { name: 'Delete?' });
    expect(dialog).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete everything' }));
    await expect(p).resolves.toBe(true);
    expect(screen.queryByRole('dialog')).toBeNull();

    const p2 = confirm({ title: 'Again?' });
    fireEvent.keyDown(await screen.findByRole('dialog'), { key: 'Escape' });
    await expect(p2).resolves.toBe(false);
  });
});
