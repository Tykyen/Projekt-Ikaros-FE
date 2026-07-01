/**
 * 16b bestie — sdílené prezentační jádro Dračí Hlídka bestie (mapa ↔ chat).
 *
 * Vzor `Drd2BestieCombatActions`: Meta pás / Atributy (klik = k10 + oprava) /
 * Útoky (klik = ÚČ + k6+, zranění za lomítkem) / Obrana (ZO/OČ) / Odolnosti
 * (rez/imu/slab tagy) / okna (Zvláštní schopnosti + Taktika). Renderuje mapový
 * `DrdhBestiePanel` i chatový `DrdhChatBestiePanel`. Liší se jen persistence +
 * routing hodů (onMapRoll vs useChatDiaryRoll) a HP, které řeší rodič.
 *
 * Rodič drží edit draft (`dStats`) + handlery; jádro je čistě prezentační.
 * Hody:
 *   - Atribut  = `d10` + `drdhAttrMod(stupeň)` (⌊st/2⌋−5).
 *   - Útok     = `d6+` (exploduje) + `uc` (ÚČ = finální číslo, žádné +atribut);
 *                zranění (`dmg`, se znaménkem) jen k zobrazení.
 * Iniciativa žije v rodiči (⚡ tlačítko).
 */
import { useState } from 'react';
import { Modal } from '@/shared/ui/Modal/Modal';
import {
  DRDH_ATTRS,
  drdhAttrMod,
  fmtMod,
} from '@/features/world/pages/CharacterDetailPage/diary-systems/sheets/drdh/constants';
import styles from './DrdhBestiePanel.module.css';

export interface DrdhAttack {
  name?: string;
  kind?: string;
  uc?: unknown;
  dmg?: string;
}
export interface DrdhResist {
  kind?: string;
  label?: string;
}
export interface DrdhBestieAbility {
  name?: string;
  desc?: string;
}

const toNum = (v: unknown, fb = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
};

const RESIST_KINDS: ReadonlyArray<{ id: string; label: string }> = [
  { id: 'rez', label: 'Rezistence' },
  { id: 'imu', label: 'Imunita' },
  { id: 'slab', label: 'Slabina' },
];
const resistLabel = (kind: string): string =>
  RESIST_KINDS.find((r) => r.id === kind)?.label ?? 'Rezistence';

/** Zranění se znaménkem k zobrazení (`+2`/`-1`/`0`); neparsovatelný text vrací jak je. */
const fmtDamage = (dmg: unknown): string | undefined => {
  const s = typeof dmg === 'string' ? dmg.trim() : dmg == null ? '' : String(dmg);
  if (!s) return undefined;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? s : fmtMod(n);
};

export interface DrdhBestieCombatActionsProps {
  /** Aktuální systemStats (view). */
  ss: Record<string, unknown>;
  /** Edit draft systemStats (jen v edit módu). */
  dStats: Record<string, unknown>;
  editing: boolean;
  /** Smí házet (klikací atributy / útoky aktivní). */
  interactive: boolean;
  /** Atribut = `d10` + oprava; Útok = `d6+` + ÚČ (+ zranění k zobrazení). */
  onRoll: (
    label: string,
    modifier: number,
    kind: 'd10' | 'd6+',
    damage?: string,
  ) => void;
  setStat: (key: string, v: unknown) => void;
  setAttack: (i: number, patch: Partial<DrdhAttack>) => void;
  addAttack: () => void;
  delAttack: (i: number) => void;
  setResist: (i: number, patch: Partial<DrdhResist>) => void;
  addResist: () => void;
  delResist: (i: number) => void;
  setAbility: (i: number, patch: Partial<DrdhBestieAbility>) => void;
  addAbility: () => void;
  delAbility: (i: number) => void;
}

