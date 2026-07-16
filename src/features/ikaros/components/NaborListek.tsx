import { getTheme } from '@/themes/registry';
import { ReportButton } from '@/shared/moderation';
import { systemLabel } from '@/shared/rpg/systems';
import type { Nabor } from '@/shared/types';
import {
  timeAgo,
  seatDots,
  seatsLabel,
  MODE_LABELS,
  STRANA_LABELS,
} from '../lib/nabory';
import s from './NaborListek.module.css';
import './naborSkins.css';

/**
 * 19.3 — univerzální lístek náboru (skeleton). Vzhled = MOTIV světa
 * (`nabor.motiv`): barvy+fonty přes inline `getTheme(motiv).vars` (přebijí
 * globální skin diváka jen pro tento lístek), tvar+ornament z `naborSkins.css`
 * přes stabilní `data-nabor-*` atributy. Deska pod lístkem = globální skin.
 */

interface Props {
  nabor: Nabor;
  onOzvatSe?: (nabor: Nabor) => void;
}

export function NaborListek({ nabor, onOzvatSe }: Props): React.ReactElement {
  const vars = getTheme(nabor.motiv).vars as React.CSSProperties;
  const dots = seatDots(nabor.seatsTaken, nabor.seatsTotal);
  const seats = seatsLabel(nabor.seatsTaken, nabor.seatsTotal);
  const full =
    nabor.status === 'closed' ||
    (nabor.seatsTotal != null && (nabor.seatsTaken ?? 0) >= nabor.seatsTotal);

  return (
    <article
      className={s.card}
      style={vars}
      data-nabor-card
      data-nabor-motiv={nabor.motiv}
      data-strana={nabor.strana}
    >
      {nabor.imageUrl && (
        <div className={s.portrait} data-nabor-portrait>
          <img src={nabor.imageUrl} alt="" />
        </div>
      )}

      <span className={s.side} data-nabor-side data-strana={nabor.strana}>
        {STRANA_LABELS[nabor.strana]}
      </span>

      <h3 className={s.title} data-nabor-title>
        {nabor.title}
      </h3>

      <div className={s.meta}>
        {nabor.system && (
          <span className={s.k}>
            Systém: <b>{systemLabel(nabor.system)}</b>
          </span>
        )}
        {nabor.genre && (
          <span className={s.k}>
            Žánr: <b>{nabor.genre}</b>
          </span>
        )}
        <span className={s.k}>
          {MODE_LABELS[nabor.mode]}
          {nabor.place ? ` · ${nabor.place}` : ''}
        </span>
        {seats && (
          <span className={s.k}>
            Místa:{' '}
            <span className={s.seats} aria-label={`obsazenost ${seats}`}>
              {dots.map((f, i) => (
                <span key={i} className={f ? `${s.dot} ${s.dotFull}` : s.dot} />
              ))}
            </span>{' '}
            {seats}
          </span>
        )}
      </div>

      {nabor.body && <p className={s.body}>{nabor.body}</p>}

      <div className={s.foot}>
        <span className={s.who}>
          <b
            style={
              nabor.authorIsDeleted
                ? { fontStyle: 'italic', opacity: 0.7 }
                : undefined
            }
          >
            {nabor.authorIsDeleted ? 'Smazaný účet' : nabor.authorName}
          </b>
          {' · '}
          {timeAgo(nabor.createdAtUtc)}
          {nabor.worldName ? ` · ${nabor.worldName}` : ''}
        </span>
        <div className={s.footRight}>
          <ReportButton
            variant="icon"
            targetType="nabor"
            targetId={nabor.id}
            targetSnapshot={nabor.title}
            targetAuthorName={nabor.authorName}
            targetAuthorId={nabor.authorId}
            worldId={nabor.worldId}
            targetUrl="/ikaros/nabory"
          />
          {full ? (
            <span className={s.closed}>Obsazeno</span>
          ) : (
            <button
              type="button"
              className={s.reply}
              onClick={() => onOzvatSe?.(nabor)}
            >
              Ozvat se
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
