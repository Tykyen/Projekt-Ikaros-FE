/**
 * 16.2b Fáze 2 — DrD 1.6 bestie panel na taktické mapě.
 *
 * Ořez na bojové minimum (per přání uživatele): Životy (standardní mapové HP) +
 * Iniciativa (d6+ bez bonusu) + Útoky (d6+ + číslo útoku) + Obranné číslo
 * (d6+ + OČ). Víc není potřeba. Žádná editace statů (čte snapshot z
 * `token.systemStats` = bestie schéma drd16) → žádná sanitizace/save.
 *
 * HP = token.currentHp/maxHp (mapový HP systém; `hp` bestie → maxHp při spawnu,
 * viz buildBestieToken schema-aware). Hody přes `performSheetRoll(kind:'d6+')`
 * → `onMapRoll` (3D overlay + dice log), `rollerKind: 'bestie'`.
 */
import { useState } from 'react';
import { performSheetRoll } from '../../../utils/rollFromSheet';
import { useTokenUpdate } from '../../../hooks/useTokenUpdate';
import { Drd16BestieTokenEditModal } from './Drd16BestieTokenEditModal';
import type { MapToken, DiceRollCategory } from '../../../types';
import type { MapRollRequest } from '../../../hooks/useMapDiceRoll';
import styles from './Drd16BestiePanel.module.css';

interface Props {
  token: MapToken;
  sceneId: string;
  worldId: string;
  systemId: string;
  canEdit: boolean;
  onMapRoll?: (req: MapRollRequest) => void;
}

interface Drd16Attack {
  name?: string;
  value?: unknown;
}

const toNum = (v: unknown, fb = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
};

const has = (v: unknown): boolean =>
  v !== undefined && v !== null && v !== '';

/** Read-only staty pro PJ referenci (label · key · slovo?). */
const SECONDARY: ReadonlyArray<{ label: string; key: string; word?: boolean }> = [
  { label: 'Velikost', key: 'size', word: true },
  { label: 'Zranit.', key: 'vulnerability', word: true },
  { label: 'Odoln.', key: 'resilience' },
  { label: 'Bojov.', key: 'combativeness' },
  { label: 'Vytrv.', key: 'endurance' },
  { label: 'Manévr.', key: 'maneuver' },
  { label: 'Int.', key: 'intelligence' },
  { label: 'Cha.', key: 'charisma' },
  { label: 'ZSM', key: 'mindForce' },
  { label: 'Přesv.', key: 'alignment', word: true },
  { label: 'Poklady', key: 'treasure', word: true },
  { label: 'Zkuš.', key: 'experience' },
  { label: 'Ochoč.', key: 'taming' },
];

