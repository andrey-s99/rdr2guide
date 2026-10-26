import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/preact';
import { itemsByCategory, itemsByVendor } from '../src/data';
import { FenceTalismans } from '../src/screens/FenceTalismans';
import { FenceTrinkets } from '../src/screens/FenceTrinkets';
import { VendorScreen } from '../src/screens/VendorScreen';
import { resetSessionForTests } from '../src/state/session';
import { resetStoreForTests } from '../src/state/store';
import { dismissToast } from '../src/state/undo';

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
  it.each(['trapper', 'fence'] as const)(
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

  it('unknown id shows «Не найдено»', () => {
    render(<VendorScreen id="nobody" />);
    expect(screen.getByText('Не найдено')).toBeTruthy();
  });
});
