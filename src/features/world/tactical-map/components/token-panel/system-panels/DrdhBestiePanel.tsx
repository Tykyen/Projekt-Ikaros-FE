/**
 * 16b bestie — Dračí Hlídka (drdh) bestie panel na taktické mapě.
 *
 * Fantasy pergamen „Strážní bestiář" (sladěno s DrdhCombatPanel/DrdhSheet). Čte
 * `token.systemStats` (snapshot drdh bestie). HP = token.currentHp/maxHp (mapový
 * systém; `hp` bestie → maxHp při spawnu, viz buildBestieToken schema-aware).
 *
 * Bojové jádro (Meta / Atributy / Útoky / Obrana / Odolnosti / okna, view +
 * inline edit) je SDÍLENÉ s chatem přes `DrdhBestieCombatActions`. Tady jen
 * mapová specifika: persistence přes `useTokenUpdate`, routing `onMapRoll`,
 * HP ± a iniciativa.
 *
 * Hody:
 *   - Iniciativa = `d6` + oprava OBR (`drdhAttrMod(dex)` nebo uložená
 *     `initiative`), `initiative:true` (NEexploduje) → zapíše `token.initiative`.
 *   - Atribut    = `d10` + `drdhAttrMod(stupeň)`.
 *   - Útok       = `d6+` + ÚČ (finální číslo); zranění (dmg) jen k zobrazení.
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { parseApiError } from '@/shared/api/client';
import { performSheetRoll } from '../../../utils/rollFromSheet';
import { useTokenUpdate } from '../../../hooks/useTokenUpdate';
import { systemEntitySchemaRegistry } from '../../../schemas/registry';
import {
  drdhAttrMod,
} from '@/features/world/pages/CharacterDetailPage/diary-systems/sheets/drdh/constants';
import type { MapToken, DiceRollCategory } from '../../../types';
import type { MapRollRequest } from '../../../hooks/useMapDiceRoll';
import {
  DrdhBestieCombatActions,
  type DrdhAttack,
  type DrdhResist,
  type DrdhBestieAbility,
} from './DrdhBestieCombatActions';
import styles from './DrdhBestiePanel.module.css';

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

export function DrdhBestiePanel({
  token,
  sceneId,
  worldId,
  canEdit,
  onMapRoll,
}: Props): React.ReactElement {
  const update = useTokenUpdate(sceneId, worldId);
  const [editing, setEditing] = useState(false);
  const [dName, setDName] = useState('');
  const [dStats, setDStats] = useState<Record<string, unknown>>({});

  const ss = (token.systemStats ?? {}) as Record<string, unknown>;
  const rollerName = token.instanceName ?? 'Bestie';
  const interactive = canEdit && !!onMapRoll && !editing;
  const maxHp = toNum(token.maxHp);
  const currentHp = toNum(token.currentHp);
  const pct = maxHp > 0 ? Math.max(0, Math.min(100, (currentHp / maxHp) * 100)) : 0;

  // Iniciativa = uložená `initiative` (= oprava OBR) nebo dopočet z Obr stupně.
  const initMod =
    ss.initiative != null ? toNum(ss.initiative) : drdhAttrMod(toNum(ss.dex));
  // Hranice smrti = −(10 + oprava ODO) — reference (auto z Odolnosti).
  const deathLimit = -(10 + drdhAttrMod(toNum(ss.con)));

  // ── sanitizace systemStats na klíče `drdh:token` (BE validateForPatch STRICT) ──
  const sanitize = (stats: Record<string, unknown>): Record<string, unknown> => {
    const sch = systemEntitySchemaRegistry.get('drdh', 'token');
    const known = new Set(
      sch?.sections.flatMap((s) => s.fields.map((f) => f.key)) ?? [],
    );
    return known.size > 0
      ? Object.fromEntries(Object.entries(stats).filter(([k]) => known.has(k)))
      : stats;
  };

  // ── hody ──
  const roll = (
    label: string,
    modifier: number,
    kind: 'd6' | 'd6+' | 'd10',
    category: DiceRollCategory,
    damage?: string,
  ): void => {
    if (!onMapRoll) return;
    const res = performSheetRoll({
      label,
      modifier,
      kind,
      rollerName,
      ...(damage ? { damage } : {}),
    });
    if (!res) return;
    onMapRoll({
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
  const onRoll = (
    label: string,
    modifier: number,
    kind: 'd10' | 'd6+',
    damage?: string,
  ): void => roll(label, modifier, kind, 'skill', damage);

  const adjustHp = (delta: number): void => {
    if (!canEdit) return;
    const next =
      maxHp > 0
        ? Math.max(0, Math.min(maxHp, currentHp + delta))
        : Math.max(0, currentHp + delta);
    update.mutate({ tokenId: token.id, patch: { currentHp: next } });
  };

  // ── inline edit ──
  const enterEdit = (): void => {
    setDName(token.instanceName ?? '');
    setDStats({ ...ss });
    setEditing(true);
  };
  const saveEdit = (): void => {
    const newMax = toNum(dStats.hp, maxHp);
    update.mutate(
      {
        tokenId: token.id,
        patch: {
          instanceName: dName.trim() || token.instanceName,
          systemStats: sanitize(dStats),
          maxHp: newMax,
          currentHp: Math.min(currentHp, newMax),
        },
      },
      {
        onSuccess: () => setEditing(false),
        onError: (e) =>
          toast.error(
            `Uložení selhalo: ${parseApiError(e)}`,
          ),
      },
    );
  };

  const setStat = (key: string, v: unknown): void =>
    setDStats((s) => ({ ...s, [key]: v }));

  // ── list draft helpery (útoky / odolnosti / schopnosti) ──
  const getList = <T,>(s: Record<string, unknown>, key: string): T[] =>
    Array.isArray(s[key]) ? (s[key] as T[]) : [];
  const setItem = <T,>(key: string, i: number, patch: Partial<T>): void =>
    setDStats((s) => {
      const arr = [...getList<T>(s, key)];
      arr[i] = { ...arr[i], ...patch };
      return { ...s, [key]: arr };
    });
  const addItem = <T,>(key: string, empty: T): void =>
    setDStats((s) => ({ ...s, [key]: [...getList<T>(s, key), empty] }));
  const delItem = (key: string, i: number): void =>
    setDStats((s) => ({
      ...s,
      [key]: getList<unknown>(s, key).filter((_, j) => j !== i),
    }));

  return (
    <div className={`${styles.root}${editing ? ' ' + styles.editing : ''}`}>
      {editing && (
        <div className={styles.modeTag}>✏ Režim úprav — měníš hodnoty této potvory</div>
      )}
      {editing && (
        <input
          className={styles.nameEdit}
          value={dName}
          onChange={(e) => setDName(e.target.value)}
          aria-label="Jméno bestie"
          placeholder="Jméno bestie"
        />
      )}

      {interactive && (
        <button
          type="button"
          className={styles.initBtn}
          onClick={() => roll('Iniciativa', initMod, 'd6', 'initiative')}
          title="Hodit iniciativu (k6 + oprava OBR)"
        >
          ⚡ Iniciativa
        </button>
      )}

      {canEdit && (
        <button
          type="button"
          className={styles.editFull}
          onClick={editing ? saveEdit : enterEdit}
          disabled={update.isPending}
        >
          {editing ? '✓ Hotovo (uložit)' : '✏ Upravit bestii'}
        </button>
      )}

      {/* Životy = HP (damageable) */}
      <div className={styles.hp}>
        <span className={styles.hpLbl}>Životy</span>
        {editing ? (
          <input
            className={styles.hpEdit}
            value={String(dStats.hp ?? '')}
            onChange={(e) => setStat('hp', e.target.value)}
            aria-label="Životy (max)"
          />
        ) : (
          <>
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
          </>
        )}
      </div>
      {!editing && (
        <div className={styles.hpDeath}>
          Hranice smrti <b>{deathLimit}</b>
        </div>
      )}

      <DrdhBestieCombatActions
        ss={ss}
        dStats={dStats}
        editing={editing}
        interactive={interactive}
        onRoll={onRoll}
        setStat={setStat}
        setAttack={(i, patch) => setItem<DrdhAttack>('attacks', i, patch)}
        addAttack={() =>
          addItem<DrdhAttack>('attacks', { name: '', kind: '', uc: 0, dmg: '' })
        }
        delAttack={(i) => delItem('attacks', i)}
        setResist={(i, patch) => setItem<DrdhResist>('resist', i, patch)}
        addResist={() => addItem<DrdhResist>('resist', { kind: 'rez', label: '' })}
        delResist={(i) => delItem('resist', i)}
        setAbility={(i, patch) => setItem<DrdhBestieAbility>('abilities', i, patch)}
        addAbility={() =>
          addItem<DrdhBestieAbility>('abilities', { name: '', desc: '' })
        }
        delAbility={(i) => delItem('abilities', i)}
      />
    </div>
  );
}

export default DrdhBestiePanel;
