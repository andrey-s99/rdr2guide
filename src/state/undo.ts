// Undo toast state (SPEC 9.10).
import { signal } from '@preact/signals';

export interface ToastData {
  id: number;
  title: string;
  detail: string;
  undo?: () => void;
}

export const TOAST_DURATION_MS = 6000;

export const toast = signal<ToastData | null>(null);

let nextId = 1;
let hideTimer: ReturnType<typeof setTimeout> | undefined;

function clearTimer(): void {
  if (hideTimer !== undefined) {
    clearTimeout(hideTimer);
    hideTimer = undefined;
  }
}

/** Shows a toast, replacing the current one (the previous action stays in effect). */
export function showToast(data: Omit<ToastData, 'id'>): ToastData {
  clearTimer();
  const t: ToastData = { ...data, id: nextId++ };
  toast.value = t;
  hideTimer = setTimeout(() => {
    hideTimer = undefined;
    if (toast.value?.id === t.id) toast.value = null;
  }, TOAST_DURATION_MS);
  return t;
}

export function dismissToast(): void {
  clearTimer();
  toast.value = null;
}

/** Runs the undo action of the current toast (if any) and hides it. */
export function undoToast(): void {
  const current = toast.value;
  dismissToast();
  current?.undo?.();
}
