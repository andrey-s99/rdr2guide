import { EmptyState } from '../components/EmptyState';

export interface SummaryProps {
  /** Scope id from `?scope=`, undefined when absent. */
  scope?: string;
  /** Grouping from `?group=`, undefined when absent. */
  group?: string;
}

export function Summary({ scope }: SummaryProps) {
  return (
    <div class="screen">
      <h2 class="screen-title">Сводка</h2>
      <EmptyState
        icon="ledger"
        text={
          scope
            ? `Область: ${scope}. Раздел появится в следующей версии`
            : 'Раздел появится в следующей версии'
        }
      />
    </div>
  );
}
