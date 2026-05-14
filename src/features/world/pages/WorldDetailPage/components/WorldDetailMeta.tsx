import type { World } from '@/shared/types';
import s from './WorldDetailMeta.module.css';

interface Props {
  world: World;
}

/**
 * Spec 2.4 — meta sidebar. Labels v UPPERCASE TRACKED, hodnoty plain.
 * Sekce: Žánr · Tóny · Kostky · Systém · Kapacita.
 */
export function WorldDetailMeta({ world }: Props) {
  const freeSpots =
    world.maxPlayers != null ? world.maxPlayers - world.playerCount : null;
  return (
    <div className={s.meta}>
      {world.genre ? (
        <MetaRow label="Žánr">
          <span className={s.value}>{world.genre}</span>
        </MetaRow>
      ) : null}

      {world.tones && world.tones.length > 0 ? (
        <MetaRow label={`Tóny (${world.tones.length})`}>
          <div className={s.chips}>
            {world.tones.map((t) => (
              <span key={t} className={s.chip}>
                {t}
              </span>
            ))}
          </div>
        </MetaRow>
      ) : null}

      {world.dice && world.dice.length > 0 ? (
        <MetaRow label="Kostky">
          <div className={s.chips}>
            {world.dice.map((d) => (
              <span key={d} className={s.chip}>
                {d}
              </span>
            ))}
          </div>
        </MetaRow>
      ) : null}

      <MetaRow label="Systém">
        <span className={s.value}>{world.system}</span>
      </MetaRow>

      <MetaRow label="Kapacita">
        <span className={s.value}>
          {world.playerCount}
          {world.maxPlayers ? ` / ${world.maxPlayers}` : ''} hráč
          {world.playerCount === 1 ? '' : 'ů'}
        </span>
        {freeSpots != null && freeSpots > 0 ? (
          <span className={s.free}> · {freeSpots} volných míst</span>
        ) : null}
      </MetaRow>
    </div>
  );
}

interface MetaRowProps {
  label: string;
  children: React.ReactNode;
}

function MetaRow({ label, children }: MetaRowProps) {
  return (
    <div className={s.row}>
      <p className={s.label}>{label}</p>
      {children}
    </div>
  );
}
