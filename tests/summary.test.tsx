import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { regions } from '../src/data';
import { currentRoute, navigate } from '../src/router';
import { Summary } from '../src/screens/Summary';
import { UI_KEY } from '../src/state/persist';
import { resetSessionForTests } from '../src/state/session';
import { resetStoreForTests, toggleGoalOutfit } from '../src/state/store';

/** Renders Summary from the current route, like src/app.tsx does. */
function Harness() {
  const r = currentRoute.value;
  return <Summary scope={r.query.scope} group={r.query.group} />;
}

function open(path: string) {
  navigate(path, { replace: true });
  return render(<Harness />);
}

function totalsText(): string {
  return screen.getByTestId('summary-remaining').textContent ?? '';
}

function renderedRows(): { count: number; units: number } {
  const cells = [...document.querySelectorAll('.material-row__remaining')];
  return {
    count: cells.length,
    units: cells.reduce((s, el) => s + Number(el.textContent), 0),
  };
}

function uiPrefs(): Record<string, unknown> {
  return JSON.parse(localStorage.getItem(UI_KEY) ?? '{}') as Record<string, unknown>;
}

beforeEach(() => {
  localStorage.clear();
  resetStoreForTests();
  resetSessionForTests();
});

afterEach(() => {
  cleanup();
});

// SPEC 15.3 reference totals (empty progress and stock).
const REFERENCE: [scope: string, distinct: number, units: number, itemsTotal: number | null][] = [
  ['all', 103, 299, 141],
  ['trapper', 77, 273, 123],
  ['trapper_outfits', 50, 118, null],
  ['fence', 26, 26, 18],
  ['outfit:bear_hunter', 5, 6, 4],
  ['outfit:desperado', 9, 12, null],
  ['outfit:dreamcatcher', 4, 4, null],
];

describe('Summary screen: 15.3 totals on screen', () => {
  for (const [scope, distinct, units, itemsTotal] of REFERENCE) {
    it(`${scope}: ${units} units, ${distinct} kinds`, () => {
      open(`/summary?scope=${encodeURIComponent(scope)}&group=flat`);
      const text = totalsText();
      expect(text).toMatch(new RegExp(`^Still to collect: ${units}, ${distinct} material type`));
      // The list itself shows the same numbers.
      expect(renderedRows()).toEqual({ count: distinct, units });
      if (itemsTotal !== null) {
        expect(screen.getByText(new RegExp(`^Crafted 0 of ${itemsTotal} `))).toBeTruthy();
      }
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe(scope);
    });
  }

  it('select has optgroups and all scopes (16 outfits, 8 trapper categories)', () => {
    open('/summary?scope=all');
    const groups = [...document.querySelectorAll('optgroup')].map((g) => g.label);
    expect(groups).toEqual(['General', 'Trapper', 'Outfits', 'Fence']);
    const values = [...document.querySelectorAll('option')].map((o) => o.value);
    expect(values.filter((v) => v.startsWith('outfit:'))).toHaveLength(16);
    expect(values.filter((v) => v.startsWith('trapper_cat:'))).toHaveLength(8);
    expect(values).toEqual(
      expect.arrayContaining(['all', 'goals', 'trapper', 'trapper_outfits', 'fence']),
    );
  });
});

