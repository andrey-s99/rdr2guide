import { navigate, DEFAULT_PATH } from '../router';

export function NotFound() {
  return (
    <div class="not-found">
      <h2 class="screen-title">Not found</h2>
      <p class="muted">This page is not in the journal.</p>
      <button type="button" class="btn btn--primary" onClick={() => navigate(DEFAULT_PATH)}>
        Go to start
      </button>
    </div>
  );
}
