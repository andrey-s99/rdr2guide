import { computed, signal } from '@preact/signals';

/** Hash router (SPEC 8.1). No libraries: a signal holding the parsed `location.hash`. */

export type RouteName =
  | 'trapper-outfits'
  | 'trapper-items'
  | 'pearson-satchels'
  | 'pearson-camp'
  | 'fence-trinkets'
  | 'fence-talismans'
  | 'animals'
  | 'summary'
  | 'item'
  | 'outfit'
  | 'animal'
  | 'vendor'
  | 'search'
  | 'settings';

export type SectionTab = 'trapper' | 'pearson' | 'fence' | 'animals' | 'summary';

export interface Route {
  name: RouteName;
  /** Path without query, always starting with '/', e.g. '/item/beaver_hat'. */
  path: string;
  /** Decoded path segments, e.g. ['item', 'beaver_hat']. */
  segments: string[];
  /** Query parameters (last value wins). */
  query: Record<string, string>;
  /** Entity id for /item, /outfit, /animal, /vendor routes. */
  id?: string;
  /** Unique key of this location (path + query), used for scroll restoration. */
  key: string;
}

export const DEFAULT_PATH = '/trapper/outfits';

const STATIC_ROUTES: Record<string, RouteName> = {
  '/trapper/outfits': 'trapper-outfits',
  '/trapper/items': 'trapper-items',
  '/pearson/satchels': 'pearson-satchels',
  '/pearson/camp': 'pearson-camp',
  '/fence/trinkets': 'fence-trinkets',
  '/fence/talismans': 'fence-talismans',
  '/animals': 'animals',
  '/summary': 'summary',
  '/search': 'search',
  '/settings': 'settings',
};

const ID_ROUTES: Record<string, RouteName> = {
  item: 'item',
  outfit: 'outfit',
  animal: 'animal',
  vendor: 'vendor',
};

const SECTION_OF: Partial<Record<RouteName, SectionTab>> = {
  'trapper-outfits': 'trapper',
  'trapper-items': 'trapper',
  'pearson-satchels': 'pearson',
  'pearson-camp': 'pearson',
  'fence-trinkets': 'fence',
  'fence-talismans': 'fence',
  animals: 'animals',
  summary: 'summary',
};

export const SECTION_DEFAULT_PATH: Record<SectionTab, string> = {
  trapper: '/trapper/outfits',
  pearson: '/pearson/satchels',
  fence: '/fence/trinkets',
  animals: '/animals',
  summary: '/summary',
};

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/** Parses a location hash like '#/item/foo?x=1'. Returns null for unknown routes. */
export function parseHash(hash: string): Route | null {
  let raw = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!raw.startsWith('/')) raw = '/' + raw;
  const qIndex = raw.indexOf('?');
  const pathPart = qIndex >= 0 ? raw.slice(0, qIndex) : raw;
  const queryPart = qIndex >= 0 ? raw.slice(qIndex + 1) : '';

  const segments = pathPart.split('/').filter(Boolean).map(safeDecode);
  const path = '/' + segments.join('/');

  const query: Record<string, string> = {};
  new URLSearchParams(queryPart).forEach((value, k) => {
    query[k] = value;
  });

  const qs = new URLSearchParams(query).toString();
  const key = qs ? `${path}?${qs}` : path;

  const staticName = STATIC_ROUTES[path];
  if (staticName) return { name: staticName, path, segments, query, key };

  if (segments.length === 2) {
    const idName = ID_ROUTES[segments[0]];
    if (idName && segments[1]) return { name: idName, path, segments, query, id: segments[1], key };
  }
  return null;
}

/** Section tab a route belongs to; null for cards, search and settings. */
export function sectionOf(name: RouteName): SectionTab | null {
  return SECTION_OF[name] ?? null;
}

/** Builds a hash path with query, skipping empty values. */
export function buildPath(path: string, query: Record<string, string | undefined> = {}): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== '') params.set(k, v);
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

// ---------------------------------------------------------------------------
// Runtime state

const fallbackRoute = parseHash(DEFAULT_PATH)!;