export function DrdhBestieCombatActions({
  ss,
  dStats,
  editing,
  interactive,
  onRoll,
  setStat,
  setAttack,
  addAttack,
  delAttack,
  setResist,
  addResist,
  delResist,
  setAbility,
  addAbility,
  delAbility,
}: DrdhBestieCombatActionsProps): React.ReactElement {
  const [abilOpen, setAbilOpen] = useState(false);
  const [tacOpen, setTacOpen] = useState(false);

  const src = editing ? dStats : ss;
  const attacks = (Array.isArray(src.attacks) ? src.attacks : []) as DrdhAttack[];
  const resist = (Array.isArray(src.resist) ? src.resist : []) as DrdhResist[];
  const abilities = (Array.isArray(src.abilities)
    ? src.abilities
    : []) as DrdhBestieAbility[];
  const tactic = typeof src.tactic === 'string' ? src.tactic : '';

  // Meta pás — čte view i edit z odpovídajícího zdroje.
  const metaStr = (key: string): string => {
    const v = src[key];
    return v == null ? '' : String(v);
  };

  return (
    <>
      {/* META — úroveň · velikost · pohyb · typ · výskyt · XP */}
      <div className={styles.stitle}>Meta</div>
      {editing ? (
        <div className={styles.meta}>
          {(
            [
              ['level', 'Úroveň'],
              ['size', 'Velikost'],
              ['movement', 'Pohyb'],
              ['creature_type', 'Typ tvora'],
              ['occurrence', 'Výskyt'],
              ['higher_power', 'Vyšší moc'],
              ['xp', 'Zkušenosti'],
            ] as const
          ).map(([key, label]) => (
            <div className={styles.metaCard} key={key}>
              <span className={styles.metaLab}>{label}</span>
              <input
                className={styles.metaEdit}
                value={metaStr(key)}
                onChange={(e) => setStat(key, e.target.value)}
                aria-label={label}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.meta}>
          <MetaCard label="Úroveň" value={metaStr('level') || '—'} />
          <MetaCard label="Velikost" value={metaStr('size') || '—'} small />
          <MetaCard label="Pohyb" value={metaStr('movement') || '—'} />
          <MetaCard
            label="Typ"
            value={metaStr('creature_type') || '—'}
            small
          />
          <MetaCard label="Výskyt" value={metaStr('occurrence') || '—'} small />
          <MetaCard label="Zkušenosti" value={metaStr('xp') || '—'} />
        </div>
      )}

      {/* ATRIBUTY — klik = k10 + oprava */}
      <div className={styles.stitle}>
        Atributy <small>{editing ? 'stupeň' : 'klik = k10 + oprava'}</small>
      </div>
      {!editing && (
        <div className={styles.statGrid}>
          {DRDH_ATTRS.map((a) => {
            const deg = toNum(ss[a.id]);
            const mod = drdhAttrMod(deg);
            return (
              <button
                key={a.id}
                type="button"
                className={styles.statBtn}
                disabled={!interactive}
                onClick={() => onRoll(a.label, mod, 'd10')}
                title={`Hodit ${a.label} (k10 ${fmtMod(mod)})`}
                aria-label={
                  interactive ? `Hodit ${a.label}` : a.label
                }
              >
                <span className={styles.statName}>
                  {a.label}
                  <small>{a.abbr}</small>
                </span>
                <span className={styles.statVal}>{ss[a.id] != null ? deg : '—'}</span>
                <span
                  className={`${styles.statBonus} ${
                    mod < 0 ? styles.neg : mod === 0 ? styles.zero : ''
                  }`.trim()}
                >
                  {fmtMod(mod)}
                </span>
              </button>
            );
          })}
        </div>
      )}
      {editing && (
        <div className={styles.statGrid}>
          {DRDH_ATTRS.map((a) => (
            <div className={styles.statEdit} key={a.id}>
              <span>
                {a.label} <small>{a.abbr}</small>
              </span>
              <input
                className={`${styles.ed} ${styles.edNum}`}
                style={{ flex: '0 0 56px' }}
                value={String(dStats[a.id] ?? '')}
                onChange={(e) => setStat(a.id, e.target.value)}
                aria-label={`${a.label} stupeň`}
              />
            </div>
          ))}
        </div>
      )}

      {/* ÚTOKY — klik = ÚČ + k6+ */}
      <div className={styles.stitle}>
        Útoky <small>{editing ? 'úprava' : 'klik = ÚČ + k6+'}</small>
      </div>
      {!editing &&
        attacks.map((atk, i) => {
          const uc = toNum(atk.uc);
          const dmg = fmtDamage(atk.dmg);
          const meta = [atk.kind, dmg ? `zranění ${dmg}` : '']
            .filter(Boolean)
            .join(' · ');
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
                onClick={() =>
                  onRoll(`Útok: ${atk.name || 'zbraň'}`, uc, 'd6+', dmg)
                }
                title={`Útok ${atk.name || 'zbraň'} (k6+ ÚČ ${uc})${
                  dmg ? ` · zranění ${dmg}` : ''
                }`}
                aria-label={atk.name ? `Útok ${atk.name}` : 'Útok'}
              >
                ⚔ Útok <b>ÚČ {uc}</b>
              </button>
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
              className={styles.ed}
              value={String(atk.kind ?? '')}
              onChange={(e) => setAttack(i, { kind: e.target.value })}
              placeholder="typ"
              aria-label={`Útok ${i + 1} typ`}
            />
            <input
              className={`${styles.ed} ${styles.edNum}`}
              value={String(atk.uc ?? '')}
              onChange={(e) => setAttack(i, { uc: e.target.value })}
              placeholder="ÚČ"
              aria-label={`Útok ${i + 1} ÚČ`}
            />
            <input
              className={`${styles.ed} ${styles.edNum}`}
              value={String(atk.dmg ?? '')}
              onChange={(e) => setAttack(i, { dmg: e.target.value })}
              placeholder="zran."
              aria-label={`Útok ${i + 1} zranění`}
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

      {/* OBRANA — ZO / OČ */}
      <div className={styles.stitle}>Obrana</div>
      <div className={styles.defRow}>
        <div className={styles.defCard}>
          <span className={styles.defLab}>ZO</span>
          {editing ? (
            <input
              className={styles.defEdit}
              value={String(dStats.zo ?? '')}
              onChange={(e) => setStat('zo', e.target.value)}
              aria-label="ZO"
            />
          ) : (
            <span className={styles.defVal}>{toNum(ss.zo)}</span>
          )}
        </div>
        <div className={styles.defCard}>
          <span className={styles.defLab}>OČ</span>
          {editing ? (
            <input
              className={styles.defEdit}
              value={String(dStats.oc ?? '')}
              onChange={(e) => setStat('oc', e.target.value)}
              aria-label="OČ"
            />
          ) : (
            <span className={styles.defVal}>{toNum(ss.oc)}</span>
          )}
        </div>
      </div>

      {/* ODOLNOSTI — rez / imu / slab */}
      <div className={styles.stitle}>
        Odolnosti <small>{editing ? 'úprava' : 'rezistence · imunity · slabiny'}</small>
      </div>
      {!editing && (
        <div className={styles.resGrid}>
          {resist.map((r, i) => {
            const kind = r.kind === 'imu' || r.kind === 'slab' ? r.kind : 'rez';
            return (
              <div className={`${styles.resTag} ${styles[kind]}`} key={i}>
                <span className={styles.resKind}>{resistLabel(kind)}</span>
                {r.label || '—'}
              </div>
            );
          })}
          {resist.length === 0 && <p className={styles.hint}>Žádné odolnosti.</p>}
        </div>
      )}
      {editing &&
        resist.map((r, i) => (
          <div className={styles.resEdit} key={i}>
            <select
              className={styles.resSelect}
              value={String(r.kind ?? 'rez')}
              onChange={(e) => setResist(i, { kind: e.target.value })}
              aria-label={`Odolnost ${i + 1} druh`}
            >
              {RESIST_KINDS.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
            </select>
            <input
              className={styles.ed}
              value={String(r.label ?? '')}
              onChange={(e) => setResist(i, { label: e.target.value })}
              placeholder="popis (např. Chlad — poloviční zranění)"
              aria-label={`Odolnost ${i + 1} popis`}
            />
            <button
              type="button"
              className={styles.del}
              onClick={() => delResist(i)}
              aria-label="Odebrat odolnost"
            >
              ✕
            </button>
          </div>
        ))}
      {editing && (
        <button type="button" className={styles.miniAdd} onClick={addResist}>
          + přidat odolnost
        </button>
      )}

      {/* OKNA — schopnosti + taktika */}
      <div className={styles.winBtns}>
        <button
          type="button"
          className={styles.winBtn}
          onClick={() => setAbilOpen(true)}
        >
          ✦ Zvláštní schopnosti
        </button>
        <button
          type="button"
          className={styles.winBtn}
          onClick={() => setTacOpen(true)}
        >
          📖 Taktika &amp; popis
        </button>
      </div>

      <Modal
        open={abilOpen}
        onClose={() => setAbilOpen(false)}
        title="Zvláštní schopnosti"
        size="lg"
      >
        {editing ? (
          <>
            {abilities.map((a, i) => (
              <div className={styles.atkEdit} key={i} style={{ gridTemplateColumns: '1fr 2fr auto' }}>
                <input
                  className={styles.ed}
                  value={String(a.name ?? '')}
                  onChange={(e) => setAbility(i, { name: e.target.value })}
                  placeholder="název"
                  aria-label={`Schopnost ${i + 1} název`}
                />
                <input
                  className={styles.ed}
                  value={String(a.desc ?? '')}
                  onChange={(e) => setAbility(i, { desc: e.target.value })}
                  placeholder="účinek"
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
          <p className={styles.modalEmpty}>Žádné zvláštní schopnosti.</p>
        ) : (
          <table className={styles.mtbl}>
            <thead>
              <tr>
                <th>Název</th>
                <th>Účinek</th>
              </tr>
            </thead>
            <tbody>
              {abilities.map((a, i) => (
                <tr key={i}>
                  <td>{a.name || '—'}</td>
                  <td>{a.desc || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>

      <Modal
        open={tacOpen}
        onClose={() => setTacOpen(false)}
        title="Taktika & popis"
        size="lg"
      >
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
          <p className={styles.modalEmpty}>Bez popisu.</p>
        )}
      </Modal>
    </>
  );
}

function MetaCard({
  label,
  value,
  small,
}: {
  label: string;
  value: string;
  small?: boolean;
}): React.ReactElement {
  return (
    <div className={styles.metaCard}>
      <span className={styles.metaLab}>{label}</span>
      <div className={`${styles.metaVal} ${small ? styles.small : ''}`.trim()}>
        {value}
      </div>
    </div>
  );
}

export default DrdhBestieCombatActions;
