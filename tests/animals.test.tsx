import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { animals, materials, meta } from '../src/data';
import type { UserState } from '../src/data/types';
import { createInitialState } from '../src/state/persist';
import { resetSessionForTests } from '../src/state/session';
import { resetStoreForTests, state } from '../src/state/store';
import { Animals, animalOnlyNeeded, animalRegionFilter } from '../src/screens/Animals';
import { AnimalScreen } from '../src/screens/AnimalScreen';

const rowIds = (): string[] =>
  Array.from(document.querySelectorAll<HTMLAnchorElement>('a.animal-row')).map((a) =>
    a.getAttribute('href')!.replace('#/animal/', ''),
  );

const setState = (patch: Partial<UserState>) => {
  act(() => {
    state.value = { ...createInitialState(), ...patch };
  });
};

beforeEach(() => {
  resetStoreForTests();
  resetSessionForTests();
  animalRegionFilter.value = [];
  animalOnlyNeeded.value = true;
});

afterEach(() => {
  cleanup();
});

describe('Animals list (9.7)', () => {
  it.each([
    ['regular', 'regular'],
    ['legendary', 'legendary'],
    ['birds', 'bird'],
  ] as const)('renders the %s tab', (tab, type) => {
    render(<Animals tab={tab} />);
    const ids = rowIds();
    expect(ids.length).toBeGreaterThan(0);
    const expected = animals.filter((a) => a.type === type).map((a) => a.id);
    for (const id of ids) expect(expected).toContain(id);
  });

  it('sorts by need desc, then by name', () => {
    render(<Animals tab="regular" />);
    const needs = Array.from(document.querySelectorAll('a.animal-row .badge--accent')).map((b) =>
      Number(b.textContent?.replace(/\D+/g, '')),
    );
    expect(needs.length).toBeGreaterThan(1);
    for (let i = 1; i < needs.length; i++) expect(needs[i - 1]).toBeGreaterThanOrEqual(needs[i]);
  });

  it('region filter narrows the list', () => {
    render(<Animals tab="regular" />);
    const before = rowIds();
    expect(before).toContain('armadillo');
    fireEvent.click(screen.getByRole('button', { name: 'Лемойн' }));
    const after = rowIds();
    expect(after.length).toBeLessThan(before.length);
    expect(after).not.toContain('armadillo');
    for (const id of after) {
      expect(animals.find((a) => a.id === id)?.regions).toContain('lemoyne');
    }
    // Deselecting returns to «all regions».
    fireEvent.click(screen.getByRole('button', { name: 'Лемойн' }));
    expect(rowIds()).toEqual(before);
  });

  it('«Только нужные» hides an animal once its item is crafted', () => {
    render(<Animals tab="regular" />);
    expect(rowIds()).toContain('armadillo');
    setState({ crafted: { billy_vest: { at: '2026-01-01T00:00:00.000Z', deducted: {} } } });
    expect(rowIds()).not.toContain('armadillo');
    // Switch off → shown again with «хватает».
    fireEvent.click(screen.getByRole('switch', { name: 'Только нужные' }));
    expect(rowIds()).toContain('armadillo');
  });

  it('«Только нужные» hides an animal once the stock suffices', () => {
    render(<Animals tab="regular" />);
    expect(rowIds()).toContain('opossum');
    setState({ stock: { perfect_opossum: 4 } });
    expect(rowIds()).not.toContain('opossum');
  });

  it('shows an empty state when nothing is needed', () => {
    setState({ stock: Object.fromEntries(materials.map((m) => [m.id, 999])) });
    render(<Animals tab="birds" />);
    expect(rowIds()).toEqual([]);
    expect(screen.getByText('Все звери из этого списка уже не нужны')).toBeTruthy();
  });

  it('legendary rows show pelt status', () => {
    setState({ stock: { legendary_bear_pelt: 1 } });
    animalOnlyNeeded.value = false;
    render(<Animals tab="legendary" />);
    const bear = document.querySelector('a[href="#/animal/leg_bear"]');
    expect(bear?.textContent).toContain('Шкура у Охотника');
    const ids = rowIds();
    // Obtained legendary animals go last.
    expect(ids[ids.length - 1]).toBe('leg_bear');
    expect(screen.getAllByText('Не добыт').length).toBe(ids.length - 1);
  });
});

describe('Animal card (9.8)', () => {
  it('renders links with target _blank and rel noopener', () => {
    render(<AnimalScreen id="leg_bear" />);
    const bear = animals.find((a) => a.id === 'leg_bear')!;
    expect(screen.getByText(bear.nameRu)).toBeTruthy();
    expect(screen.getByText('Тактика')).toBeTruthy();
    expect(screen.getByText('Когда доступен')).toBeTruthy();
    const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('a.ext-link'));
    const urls = new Set([...bear.links, ...meta.globalMapLinks].map((l) => l.url));
    expect(anchors.length).toBe(urls.size);
    expect(anchors[0].getAttribute('href')).toBe(bear.links[0].url);
    for (const a of anchors) {
      expect(a.getAttribute('target')).toBe('_blank');
      expect(a.getAttribute('rel')).toContain('noopener');
    }
    expect(screen.getByText('Материалы с этого зверя')).toBeTruthy();
  });

  it('lists materials and expands «Для чего нужно» with item links', () => {
    render(<AnimalScreen id="armadillo" />);
    expect(screen.getByText('Чем убивать для идеальной шкуры')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Для чего нужно/ }));
    expect(document.querySelector('a[href="#/item/billy_vest"]')).toBeTruthy();
  });

  it('unknown id shows «Не найдено»', () => {
    render(<AnimalScreen id="no_such_animal" />);
    expect(screen.getByText('Не найдено')).toBeTruthy();
  });
});
