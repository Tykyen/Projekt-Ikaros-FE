/**
 * 16.2e Fáze 2 — DrD II bestie panel na taktické mapě.
 *
 * Fantasy pergamen (sladěno s Drd2CombatPanel/Sheet). Čte `token.systemStats`
 * (snapshot drd2 bestie). Sudba = HP tokenu (`token.currentHp/maxHp`, mapový
 * systém; `sudba` → maxHp při spawnu, viz buildBestieToken schema-aware).
 *
 * Bojové jádro (Hranice / Charakteristiky / Zvláštní schopnosti, view + inline
 * edit) je SDÍLENÉ s chatem přes `Drd2BestieCombatActions`. Tady jen mapová
 * specifika: persistence přes `useTokenUpdate`, routing `onMapRoll`, Sudba HP
 * a iniciativa.
 *
 * Hody: vše `2d6+` (otevřený hod DrD). Charakteristiky = 2k6 + úroveň;
 * Iniciativa = 2k6 + iniciativa(base) → zapíše `token.initiative`.
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
  Drd2BestieCombatActions,
  type Charakteristika,
  type ZvlSchopnost,
} from './Drd2BestieCombatActions';
import styles from './Drd2BestiePanel.module.css';

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

export function Drd2BestiePanel({
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
  const initBase = toNum(ss['initiative.base']);
  const pct = maxHp > 0 ? Math.max(0, Math.min(100, (currentHp / maxHp) * 100)) : 0;

  // ── sanitizace systemStats na klíče `drd2:token` (BE validateForPatch STRICT) ──
  const sanitize = (stats: Record<string, unknown>): Record<string, unknown> => {
    const sch = systemEntitySchemaRegistry.get('drd2', 'token');
    const known = new Set(
      sch?.sections.flatMap((s) => s.fields.map((f) => f.key)) ?? [],
    );
    return known.size > 0
      ? Object.fromEntries(Object.entries(stats).filter(([k]) => known.has(k)))
      : stats;
  };

  // ── hody (2d6+) ──
  const roll = (
    label: string,
    mod: number,
    category: DiceRollCategory,
  ): void => {
    if (!onMapRoll) return;
    const res = performSheetRoll({ label, modifier: mod, kind: '2d6+', rollerName });
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
  const onRoll = (label: string, baseMod: number): void =>
    roll(label, baseMod, 'skill');

  const adjustHp = (delta: number): void => {
    if (!canEdit) return;
    // Lost-update fix: DELTA místo absolutního `patch.currentHp` — server ji
    // aplikuje atomicky s clampem 0..maxHp a v 201/broadcastu vrací absolutní
    // hodnotu (zdroj pravdy). Absolutní set ze stale cache ztrácel souběžné zásahy.
    update.mutate({ tokenId: token.id, hpDelta: delta });
  };

  // ── inline edit ──
  const enterEdit = (): void => {
    setDName(token.instanceName ?? '');
    setDStats({ ...ss });
    setEditing(true);
  };
  const saveEdit = (): void => {
    const newMax = toNum(dStats.sudba, maxHp);
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

  // charakteristiky draft
  const getChars = (s: Record<string, unknown>): Charakteristika[] =>
    Array.isArray(s.charakteristiky) ? (s.charakteristiky as Charakteristika[]) : [];
  const setChar = (i: number, patch: Partial<Charakteristika>): void =>
    setDStats((s) => {
      const arr = [...getChars(s)];
      arr[i] = { ...arr[i], ...patch };
      return { ...s, charakteristiky: arr };
    });
  const addChar = (): void =>
    setDStats((s) => ({
      ...s,
      charakteristiky: [...getChars(s), { nazev: '', uroven: 1 }],
    }));
  const delChar = (i: number): void =>
    setDStats((s) => ({
      ...s,
      charakteristiky: getChars(s).filter((_, j) => j !== i),
    }));

  // zvláštní schopnosti draft
  const getZs = (s: Record<string, unknown>): ZvlSchopnost[] =>
    Array.isArray(s.zvlastni_schopnosti)
      ? (s.zvlastni_schopnosti as ZvlSchopnost[])
      : [];
  const setZs = (i: number, patch: Partial<ZvlSchopnost>): void =>
    setDStats((s) => {
      const arr = [...getZs(s)];
      arr[i] = { ...arr[i], ...patch };
      return { ...s, zvlastni_schopnosti: arr };
    });
  const addZs = (): void =>
    setDStats((s) => ({
      ...s,
      zvlastni_schopnosti: [...getZs(s), { nazev: '', popis: '' }],
    }));
  const delZs = (i: number): void =>
    setDStats((s) => ({
      ...s,
      zvlastni_schopnosti: getZs(s).filter((_, j) => j !== i),
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
          onClick={() => roll('Iniciativa', initBase, 'initiative')}
          title="Hodit iniciativu (2k6 + iniciativa)"
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

      {/* Sudba = HP (damageable) */}
      <div className={styles.sudba}>
        <span className={styles.sudbaLbl}>Sudba</span>
        {editing ? (
          <input
            className={styles.sudbaEdit}
            value={String(dStats.sudba ?? '')}
            onChange={(e) => setStat('sudba', e.target.value)}
            aria-label="Sudba (max)"
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
                    aria-label={`Sudba ${d > 0 ? '+' : ''}${d}`}
                  >
                    {d > 0 ? `+${d}` : d}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Drd2BestieCombatActions
        ss={ss}
        dStats={dStats}
        editing={editing}
        interactive={interactive}
        onRoll={onRoll}
        setStat={setStat}
        setChar={setChar}
        addChar={addChar}
        delChar={delChar}
        setZs={setZs}
        addZs={addZs}
        delZs={delZs}
      />
    </div>
  );
}

export default Drd2BestiePanel;
