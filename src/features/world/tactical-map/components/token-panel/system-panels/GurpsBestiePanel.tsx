/**
 * GURPS 4E bestie panel na taktické mapě.
 *
 * Čte `token.systemStats` (snapshot gurps bestie, ploché tečkové klíče). HP =
 * token.currentHp/maxHp (mapový systém; health.current→currentHp při spawnu).
 * Bojové jádro (Meta/Atributy/Útoky/Obrana/Zvláštnosti) je SDÍLENÉ s chatem přes
 * `GurpsBestieCombatActions`. Tady jen mapová specifika: persistence
 * (`useTokenUpdate`), routing `onMapRoll`, HP ± a iniciativa.
 *
 * Hody: Atribut/zásah = `3d6` (roll-under), škody = `mixed{d6}`, iniciativa =
 * `flat` (Základní rychlost; GURPS nehází) → `token.initiative`.
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { performSheetRoll } from '../../../utils/rollFromSheet';
import { useTokenUpdate } from '../../../hooks/useTokenUpdate';
import { systemEntitySchemaRegistry } from '../../../schemas/registry';
import { basicSpeed } from '@/features/world/pages/CharacterDetailPage/diary-systems/sheets/gurps/formulas';
import type { MapToken, DiceRollCategory } from '../../../types';
import type { MapRollRequest } from '../../../hooks/useMapDiceRoll';
import {
  GurpsBestieCombatActions,
  parseBestieDamage,
  type GurpsBestieAttack,
  type GurpsBestieAbility,
} from './GurpsBestieCombatActions';
import styles from './GurpsBestiePanel.module.css';

interface Props {
  token: MapToken;
  sceneId: string;
  worldId: string;
  systemId?: string;
  canEdit: boolean;
  onMapRoll?: (req: MapRollRequest) => void;
}

const toNum = (v: unknown, fb = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
};

export function GurpsBestiePanel({
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

  const initVal =
    ss['basic_speed'] != null
      ? toNum(ss['basic_speed'])
      : Math.round(basicSpeed(toNum(ss['attributes.dx'], 10), toNum(ss['attributes.ht'], 10)) * 100) / 100;

  // ── sanitizace systemStats na klíče `gurps:token` (BE validateForPatch STRICT) ──
  const sanitize = (stats: Record<string, unknown>): Record<string, unknown> => {
    const sch = systemEntitySchemaRegistry.get('gurps', 'token');
    const known = new Set(
      sch?.sections.flatMap((s) => s.fields.map((f) => f.key)) ?? [],
    );
    return known.size > 0
      ? Object.fromEntries(Object.entries(stats).filter(([k]) => known.has(k)))
      : stats;
  };

  // ── hody ──
  const rollUnder = (label: string, target: number): void => {
    if (!onMapRoll) return;
    const res = performSheetRoll({ label, kind: '3d6', target, rollerName });
    if (!res) return;
    onMapRoll({
      category: 'skill',
      dicePayload: res.dicePayload,
      tokenId: token.id,
      rollerKind: 'bestie',
      rollerName,
    });
  };
  const rollDamage = (label: string, dmg: string): void => {
    if (!onMapRoll) return;
    const d = parseBestieDamage(dmg);
    if (!d) return;
    const res = performSheetRoll({
      label,
      kind: 'mixed',
      mixed: { d6: d.count },
      modifier: d.mod,
      rollerName,
    });
    if (!res) return;
    onMapRoll({
      category: 'skill',
      dicePayload: res.dicePayload,
      tokenId: token.id,
      rollerKind: 'bestie',
      rollerName,
    });
  };
  const rollInit = (): void => {
    if (!onMapRoll) return;
    const res = performSheetRoll({
      label: 'Iniciativa',
      kind: 'flat',
      modifier: initVal,
      rollerName,
    });
    if (!res) return;
    const category: DiceRollCategory = 'initiative';
    onMapRoll({
      category,
      dicePayload: res.dicePayload,
      tokenId: token.id,
      rollerKind: 'bestie',
      rollerName,
    });
    update.mutate({
      tokenId: token.id,
      patch: { initiative: res.total },
      skipInvalidate: true,
    });
  };

  const adjustHp = (delta: number): void => {
    if (!canEdit) return;
    const next =
      maxHp > 0
        ? Math.max(0, Math.min(maxHp, currentHp + delta))
        : Math.max(0, currentHp + delta);
    // Zelený bar na tokenu čte `systemStats['health.current']` (damageable pole
    // token schématu) — musíme updatovat JEHO, ne jen `token.currentHp`, jinak
    // bar nereaguje. Držíme oba v sync (currentHp = combat roster / init lišta).
    update.mutate({
      tokenId: token.id,
      patch: {
        currentHp: next,
        systemStats: sanitize({ ...ss, 'health.current': next }),
      },
    });
  };

  // ── inline edit ──
  const enterEdit = (): void => {
    setDName(token.instanceName ?? '');
    setDStats({ ...ss });
    setEditing(true);
  };
  const saveEdit = (): void => {
    const newMax = toNum(dStats['health.max'], maxHp);
    const newCur = Math.min(toNum(dStats['health.current'], currentHp), newMax);
    update.mutate(
      {
        tokenId: token.id,
        patch: {
          instanceName: dName.trim() || token.instanceName,
          systemStats: sanitize({
            ...dStats,
            'health.current': newCur,
            'health.max': newMax,
          }),
          maxHp: newMax,
          currentHp: newCur,
        },
      },
      {
        onSuccess: () => setEditing(false),
        onError: (e) =>
          toast.error(`Uložení selhalo: ${e instanceof Error ? e.message : 'chyba'}`),
      },
    );
  };

  const setStat = (key: string, v: unknown): void =>
    setDStats((s) => ({ ...s, [key]: v }));
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
          onClick={rollInit}
          title="Iniciativa = Základní rychlost (GURPS nehází)"
        >
          ⚑ Do iniciativy = {String(initVal).replace('.', ',')}
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
        <span className={styles.hpLbl}>Životy (HP)</span>
        {editing ? (
          <input
            className={styles.hpEdit}
            value={String(dStats['health.max'] ?? '')}
            onChange={(e) => setStat('health.max', e.target.value)}
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

      <GurpsBestieCombatActions
        ss={ss}
        dStats={dStats}
        editing={editing}
        interactive={interactive}
        rollUnder={rollUnder}
        rollDamage={rollDamage}
        setStat={setStat}
        setAttack={(i, patch) => setItem<GurpsBestieAttack>('attacks', i, patch)}
        addAttack={() =>
          addItem<GurpsBestieAttack>('attacks', { name: '', skill: 10, dmg: '', reach: '' })
        }
        delAttack={(i) => delItem('attacks', i)}
        setAbility={(i, patch) => setItem<GurpsBestieAbility>('abilities', i, patch)}
        addAbility={() => addItem<GurpsBestieAbility>('abilities', { label: '', value: '' })}
        delAbility={(i) => delItem('abilities', i)}
      />
    </div>
  );
}

export default GurpsBestiePanel;
