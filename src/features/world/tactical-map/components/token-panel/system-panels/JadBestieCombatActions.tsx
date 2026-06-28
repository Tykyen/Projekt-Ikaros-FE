/**
 * 8.7r krok 2 — JaD bestie statblok (view, klikací k20 hody).
 *
 * Sdílené jádro mapa↔chat: čte snapshot bestie ze `systemStats` a vykreslí
 * čistý statblok (vlastnosti / útoky / záchrany / zdatnosti / odolnosti /
 * schopnosti seskupené dle typu / kouzla). Klik (jen `interactive`) hází k20
 * (fatální úspěch/neúspěch) nebo skládaný zásah (mixed). Persistence + HP +
 * iniciativu řeší rodič (JadBestiePanel mapy / JadChatBestiePanel chatu).
 */
import { calcMod, fmtMod, parseDamageFormula } from '@/features/world/pages/CharacterDetailPage/diary-systems/sheets/jad/formulas';
import styles from './JadBestiePanel.module.css';

export interface JadBestieRollReq {
  label: string;
  modifier?: number;
  kind: 'd20' | 'mixed';
  critOnD20?: boolean;
  mixed?: Record<string, number>;
}

interface Attack {
  nazev?: string;
  bonus?: string;
  zasah?: string;
  typ?: string;
  dosah?: string;
  efekt?: string;
}
interface SaveRow {
  vlastnost?: string;
  bonus?: number;
}
interface SkillRow {
  dovednost?: string;
  bonus?: number;
}
interface Ability {
  nazev?: string;
  typ?: string;
  popis?: string;
}
interface Spell {
  pripravene?: boolean;
  nazev?: string;
  utok_so?: string;
  doba?: string;
  dosah?: string;
  trvani?: string;
}

const ABILS: { k: string; l: string }[] = [
  { k: 'attributes.str', l: 'Síla' },
  { k: 'attributes.dex', l: 'Obratnost' },
  { k: 'attributes.con', l: 'Odolnost' },
  { k: 'attributes.int', l: 'Inteligence' },
  { k: 'attributes.wis', l: 'Moudrost' },
  { k: 'attributes.cha', l: 'Charisma' },
];

/** Pořadí kategorií ve statbloku. */
const ABILITY_ORDER = [
  'Schopnost',
  'Akce',
  'Bonusová akce',
  'Reakce',
  'Legendární akce',
];

const num = (ss: Record<string, unknown>, key: string, fb = 0): number => {
  const n = Number(ss[key]);
  return Number.isFinite(n) ? n : fb;
};
const text = (ss: Record<string, unknown>, key: string): string => {
  const v = ss[key];
  return v === undefined || v === null ? '' : String(v);
};
function arr<T>(ss: Record<string, unknown>, key: string): T[] {
  const v = ss[key];
  return Array.isArray(v) ? (v as T[]) : [];
}

interface Props {
  ss: Record<string, unknown>;
  interactive: boolean;
  onRoll: (req: JadBestieRollReq) => void;
}

