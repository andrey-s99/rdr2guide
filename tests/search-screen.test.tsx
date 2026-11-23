import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { Search, SEARCH_HINT, SEARCH_NOTHING, materialTarget } from '../src/screens/Search';
import { SearchField } from '../src/components/SearchField';
import { materials } from '../src/data';
import { resetStoreForTests } from '../src/state/store';

beforeEach(() => {
  resetStoreForTests();
  location.hash = '#/search';
});

afterEach(() => {
  cleanup();
});

describe('Search screen (9.12)', () => {
  it('shows the hint for queries shorter than 2 characters', () => {
    render(<Search q="b" />);
    expect(screen.getByText(SEARCH_HINT)).toBeTruthy();
    cleanup();
    render(<Search q="" />);
    expect(screen.getByText(SEARCH_HINT)).toBeTruthy();
  });

  it('"black b" finds "Black Bear" in the animals group, linking to its card', () => {
    render(<Search q="black b" />);
    const link = screen.getByRole('link', { name: /^Black Bear/ });
    expect(link.getAttribute('href')).toMatch(/^#\/animal\//);
    expect(screen.getByRole('heading', { name: /Animals/ })).toBeTruthy();
  });

  it('shows "Nothing found" when nothing matches', () => {
    render(<Search q="zzqqxx" />);
    expect(screen.getByText(SEARCH_NOTHING)).toBeTruthy();
  });

  it('a Russian query still finds the item, shown by its English name', () => {
    render(<Search q="чёрн" />);
    expect(screen.queryAllByText('Black Bear').length).toBeGreaterThan(0);
  });

  it('every material result has a target card', () => {
    for (const m of materials) expect(materialTarget(m)).not.toBeNull();
    const special = materials.find((m) => m.animalId === null);
    if (special) expect(materialTarget(special)?.to).toMatch(/^\/item\//);
  });

  it('search field keeps the query in the URL and clears it', () => {
    render(<SearchField q="" />);
    const input = screen.getByRole('searchbox', { name: 'Search' }) as HTMLInputElement;
    expect(document.activeElement).toBe(input);
    fireEvent.input(input, { target: { value: 'beaver' } });
    expect(decodeURIComponent(location.hash)).toBe('#/search?q=beaver');
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(location.hash).toBe('#/search');
    expect(input.value).toBe('');
  });
});
