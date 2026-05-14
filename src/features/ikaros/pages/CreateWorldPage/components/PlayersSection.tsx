import { SectionCard } from './SectionCard';
import s from './sections.module.css';

interface Props {
  playersWanted: string;
  maxPlayers: number | null;
  onPlayersWantedChange: (v: string) => void;
  onMaxPlayersChange: (v: number | null) => void;
}

export function PlayersSection({
  playersWanted,
  maxPlayers,
  onPlayersWantedChange,
  onMaxPlayersChange,
}: Props) {
  return (
    <SectionCard index={3} title="Hráči">
      <div className={s.twoCol}>
        <div className={s.field}>
          <label htmlFor="cw-players-wanted" className={s.label}>
            Koho hledáte
          </label>
          <textarea
            id="cw-players-wanted"
            className={s.textarea}
            value={playersWanted}
            onChange={(e) => onPlayersWantedChange(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="Hledám aktivní a kreativní hráče na asynchronní post-by-post hraní…"
          />
        </div>

        <div className={s.field}>
          <label htmlFor="cw-max-players" className={s.label}>
            Kapacita
          </label>
          <input
            id="cw-max-players"
            type="number"
            className={s.input}
            value={maxPlayers ?? ''}
            min={1}
            max={999}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === '') {
                onMaxPlayersChange(null);
                return;
              }
              const n = Number(raw);
              if (Number.isFinite(n)) {
                onMaxPlayersChange(Math.min(999, Math.max(1, Math.floor(n))));
              }
            }}
            placeholder="max. počet"
          />
          <p className={s.helper}>
            Pro sort „volná místa" v Přehledu vesmírů. Nepovinné.
          </p>
        </div>
      </div>
    </SectionCard>
  );
}
