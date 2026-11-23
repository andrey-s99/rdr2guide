import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/preact';
import { itemsByCategory, itemsByVendor } from '../src/data';
import { FenceTalismans } from '../src/screens/FenceTalismans';
import { FenceTrinkets } from '../src/screens/FenceTrinkets';
import { ItemScreen } from '../src/screens/ItemScreen';
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
    expect(screen.getByText('How the Fence works →').getAttribute('href')).toBe('#/vendor/fence');
    for (const item of itemsByCategory.get(category) ?? []) {
      const row = rowOf(item.nameEn);
      expect(within(row).getByText(item.effectEn)).toBeTruthy();
      expect(row.querySelector('.price')).toBeNull();
    }
    expect(screen.getByText('Fence summary').getAttribute('href')).toBe('#/summary?scope=fence');
  });
});

describe('Item card for non-hunting materials', () => {
  it('shows where to get the ingredient', () => {
    render(<ItemScreen id="raven_claw_talisman" />);
    expect(screen.getByText(/On the table in Francis Sinclair's cabin/)).toBeTruthy();
  });
});

describe('Vendor page (9.11)', () => {
  it.each(['trapper', 'fence'] as const)('%s shows locations, rules and progress', (id) => {
    render(<VendorScreen id={id} />);
    const total = itemsByVendor.get(id)?.length ?? 0;
    expect(screen.getByText(`Crafted 0 of ${total}`)).toBeTruthy();
    expect(screen.getByText('Where to find')).toBeTruthy();
    expect(screen.getByText('How it works')).toBeTruthy();
    expect(screen.getByText('Vendor summary').closest('a')?.getAttribute('href')).toBe(
      `#/summary?scope=${id}`,
    );
  });

  it('fence page lists non-hunting ingredients with where to find them', () => {
    render(<VendorScreen id="fence" />);
    expect(screen.getByText('Items not from hunting')).toBeTruthy();
    expect(screen.getByText('Old Brass Compass')).toBeTruthy();
    expect(screen.getByText('Vintage Civil War Handcuffs')).toBeTruthy();
  });

  it('trapper page has no non-hunting block', () => {
    render(<VendorScreen id="trapper" />);
    expect(screen.queryByText('Items not from hunting')).toBeNull();
  });

  it('unknown id shows "Not found"', () => {
    render(<VendorScreen id="nobody" />);
    expect(screen.getByText('Not found')).toBeTruthy();
  });
});
