/**
 * Call of Cthulhu bestie panel na taktické mapě.
 *
 * Čte `token.systemStats` (snapshot coc bestie, ploché tečkové klíče). HP =
 * token.currentHp/maxHp (mapový systém; health.current → currentHp při spawnu).
 * Bojové jádro (Vlastnosti/SAN loss/Útoky/Boj/Zvláštnosti) je SDÍLENÉ s chatem
 * přes `CocBestieCombatActions`. Tady mapová specifika: persistence
 * (`useTokenUpdate`), routing `onMapRoll`, HP ± a iniciativa.
 *
 * Hody: vlastnost/zásah/dovednost = `d100` (percentile „pod cíl"), škody =
 * `mixed{dY}`, iniciativa = `flat` (= OBR; CoC nehází) → `token.initiative`.
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { parseApiError } from '@/shared/api/client';
import { performSheetRoll } from '../../../utils/rollFromSheet';
import { useTokenUpdate } from '../../../hooks/useTokenUpdate';
import { systemEntitySchemaRegistry } from '../../../schemas/registry';
import type { MapToken, DiceRollCategory } from '../../../types';
import type { MapRollRequest } from '../../../hooks/useMapDiceRoll';
import {
  CocBestieCombatActions,
  parseCocDamage,
  type CocBestieAttack,
  type CocBestieAbility,
} from './CocBestieCombatActions';
import styles from './CocBestiePanel.module.css';

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
const s = (o: Record<string, unknown>, k: string): string => {
  const v = o[k];
  return v == null ? '' : String(v);
};

export function CocBestiePanel({
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
    ss['characteristics.dex'] != null
      ? toNum(ss['characteristics.dex'])
      : toNum(ss['initiative.current'], 50);

  // Sanitizace systemStats na klíče `coc:token` (BE validateForPatch STRICT).
  const sanitize = (stats: Record<string, unknown>): Record<string, unknown> => {
    const sch = systemEntitySchemaRegistry.get('coc', 'token');
    const known = new Set(sch?.sections.flatMap((sec) => sec.fields.map((f) => f.key)) ?? []);
    return known.size > 0
      ? Object.fromEntries(Object.entries(stats).filter(([k]) => known.has(k)))
      : stats;
  };

  // ── hody ──
  const rollPercentile = (label: string, target: number): void => {
    if (!onMapRoll) return;
    const res = performSheetRoll({ label, kind: 'd100', target, rollerName });
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
    const d = parseCocDamage(dmg);
    if (!d) return;
    const res = performSheetRoll({
      label,
      kind: 'mixed',
      mixed: d.counts,
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
    update.mutate({ tokenId: token.id, patch: { initiative: res.total }, skipInvalidate: true });
  };

  const adjustHp = (delta: number): void => {
    if (!canEdit) return;
    // Lost-update fix: DELTA místo absolutního `patch.currentHp` — server ji
    // aplikuje atomicky s clampem 0..maxHp a v 201 vrací absolutní hodnotu.
    // Zelený bar na tokenu čte `systemStats['health.current']` (damageable pole
    // token schématu) — mirror dopočítáváme z ABSOLUTNÍ hodnoty z response
    // (ne z lokálního odhadu; ten může být pod souběžnými zásahy mimo).
    update.mutate(
      { tokenId: token.id, hpDelta: delta },
      {
        onSuccess: (res) => {
          const abs =
            res.op.type === 'token.update' ? res.op.patch.currentHp : undefined;
          if (typeof abs !== 'number') return;
          update.mutate({
            tokenId: token.id,
            patch: { systemStats: sanitize({ ...ss, 'health.current': abs }) },
          });
        },
      },
    );
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
          systemStats: sanitize({ ...dStats, 'health.current': newCur, 'health.max': newMax }),
          maxHp: newMax,
          currentHp: newCur,
        },
      },
      {
        onSuccess: () => setEditing(false),
        onError: (e) => toast.error(`Uložení selhalo: ${parseApiError(e)}`),
      },
    );
  };

  const setStat = (key: string, v: unknown): void => setDStats((st) => ({ ...st, [key]: v }));
  const getList = <T,>(o: Record<string, unknown>, key: string): T[] =>
    Array.isArray(o[key]) ? (o[key] as T[]) : [];
  const setItem = <T,>(key: string, i: number, patch: Partial<T>): void =>
    setDStats((st) => {
      const arr = [...getList<T>(st, key)];
      arr[i] = { ...arr[i], ...patch };
      return { ...st, [key]: arr };
    });
  const addItem = <T,>(key: string, empty: T): void =>
    setDStats((st) => ({ ...st, [key]: [...getList<T>(st, key), empty] }));
  const delItem = (key: string, i: number): void =>
    setDStats((st) => ({ ...st, [key]: getList<unknown>(st, key).filter((_, j) => j !== i) }));

  return (
    <div className={`${styles.root}${editing ? ' ' + styles.editing : ''}`}>
      {editing && <div className={styles.modeTag}>✏ Režim úprav — měníš hodnoty této potvory</div>}

      {/* hlavička */}
      <div className={styles.beastHead}>
        <div className={styles.kind}>{s(ss, 'creature_type') || 'Bytost'}</div>
        {editing ? (
          <input
            className={styles.nameEdit}
            value={dName}
            onChange={(e) => setDName(e.target.value)}
            aria-label="Jméno bestie"
            placeholder="Jméno bestie"
          />
        ) : (
          <div className={styles.bname}>{rollerName}</div>
        )}
      </div>

      {interactive && (
        <button
          type="button"
          className={styles.initBtn}
          onClick={rollInit}
          title="Iniciativa = OBR (CoC nehází, jen řadí)"
        >
          ⚑ Do iniciativy = {initVal}
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

      {/* Životy */}
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

      {/* SAN / MP / Štěstí */}
      {!editing && (
        <div className={styles.mini}>
          <div className={`${styles.miniBox} ${styles.san}`}>
            <span className={styles.miniK}>SAN</span>
            <span className={styles.miniV}>{s(ss, 'sanity') || '—'}</span>
          </div>
          <div className={styles.miniBox}>
            <span className={styles.miniK}>MP</span>
            <span className={styles.miniV}>{s(ss, 'mp.current') || s(ss, 'mp.max') || '—'}</span>
          </div>
          <div className={styles.miniBox}>
            <span className={styles.miniK}>Štěstí</span>
            <span className={styles.miniV}>{s(ss, 'luck') || '—'}</span>
          </div>
        </div>
      )}

      <CocBestieCombatActions
        ss={ss}
        dStats={dStats}
        editing={editing}
        interactive={interactive}
        rollPercentile={rollPercentile}
        rollDamage={rollDamage}
        setStat={setStat}
        setAttack={(i, patch) => setItem<CocBestieAttack>('attacks', i, patch)}
        addAttack={() => addItem<CocBestieAttack>('attacks', { name: '', skill: 30, dmg: '', special: '' })}
        delAttack={(i) => delItem('attacks', i)}
        setAbility={(i, patch) => setItem<CocBestieAbility>('abilities', i, patch)}
        addAbility={() => addItem<CocBestieAbility>('abilities', { label: '', value: '' })}
        delAbility={(i) => delItem('abilities', i)}
      />
    </div>
  );
}

export default CocBestiePanel;
