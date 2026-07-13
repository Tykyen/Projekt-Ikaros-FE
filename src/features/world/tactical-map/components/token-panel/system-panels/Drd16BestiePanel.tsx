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
import { Drd16BestieCombatActions } from './Drd16BestieCombatActions';
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

const toNum = (v: unknown, fb = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
};

export function Drd16BestiePanel({
  token,
  sceneId,
  worldId,
  canEdit,
  onMapRoll,
}: Props): React.ReactElement {
  const update = useTokenUpdate(sceneId, worldId);
  const ss = (token.systemStats ?? {}) as Record<string, unknown>;
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
    // Lost-update fix: DELTA místo absolutního `patch.currentHp` — server ji
    // aplikuje atomicky s clampem 0..maxHp a v 201/broadcastu vrací absolutní
    // hodnotu (zdroj pravdy). Absolutní set ze stale cache ztrácel souběžné zásahy.
    update.mutate({ tokenId: token.id, hpDelta: delta });
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

      <Drd16BestieCombatActions
        systemStats={ss}
        notes={token.notes}
        interactive={interactive}
        onRoll={(label, modifier) => roll(label, modifier, 'skill')}
      />

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