export function JadBestieCombatActions({
  ss,
  interactive,
  onRoll,
}: Props): React.ReactElement {
  const k20 = (label: string, modifier: number): void => {
    if (interactive) onRoll({ label, modifier, kind: 'd20', critOnD20: true });
  };

  const attacks = arr<Attack>(ss, 'utoky');
  const saves = arr<SaveRow>(ss, 'zachrany');
  const skills = arr<SkillRow>(ss, 'zdatnosti');
  const abilities = arr<Ability>(ss, 'abilities');
  const spells = arr<Spell>(ss, 'kouzla');

  const zr = text(ss, 'zranitelnosti');
  const od = text(ss, 'odolnosti');
  const im = text(ss, 'imunity_zasah');
  const imStavy = text(ss, 'imunity_stavy');
  const smysly = text(ss, 'smysly');
  const jazyky = text(ss, 'jazyky');

  return (
    <div className={styles.actions}>
      {/* Vlastnosti — klik k20 */}
      <section className={styles.section}>
        <h4 className={styles.secTitle}>Vlastnosti</h4>
        <div className={styles.abilGrid}>
          {ABILS.map(({ k, l }) => {
            const mod = calcMod(num(ss, k, 10));
            return (
              <button
                key={k}
                type="button"
                className={styles.abil}
                disabled={!interactive}
                onClick={() => k20(l, mod)}
                title={`Hodit ${l} (k20 ${fmtMod(mod)})`}
              >
                <span className={styles.abilLbl}>{l.slice(0, 3).toUpperCase()}</span>
                <span className={styles.abilMod}>{fmtMod(mod)}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Útoky — bonus = k20, zásah = mixed */}
      {attacks.length > 0 && (
        <section className={styles.section}>
          <h4 className={styles.secTitle}>Útoky</h4>
          {attacks.map((a, i) => {
            const bonusMod = parseInt(String(a.bonus).replace(/[^\d-]/g, ''), 10);
            const bonus = Number.isFinite(bonusMod) ? bonusMod : 0;
            const dmg = parseDamageFormula(a.zasah ?? '');
            return (
              <div key={i} className={styles.attack}>
                <span className={styles.attackName}>{a.nazev || 'Útok'}</span>
                <button
                  type="button"
                  className={styles.attackBtn}
                  disabled={!interactive}
                  onClick={() =>
                    k20(`Útok: ${a.nazev || 'bestie'}`, bonus)
                  }
                  title={`Útok (k20 ${fmtMod(bonus)})`}
                >
                  ⚔ {a.bonus || fmtMod(bonus)}
                </button>
                <button
                  type="button"
                  className={styles.dmgBtn}
                  disabled={!interactive || !dmg}
                  onClick={() =>
                    dmg &&
                    onRoll({
                      label: `Zranění: ${a.nazev || 'bestie'}`,
                      kind: 'mixed',
                      mixed: dmg.mixed,
                      modifier: dmg.modifier,
                    })
                  }
                  title={dmg ? `Hodit zranění ${a.zasah}` : a.zasah || '—'}
                >
                  {a.zasah || '—'}
                </button>
                {(a.typ || a.dosah) && (
                  <span className={styles.attackMeta}>
                    {[a.dosah, a.typ].filter(Boolean).join(' · ')}
                  </span>
                )}
                {a.efekt && <span className={styles.attackEfekt}>{a.efekt}</span>}
              </div>
            );
          })}
        </section>
      )}

      {/* Záchranné hody + zdatnosti — klik k20 */}
      {(saves.length > 0 || skills.length > 0) && (
        <section className={styles.section}>
          <h4 className={styles.secTitle}>Záchrany a zdatnosti</h4>
          <div className={styles.chips}>
            {saves.map((s, i) => (
              <button
                key={`zh${i}`}
                type="button"
                className={styles.chip}
                disabled={!interactive}
                onClick={() => k20(`ZH ${s.vlastnost}`, s.bonus ?? 0)}
                title={`Záchrana ${s.vlastnost} (k20 ${fmtMod(s.bonus ?? 0)})`}
              >
                ZH {s.vlastnost} {fmtMod(s.bonus ?? 0)}
              </button>
            ))}
            {skills.map((s, i) => (
              <button
                key={`zd${i}`}
                type="button"
                className={`${styles.chip} ${styles.chipSkill}`}
                disabled={!interactive}
                onClick={() => k20(String(s.dovednost), s.bonus ?? 0)}
                title={`${s.dovednost} (k20 ${fmtMod(s.bonus ?? 0)})`}
              >
                {s.dovednost} {fmtMod(s.bonus ?? 0)}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Odolnosti / imunity / smysly — read-only */}
      {(zr || od || im || imStavy || smysly || jazyky) && (
        <section className={styles.section}>
          <dl className={styles.meta}>
            {zr && (<><dt>Zranitelnosti</dt><dd>{zr}</dd></>)}
            {od && (<><dt>Odolání</dt><dd>{od}</dd></>)}
            {im && (<><dt>Imunity</dt><dd>{im}</dd></>)}
            {imStavy && (<><dt>Imunity (stavy)</dt><dd>{imStavy}</dd></>)}
            {smysly && (<><dt>Smysly</dt><dd>{smysly}</dd></>)}
            {jazyky && jazyky !== '—' && (<><dt>Jazyky</dt><dd>{jazyky}</dd></>)}
          </dl>
        </section>
      )}

      {/* Schopnosti — seskupené dle typu */}
      {abilities.length > 0 &&
        ABILITY_ORDER.map((cat) => {
          const group = abilities.filter(
            (a) => (a.typ || 'Schopnost') === cat,
          );
          if (group.length === 0) return null;
          return (
            <section key={cat} className={styles.section}>
              <h4 className={styles.secTitle}>{cat === 'Schopnost' ? 'Schopnosti' : cat}</h4>
              {group.map((a, i) => (
                <div key={i} className={styles.feat}>
                  {a.nazev && <strong>{a.nazev}.</strong>}{' '}
                  {a.popis && <span>{a.popis}</span>}
                </div>
              ))}
            </section>
          );
        })}

      {/* Kouzla — read-only */}
      {spells.length > 0 && (
        <section className={styles.section}>
          <h4 className={styles.secTitle}>Kouzla</h4>
          {(text(ss, 'kouzla_vlastnost') ||
            text(ss, 'kouzla_so') ||
            text(ss, 'kouzla_utok')) && (
            <div className={styles.spellHead}>
              {text(ss, 'kouzla_vlastnost') && (
                <span>Vlastnost: {text(ss, 'kouzla_vlastnost')}</span>
              )}
              {text(ss, 'kouzla_so') && <span>SO {text(ss, 'kouzla_so')}</span>}
              {text(ss, 'kouzla_utok') && (
                <span>Útok {text(ss, 'kouzla_utok')}</span>
              )}
            </div>
          )}
          {spells.map((s, i) => (
            <div key={i} className={styles.feat}>
              {s.pripravene ? '◆ ' : ''}
              <strong>{s.nazev || '—'}</strong>
              {[s.utok_so, s.doba, s.dosah, s.trvani].filter(Boolean).length >
                0 && (
                <span className={styles.spellMeta}>
                  {' '}
                  ({[s.utok_so, s.doba, s.dosah, s.trvani]
                    .filter(Boolean)
                    .join(' · ')})
                </span>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
