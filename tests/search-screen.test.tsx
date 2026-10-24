import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { Search, SEARCH_HINT, SEARCH_NOTHING, materialTarget } from '../src/screens/Search';
import { SearchField } from '../src/components/SearchField';
import { materials } from '../src/data';
import { resetStoreForTests, setSettings } from '../src/state/store';

beforeEach(() => {
  resetStoreForTests();
  location.hash = '#/search';
});

afterEach(() => {
  cleanup();
});

describe('Search screen (9.12)', () => {
  it('shows the hint for queries shorter than 2 characters', () => {
    render(<Search q="ч" />);
    expect(screen.getByText(SEARCH_HINT)).toBeTruthy();
    cleanup();
    render(<Search q="" />);
    expect(screen.getByText(SEARCH_HINT)).toBeTruthy();
  });

  it('«чёрн» finds «Чёрный медведь» in the animals group, linking to its card', () => {
    render(<Search q="чёрн" />);
    const link = screen.getByRole('link', { name: /^Чёрный медведь/ });
    expect(link.getAttribute('href')).toMatch(/^#\/animal\//);
    expect(screen.getByRole('heading', { name: /Животные/ })).toBeTruthy();
  });

  it('shows «Ничего не найдено» when nothing matches', () => {
    render(<Search q="zzqqxx" />);
    expect(screen.getByText(SEARCH_NOTHING)).toBeTruthy();
  });

  it('English names follow the setting', () => {
    render(<Search q="чёрн" />);
    expect(screen.queryAllByText('Black Bear').length).toBeGreaterThan(0);
    act(() => setSettings({ showEnglish: false }));
    expect(screen.queryAllByText('Black Bear').length).toBe(0);
  });

  it('every material result has a target card', () => {
    for (const m of materials) expect(materialTarget(m)).not.toBeNull();
    const special = materials.find((m) => m.animalId === null);
    if (special) expect(materialTarget(special)?.to).toMatch(/^\/item\//);
  });

  it('search field keeps the query in the URL and clears it', () => {
    render(<SearchField q="" />);
    const input = screen.getByRole('searchbox', { name: 'Поиск' }) as HTMLInputElement;
    expect(document.activeElement).toBe(input);
    fireEvent.input(input, { target: { value: 'бобр' } });
    expect(decodeURIComponent(location.hash)).toBe('#/search?q=бобр');
    fireEvent.click(screen.getByRole('button', { name: 'Очистить' }));
    expect(location.hash).toBe('#/search');
    expect(input.value).toBe('');
  });
});
