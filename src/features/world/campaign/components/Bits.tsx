import { valenceToken } from '../campaignColors';
import s from './campaign.module.css';

/** Priorita 1–5 jako tečky. */
export function PriorityPips({ value }: { value: number }) {
  return (
    <span className={s.pips} aria-label={`Priorita ${value} z 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={i <= value ? `${s.pip} ${s.pipOn}` : s.pip}
        />
      ))}
    </span>
  );
}

/** Chip jedné strany vztahu — emoce + valence, barva dle valence. */
export function EmotionChip({
  tag,
  valence,
  prefix,
}: {
  tag?: string;
  valence?: number;
  prefix?: string;
}) {
  const v = valence ?? 0;
  const color = `var(${valenceToken(v)})`;
  const label = tag || (v > 0 ? 'kladný' : v < 0 ? 'záporný' : 'neutrál');
  const sign = v > 0 ? `+${v}` : `${v}`;
  return (
    <span className={s.emotionChip} style={{ borderColor: color, color }}>
      {prefix}
      {label}
      {v !== 0 && <span className={s.emotionVal}>{sign}</span>}
    </span>
  );
}
