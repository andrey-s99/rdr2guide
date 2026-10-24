import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/preact';
import { itemsByCategory, itemsById, itemsByVendor } from '../src/data';
import { FenceTalismans } from '../src/screens/FenceTalismans';
import { FenceTrinkets } from '../src/screens/FenceTrinkets';
import { PearsonCamp, groupByCampSpot } from '../src/screens/PearsonCamp';
import { PearsonSatchels } from '../src/screens/PearsonSatchels';
import { VendorScreen } from '../src/screens/VendorScreen';
import { resetSessionForTests } from '../src/state/session';
import { markCrafted, resetStoreForTests } from '../src/state/store';
import { dismissToast } from '../src/state/undo';

const LEGEND_ID = 'legend_of_the_east_satchel';

function rowOf(name: string): HTMLElement {
  const link = screen.getByText(name, { selector: 'a' });
  return link.closest('.item-row') as HTMLElement;
}

beforeEach(() => {
  resetStoreForTests();
  resetSessionForTests();
  dismissToast();
});

afterEach(() => {
  cleanup();
});

describe('Pearson satchels (9.5)', () => {
  it('renders the vendor link, reminder, requirements and summary button', () => {
    render(<PearsonSatchels />);
    const link = screen.getByText('Как работает Пирсон →');
    expect(link.getAttribute('href')).toBe('#/vendor/pearson');
    expect(screen.getByText('Пирсон работает до конца главы 6')).toBeTruthy();
    for (const item of itemsByCategory.get('satchel') ?? []) {
      expect(within(rowOf(item.nameRu)).getByText(item.requirementRu)).toBeTruthy();
    }
    const summary = screen.getByText('Сводка по Пирсону');
    expect(summary.getAttribute('href')).toBe('#/summary?scope=pearson');
  });

  it('«Легенда Востока» is locked 0/6, then unlocked 6/6 after crafting the others', () => {
    const legend = itemsById.get(LEGEND_ID);
    expect(legend?.prerequisiteItemIds).toHaveLength(6);
    render(<PearsonSatchels />);
    // Show crafted items too, so the list keeps all rows.
    fireEvent.click(screen.getByRole('button', { name: /^Все/ }));
    const name = legend!.nameRu;
    expect(within(rowOf(name)).getByText('Сначала другие 0/6')).toBeTruthy();

    act(() => {
      for (const id of legend!.prerequisiteItemIds) markCrafted(id, { toast: false });
    });

    const row = rowOf(name);
    expect(within(row).queryByText(/Сначала другие/)).toBeNull();
    expect(row.querySelector('.lock-badge')).toBeNull();
    expect(within(row).getByText(/6\/6/)).toBeTruthy();
  });

  it('shows the empty state when everything is crafted', () => {
    act(() => {
      for (const item of itemsByCategory.get('satchel') ?? [])
        markCrafted(item.id, { toast: false });
    });
    render(<PearsonSatchels />);
    expect(screen.getByText('Здесь пока пусто — всё изготовлено')).toBeTruthy();
  });
});

describe('Pearson camp (9.5)', () => {
  it('groups by campSpotRu in order of first appearance', () => {
    const camp = itemsByCategory.get('camp') ?? [];
    const expected: string[] = [];
    for (const item of camp)
      if (!expected.includes(item.campSpotRu)) expected.push(item.campSpotRu);
    expect(groupByCampSpot(camp).map((g) => g.spot)).toEqual(expected);

    render(<PearsonCamp />);
    const headers = Array.from(document.querySelectorAll('.section-header__title')).map(
      (h) => h.textContent,
    );
    expect(headers).toEqual(expected);
    expect(screen.getByText('Сводка по Пирсону').getAttribute('href')).toBe(
      '#/summary?scope=pearson',
    );
  });

  it('remembers the filter per screen for the session', () => {
    const { unmount } = render(<PearsonCamp />);
    fireEvent.click(screen.getByRole('button', { name: /^Сделано/ }));
    expect(screen.getByText('Пока ничего не изготовлено')).toBeTruthy();
    unmount();
    render(<PearsonCamp />);
    expect(screen.getByText('Пока ничего не изготовлено')).toBeTruthy();
    cleanup();
    render(<PearsonSatchels />);
    expect(screen.queryByText('Пока ничего не изготовлено')).toBeNull();
  });
});

describe('Fence (9.6)', () => {
  it.each([
    ['trinket', FenceTrinkets],
    ['talisman', FenceTalismans],
  ] as const)('%s list shows effects, vendor link and no price', (category, Screen) => {
    render(<Screen />);
    expect(screen.getByText('Как работает Скупщик →').getAttribute('href')).toBe('#/vendor/fence');
    for (const item of itemsByCategory.get(category) ?? []) {
      const row = rowOf(item.nameRu);
      expect(within(row).getByText(item.effectRu)).toBeTruthy();
      expect(row.querySelector('.price')).toBeNull();
    }
    expect(screen.getByText('Сводка по Скупщику').getAttribute('href')).toBe(
      '#/summary?scope=fence',
    );
  });
});

describe('Vendor page (9.11)', () => {
  it.each(['trapper', 'pearson', 'fence'] as const)(
    '%s shows locations, rules and progress',
    (id) => {
      render(<VendorScreen id={id} />);
      const total = itemsByVendor.get(id)?.length ?? 0;
      expect(screen.getByText(`Изготовлено 0 из ${total}`)).toBeTruthy();
      expect(screen.getByText('Где найти')).toBeTruthy();
      expect(screen.getByText('Как работает')).toBeTruthy();
      expect(screen.getByText('Сводка по торговцу').closest('a')?.getAttribute('href')).toBe(
        `#/summary?scope=${id}`,
      );
    },
  );

  it('progress grows after crafting and links to sub-screens', () => {
    act(() => {
      markCrafted('valuables_satchel', { toast: false });
    });
    render(<VendorScreen id="pearson" />);
    const total = itemsByVendor.get('pearson')?.length ?? 0;
    expect(screen.getByText(`Изготовлено 1 из ${total}`)).toBeTruthy();
    expect(screen.getByText('Сумки').closest('a')?.getAttribute('href')).toBe('#/pearson/satchels');
    expect(screen.getByText('Лагерь').closest('a')?.getAttribute('href')).toBe('#/pearson/camp');
  });

  it('unknown id shows «Не найдено»', () => {
    render(<VendorScreen id="nobody" />);
    expect(screen.getByText('Не найдено')).toBeTruthy();
  });
});
