/**
 * Call of Cthulhu bestie — sdílené prezentační jádro (mapa ↔ chat).
 *
 * Vzor `GurpsBestieCombatActions`: Vlastnosti (klik = 1k100 ≤ %) / Ztráta
 * příčetnosti (signature CoC) / Útoky (zásah 1k100 + škody) / Boj (Úhyb/Boj
 * klik + odvozené) / Zvláštnosti (modal). Renderuje mapový `CocBestiePanel` i
 * chatový `CocChatBestiePanel`; liší se jen persistence a routing — HP řeší rodič.
 *
 * `systemStats` má PLOCHÉ tečkové klíče (`characteristics.str`, `health.max`) —
 * čti přes `stats['characteristics.str']`.
 */
import { useState } from 'react';
import { Modal } from '@/shared/ui/Modal/Modal';
import styles from './CocBestiePanel.module.css';

export interface CocBestieAttack {
  name?: string;
  skill?: unknown;
  dmg?: string;
  special?: string;
}
export interface CocBestieAbility {
  label?: string;
  value?: string;
}

/** 8 vlastností CoC (procenta) v pořadí statbloku. */
const COC_BEAST_CHARS: ReadonlyArray<{ key: string; abbr: string; label: string }> = [
  { key: 'characteristics.str', abbr: 'SIL', label: 'Síla' },
  { key: 'characteristics.con', abbr: 'ODL', label: 'Odolnost' },
  { key: 'characteristics.siz', abbr: 'VEL', label: 'Velikost' },
  { key: 'characteristics.dex', abbr: 'OBR', label: 'Obratnost' },
  { key: 'characteristics.int', abbr: 'INT', label: 'Inteligence' },
  { key: 'characteristics.pow', abbr: 'VŮL', label: 'Vůle' },
  { key: 'characteristics.app', abbr: 'VZH', label: 'Vzhled' },
  { key: 'characteristics.edu', abbr: 'VZD', label: 'Vzdělání' },
];

const toNum = (v: unknown, fb = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
};
const str = (s: Record<string, unknown>, key: string): string => {
  const v = s[key];
  return v == null ? '' : String(v);
};

/**
 * CoC škody „XKY(+Z)" → mixed počty kostek + modifikátor. Podporuje jen kostky
 * v mixed enginu (d4/d6/d8/d10/d12/d20); „+BZ" a jiný text = jen kostková část.
 * `null` = nehodíme (jen text), např. „1K3" (d3 mixed nepodporuje).
 */
export function parseCocDamage(
  dmg: string,
): { counts: Record<string, number>; mod: number } | null {
  const m = dmg.match(/(\d+)\s*[kd]\s*(\d+)\s*([+-]\s*\d+)?/i);
  if (!m) return null;
  const count = parseInt(m[1], 10);
  const sides = parseInt(m[2], 10);
  if (!Number.isFinite(count) || count <= 0) return null;
  if (![4, 6, 8, 10, 12, 20].includes(sides)) return null;
  const mod = m[3] ? parseInt(m[3].replace(/\s+/g, ''), 10) : 0;
  return { counts: { [`d${sides}`]: count }, mod };
}

export interface CocBestieCombatActionsProps {
  ss: Record<string, unknown>;
  dStats: Record<string, unknown>;
  editing: boolean;
  interactive: boolean;
  /** Vlastnost / zásah / dovednost = 1k100 „pod cíl" (percentile). */
  rollPercentile: (label: string, target: number) => void;
  /** Škody útoku = mixed (XKY). */
  rollDamage: (label: string, dmg: string) => void;
  setStat: (key: string, v: unknown) => void;
  setAttack: (i: number, patch: Partial<CocBestieAttack>) => void;
  addAttack: () => void;
  delAttack: (i: number) => void;
  setAbility: (i: number, patch: Partial<CocBestieAbility>) => void;
  addAbility: () => void;
  delAbility: (i: number) => void;
}

