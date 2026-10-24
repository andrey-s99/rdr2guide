import { navigate, DEFAULT_PATH } from '../router';

export function NotFound() {
  return (
    <div class="not-found">
      <h2 class="screen-title">Не найдено</h2>
      <p class="muted">Такой страницы нет в журнале.</p>
      <button type="button" class="btn btn--primary" onClick={() => navigate(DEFAULT_PATH)}>
        На главную
      </button>
    </div>
  );
}
