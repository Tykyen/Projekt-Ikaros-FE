import type { CelestialState } from '../api/types';
import type { LunarPhase } from '@/shared/lib/calendarEngine';
import s from './CelestialChip.module.css';

const PHASE_ICONS: Record<LunarPhase, string> = {
  new: '🌑',
  'waxing-crescent': '🌒',
  'first-quarter': '🌓',
  'waxing-gibbous': '🌔',
  full: '🌕',
  'waning-gibbous': '🌖',
  'last-quarter': '🌗',
  'waning-crescent': '🌘',
};

const PHASE_LABELS: Record<LunarPhase, string> = {
  new: 'nov',
  'waxing-crescent': 'dorůstající srpek',
  'first-quarter': 'první čtvrt',
  'waxing-gibbous': 'dorůstající měsíc',
  full: 'úplněk',
  'waning-gibbous': 'couvající měsíc',
  'last-quarter': 'poslední čtvrt',
  'waning-crescent': 'couvající srpek',
};

interface Props {
  state: CelestialState;
}

/**
 * 9.3 — chip s emoji ikonou fáze + tooltip „{body name}: {phase label} (přepsáno PJ)".
 */
export function CelestialChip({ state }: Props) {
  const label = `${state.name}: ${PHASE_LABELS[state.phase]}${state.isManualOverride ? ' (přepsáno PJ)' : ''}`;
  return (
    <span
      className={s.chip}
      title={label}
      aria-label={label}
      style={{ borderColor: state.color }}
    >
      <span aria-hidden>{PHASE_ICONS[state.phase]}</span>
    </span>
  );
}