function readLocation(): Route | null {
  return parseHash(typeof location === 'undefined' ? '' : location.hash);
}

export const currentRoute = signal<Route>(readLocation() ?? fallbackRoute);

/** Last section tab the user was in; drives tab highlight on cards/search/settings. */
export const lastSection = signal<SectionTab>(sectionOf(currentRoute.value.name) ?? 'trapper');

/** Last visited path (with query) per section, so a tab returns to its sub-screen. */
const lastPathBySection: Partial<Record<SectionTab, string>> = {};

export const activeTab = computed<SectionTab>(
  () => sectionOf(currentRoute.value.name) ?? lastSection.value,
);

/** Where a bottom-nav tab should lead. */
export function tabPath(tab: SectionTab): string {
  return lastPathBySection[tab] ?? SECTION_DEFAULT_PATH[tab];
}

// --- scroll restoration (in memory, per route key) ---
const scrollByKey = new Map<string, number>();
let freshNavigation = false;

function currentScroll(): number {
  return typeof window === 'undefined' ? 0 : window.scrollY;
}

/**
 * Returns the scroll position to apply after the route `key` rendered:
 * the saved one on back/forward, 0 after an explicit navigate().
 */
export function takeScrollTarget(key: string): number {
  if (freshNavigation) {
    freshNavigation = false;
    scrollByKey.delete(key);
    return 0;
  }
  return scrollByKey.get(key) ?? 0;
}

// --- history depth (to know whether history.back() stays inside the app) ---
interface HistoryState {
  idx?: number;
}

function historyIdx(): number {
  const st = (typeof history === 'undefined' ? null : history.state) as HistoryState | null;
  return typeof st?.idx === 'number' ? st.idx : 0;
}

function toHash(path: string): string {
  const p = path.startsWith('#') ? path.slice(1) : path;
  return '#' + (p.startsWith('/') ? p : '/' + p);
}

function setRoute(route: Route): void {
  const section = sectionOf(route.name);
  if (section) {
    lastSection.value = section;
    lastPathBySection[section] = route.key;
  }
  currentRoute.value = route;
}

/** Navigates to a path like '/item/beaver_hat' (or '#/…'). Unknown paths go to the default. */
export function navigate(path: string, opts: { replace?: boolean } = {}): void {
  const hash = toHash(path);
  const route = parseHash(hash);
  if (!route) {
    navigate(DEFAULT_PATH, { replace: true });
    return;
  }
  const sameKey = route.key === currentRoute.value.key;
  if (!opts.replace && sameKey && parseHash(location.hash)?.key === route.key) return;
  if (!sameKey) {
    scrollByKey.set(currentRoute.value.key, currentScroll());
    freshNavigation = true;
  }
  if (opts.replace) {
    history.replaceState({ idx: historyIdx() } satisfies HistoryState, '', hash);
  } else {
    const nextIdx = historyIdx() + 1;
    // Pushes a new entry synchronously; tag it with its depth.
    location.hash = hash;
    history.replaceState({ idx: nextIdx } satisfies HistoryState, '', hash);
  }
  setRoute(route);
}

/** True when going back stays within the app. */
export function canGoBack(): boolean {
  return historyIdx() > 0;
}

/** Back button in the top bar: history.back() if possible, else the last section. */
export function goBack(): void {
  if (canGoBack()) history.back();
  else navigate(tabPath(lastSection.value), { replace: true });
}

function onHashChange(): void {
  const route = readLocation();
  if (!route) {
    navigate(DEFAULT_PATH, { replace: true });
    return;
  }
  if (route.key === currentRoute.value.key) return; // already applied by navigate()
  scrollByKey.set(currentRoute.value.key, currentScroll());
  setRoute(route);
}

/** Starts listening to hash changes. Call once at startup. */
let started = false;

export function startRouter(): void {
  if (started) return;
  started = true;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.addEventListener('hashchange', onHashChange);
  const initial = readLocation();
  if (!initial) navigate(DEFAULT_PATH, { replace: true });
  else setRoute(initial);
}
