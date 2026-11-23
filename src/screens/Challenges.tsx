import { AppLink } from '../components/AppLink';
import { ProgressBar } from '../components/ProgressBar';
import { challengeCategories } from '../data';
import { ChevronIcon, MedalIcon } from '../icons';
import { challengeProgress, state } from '../state/store';
import '../styles/screens/challenges.css';

/** Total challenge ranks completed across all categories. */
export function totalChallengeProgress(): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const cat of challengeCategories) {
    done += challengeProgress(cat.id, state.value);
    total += cat.ranks.length;
  }
  return { done, total };
}

/** Challenges tab: the 9 categories with progress and the next rank to do. */
export function Challenges() {
  const overall = totalChallengeProgress();
  return (
    <div class="screen challenges-screen">
      <h2 class="visually-hidden">Challenges</h2>
      <ProgressBar
        value={overall.done}
        max={overall.total}
        label={`Completed ${overall.done} of ${overall.total} challenges`}
      />
      <p class="muted challenges-intro">
        Each category has 10 ranks that must be done in order. Progress only counts while a rank is
        active. Tap a category for every rank and a guide to finishing it quickly.
      </p>
      <ul class="list challenges-list">
        {challengeCategories.map((cat) => {
          const done = challengeProgress(cat.id, state.value);
          const total = cat.ranks.length;
          const next = cat.ranks[done];
          const complete = done >= total;
          return (
            <li
              key={cat.id}
              class={complete ? 'list-row challenge-row list-row--done' : 'list-row challenge-row'}
            >
              <span class="list-row__icon">
                <MedalIcon size={26} />
              </span>
              <div class="list-row__main">
                <AppLink to={`/challenge/${cat.id}`} class="list-row__link list-row__title">
                  {cat.name}
                </AppLink>
                <p class="list-row__note">
                  {complete ? 'All ranks completed' : `Rank ${next.rank}: ${next.text}`}
                </p>
                <ProgressBar
                  class="challenge-row__progress"
                  value={done}
                  max={total}
                  ariaLabel={`${cat.name}: ${done} of ${total} ranks`}
                />
              </div>
              <span class="list-row__aside challenge-row__count num">
                {done}/{total}
                <ChevronIcon size={18} />
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
