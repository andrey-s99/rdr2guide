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

const withStock = (stock: Record<string, number>): UserState => ({
  ...createInitialState(),
  stock,
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
    expect(screen.getByText('Где найти Охотника и как он работает')).toBeTruthy();
    expect(screen.getByText('Сводка по всем костюмам').getAttribute('href')).toBe(
      '#/summary?scope=trapper_outfits',
    );
  });

  it('hides complete outfits under «Не сделано» and shows them under «Сделано»', () => {
    const outfit = outfitsById.get('bear_hunter')!;
    for (const id of outfit.itemIds) markCrafted(id, { toast: false });
    const { container } = render(<TrapperOutfits />);
    expect(container.querySelectorAll('.outfit-card')).toHaveLength(outfits.length - 1);
    fireEvent.click(screen.getByRole('button', { name: /^Сделано/ }));
    expect(container.querySelectorAll('.outfit-card')).toHaveLength(1);
    expect(screen.getByText(outfit.nameRu)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /^Готово к крафту/ }));
    expect(screen.getByText('Пока нет костюмов, для которых всё добыто')).toBeTruthy();
  });
});

describe('TrapperItems (9.3)', () => {
  it('groups items by category with counters and collapses groups', () => {
    render(<TrapperItems />);
    const header = screen.getByRole('button', { name: /Шляпы/ });
    expect(header.textContent).toContain('сделано 0 из');
    expect(header.getAttribute('aria-expanded')).toBe('true');
    const rowsBefore = document.querySelectorAll('.item-row').length;
    fireEvent.click(header);
    expect(header.getAttribute('aria-expanded')).toBe('false');
    expect(document.querySelectorAll('.item-row').length).toBeLessThan(rowsBefore);
  });

  it('shows the empty state when the filter hides everything', () => {
    render(<TrapperItems />);
    fireEvent.click(screen.getByRole('button', { name: /^Сделано/ }));
    expect(screen.getByText('Здесь пока пусто')).toBeTruthy();
  });
});

describe('ItemScreen (9.4)', () => {
  it('renders NotFound for an unknown id', () => {
    render(<ItemScreen id="no_such_item" />);
    expect(screen.getByText('Не найдено')).toBeTruthy();
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
    expect(screen.getByText(gloves.nameRu)).toBeTruthy();
    expect(screen.getByText('Рецепт')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Отметить изготовленным' }));
    expect(state.value.crafted[gloves.id]).toBeDefined();
    expect(state.value.stock).toEqual({ perfect_boar: 0, perfect_rabbit: 0 });
    expect(document.querySelector('.toast__detail')?.textContent).toBe('Кабан −1, Кролик −2');

    fireEvent.click(screen.getByRole('button', { name: 'Снять отметку' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog.textContent).toContain('Вернуть списанные материалы в запасы?');
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: 'Снять отметку' }).at(-1)!);
    });
    await waitFor(() => expect(state.value.crafted[gloves.id]).toBeUndefined());
    expect(state.value.stock).toEqual({ perfect_boar: 1, perfect_rabbit: 2 });
    expect(screen.getByRole('button', { name: 'Отметить изготовленным' })).toBeTruthy();
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
    fireEvent.click(screen.getByRole('button', { name: 'Снять отметку' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog.textContent).toContain('ничего не вернётся');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Отмена' }));
    });
    expect(state.value.crafted[gloves.id]).toBeDefined();
  });

  it('opens items of other vendors too', () => {
    const fenceItem = [...itemsById.values()].find((i) => i.vendorId === 'fence')!;
    render(<ItemScreen id={fenceItem.id} />);
    expect(screen.getByText(fenceItem.nameRu)).toBeTruthy();
  });
});

describe('OutfitScreen (9.2)', () => {
  it('renders NotFound for an unknown id', () => {
    render(<OutfitScreen id="no_such_outfit" />);
    expect(screen.getByText('Не найдено')).toBeTruthy();
  });

  it('«Отметить весь костюм» marks all parts after confirmation; undo restores', async () => {
    const outfit = outfitsById.get('bear_hunter')!;
    render(
      <>
        <OutfitScreen id={outfit.id} />
        <ConfirmHost />
        <Toast />
      </>,
    );
    expect(screen.getByText('Что нужно добыть')).toBeTruthy();
    expect(document.querySelector('.trapper-total')?.textContent).toContain('6');
    expect(document.querySelector('.outfit-card__parts')?.textContent).toBe('0 / 4 части');

    fireEvent.click(screen.getByRole('button', { name: 'Отметить весь костюм изготовленным' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog.textContent).toContain('Отметить 4 части изготовленными?');
    expect(dialog.textContent).toContain('Материалы будут списаны из запасов');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Отметить' }));
    });

    await waitFor(() =>
      expect(outfit.itemIds.every((id) => state.value.crafted[id] !== undefined)).toBe(true),
    );
    expect(document.querySelector('.outfit-card__parts')?.textContent).toBe('4 / 4 части');
    expect(screen.getByText('Собран')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Отметить весь костюм изготовленным' })).toBeNull();

    act(() => undoToast());
    expect(state.value.crafted).toEqual({});
  });
});