export function Drd16BestiePanel({
  token,
  sceneId,
  worldId,
  canEdit,
  onMapRoll,
}: Props): React.ReactElement {
  const update = useTokenUpdate(sceneId, worldId);
  const ss = (token.systemStats ?? {}) as Record<string, unknown>;
  const attacks = Array.isArray(ss.attacks) ? (ss.attacks as Drd16Attack[]) : [];
  const defense = toNum(ss.defense);
  const maxHp = toNum(token.maxHp);
  const currentHp = toNum(token.currentHp);
  const rollerName = token.instanceName ?? 'Bestie';
  const interactive = canEdit && !!onMapRoll;
  const [editing, setEditing] = useState(false);

  const roll = (
    label: string,
    modifier: number,
    category: DiceRollCategory,
  ): void => {
    const res = performSheetRoll({ label, modifier, kind: 'd6+', rollerName });
    if (!res) return;
    onMapRoll?.({
      category,
      dicePayload: res.dicePayload,
      tokenId: token.id,
      rollerKind: 'bestie',
      rollerName,
    });
    if (category === 'initiative') {
      update.mutate({
        tokenId: token.id,
        patch: { initiative: res.total },
        skipInvalidate: true,
      });
    }
  };

  const adjustHp = (delta: number): void => {
    if (!canEdit) return;
    const next =
      maxHp > 0
        ? Math.max(0, Math.min(maxHp, currentHp + delta))
        : Math.max(0, currentHp + delta);
    update.mutate({ tokenId: token.id, patch: { currentHp: next } });
  };

  const pct = maxHp > 0 ? Math.max(0, Math.min(100, (currentHp / maxHp) * 100)) : 0;

  return (
    <div className={styles.root}>
      {interactive && (
        <button
          type="button"
          className={styles.initBtn}
          onClick={() => roll('Iniciativa', 0, 'initiative')}
          title="Hodit iniciativu (d6+)"
        >
          ⚡ Iniciativa
        </button>
      )}

      {canEdit && (
        <button
          type="button"
          className={styles.editBtn}
          onClick={() => setEditing(true)}
          title="Upravit tuto bestii (jméno, staty, popis)"
        >
          ✏ Upravit bestii
        </button>
      )}

      <div className={styles.hp}>
        <span className={styles.hpLab}>Životy</span>
        <div className={styles.hpBar}>
          <div className={styles.hpFill} style={{ width: `${pct}%` }} />
          <div className={styles.hpTxt}>
            {currentHp} / {maxHp}
          </div>
        </div>
        {canEdit && (
          <div className={styles.steps}>
            {[-5, -1, 1, 5].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => adjustHp(d)}
                aria-label={`Životy ${d > 0 ? '+' : ''}${d}`}
              >
                {d > 0 ? `+${d}` : d}
              </button>
            ))}
          </div>
        )}
      </div>

      <section>
        <h3 className={styles.title}>
          Útoky <small>klik = ÚČ + k6+</small>
        </h3>
        {attacks.length === 0 && <p className={styles.noAtk}>Žádné útoky.</p>}
        {attacks.map((a, i) => {
          const val = toNum(a.value);
          return (
            <button
              key={i}
              type="button"
              className={styles.atk}
              disabled={!interactive}
              style={
                interactive
                  ? undefined
                  : { cursor: 'default', pointerEvents: 'none' }
              }
              onClick={() => roll(`Útok: ${a.name || 'útok'}`, val, 'skill')}
              aria-label={`Útok ${a.name || ''}`.trim()}
            >
              <span className={styles.atkName}>{a.name || '(bez názvu)'}</span>
              <span className={styles.atkVal}>
                {val >= 0 ? '+' : ''}
                {val}
              </span>
            </button>
          );
        })}
      </section>

      <section>
        <h3 className={styles.title}>
          Obrana <small>klik = OČ + k6+</small>
        </h3>
        <button
          type="button"
          className={styles.def}
          disabled={!interactive}
          style={
            interactive ? undefined : { cursor: 'default', pointerEvents: 'none' }
          }
          onClick={() => roll('Obrana', defense, 'skill')}
          aria-label="Hodit obranu"
        >
          <span className={styles.defLab}>Obranné číslo</span>
          <span className={styles.defVal}>{defense}</span>
        </button>
      </section>

      {/* Read-only staty + popis — PJ s nimi pracuje (nehází se, jen reference). */}
      <section>
        <h3 className={styles.title}>Vlastnosti &amp; chování</h3>
        <div className={styles.stats}>
          {has(ss.movement) && (
            <span className={styles.pill}>
              <span className={styles.pk}>Pohyb</span>
              <span className={styles.pv}>{String(ss.movement)}</span>
              {has(ss.movementMode) && (
                <span className={`${styles.pv} ${styles.pvWord}`}>
                  {String(ss.movementMode)}
                </span>
              )}
            </span>
          )}
          {SECONDARY.filter((s) => has(ss[s.key])).map((s) => (
            <span key={s.key} className={styles.pill}>
              <span className={styles.pk}>{s.label}</span>
              <span
                className={`${styles.pv} ${s.word ? styles.pvWord : ''}`.trim()}
              >
                {String(ss[s.key])}
              </span>
            </span>
          ))}
        </div>
      </section>

      {token.notes && token.notes.trim() && (
        <section>
          <h3 className={styles.title}>Popis</h3>
          <div className={styles.desc}>{token.notes}</div>
        </section>
      )}

      {editing && (
        <Drd16BestieTokenEditModal
          token={token}
          sceneId={sceneId}
          worldId={worldId}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}

export default Drd16BestiePanel;
