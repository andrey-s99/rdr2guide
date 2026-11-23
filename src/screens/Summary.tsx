import { useEffect, useMemo } from 'preact/hooks';
import { AppLink } from '../components/AppLink';
import { EmptyState } from '../components/EmptyState';
import { MaterialRow } from '../components/MaterialRow';
import { ProgressBar } from '../components/ProgressBar';
import { SectionHeader } from '../components/SectionHeader';
import { SegmentedControl, type SegmentOption } from '../components/SegmentedControl';
import { materialsById, regionsById } from '../data';
import type { Item } from '../data/types';
import { ChevronIcon } from '../icons';
import { computeNeeds, craftedProgress, type MaterialNeed } from '../logic/calc';
import { getScopeItems, scopeExists, scopeGroups, DEFAULT_SCOPE } from '../logic/scopes';
import {
  craftedText,
  groupByAnimal,
  groupByRegion,
  isSummaryGroupMode,
  kindsWord,
  sortFlat,
  usedInScope,
  visibleRows,
  type MaterialGroup,
  type SummaryGroupMode,
} from '../logic/summary';
import { buildPath, navigate } from '../router';
import {
  initialSummaryGroup,
  initialSummaryScope,
  loadUiPrefs,
  saveUiPrefs,
} from '../state/persist';
import { sessionSignal } from '../state/session';
import { goalsCount, state } from '../state/store';
import '../styles/screens/summary.css';

export interface SummaryProps {
  /** Scope id from `?scope=`, undefined when absent. */
  scope?: string;
  /** Grouping from `?group=`, undefined when absent. */
  group?: string;
}

const GROUP_OPTIONS: SegmentOption<SummaryGroupMode>[] = [
  { value: 'animal', label: 'By animal' },
  { value: 'region', label: 'By region' },
  { value: 'flat', label: 'List' },
];

const SHOW_COLLECTED_KEY = 'summary:show-collected';

/** Effective scope: URL value if valid, unknown → 'all', absent → saved/default (9.9). */
function resolveScope(fromUrl: string | undefined, hasGoals: boolean): string {
  if (fromUrl !== undefined && fromUrl !== '') {
    return scopeExists(fromUrl) ? fromUrl : DEFAULT_SCOPE;
  }
  return initialSummaryScope(loadUiPrefs(), hasGoals);
}

function resolveGroup(fromUrl: string | undefined): SummaryGroupMode {
  return isSummaryGroupMode(fromUrl) ? fromUrl : initialSummaryGroup(loadUiPrefs());
}

function summaryPath(scope: string, group: SummaryGroupMode): string {
  return buildPath('/summary', { scope, group });
}

interface RowsProps {
  rows: readonly MaterialNeed[];
  scopeItemIds: ReadonlySet<string>;
}

/** Non-hunting materials have no animal link, so show where to get them instead. */
function materialNote(materialId: string): string | undefined {
  const m = materialsById.get(materialId);
  return m?.kind === 'special' ? m.sourceEn : undefined;
}

function MaterialRows({ rows, scopeItemIds }: RowsProps) {
  return (
    <div class="summary-rows">
      {rows.map((r) => (
        <MaterialRow
          key={r.materialId}
          materialId={r.materialId}
          need={r.need}
          note={materialNote(r.materialId)}
          usedIn={usedInScope(r.materialId, scopeItemIds)}
        />
      ))}
    </div>
  );
}

interface AnimalGroupProps extends Omit<RowsProps, 'rows'> {
  group: MaterialGroup;
  /** 'primary' — show regions[0]; 'others' — show regions[1..] (region mode). */
  regionInfo: 'primary' | 'others';
}

function AnimalGroup({ group, scopeItemIds, regionInfo }: AnimalGroupProps) {
  const { animal } = group;
  const regionNames = animal
    ? (regionInfo === 'primary' ? animal.regions.slice(0, 1) : animal.regions.slice(1))
        .map((id) => regionsById.get(id)?.nameEn ?? id)
        .join(', ')
    : '';
  const badge = (
    <span
      class={group.remaining > 0 ? 'badge badge--brass' : 'badge badge--ok'}
      aria-label={`Still to collect: ${group.remaining}`}
    >
      {group.remaining}
    </span>
  );
  return (
    <section class="summary-group">
      <h3 class="summary-group__title">
        {animal ? (
          <AppLink to={`/animal/${animal.id}`} class="summary-group__head">
            <span class="summary-group__main">
              <span class="summary-group__name">{animal.nameEn}</span>
              {regionNames && <span class="summary-group__regions">{regionNames}</span>}
            </span>
            {badge}
            <ChevronIcon size={16} class="summary-group__chevron" />
          </AppLink>
        ) : (
          <span class="summary-group__head">
            <span class="summary-group__main">
              <span class="summary-group__name">{group.title}</span>
            </span>
            {badge}
          </span>
        )}
      </h3>
      <MaterialRows rows={group.rows} scopeItemIds={scopeItemIds} />
    </section>
  );
}