describe('Summary screen: grouping', () => {
  it('by animal (default): animal headers link to animal cards, special group present', () => {
    open('/summary?scope=all');
    expect(currentRoute.value.query.group).toBe('animal');
    const heads = [...document.querySelectorAll('.summary-group__head')];
    expect(heads.length).toBeGreaterThan(10);
    const first = heads[0] as HTMLAnchorElement;
    expect(first.getAttribute('href')).toMatch(/^#\/animal\//);
    expect(screen.getByText('Special items')).toBeTruthy();
    expect(renderedRows()).toEqual({ count: 103, units: 299 });
    // Group badges are sorted by remaining desc.
    const badges = [...document.querySelectorAll('.summary-group__head .badge')].map((b) =>
      Number(b.textContent),
    );
    expect([...badges].sort((a, b) => b - a)).toEqual(badges);
  });

  it('by region: region headers in regions.json order, special group last', () => {
    open('/summary?scope=all');
    fireEvent.click(screen.getByRole('tab', { name: 'By region' }));
    expect(currentRoute.value.query.group).toBe('region');
    const titles = [...document.querySelectorAll('.summary-region .section-header__title')].map(
      (el) => el.textContent,
    );
    const regionNames = regions.map((r) => r.nameEn);
    expect(titles.at(-1)).toBe('Special items');
    expect(titles.slice(0, -1)).toEqual(regionNames.filter((n) => titles.includes(n)));
    expect(renderedRows()).toEqual({ count: 103, units: 299 });
    expect(uiPrefs().summaryGroup).toBe('region');
  });

  it('flat: a single list sorted by remaining desc', () => {
    open('/summary?scope=all&group=flat');
    expect(document.querySelectorAll('.summary-group')).toHaveLength(0);
    const values = [...document.querySelectorAll('.material-row__remaining')].map((el) =>
      Number(el.textContent),
    );
    expect(values[0]).toBe(16);
    expect([...values].sort((a, b) => b - a)).toEqual(values);
  });

  it('"Show collected" reveals rows with remaining = 0', () => {
    resetStoreForTests({
      schemaVersion: 2,
      crafted: {},
      stock: { perfect_snake: 30 },
      goals: { items: [], outfits: [] },
      challenges: {},
      settings: { theme: 'night' },
    });
    open('/summary?scope=all&group=flat');
    expect(renderedRows()).toEqual({ count: 102, units: 284 });
    fireEvent.click(screen.getByRole('switch', { name: 'Show collected' }));
    expect(renderedRows()).toEqual({ count: 103, units: 284 });
  });
});

describe('Summary screen: scope selection and persistence', () => {
  it('goals scope without goals shows the empty state', () => {
    open('/summary?scope=goals');
    expect(screen.getByText('Star items or outfits to set goals')).toBeTruthy();
    expect(screen.queryByTestId('summary-remaining')).toBeNull();
  });

  it('goals scope with an outfit goal shows its totals', () => {
    toggleGoalOutfit('bear_hunter');
    open('/summary?scope=goals&group=flat');
    expect(totalsText()).toMatch(/^Still to collect: 6, 5 material types/);
  });

  it('default without query: all when there are no goals, goals otherwise', () => {
    open('/summary');
    expect(currentRoute.value.query.scope).toBe('all');
    cleanup();
    toggleGoalOutfit('dreamcatcher');
    open('/summary');
    expect(currentRoute.value.query.scope).toBe('goals');
    expect(totalsText()).toMatch(/^Still to collect: 4, 4 material types/);
  });

  it('invalid scope in URL falls back to all', () => {
    open('/summary?scope=outfit:nope');
    expect(currentRoute.value.query.scope).toBe('all');
    expect(totalsText()).toMatch(/^Still to collect: 299, 103 material types/);
  });

  it('saved scope is used when no query; unknown saved scope → all', () => {
    localStorage.setItem(UI_KEY, JSON.stringify({ summaryScope: 'fence', summaryGroup: 'flat' }));
    open('/summary');
    expect(currentRoute.value.query).toMatchObject({ scope: 'fence', group: 'flat' });
    cleanup();
    localStorage.setItem(UI_KEY, JSON.stringify({ summaryScope: 'gone' }));
    open('/summary');
    expect(currentRoute.value.query.scope).toBe('all');
  });

  it('changing the select updates the URL and saves to rdr2-hunter:ui', () => {
    open('/summary?scope=all');
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    act(() => {
      fireEvent.change(select, { target: { value: 'fence' } });
    });
    expect(currentRoute.value.query.scope).toBe('fence');
    expect(uiPrefs()).toEqual({ summaryScope: 'fence', summaryGroup: 'animal' });
    expect(totalsText()).toMatch(/^Still to collect: 26, 26 material types/);
  });
});