export function CocBestieCombatActions({
  ss,
  dStats,
  editing,
  interactive,
  rollPercentile,
  rollDamage,
  setStat,
  setAttack,
  addAttack,
  delAttack,
  setAbility,
  addAbility,
  delAbility,
}: CocBestieCombatActionsProps): React.ReactElement {
  const [abilOpen, setAbilOpen] = useState(false);

  const src = editing ? dStats : ss;
  const attacks = (Array.isArray(src.attacks) ? src.attacks : []) as CocBestieAttack[];
  const abilities = (Array.isArray(src.abilities) ? src.abilities : []) as CocBestieAbility[];

  return (
    <>
      {/* ── VLASTNOSTI — klik = 1k100 ≤ % ── */}
      <div className={styles.stitle}>
        Vlastnosti <small>{editing ? 'úprava' : 'klik = hod'}</small>
      </div>
      <div className={styles.charGrid}>
        {COC_BEAST_CHARS.map((c) => {
          const v = toNum(src[c.key], 0);
          return editing ? (
            <div className={styles.statEdit} key={c.key}>
              <span>{c.abbr}</span>
              <input
                className={styles.edNum}
                value={String(dStats[c.key] ?? '')}
                onChange={(e) => setStat(c.key, e.target.value)}
                aria-label={c.label}
              />
            </div>
          ) : (
            <button
              key={c.key}
              type="button"
              className={styles.statBtn}
              disabled={!interactive}
              onClick={() => rollPercentile(c.abbr, v)}
              aria-label={`Hod ${c.label}`}
            >
              <span className={styles.statName}>{c.abbr}</span>
              <span className={styles.statVal}>{v || '—'}</span>
            </button>
          );
        })}
      </div>

      {/* ── ZTRÁTA PŘÍČETNOSTI — signature ── */}
      <div className={styles.sanLoss}>
        <div className={styles.sanTitle}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3 C7 8 5 11 5 15 A7 7 0 0 0 19 15 C19 11 17 8 12 3Z" />
            <circle cx="12" cy="14" r="2" />
          </svg>
          Ztráta příčetnosti
        </div>
        <div className={styles.sanRows}>
          <div className={styles.sanRow}>
            <span>Při spatření</span>
            {editing ? (
              <input
                className={styles.sanEdit}
                value={String(dStats['sanity_loss.on_seeing'] ?? '')}
                onChange={(e) => setStat('sanity_loss.on_seeing', e.target.value)}
                aria-label="Ztráta SAN při spatření"
              />
            ) : (
              <b>{str(ss, 'sanity_loss.on_seeing') || '—'}</b>
            )}
          </div>
          <div className={styles.sanRow}>
            <span>Za jiných okolností</span>
            {editing ? (
              <input
                className={styles.sanEdit}
                value={String(dStats['sanity_loss.on_attack'] ?? '')}
                onChange={(e) => setStat('sanity_loss.on_attack', e.target.value)}
                aria-label="Ztráta SAN za jiných okolností"
              />
            ) : (
              <b>{str(ss, 'sanity_loss.on_attack') || '—'}</b>
            )}
          </div>
        </div>
      </div>

      {/* ── ÚTOKY — zásah 1k100 + škody ── */}
      <div className={styles.stitle}>
        Útoky <small>{editing ? 'úprava' : 'klik = zásah / škody'}</small>
      </div>
      {!editing &&
        attacks.map((atk, i) => {
          const skill = toNum(atk.skill, 0);
          const dmg = typeof atk.dmg === 'string' ? atk.dmg.trim() : '';
          const meta = [atk.special].filter(Boolean).join(' · ');
          return (
            <div className={styles.atkRow} key={i}>
              <div className={styles.atkName}>
                {atk.name || '(bez názvu)'}
                {meta && <small>{meta}</small>}
              </div>
              <button
                type="button"
                className={styles.atkBtn}
                disabled={!interactive}
                onClick={() => rollPercentile(`Útok: ${atk.name || 'zbraň'}`, skill)}
                aria-label={`${atk.name || 'Útok'} zásah`}
              >
                zásah <b>{skill || '—'}</b>
              </button>
              {dmg &&
                (parseCocDamage(dmg) ? (
                  <button
                    type="button"
                    className={`${styles.atkBtn} ${styles.dmgBtn}`}
                    disabled={!interactive}
                    onClick={() => rollDamage(`${atk.name || 'zbraň'} (škody)`, dmg)}
                    aria-label={`${atk.name || 'Útok'} škody`}
                  >
                    {dmg}
                  </button>
                ) : (
                  <span className={styles.dmgTxt}>{dmg}</span>
                ))}
            </div>
          );
        })}
      {!editing && attacks.length === 0 && <p className={styles.hint}>Žádné útoky.</p>}
      {editing &&
        attacks.map((atk, i) => (
          <div className={styles.atkEdit} key={i}>
            <input
              className={styles.ed}
              value={String(atk.name ?? '')}
              onChange={(e) => setAttack(i, { name: e.target.value })}
              placeholder="název"
              aria-label={`Útok ${i + 1} název`}
            />
            <input
              className={styles.edNum}
              value={String(atk.skill ?? '')}
              onChange={(e) => setAttack(i, { skill: e.target.value })}
              placeholder="%"
              aria-label={`Útok ${i + 1} šance`}
            />
            <input
              className={styles.edNum}
              value={String(atk.dmg ?? '')}
              onChange={(e) => setAttack(i, { dmg: e.target.value })}
              placeholder="škody"
              aria-label={`Útok ${i + 1} škody`}
            />
            <input
              className={styles.ed}
              value={String(atk.special ?? '')}
              onChange={(e) => setAttack(i, { special: e.target.value })}
              placeholder="efekt"
              aria-label={`Útok ${i + 1} efekt`}
            />
            <button
              type="button"
              className={styles.del}
              onClick={() => delAttack(i)}
              aria-label="Odebrat útok"
            >
              ✕
            </button>
          </div>
        ))}
      {editing && (
        <button type="button" className={styles.miniAdd} onClick={addAttack}>
          + přidat útok
        </button>
      )}

      {/* ── BOJ — dovednosti (klik) + odvozené ── */}
      <div className={styles.stitle}>Boj</div>
      <div className={styles.defRow}>
        {(
          [
            ['dodge', 'Úhyb', true],
            ['fighting', 'Boj', true],
          ] as const
        ).map(([key, label, rollable]) => {
          const v = toNum(src[key], 0);
          return editing ? (
            <div className={styles.defCard} key={key}>
              <span className={styles.defLab}>{label}</span>
              <input
                className={styles.defEdit}
                value={String(dStats[key] ?? '')}
                onChange={(e) => setStat(key, e.target.value)}
                aria-label={label}
              />
            </div>
          ) : (
            <button
              key={key}
              type="button"
              className={styles.defBtn}
              disabled={!interactive || !rollable}
              onClick={() => rollPercentile(label, v)}
              aria-label={`Hod ${label}`}
            >
              <span className={styles.defLab}>{label}</span>
              <span className={styles.defVal}>{v || '—'}</span>
            </button>
          );
        })}
        {(
          [
            ['damage_bonus', 'BZ'],
            ['build', 'Stavba'],
            ['armor', 'Brnění'],
            ['movement', 'Pohyb'],
          ] as const
        ).map(([key, label]) => (
          <div className={styles.defCard} key={key}>
            <span className={styles.defLab}>{label}</span>
            {editing ? (
              <input
                className={styles.defEdit}
                value={String(dStats[key] ?? '')}
                onChange={(e) => setStat(key, e.target.value)}
                aria-label={label}
              />
            ) : (
              <span className={styles.defVal}>{str(ss, key) || '—'}</span>
            )}
          </div>
        ))}
      </div>

      {/* ── ZVLÁŠTNOSTI ── */}
      <button type="button" className={styles.winBtn} onClick={() => setAbilOpen(true)}>
        ✦ Zvláštní schopnosti{abilities.length > 0 ? ` (${abilities.length})` : ''}
      </button>

      <Modal open={abilOpen} onClose={() => setAbilOpen(false)} title="Zvláštní schopnosti" size="lg">
        {editing ? (
          <>
            {abilities.map((a, i) => (
              <div
                className={styles.atkEdit}
                key={i}
                style={{ gridTemplateColumns: '1fr 2fr auto' }}
              >
                <input
                  className={styles.ed}
                  value={String(a.label ?? '')}
                  onChange={(e) => setAbility(i, { label: e.target.value })}
                  placeholder="název"
                  aria-label={`Schopnost ${i + 1} název`}
                />
                <input
                  className={styles.ed}
                  value={String(a.value ?? '')}
                  onChange={(e) => setAbility(i, { value: e.target.value })}
                  placeholder="popis"
                  aria-label={`Schopnost ${i + 1} popis`}
                />
                <button
                  type="button"
                  className={styles.del}
                  onClick={() => delAbility(i)}
                  aria-label="Odebrat schopnost"
                >
                  ✕
                </button>
              </div>
            ))}
            <button type="button" className={styles.miniAdd} onClick={addAbility}>
              + přidat schopnost
            </button>
          </>
        ) : abilities.length === 0 ? (
          <p className={styles.hint}>Žádné zvláštní schopnosti.</p>
        ) : (
          <div className={styles.abilList}>
            {abilities.map((a, i) => (
              <div className={styles.abilItem} key={i}>
                <div className={styles.abilName}>{a.label || '—'}</div>
                <div className={styles.abilDesc}>{a.value || '—'}</div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}

export default CocBestieCombatActions;
