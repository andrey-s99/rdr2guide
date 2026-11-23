import { Checkbox } from '../components/Checkbox';
import { PaperCard } from '../components/PaperCard';
import { ProgressBar } from '../components/ProgressBar';
import { SectionHeader } from '../components/SectionHeader';
import { challengeCategoriesById } from '../data';
import type { ChallengeCategoryId } from '../data/types';
import { challengeProgress, state, toggleChallengeRank } from '../state/store';
import { NotFound } from './NotFound';
import '../styles/screens/challenges.css';

export interface ChallengeScreenProps {
  id: string;
}

/** One challenge category `#/challenge/<id>`: how it starts, rewards, tips and all 10 ranks. */
export function ChallengeScreen({ id }: ChallengeScreenProps) {
  const cat = challengeCategoriesById.get(id as ChallengeCategoryId);
  if (!cat) return <NotFound />;
  const done = challengeProgress(cat.id, state.value);
  const total = cat.ranks.length;

  return (
    <div class="screen challenge-screen">
      <PaperCard as="article" class="challenge-card" title={`${cat.name} Challenges`}>
        <ProgressBar value={done} max={total} label={`Completed ${done} of ${total} ranks`} />
        <section class="challenge-card__block">
          <h3 class="challenge-card__heading">How it starts</h3>
          <p>{cat.unlock}</p>
        </section>
        <section class="challenge-card__block">
          <h3 class="challenge-card__heading">Rewards</h3>
          <p>{cat.reward}</p>
        </section>
        {cat.tips.length > 0 && (
          <section class="challenge-card__block">
            <h3 class="challenge-card__heading">Tips</h3>
            <ul class="challenge-card__tips">
              {cat.tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
        )}
      </PaperCard>

      <section>
        <SectionHeader title="Ranks" extra={`${done} of ${total} done`} />
        <ol class="list challenge-ranks">
          {cat.ranks.map((r) => {
            const rankDone = r.rank <= done;
            const current = r.rank === done + 1;
            const cls = [
              'list-row',
              'challenge-rank',
              rankDone && 'list-row--done',
              current && 'challenge-rank--current',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <li key={r.rank} class={cls} aria-current={current ? 'step' : undefined}>
                <div class="list-row__main">
                  <p class="challenge-rank__label">
                    Rank {r.rank}
                    {current && <span class="badge badge--accent">Current</span>}
                  </p>
                  <p class="challenge-rank__text">{r.text}</p>
                  <p class="challenge-rank__reward">Reward: {r.reward}</p>
                  <p class="challenge-rank__guide">{r.guide}</p>
                </div>
                <div class="list-row__actions">
                  <Checkbox
                    checked={rankDone}
                    label={`Completed: ${cat.name} rank ${r.rank}`}
                    onChange={() => toggleChallengeRank(cat.id, r.rank)}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
