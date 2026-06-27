/**
 * 16.2d — sdílené prezentační jádro DrD+ bestie (mapa ↔ chat).
 *
 * Vzor `Drd16BestieCombatActions`: stejné Útoky / Ochrana / Vlastnosti-Tělo-Smysly
 * / Schopnosti / Poznámky (view + inline edit) renderuje mapový `DrdPlusBestiePanel`
 * i chatový `DrdPlusChatBestiePanel`. Liší se jen persistence (token vs combatant),
 * routing hodů (onMapRoll vs useChatDiaryRoll) a wound (mapa `token.injury`, chat
 * `systemStats.injury`) → wound vkládá rodič přes `woundSlot` (mezi Útoky a Ochranu).
 *
 * Rodič drží edit draft (`dStats`/`dAbil`/`dNotes`) + handlery; jádro je čistě
 * prezentační. `onRoll(label, baseMod, kind, initiative?)` — postih si přičítá rodič.
 */
import type { ReactNode } from 'react';
import styles from './DrdPlusBestiePanel.module.css';

export interface Utok {
  name?: string;
  bc?: unknown;
  uc?: unknown;
  oc?: unknown;
  zz?: unknown;
  type?: string;
}
export interface AbilDraft {
  label: string;
  value: string;
}

const toNum = (v: unknown, fb = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
};
/** Hodnota se hází jen když je číselná (Výdrž „—" u neúnavných → nehází). */
const isNumeric = (v: unknown): boolean =>
  v !== '' && v !== null && v !== undefined && Number.isFinite(Number(v));

const STAT_FIELDS: ReadonlyArray<[string, string]> = [
  ['sil', 'Síla'],
  ['obr', 'Obratnost'],
  ['zrc', 'Zručnost'],
  ['vol', 'Vůle'],
  ['int', 'Inteligence'],
  ['chr', 'Charisma'],
];
const BODY_FIELDS: ReadonlyArray<[string, string]> = [
  ['odolnost', 'Odolnost'],
  ['vydrz', 'Výdrž'],
  ['rychlost', 'Rychlost'],
];
const SENSE_FIELDS: ReadonlyArray<[string, string]> = [
  ['hmat', 'Hmat'],
  ['chut', 'Chuť'],
  ['cich', 'Čich'],
  ['sluch', 'Sluch'],
  ['zrak', 'Zrak'],
];

export interface DrdPlusBestieCombatActionsProps {
  /** Aktuální systemStats (view). */
  ss: Record<string, unknown>;
  /** Edit draft systemStats (jen v edit módu). */
  dStats: Record<string, unknown>;
  editing: boolean;
  /** Smí házet (klikací řádky/chipy aktivní). */
  interactive: boolean;
  /** Hod: postih si přičítá rodič; `initiative` → BČ (zapíše iniciativu). */
  onRoll: (label: string, baseMod: number, kind: '2d6+' | 'd6', initiative?: boolean) => void;
  setStat: (key: string, v: unknown) => void;
  setUtok: (i: number, patch: Partial<Utok>) => void;
  addUtok: () => void;
  delUtok: (i: number) => void;
  /** Schopnosti — view zdroj (token/combatant.abilities). */
  abilities: { name: string; description: string }[];
  /** Schopnosti — edit draft. */
  dAbil: AbilDraft[];
  setDAbil: (updater: (arr: AbilDraft[]) => AbilDraft[]) => void;
  /** Poznámky — view zdroj. */
  notes: string;
  /** Poznámky — edit draft. */
  dNotes: string;
  setDNotes: (v: string) => void;
  /** Wound sekce (mapa/chat řeší jinak) — vkládá se mezi Útoky a Ochranu. */
  woundSlot?: ReactNode;
}

