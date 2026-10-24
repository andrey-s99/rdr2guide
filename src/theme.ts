export type ThemeSetting = 'night' | 'paper' | 'system';
export type ResolvedTheme = 'night' | 'paper';

/** Must match `--surface` in styles/tokens.css for each theme. */
export const THEME_SURFACE: Record<ResolvedTheme, string> = {
  night: '#1a1612',
  paper: '#e9dfc8',
};

const DARK_QUERY = '(prefers-color-scheme: dark)';

let systemQuery: MediaQueryList | null = null;
let systemListener: (() => void) | null = null;

export function resolveTheme(theme: ThemeSetting, prefersDark: boolean): ResolvedTheme {
  if (theme === 'system') return prefersDark ? 'night' : 'paper';
  return theme;
}

function setResolved(resolved: ResolvedTheme): void {
  const root = document.documentElement;
  root.dataset.theme = resolved;
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = THEME_SURFACE[resolved];
}

function detachSystemListener(): void {
  if (systemQuery && systemListener) systemQuery.removeEventListener('change', systemListener);
  systemQuery = null;
  systemListener = null;
}

/**
 * Applies a theme setting to `<html data-theme>` and `<meta name="theme-color">`.
 * For 'system' it follows `prefers-color-scheme` live. Returns the resolved theme.
 */
export function applyTheme(theme: ThemeSetting): ResolvedTheme {
  detachSystemListener();
  if (theme !== 'system') {
    setResolved(theme);
    return theme;
  }
  const mq = typeof window.matchMedia === 'function' ? window.matchMedia(DARK_QUERY) : null;
  const resolved = resolveTheme('system', mq ? mq.matches : true);
  setResolved(resolved);
  if (mq) {
    systemQuery = mq;
    systemListener = () => setResolved(resolveTheme('system', mq.matches));
    mq.addEventListener('change', systemListener);
  }
  return resolved;
}
