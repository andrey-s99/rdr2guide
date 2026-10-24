// In-memory UI state that lives for the session only (SPEC 9: filters, collapsed groups).
import { signal, type Signal } from '@preact/signals';
import type { StatusFilter } from '../logic/filters';

const store = new Map<string, Signal<unknown>>();

/** Returns a signal kept in memory for the whole session under `key`. */
export function sessionSignal<T>(key: string, initial: T): Signal<T> {
  let s = store.get(key) as Signal<T> | undefined;
  if (!s) {
    s = signal<T>(initial);
    store.set(key, s as Signal<unknown>);
  }
  return s;
}

/** Status filter of a list screen, «Не сделано» by default. */
export function statusFilterSignal(screenKey: string): Signal<StatusFilter> {
  return sessionSignal<StatusFilter>(`status-filter:${screenKey}`, 'not_crafted');
}

/** Test helper: forgets all session values. */
export function resetSessionForTests(): void {
  store.clear();
}
