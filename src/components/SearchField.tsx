import { useEffect, useRef, useState } from 'preact/hooks';
import { CloseIcon, SearchIcon } from '../icons';
import { buildPath, navigate } from '../router';
import '../styles/screens/search.css';

export interface SearchFieldProps {
  /** Current query from the URL (`#/search?q=`). */
  q: string;
}

/** Search input shown in the top bar on the search route (SPEC 9.12). */
export function SearchField({ q }: SearchFieldProps) {
  const [value, setValue] = useState(q);
  const input = useRef<HTMLInputElement>(null);

  // Follow external URL changes (back/forward) without fighting the user's typing.
  useEffect(() => {
    setValue((current) => (current === q ? current : q));
  }, [q]);

  useEffect(() => {
    input.current?.focus();
  }, []);

  const update = (next: string) => {
    setValue(next);
    navigate(buildPath('/search', { q: next }), { replace: true });
  };

  return (
    <form class="search-field" role="search" onSubmit={(e) => e.preventDefault()}>
      <SearchIcon size={20} class="search-field__icon" />
      <input
        ref={input}
        class="search-field__input"
        type="search"
        enterKeyHint="search"
        autocomplete="off"
        spellcheck={false}
        aria-label="Поиск"
        placeholder="Вещь, зверь или шкура"
        value={value}
        onInput={(e) => update(e.currentTarget.value)}
      />
      {value && (
        <button
          type="button"
          class="icon-btn search-field__clear"
          aria-label="Очистить"
          onClick={() => {
            update('');
            input.current?.focus();
          }}
        >
          <CloseIcon size={20} />
        </button>
      )}
    </form>
  );
}
