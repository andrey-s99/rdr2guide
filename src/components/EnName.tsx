import { state } from '../state/store';

/** Whether English names should be shown (settings, SPEC 6.1). Reading subscribes the component. */
export function useShowEnglish(): boolean {
  return state.value.settings.showEnglish;
}

export interface EnNameProps {
  text: string;
  class?: string;
}

/** Small English name under a Russian one; hidden when the setting is off. */
export function EnName({ text, class: cls }: EnNameProps) {
  const show = useShowEnglish();
  if (!show || !text) return null;
  return (
    <span class={cls ? `en ${cls}` : 'en'} lang="en">
      {text}
    </span>
  );
}
