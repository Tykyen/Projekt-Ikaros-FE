/**
 * 16.2b-chat — DrD 1.6 bestie panel v railu světového chatu (parita s mapou).
 *
 * Sourozenec mapového `Drd16BestiePanel`: sdílí prezentační jádro boje
 * (`Drd16BestieCombatActions` — útoky/OČ/statline/popis), liší se persistencí a
 * routingem hodů:
 *   - **Hody d6+** → `useChatDiaryRoll` (overlay + zpráva do konverzace,
 *     atribuce `bestie`), NE mapový `onMapRoll`.
 *   - **Životy** = jedno číslo `systemStats.hp` (drd16 nemá current/max jako
 *     mapový token) — instance: ± kroky → `onPatch`; katalog: read-only.
 *   - **Edit instance** → `Drd16ChatBestieEditModal` (patch combatanta).
 *
 * Routing rolí/persistence dodá rodič (`BestieRollPanel` katalog /
 * `BestieInstancePanel` roster) přes `onPatch` (instance) nebo bez něj (katalog).
 *
 * Iniciativa instance se ukládá do `combatant.initiative` (souboj lišta) přes
 * `useChatDiaryRoll`'s `onResult(total)` → `onPatch`. Katalog (bez `onPatch`)
 * jen hází do konverzace.
 */
import { useState } from 'react';
import { Drd16BestieCombatActions } from '@/features/world/tactical-map/components/token-panel/system-panels/Drd16BestieCombatActions';
import mapStyles from '@/features/world/tactical-map/components/token-panel/system-panels/Drd16BestiePanel.module.css';
import { useChatDiaryRoll } from './useChatDiaryRoll';
import { Drd16ChatBestieEditModal } from './Drd16ChatBestieEditModal';
import styles from './Drd16ChatBestiePanel.module.css';

/** Patch nad bestie instancí v rosteru (combatant). `type` (ne `interface`) —
 *  musí být přiřaditelný k `Record<string, unknown>` (CombatantOp patch). */
export type Drd16ChatBestiePatch = {
  systemStats?: Record<string, unknown>;
  notes?: string;
  name?: string;
  /** Výsledek hodu iniciativy → řazení souboj lišty. */
  initiative?: number;
};

interface Props {
  worldId: string;
  /** Aktivní konverzace — kam hod míří. `null` = roll no-op. */
  channelId: string | null;
  /** Jméno + avatar pro atribuci hodu (PJ mluví za bestii). */
  rollerName: string;
  avatarUrl?: string;
  systemStats: Record<string, unknown>;
  notes?: string;
  /** Instance PJ — smí HP ± + „✏ Upravit". Katalog = false. */
  canEdit: boolean;
  /** Persist patch na combatanta (instance). Bez něj = read-only katalog. */
  onPatch?: (patch: Drd16ChatBestiePatch) => void;
}

const toNum = (v: unknown, fb = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
};

export function Drd16ChatBestiePanel({
  worldId,
  channelId,
  rollerName,
  avatarUrl,
  systemStats,
  notes,
  canEdit,
  onPatch,
}: Props): React.ReactElement {
  const [editing, setEditing] = useState(false);
  const makeOnRoll = useChatDiaryRoll(worldId, channelId);
  const onRoll = makeOnRoll({ kind: 'bestie', rollerName, avatarUrl });

  const ss = systemStats ?? {};
  const hp = toNum(ss.hp);
  const interactive = !!channelId;
  const editable = canEdit && !!onPatch;

  const doRoll = (label: string, modifier: number): void => {
    onRoll({ label, modifier, kind: 'd6+' });
  };

  const rollInitiative = (): void => {
    // Iniciativa → hod do chatu + persist výsledku do combatant.initiative
    // (souboj lišta řadí dle něj). Katalog bez onPatch → jen hod.
    onRoll({ label: 'Iniciativa', modifier: 0, kind: 'd6+' }, (total) =>
      onPatch?.({ initiative: total }),
    );
  };

  const adjustHp = (delta: number): void => {
    if (!editable) return;
    const next = Math.max(0, hp + delta);
    onPatch?.({ systemStats: { ...ss, hp: next } });
  };

  return (
    <div className={mapStyles.root}>
      {interactive && (
        <button
          type="button"
          className={mapStyles.initBtn}
          onClick={rollInitiative}
          title="Hodit iniciativu (d6+)"
        >
          ⚡ Iniciativa
        </button>
      )}

      {editable && (
        <button
          type="button"
          className={mapStyles.editBtn}
          onClick={() => setEditing(true)}
          title="Upravit tuto bestii (jméno, staty, popis)"
        >
          ✏ Upravit bestii
        </button>
      )}

      <div className={styles.hpRow}>
        <span className={mapStyles.hpLab}>Životy</span>
        <span className={styles.hpVal}>{hp}</span>
        {editable && (
          <div className={mapStyles.steps} style={{ marginLeft: 'auto' }}>
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
        notes={notes}
        interactive={interactive}
        onRoll={doRoll}
      />

      {editing && onPatch && (
        <Drd16ChatBestieEditModal
          name={rollerName}
          systemStats={ss}
          notes={notes ?? ''}
          onSave={(patch) => {
            onPatch(patch);
            setEditing(false);
          }}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}

export default Drd16ChatBestiePanel;