export function DrdPlusBestieCombatActions({
  ss,
  dStats,
  editing,
  interactive,
  onRoll,
  setStat,
  setUtok,
  addUtok,
  delUtok,
  abilities,
  dAbil,
  setDAbil,
  notes,
  dNotes,
  setDNotes,
  woundSlot,
}: DrdPlusBestieCombatActionsProps): React.ReactElement {
  const utoky = (Array.isArray(ss.utoky) ? ss.utoky : []) as Utok[];
  const dUtoky = (Array.isArray(dStats.utoky) ? dStats.utoky : []) as Utok[];

  const statRow = (key: string, label: string): ReactNode => {
    if (editing) {
      const isText = key === 'vydrz';
      return (
        <div className={styles.rollRow} key={key}>
          <span className={styles.rName}>{label}</span>
          <input
            className={`${styles.ed}${isText ? ' ' + styles.edTxt : ''}`}
            value={String(dStats[key] ?? '')}
            onChange={(e) => setStat(key, e.target.value)}
            aria-label={label}
          />
        </div>
      );
    }
    const raw = ss[key];
    const rollable = interactive && isNumeric(raw);
    return (
      <button
        key={key}
        type="button"
        className={styles.rollRow}
        disabled={!rollable}
        onClick={() => onRoll(label, toNum(raw), '2d6+')}
        aria-label={rollable ? `Hodit ${label}` : label}
      >
        <span className={styles.rName}>{label}</span>
        <span className={styles.rVal}>
          {raw === '' || raw === undefined || raw === null ? '—' : String(raw)}
        </span>
      </button>
    );
  };

  return (
    <>
      {/* ÚTOKY */}
      <div className={styles.stitle}>
        Útoky{' '}
        <small>BČ/ÚČ/OČ = 2k6+ · ZZ = 1k6 · BČ určí i iniciativu ⚡</small>
      </div>
      {!editing &&
        utoky.map((a, i) => (
          <div className={styles.weap} key={i}>
            <div className={styles.weapName}>{String(a.name || '(bez názvu)')}</div>
            <div className={styles.chips}>
              <button
                type="button"
                className={`${styles.chip} ${styles.bc}`}
                disabled={!interactive}
                aria-label={`${a.name || 'Útok'} BČ (iniciativa)`}
                onClick={() => onRoll(`${a.name || 'Útok'} — BČ`, toNum(a.bc), '2d6+', true)}
              >
                BČ<b>{toNum(a.bc)}</b>
              </button>
              <button
                type="button"
                className={styles.chip}
                disabled={!interactive}
                aria-label={`${a.name || 'Útok'} ÚČ`}
                onClick={() => onRoll(`${a.name || 'Útok'} — ÚČ`, toNum(a.uc), '2d6+')}
              >
                ÚČ<b>{toNum(a.uc)}</b>
              </button>
              <button
                type="button"
                className={styles.chip}
                disabled={!interactive}
                aria-label={`${a.name || 'Útok'} OČ`}
                onClick={() => onRoll(`${a.name || 'Útok'} — OČ`, toNum(a.oc), '2d6+')}
              >
                OČ<b>{toNum(a.oc)}</b>
              </button>
              <button
                type="button"
                className={`${styles.chip} ${styles.zz}`}
                disabled={!interactive}
                aria-label={`${a.name || 'Útok'} ZZ`}
                onClick={() => onRoll(`${a.name || 'Útok'} — ZZ`, toNum(a.zz), 'd6')}
              >
                ZZ<b>
                  {toNum(a.zz)}
                  {a.type ? ` ${a.type}` : ''}
                </b>
              </button>
            </div>
          </div>
        ))}
      {!editing && utoky.length === 0 && <p className={styles.hint}>Žádné útoky.</p>}
      {editing &&
        dUtoky.map((a, i) => (
          <div className={styles.weap} key={i}>
            <div className={styles.weapName}>
              <input
                className={`${styles.ed} ${styles.edTxt}`}
                value={String(a.name ?? '')}
                onChange={(e) => setUtok(i, { name: e.target.value })}
                aria-label="Název útoku"
              />
              <button
                type="button"
                className={styles.del}
                onClick={() => delUtok(i)}
                aria-label="Odebrat útok"
              >
                ✕
              </button>
            </div>
            <div className={styles.chips}>
              {(['bc', 'uc', 'oc', 'zz'] as const).map((k) => (
                <span className={styles.atkPair} key={k}>
                  <span className={styles.atkLbl}>{k.toUpperCase()}</span>
                  <input
                    className={styles.ed}
                    value={String(a[k] ?? '')}
                    onChange={(e) => setUtok(i, { [k]: e.target.value })}
                    aria-label={k.toUpperCase()}
                  />
                </span>
              ))}
              <select
                className={styles.ed}
                value={a.type ?? 'B'}
                onChange={(e) => setUtok(i, { type: e.target.value })}
                aria-label="Typ zranění"
              >
                <option>B</option>
                <option>S</option>
                <option>D</option>
              </select>
            </div>
          </div>
        ))}
      {editing && (
        <button type="button" className={styles.miniAdd} onClick={addUtok}>
          + Přidat útok
        </button>
      )}

      {woundSlot}

      {/* OCHRANA */}
      <div className={styles.stitle}>Ochrana</div>
      <div className={styles.readRow}>
        <span className={styles.rk}>Ochrana</span>
        {editing ? (
          <input
            className={styles.ed}
            value={String(dStats.ochrana ?? '')}
            onChange={(e) => setStat('ochrana', e.target.value)}
            aria-label="Ochrana"
          />
        ) : (
          <span className={styles.rv}>{toNum(ss.ochrana)}</span>
        )}
      </div>

      <hr className={styles.rule} />

      {/* VLASTNOSTI */}
      <div className={styles.stitle}>
        Vlastnosti <small>klik = 2k6+</small>
      </div>
      <div className={styles.grid2}>{STAT_FIELDS.map(([k, l]) => statRow(k, l))}</div>

      {/* TĚLO */}
      <div className={styles.stitle}>
        Tělo a pohyb <small>klik = 2k6+ · „—" se nehází</small>
      </div>
      {BODY_FIELDS.map(([k, l]) => statRow(k, l))}

      {/* SMYSLY */}
      <div className={styles.stitle}>
        Smysly <small>klik = 2k6+</small>
      </div>
      <div className={styles.grid2}>{SENSE_FIELDS.map(([k, l]) => statRow(k, l))}</div>

      <hr className={styles.rule} />

      {/* SCHOPNOSTI */}
      <div className={styles.stitle}>
        Schopnosti <small>{editing ? 'úprava' : 'jen k nahlédnutí'}</small>
      </div>
      {!editing &&
        abilities.map((a, i) => (
          <div className={styles.ability} key={i}>
            <span className={styles.ak}>{a.name}</span>
            <span className={styles.av}>{a.description}</span>
          </div>
        ))}
      {!editing && abilities.length === 0 && (
        <p className={styles.hint}>Žádné schopnosti.</p>
      )}
      {editing &&
        dAbil.map((a, i) => (
          <div className={styles.ability} key={i}>
            <input
              className={`${styles.ed} ${styles.edTxt}`}
              value={a.label}
              onChange={(e) =>
                setDAbil((arr) =>
                  arr.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)),
                )
              }
              aria-label="Název schopnosti"
            />
            <input
              className={`${styles.ed} ${styles.edTxt}`}
              value={a.value}
              onChange={(e) =>
                setDAbil((arr) =>
                  arr.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)),
                )
              }
              aria-label="Hodnota schopnosti"
            />
            <button
              type="button"
              className={styles.del}
              onClick={() => setDAbil((arr) => arr.filter((_, j) => j !== i))}
              aria-label="Odebrat schopnost"
            >
              ✕
            </button>
          </div>
        ))}
      {editing && (
        <button
          type="button"
          className={styles.miniAdd}
          onClick={() => setDAbil((arr) => [...arr, { label: '', value: '' }])}
        >
          + Přidat schopnost
        </button>
      )}

      {/* POZNÁMKY */}
      <div className={styles.stitle}>
        Poznámky <small>{editing ? 'úprava' : 'jen k nahlédnutí'}</small>
      </div>
      {editing ? (
        <textarea
          className={styles.edWide}
          rows={4}
          value={dNotes}
          onChange={(e) => setDNotes(e.target.value)}
          aria-label="Poznámky"
        />
      ) : notes && notes.trim() ? (
        <div className={styles.notes}>{notes}</div>
      ) : (
        <p className={styles.hint}>Bez poznámek.</p>
      )}
    </>
  );
}

export default DrdPlusBestieCombatActions;
