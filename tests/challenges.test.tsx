import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/preact';
import { App } from '../src/app';
import { challengeCategories } from '../src/data';
import { navigate, parseHash, sectionOf } from '../src/router';
import { ChallengeScreen } from '../src/screens/ChallengeScreen';
import { Challenges } from '../src/screens/Challenges';
import { resetStoreForTests, state } from '../src/state/store';

beforeEach(() => {
  resetStoreForTests();
});

afterEach(() => {
  cleanup();
});

describe('routes', () => {
  it('has a Challenges tab and challenge category cards', () => {
    expect(parseHash('#/challenges')?.name).toBe('challenges');
    expect(sectionOf('challenges')).toBe('challenges');
    const r = parseHash('#/challenge/bandit');
    expect(r?.name).toBe('challenge');
    expect(r?.id).toBe('bandit');
    expect(sectionOf('challenge')).toBeNull();
  });
});

describe('Challenges list', () => {
  it('lists all 9 categories with their next rank', () => {
    render(<Challenges />);
    const links = screen.getAllByRole('link');
    expect(links.map((a) => a.textContent)).toEqual(challengeCategories.map((c) => c.name));
    expect(links[0].getAttribute('href')).toBe('#/challenge/bandit');
    expect(screen.getByText('Rank 1: Hold up 5 townsfolk.')).toBeTruthy();
    expect(screen.getByText('Completed 0 of 90 challenges')).toBeTruthy();
  });

  it('shows progress', () => {
    act(() => {
      state.value = { ...state.value, challenges: { bandit: 10, gambler: 2 } };
    });
    render(<Challenges />);
    expect(screen.getByText('Completed 12 of 90 challenges')).toBeTruthy();
    expect(screen.getByText('All ranks completed')).toBeTruthy();
    expect(screen.getByText(/^Rank 3: /, { selector: '.list-row__note' })).toBeTruthy();
  });
});

describe('Challenge category card', () => {
  it('shows how it starts, rewards, tips and all 10 ranks with guides', () => {
    render(<ChallengeScreen id="master_hunter" />);
    const cat = challengeCategories.find((c) => c.id === 'master_hunter')!;
    expect(screen.getByText('Master Hunter Challenges')).toBeTruthy();
    expect(screen.getByText(cat.unlock)).toBeTruthy();
    expect(screen.getByText(cat.reward)).toBeTruthy();
    for (const r of cat.ranks) {
      expect(screen.getByText(r.text)).toBeTruthy();
      expect(screen.getByText(r.guide)).toBeTruthy();
    }
    expect(screen.getAllByRole('checkbox')).toHaveLength(10);
  });

  it('ticking a rank completes the earlier ones and moves "Current"', () => {
    render(<ChallengeScreen id="bandit" />);
    const current = () => document.querySelector('.challenge-rank--current');
    expect(within(current() as HTMLElement).getByText(/Rank 1/)).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Completed: Bandit rank 3' }));
    expect(state.value.challenges.bandit).toBe(3);
    const boxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    expect(boxes.map((b) => b.checked)).toEqual([...Array(10)].map((_, i) => i < 3));
    expect(within(current() as HTMLElement).getByText(/Rank 4/)).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Completed: Bandit rank 3' }));
    expect(state.value.challenges.bandit).toBe(2);
  });

  it('unknown id shows "Not found"', () => {
    render(<ChallengeScreen id="nope" />);
    expect(screen.getByText('Not found')).toBeTruthy();
  });
});

describe('English UI', () => {
  it.each([
    '/trapper/outfits',
    '/trapper/items',
    '/fence/trinkets',
    '/fence/talismans',
    '/animals?tab=regular',
    '/animals?tab=legendary',
    '/animals?tab=birds',
    '/challenges',
    '/challenge/herbalist',
    '/summary?scope=all',
    '/item/legendary_bear_head_hat',
    '/outfit/bear_hunter',
    '/animal/leg_bear',
    '/animal/beaver',
    '/vendor/trapper',
    '/vendor/fence',
    '/settings',
  ])('%s has no Russian text', (path) => {
    act(() => navigate(path));
    const { container } = render(<App />);
    expect(container.textContent).not.toMatch(/[А-Яа-яЁё]/);
  });

  it('the bottom navigation has 5 tabs including Challenges', () => {
    act(() => navigate('/challenges'));
    render(<App />);
    const nav = screen.getByRole('navigation', { name: 'Sections' });
    const tabs = within(nav).getAllByRole('link');
    expect(tabs.map((t) => t.textContent)).toEqual([
      'Trapper',
      'Fence',
      'Animals',
      'Challenges',
      'Summary',
    ]);
    expect(tabs[3].getAttribute('aria-current')).toBe('page');
  });
});
