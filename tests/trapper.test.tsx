import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { itemsById, outfits, outfitsById } from '../src/data';
import type { UserState } from '../src/data/types';
import { ConfirmHost } from '../src/components/ConfirmDialog';
import { Toast } from '../src/components/Toast';
import { createInitialState } from '../src/state/persist';
import { resetSessionForTests } from '../src/state/session';
import { markCrafted, resetStoreForTests, state } from '../src/state/store';
import { dismissToast, undoToast } from '../src/state/undo';
import { ItemScreen } from '../src/screens/ItemScreen';
import { OutfitScreen } from '../src/screens/OutfitScreen';
import { TrapperItems } from '../src/screens/TrapperItems';
import { TrapperOutfits } from '../src/screens/TrapperOutfits';

/** State with a Trapper stock (these tests use Trapper items). */
const withStock = (stock: Record<string, number>): UserState => ({
  ...createInitialState(),
  stock: { ...createInitialState().stock, trapper: stock },
});

beforeEach(() => {
  resetStoreForTests();
  resetSessionForTests();
  dismissToast();
});

afterEach(() => {
  cleanup();
});

describe('TrapperOutfits (9.1)', () => {
  it('renders all 16 outfits by default and the vendor link', () => {
    const { container } = render(<TrapperOutfits />);
    expect(container.querySelectorAll('.outfit-card')).toHaveLength(outfits.length);
    expect(screen.getByText('Where to find the Trapper and how he works')).toBeTruthy();
    expect(screen.getByText('Summary for all outfits').getAttribute('href')).toBe(
      '#/summary?scope=trapper_outfits',
    );
  });

  it('hides complete outfits under "Not crafted" and shows them under "Crafted"', () => {
    const outfit = outfitsById.get('bear_hunter')!;
    for (const id of outfit.itemIds) markCrafted(id, { toast: false });
    const { container } = render(<TrapperOutfits />);
    expect(container.querySelectorAll('.outfit-card')).toHaveLength(outfits.length - 1);
    fireEvent.click(screen.getByRole('button', { name: /^Crafted/ }));
    expect(container.querySelectorAll('.outfit-card')).toHaveLength(1);
    expect(screen.getByText(outfit.nameEn)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /^Ready to craft/ }));
    expect(screen.getByText('No outfits have all materials collected yet')).toBeTruthy();
  });
});

describe('TrapperItems (9.3)', () => {
  it('groups items by category with counters and collapses groups', () => {
    render(<TrapperItems />);
    const header = screen.getByRole('button', { name: /Hats/ });
    expect(header.textContent).toMatch(/0 of \d+ crafted/);
    expect(header.getAttribute('aria-expanded')).toBe('true');
    const rowsBefore = document.querySelectorAll('.item-row').length;
    fireEvent.click(header);
    expect(header.getAttribute('aria-expanded')).toBe('false');
    expect(document.querySelectorAll('.item-row').length).toBeLessThan(rowsBefore);
  });

  it('shows the empty state when the filter hides everything', () => {
    render(<TrapperItems />);
    fireEvent.click(screen.getByRole('button', { name: /^Crafted/ }));
    expect(screen.getByText('Nothing here yet')).toBeTruthy();
  });
});

describe('ItemScreen (9.4)', () => {
  it('renders NotFound for an unknown id', () => {
    render(<ItemScreen id="no_such_item" />);
    expect(screen.getByText('Not found')).toBeTruthy();
  });

  it('marks an item (deducting stock) and unmarks it with confirmation (returning stock)', async () => {
    state.value = withStock({ perfect_boar: 1, perfect_rabbit: 2 });
    const gloves = itemsById.get('boar_riding_gloves')!;
    render(
      <>
        <ItemScreen id={gloves.id} />
        <ConfirmHost />
        <Toast />
      </>,
    );
    expect(screen.getByText(gloves.nameEn)).toBeTruthy();
    expect(screen.getByText('Recipe')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Mark as crafted' }));
    expect(state.value.crafted[gloves.id]).toBeDefined();
    expect(state.value.stock.trapper).toEqual({ perfect_boar: 0, perfect_rabbit: 0 });
    expect(document.querySelector('.toast__detail')?.textContent).toBe('Boar −1, Rabbit −2');

    fireEvent.click(screen.getByRole('button', { name: 'Unmark crafted' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog.textContent).toContain('Return the deducted materials to your stock?');
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: 'Unmark' }).at(-1)!);
    });
    await waitFor(() => expect(state.value.crafted[gloves.id]).toBeUndefined());
    expect(state.value.stock.trapper).toEqual({ perfect_boar: 1, perfect_rabbit: 2 });
    expect(screen.getByRole('button', { name: 'Mark as crafted' })).toBeTruthy();
  });

  it('cancelled unmark keeps the item crafted', async () => {
    const gloves = itemsById.get('boar_riding_gloves')!;
    markCrafted(gloves.id, { toast: false });
    render(
      <>
        <ItemScreen id={gloves.id} />
        <ConfirmHost />
      </>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Unmark crafted' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog.textContent).toContain('nothing returns to your stock');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    });
    expect(state.value.crafted[gloves.id]).toBeDefined();
  });

  it('opens items of other vendors too', () => {
    const fenceItem = [...itemsById.values()].find((i) => i.vendorId === 'fence')!;
    render(<ItemScreen id={fenceItem.id} />);
    expect(screen.getByText(fenceItem.nameEn)).toBeTruthy();
  });
});

describe('OutfitScreen (9.2)', () => {
  it('renders NotFound for an unknown id', () => {
    render(<OutfitScreen id="no_such_outfit" />);
    expect(screen.getByText('Not found')).toBeTruthy();
  });

  it('"Mark whole outfit" marks all parts after confirmation; undo restores', async () => {
    const outfit = outfitsById.get('bear_hunter')!;
    render(
      <>
        <OutfitScreen id={outfit.id} />
        <ConfirmHost />
        <Toast />
      </>,
    );
    expect(screen.getByText('What to collect')).toBeTruthy();
    expect(document.querySelector('.trapper-total')?.textContent).toContain('6');
    expect(document.querySelector('.outfit-card__parts')?.textContent).toBe('0 / 4 parts');

    fireEvent.click(screen.getByRole('button', { name: 'Mark whole outfit as crafted' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog.textContent).toContain('Mark 4 parts as crafted?');
    expect(dialog.textContent).toContain('Materials will be deducted from your stock');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Mark' }));
    });

    await waitFor(() =>
      expect(outfit.itemIds.every((id) => state.value.crafted[id] !== undefined)).toBe(true),
    );
    expect(document.querySelector('.outfit-card__parts')?.textContent).toBe('4 / 4 parts');
    expect(screen.getByText('Complete')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Mark whole outfit as crafted' })).toBeNull();

    act(() => undoToast());
    expect(state.value.crafted).toEqual({});
  });
});
