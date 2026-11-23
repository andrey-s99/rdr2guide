import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/preact';
import { itemsByCategory, itemsById, itemsByVendor } from '../src/data';
import { FenceTalismans } from '../src/screens/FenceTalismans';
import { FenceTrinkets } from '../src/screens/FenceTrinkets';
import { ItemScreen } from '../src/screens/ItemScreen';
import { PearsonSatchels } from '../src/screens/PearsonSatchels';
import { VendorScreen } from '../src/screens/VendorScreen';
import { resetSessionForTests } from '../src/state/session';
import { markCrafted, resetStoreForTests } from '../src/state/store';
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

const LEGEND_ID = 'legend_of_the_east_satchel';

describe('Pearson satchels (9.5)', () => {
  it('renders the vendor link, reminder, effects, requirements and summary button', () => {
    render(<PearsonSatchels />);
    expect(screen.getByText('How Pearson works →').getAttribute('href')).toBe('#/vendor/pearson');
    expect(screen.getByText('Pearson crafts until the end of Chapter 6')).toBeTruthy();
    const satchels = itemsByCategory.get('satchel') ?? [];
    expect(satchels).toHaveLength(7);
    for (const item of satchels) {
      const row = rowOf(item.nameEn);
      expect(within(row).getByText(item.effectEn)).toBeTruthy();
      expect(within(row).getByText(`Unlock: ${item.requirementEn}`)).toBeTruthy();
      expect(row.querySelectorAll('.item-row__recipe .tag')).toHaveLength(item.recipe.length);
    }
    expect(screen.getByText('Pearson summary').getAttribute('href')).toBe(
      '#/summary?scope=pearson',
    );
  });

  it('Legend of the East is locked 0/6, then unlocked 6/6 after crafting the others', () => {
    const legend = itemsById.get(LEGEND_ID)!;
    expect(legend.prerequisiteItemIds).toHaveLength(6);
    render(<PearsonSatchels />);
    fireEvent.click(screen.getByRole('button', { name: /^All/ }));
    expect(rowOf(legend.nameEn).querySelector('.lock-badge')).not.toBeNull();
    act(() => {
      for (const id of legend.prerequisiteItemIds) markCrafted(id, { toast: false });
    });
    const row = rowOf(legend.nameEn);
    expect(row.querySelector('.lock-badge')).toBeNull();
    expect(within(row).getByText('Required items crafted: 6/6')).toBeTruthy();
  });

  it('item card links recipe animals', () => {
    render(<ItemScreen id="kit_satchel" />);
    expect(document.querySelector('a[href="#/animal/panther"]')).not.toBeNull();
  });
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
  it.each(['trapper', 'pearson', 'fence'] as const)(
    '%s shows locations, rules and progress',
    (id) => {
      render(<VendorScreen id={id} />);
      const total = itemsByVendor.get(id)?.length ?? 0;
      expect(screen.getByText(`Crafted 0 of ${total}`)).toBeTruthy();
      expect(screen.getByText('Where to find')).toBeTruthy();
      expect(screen.getByText('How it works')).toBeTruthy();
      expect(screen.getByText('Vendor summary').closest('a')?.getAttribute('href')).toBe(
        `#/summary?scope=${id}`,
      );
    },
  );

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
