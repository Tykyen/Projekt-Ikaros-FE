/**
 * GURPS 4E bestie — sdílené prezentační jádro (mapa ↔ chat).
 *
 * Vzor `DrdhBestieCombatActions`: Meta / Atributy (klik = 3k6 ≤ atribut) /
 * Útoky (klik = zásah 3k6 ≤ dovednost + škody přes mixed) / Obrana
 * (Úhyb/Kryt/Blok + DR + thr/sw) / Zvláštnosti + Taktika. Renderuje mapový
 * `GurpsBestiePanel` i chatový `GurpsChatBestiePanel`; liší se jen persistence
 * a routing hodů — HP řeší rodič.
 *
 * `systemStats` má PLOCHÉ tečkové klíče (`attributes.st`, `health.max`) — NE
 * nested (viz `fateBestieView`). Čti přes `stats['attributes.st']`.
 */
import { useState } from 'react';
import { Modal } from '@/shared/ui/Modal/Modal';
import styles from './GurpsBestiePanel.module.css';

export interface GurpsBestieAttack {
  name?: string;
  skill?: unknown;
  dmg?: string;
  reach?: string;
}
export interface GurpsBestieAbility {
  label?: string;
  value?: string;
}

const GB_ATTRS: ReadonlyArray<{ key: string; abbr: string; label: string }> = [
  { key: 'attributes.st', abbr: 'ST', label: 'Síla' },
  { key: 'attributes.dx', abbr: 'DX', label: 'Obratnost' },
  { key: 'attributes.iq', abbr: 'IQ', label: 'Inteligence' },
  { key: 'attributes.ht', abbr: 'HT', label: 'Zdraví' },
  { key: 'attributes.will', abbr: 'Vůle', label: 'Vůle' },
  { key: 'attributes.per', abbr: 'Vním.', label: 'Vnímání' },
];

const toNum = (v: unknown, fb = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
};
const str = (s: Record<string, unknown>, key: string): string => {
  const v = s[key];
  return v == null ? '' : String(v);
};

/** GURPS škody „NkM"/„NdM" (jen d6) → počet kostek + modifikátor pro mixed. */
export function parseBestieDamage(dmg: string): { count: number; mod: number } | null {
  const m = dmg.match(/(\d+)\s*[kd]\s*([+-]\s*\d+)?/i);
  if (!m) return null;
  const count = parseInt(m[1], 10);
  if (!Number.isFinite(count) || count <= 0) return null;
  const mod = m[2] ? parseInt(m[2].replace(/\s+/g, ''), 10) : 0;
  return { count, mod };
}

export interface GurpsBestieCombatActionsProps {
  ss: Record<string, unknown>;
  dStats: Record<string, unknown>;
  editing: boolean;
  interactive: boolean;
  /** Atribut / zásah útoku = 3k6 „pod cíl". */
  rollUnder: (label: string, target: number) => void;
  /** Škody útoku = mixed (NkM). */
  rollDamage: (label: string, dmg: string) => void;
  setStat: (key: string, v: unknown) => void;
  setAttack: (i: number, patch: Partial<GurpsBestieAttack>) => void;
  addAttack: () => void;
  delAttack: (i: number) => void;
  setAbility: (i: number, patch: Partial<GurpsBestieAbility>) => void;
  addAbility: () => void;
  delAbility: (i: number) => void;
}