export function Summary({ scope: scopeParam, group: groupParam }: SummaryProps) {
  const showCollected = sessionSignal(SHOW_COLLECTED_KEY, false);
  const s = state.value;
  const hasGoals = goalsCount.value > 0;
  const scope = resolveScope(scopeParam, hasGoals);
  const group = resolveGroup(groupParam);

  // Keep the URL in sync with the effective scope/grouping (no extra history entry).
  useEffect(() => {
    if (scopeParam !== scope || groupParam !== group) {
      navigate(summaryPath(scope, group), { replace: true });
    }
  }, [scopeParam, groupParam, scope, group]);

  const scopeItems: Item[] = useMemo(() => getScopeItems(scope, s.goals), [scope, s.goals]);
  const scopeItemIds = useMemo(() => new Set(scopeItems.map((i) => i.id)), [scopeItems]);
  const needs = computeNeeds(scopeItems, s.stock, s.crafted);
  const progress = craftedProgress(scopeItems, s.crafted);
  const rows = visibleRows(needs.rows, showCollected.value);

  const change = (nextScope: string, nextGroup: SummaryGroupMode) => {
    saveUiPrefs({ summaryScope: nextScope, summaryGroup: nextGroup });
    navigate(summaryPath(nextScope, nextGroup), { replace: true });
  };

  const goalsEmpty = scope === 'goals' && !hasGoals;

  let content;
  if (goalsEmpty) {
    content = <EmptyState icon="star" text="Star items or outfits to set goals" />;
  } else if (rows.length === 0) {
    content = (
      <EmptyState
        icon="check"
        text={
          needs.rows.length > 0
            ? 'Everything needed is collected'
            : 'Nothing here — everything is crafted'
        }
      />
    );
  } else if (group === 'flat') {
    content = (
      <div class="summary-flat">
        <MaterialRows rows={sortFlat(rows)} scopeItemIds={scopeItemIds} />
      </div>
    );
  } else if (group === 'region') {
    content = groupByRegion(rows).map((rg) => (
      <section key={rg.id} class="summary-region">
        <SectionHeader
          title={rg.title}
          icon={rg.region ? 'map-pin' : undefined}
          extra={`${rg.remaining} left`}
        />
        {rg.region ? (
          rg.groups.map((g) => (
            <AnimalGroup key={g.id} group={g} scopeItemIds={scopeItemIds} regionInfo="others" />
          ))
        ) : (
          <MaterialRows rows={rg.groups[0]?.rows ?? []} scopeItemIds={scopeItemIds} />
        )}
      </section>
    ));
  } else {
    content = groupByAnimal(rows).map((g) => (
      <AnimalGroup key={g.id} group={g} scopeItemIds={scopeItemIds} regionInfo="primary" />
    ));
  }

  return (
    <div class="screen summary">
      <h2 class="visually-hidden">Summary</h2>

      <div class="summary-controls">
        <label class="summary-scope">
          <span class="summary-scope__label">What to count</span>
          <select
            class="select"
            value={scope}
            onChange={(e) => change((e.currentTarget as HTMLSelectElement).value, group)}
          >
            {scopeGroups.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.scopes.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.labelEn}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <SegmentedControl
          variant="boxed"
          ariaLabel="Grouping"
          options={GROUP_OPTIONS}
          value={group}
          onChange={(g) => change(scope, g)}
        />

        <label class="switch">
          <span>Show collected</span>
          <input
            type="checkbox"
            role="switch"
            class="switch__input"
            checked={showCollected.value}
            onChange={(e) => {
              showCollected.value = (e.currentTarget as HTMLInputElement).checked;
            }}
          />
        </label>
      </div>

      {!goalsEmpty && (
        <div class="summary-totals">
          <p class="summary-totals__line" data-testid="summary-remaining">
            Still to collect: <strong class="num">{needs.totals.units}</strong>,{' '}
            <strong class="num">{needs.totals.distinct}</strong> {kindsWord(needs.totals.distinct)}
          </p>
          <ProgressBar
            value={progress.done}
            max={progress.total}
            label={craftedText(progress.done, progress.total)}
          />
        </div>
      )}

      <div class="summary-list">{content}</div>
    </div>
  );
}
