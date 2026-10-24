import { EmptyState } from '../components/EmptyState';

export interface SearchProps {
  /** Query from `?q=`. */
  q: string;
}

export function Search({ q }: SearchProps) {
  return (
    <div class="screen">
      <h2 class="screen-title">Поиск</h2>
      <EmptyState
        icon="search"
        text={q.length < 2 ? 'Введите название вещи, зверя или шкуры' : `Запрос: ${q}`}
      />
    </div>
  );
}