export function GurpsBestieCombatActions({
  ss,
  dStats,
  editing,
  interactive,
  rollUnder,
  rollDamage,
  setStat,
  setAttack,
  addAttack,
  delAttack,
  setAbility,
  addAbility,
  delAbility,
}: GurpsBestieCombatActionsProps): React.ReactElement {
  const [abilOpen, setAbilOpen] = useState(false);
  const [tacOpen, setTacOpen] = useState(false);

  const src = editing ? dStats : ss;
  const attacks = (Array.isArray(src.attacks) ? src.attacks : []) as GurpsBestieAttack[];
  const abilities = (Array.isArray(src.abilities) ? src.abilities : []) as GurpsBestieAbility[];
  const tactic = typeof src.tactic === 'string' ? src.tactic : '';

  return (
    <>
      {/* META */}
      <div className={styles.stitle}>Meta</div>
      {editing ? (
        <div className={styles.meta}>
          {(
            [
              ['creature_type', 'Typ tvora'],
              ['size_modifier', 'SM'],
              ['movement', 'Pohyb'],
            ] as const
          ).map(([key, label]) => (
            <div className={styles.metaCard} key={key}>
              <span className={styles.metaLab}>{label}</span>
              <input
                className={styles.metaEdit}
                value={str(dStats, key)}
                onChange={(e) => setStat(key, e.target.value)}
                aria-label={label}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.meta}>
          <div className={styles.metaCard}>
            <span className={styles.metaLab}>Typ</span>
            <div className={styles.metaVal}>{str(ss, 'creature_type') || '—'}</div>
          </div>
          <div className={styles.metaCard}>
            <span className={styles.metaLab}>SM</span>
            <div className={styles.metaVal}>{str(ss, 'size_modifier') || '0'}</div>
          </div>
          <div className={styles.metaCard}>
            <span className={styles.metaLab}>Pohyb</span>
            <div className={styles.metaVal}>{str(ss, 'movement') || '—'}</div>
          </div>
        </div>
      )}

      {/* ATRIBUTY — klik = 3k6 ≤ atribut */}
      <div className={styles.stitle}>
        Atributy <small>{editing ? 'úprava' : 'klik = 3k6 ≤ atribut'}</small>
      </div>
      <div className={styles.statGrid}>
        {GB_ATTRS.map((a) => {
          const v = toNum(src[a.key], 10);
          return editing ? (
            <div className={styles.statEdit} key={a.key}>
              <span>{a.abbr}</span>
              <input
                className={styles.edNum}
                value={String(dStats[a.key] ?? '')}
                onChange={(e) => setStat(a.key, e.target.value)}
                aria-label={a.label}
              />
            </div>
          ) : (
            <button
              key={a.key}
              type="button"
              className={styles.statBtn}
              disabled={!interactive}
              onClick={() => rollUnder(a.label, v)}
              aria-label={`Hod na ${a.label}`}
            >
              <span className={styles.statName}>{a.abbr}</span>
              <span className={styles.statVal}>{v}</span>
            </button>
          );
        })}
      </div>

      {/* ÚTOKY — klik = zásah 3k6 + škody */}
      <div className={styles.stitle}>
        Útoky <small>{editing ? 'úprava' : 'klik = zásah / škody'}</small>
      </div>
      {!editing &&
        attacks.map((atk, i) => {
          const skill = toNum(atk.skill, 0);
          const dmg = typeof atk.dmg === 'string' ? atk.dmg.trim() : '';
          const meta = [atk.reach && `dosah ${atk.reach}`].filter(Boolean).join(' · ');
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
                onClick={() => rollUnder(`Útok: ${atk.name || 'zbraň'}`, skill)}
                aria-label={`${atk.name || 'Útok'} zásah`}
              >
                zásah <b>{skill}</b>
              </button>
              {parseBestieDamage(dmg) && (
                <button
                  type="button"
                  className={`${styles.atkBtn} ${styles.dmgBtn}`}
                  disabled={!interactive}
                  onClick={() => rollDamage(`${atk.name || 'zbraň'} (škody)`, dmg)}
                  aria-label={`${atk.name || 'Útok'} škody`}
                >
                  {dmg}
                </button>
              )}
            </div>
          );
        })}
      {!editing && attacks.length === 0 && (
        <p className={styles.hint}>Žádné útoky.</p>
      )}
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
              placeholder="zásah"
              aria-label={`Útok ${i + 1} zásah`}
            />
            <input
              className={styles.edNum}
              value={String(atk.dmg ?? '')}
              onChange={(e) => setAttack(i, { dmg: e.target.value })}
              placeholder="škody"
              aria-label={`Útok ${i + 1} škody`}
            />
            <input
              className={styles.edNum}
              value={String(atk.reach ?? '')}
              onChange={(e) => setAttack(i, { reach: e.target.value })}
              placeholder="dosah"
              aria-label={`Útok ${i + 1} dosah`}
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

      {/* OBRANA */}
      <div className={styles.stitle}>Obrana</div>
      <div className={styles.defRow}>
        {(
          [
            ['dodge', 'Úhyb'],
            ['parry', 'Kryt'],
            ['block', 'Blok'],
            ['dr', 'DR'],
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
              <span className={styles.defVal}>{toNum(ss[key])}</span>
            )}
          </div>
        ))}
      </div>
      <div className={styles.drline}>
        Škody: Úder <b>{str(src, 'damage_thrust') || '—'}</b> · Mách{' '}
        <b>{str(src, 'damage_swing') || '—'}</b>
      </div>

      {/* OKNA — zvláštnosti + taktika */}
      <div className={styles.winBtns}>
        <button type="button" className={styles.winBtn} onClick={() => setAbilOpen(true)}>
          ✦ Zvláštnosti{abilities.length > 0 ? ` (${abilities.length})` : ''}
        </button>
        <button type="button" className={styles.winBtn} onClick={() => setTacOpen(true)}>
          📖 Taktika
        </button>
      </div>

      <Modal open={abilOpen} onClose={() => setAbilOpen(false)} title="Zvláštní schopnosti" size="lg">
        {editing ? (
          <>
            {abilities.map((a, i) => (
              <div className={styles.atkEdit} key={i} style={{ gridTemplateColumns: '1fr 2fr auto' }}>
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
          <table className={styles.mtbl}>
            <thead>
              <tr>
                <th>Název</th>
                <th>Popis</th>
              </tr>
            </thead>
            <tbody>
              {abilities.map((a, i) => (
                <tr key={i}>
                  <td>{a.label || '—'}</td>
                  <td>{a.value || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>

      <Modal open={tacOpen} onClose={() => setTacOpen(false)} title="Taktika a popis" size="lg">
        {editing ? (
          <textarea
            className={styles.edArea}
            value={tactic}
            onChange={(e) => setStat('tactic', e.target.value)}
            placeholder="Chování v boji, vzhled, poznámka PJ…"
            aria-label="Taktika a popis"
          />
        ) : tactic.trim() ? (
          <div className={styles.tactic}>{tactic}</div>
        ) : (
          <p className={styles.hint}>Bez popisu.</p>
        )}
      </Modal>
    </>
  );
}

export default GurpsBestieCombatActions;
