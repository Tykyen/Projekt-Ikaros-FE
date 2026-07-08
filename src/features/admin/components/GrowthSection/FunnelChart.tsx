import { Fragment } from 'react';
import type { GrowthFunnelStep, FunnelStepKey } from '../../api/growth.types';
import s from './GrowthSection.module.css';

/** CZ popisky milníků + krátká definice do tooltipu. */
const STEP_META: Record<FunnelStepKey, { label: string; hint: string }> = {
  registered: {
    label: 'Registrovaní',
    hint: 'Založený účet (bez smazaných).',
  },
  joinedWorld: {
    label: 'Vstoupil do světa',
    hint: 'Je členem aspoň jednoho světa.',
  },
  character: {
    label: 'Má postavu',
    hint: 'Vytvořil aspoň jednu hráčskou postavu.',
  },
  action: {
    label: 'Zahrál si',
    hint: 'Poslal aspoň jednu zprávu ve světovém chatu.',
  },
  dice: {
    label: 'Hází kostkou (odhad)',
    hint: 'Hodil aspoň jednou — proxy „reálně hraje". Session jako entita neexistuje.',
  },
};

/** Konverze mezi sousedními kroky v %; první krok bez konverze. */
function conversion(prev: number, curr: number): number | null {
  if (prev <= 0) return null;
  return Math.round((curr / prev) * 100);
}

/**
 * 19.1 — onboarding trychtýř. Horizontální bary klesající šířky (zarovnané
 * vlevo, ať jdou délky srovnat), mezi kroky konverzní %. Vlastní CSS, žádný
 * chart dep (vzor MiniBarChart). Šířka baru = total / total prvního kroku.
 */
export function FunnelChart({ steps }: { steps: GrowthFunnelStep[] }) {
  const base = Math.max(1, steps[0]?.total ?? 1);

  return (
    <div className={s.funnel}>
      {steps.map((step, i) => {
        const meta = STEP_META[step.key];
        const pct = Math.max(3, Math.round((step.total / base) * 100));
        const conv = i > 0 ? conversion(steps[i - 1].total, step.total) : null;
        return (
          <Fragment key={step.key}>
            {conv !== null && (
              <div className={s.funnelConv} aria-hidden>
                ↓ {conv} %
              </div>
            )}
            <div className={s.funnelRow} title={meta.hint}>
              <span className={s.funnelLabel}>{meta.label}</span>
              <span className={s.funnelTrack}>
                <span
                  className={s.funnelBar}
                  style={{ width: `${pct}%` }}
                />
              </span>
              <span className={s.funnelValue}>
                {step.total.toLocaleString('cs-CZ')}
                {step.recent > 0 && (
                  <span className={s.funnelRecent}>
                    {' '}
                    (+{step.recent.toLocaleString('cs-CZ')})
                  </span>
                )}
              </span>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}
