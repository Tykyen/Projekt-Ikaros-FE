/**
 * 16.2e — sdílené prezentační jádro DrD II bestie (mapa ↔ chat).
 *
 * Vzor `DrdPlusBestieCombatActions`: Hranice (reference) / Charakteristiky
 * (klikací 2k6+úroveň) / Zvláštní schopnosti (poznámky) renderuje mapový
 * `Drd2BestiePanel` i (budoucí) chatový panel. Liší se jen persistence +
 * routing hodů (onMapRoll vs useChatDiaryRoll) a Sudba/HP, které řeší rodič.
 *
 * Rodič drží edit draft (`dStats`) + handlery; jádro je čistě prezentační.
 * `onRoll(label, baseMod, kind)` — vždy `2d6+` (otevřený hod DrD).
 */
import styles from './Drd2BestiePanel.module.css';

export interface Charakteristika {
  nazev?: string;
  uroven?: unknown;
}
export interface ZvlSchopnost {
  nazev?: string;
  popis?: string;
}

const toNum = (v: unknown, fb = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
};

const HRANICE: ReadonlyArray<[string, string, string]> = [
  ['telo', 'Tělo', styles.body],
  ['duse', 'Duše', styles.soul],
  ['vliv', 'Vliv', styles.infl],
];

export interface Drd2BestieCombatActionsProps {
  /** Aktuální systemStats (view). */
  ss: Record<string, unknown>;
  /** Edit draft systemStats (jen v edit módu). */
  dStats: Record<string, unknown>;
  editing: boolean;
  /** Smí házet (klikací charakteristiky aktivní). */
  interactive: boolean;
  /** Hod charakteristiky: `2d6+` + úroveň. */
  onRoll: (label: string, baseMod: number, kind: '2d6+') => void;
  setStat: (key: string, v: unknown) => void;
  setChar: (i: number, patch: Partial<Charakteristika>) => void;
  addChar: () => void;
  delChar: (i: number) => void;
  setZs: (i: number, patch: Partial<ZvlSchopnost>) => void;
  addZs: () => void;
  delZs: (i: number) => void;
}

export function Drd2BestieCombatActions({
  ss,
  dStats,
  editing,
  interactive,
  onRoll,
  setStat,
  setChar,
  addChar,
  delChar,
  setZs,
  addZs,
  delZs,
}: Drd2BestieCombatActionsProps): React.ReactElement {
  const src = editing ? dStats : ss;
  const chars = (Array.isArray(src.charakteristiky)
    ? src.charakteristiky
    : []) as Charakteristika[];
  const zsList = (Array.isArray(src.zvlastni_schopnosti)
    ? src.zvlastni_schopnosti
    : []) as ZvlSchopnost[];

  return (
    <>
      {/* HRANICE — reference (nehází se), edit = čísla */}
      <div className={styles.stitle}>
        Hranice <small>reference · velikosti v úpravě</small>
      </div>
      <div className={styles.hran}>
        {HRANICE.map(([key, label, cls]) => (
          <div className={`${styles.hcell} ${cls}`} key={key}>
            <span className={styles.hl}>{label}</span>
            {editing ? (
              <input
                className={styles.hin}
                value={String(dStats[key] ?? '')}
                onChange={(e) => setStat(key, e.target.value)}
                aria-label={`Hranice ${label}`}
              />
            ) : (
              <span className={styles.hv}>{toNum(ss[key])}</span>
            )}
          </div>
        ))}
      </div>

      {/* CHARAKTERISTIKY — klik = 2k6 + úroveň */}
      <div className={styles.stitle}>
        Charakteristiky <small>{editing ? 'úprava' : 'klik = 2k6 + úroveň'}</small>
      </div>
      {!editing &&
        chars.map((c, i) => (
          <button
            key={i}
            type="button"
            className={styles.char}
            disabled={!interactive}
            onClick={() => onRoll(String(c.nazev || 'Charakteristika'), toNum(c.uroven), '2d6+')}
            aria-label={
              interactive
                ? `Hodit ${c.nazev || 'charakteristiku'}`
                : String(c.nazev || 'Charakteristika')
            }
          >
            <span className={styles.charName}>{c.nazev || '(bez názvu)'}</span>
            <span className={styles.charLvl}>{toNum(c.uroven)}</span>
          </button>
        ))}
      {!editing && chars.length === 0 && (
        <p className={styles.hint}>Žádné charakteristiky.</p>
      )}
      {editing &&
        chars.map((c, i) => (
          <div className={styles.charEdit} key={i}>
            <input
              className={styles.ed}
              value={String(c.nazev ?? '')}
              onChange={(e) => setChar(i, { nazev: e.target.value })}
              placeholder="název"
              aria-label={`Charakteristika ${i + 1} název`}
            />
            <input
              className={`${styles.ed} ${styles.edNum}`}
              value={String(c.uroven ?? '')}
              onChange={(e) => setChar(i, { uroven: e.target.value })}
              placeholder="úr."
              aria-label={`Charakteristika ${i + 1} úroveň`}
            />
            <button
              type="button"
              className={styles.del}
              onClick={() => delChar(i)}
              aria-label="Odebrat charakteristiku"
            >
              ✕
            </button>
          </div>
        ))}
      {editing && (
        <button type="button" className={styles.miniAdd} onClick={addChar}>
          + přidat charakteristiku
        </button>
      )}

      {/* ZVLÁŠTNÍ SCHOPNOSTI — poznámky */}
      <div className={styles.stitle}>
        Zvláštní schopnosti <small>{editing ? 'úprava' : 'jen k nahlédnutí'}</small>
      </div>
      {!editing &&
        zsList.map((z, i) => (
          <div className={styles.zs} key={i}>
            <span className={styles.zk}>{z.nazev}</span>
            {z.popis && <span className={styles.zv}>{z.popis}</span>}
          </div>
        ))}
      {!editing && zsList.length === 0 && (
        <p className={styles.hint}>Žádné zvláštní schopnosti.</p>
      )}
      {editing &&
        zsList.map((z, i) => (
          <div className={styles.zsEdit} key={i}>
            <input
              className={`${styles.ed} ${styles.edTxt}`}
              value={String(z.nazev ?? '')}
              onChange={(e) => setZs(i, { nazev: e.target.value })}
              placeholder="název schopnosti"
              aria-label={`Schopnost ${i + 1} název`}
            />
            <input
              className={`${styles.ed} ${styles.edTxt}`}
              value={String(z.popis ?? '')}
              onChange={(e) => setZs(i, { popis: e.target.value })}
              placeholder="popis"
              aria-label={`Schopnost ${i + 1} popis`}
            />
            <button
              type="button"
              className={styles.del}
              onClick={() => delZs(i)}
              aria-label="Odebrat schopnost"
            >
              ✕
            </button>
          </div>
        ))}
      {editing && (
        <button type="button" className={styles.miniAdd} onClick={addZs}>
          + přidat schopnost
        </button>
      )}
    </>
  );
}

export default Drd2BestieCombatActions;
