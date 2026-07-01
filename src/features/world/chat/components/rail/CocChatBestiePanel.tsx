/**
 * Call of Cthulhu bestie panel v railu světového chatu (parita s mapou).
 *
 * Sourozenec mapového `CocBestiePanel`: sdílí jádro `CocBestieCombatActions`,
 * liší se persistencí a routingem:
 *   - Hody → `useChatDiaryRoll` (overlay + zpráva, atribuce `bestie`). Vlastnost
 *     / zásah = `d100` (percentile), škody = `mixed{dY}`.
 *   - Iniciativa = `flat` (= OBR; CoC nehází) → `onResult` → `onPatch({initiative})`.
 *   - HP žije v `systemStats` (`health.max`/`health.current`); ± přes `onPatch`.
 *   - Edit inline → `onPatch` (combatant; systemStats VOLNÝ, bez BE strict).
 */
import { useState } from 'react';
import {
  CocBestieCombatActions,
  parseCocDamage,
  type CocBestieAttack,
  type CocBestieAbility,
} from '@/features/world/tactical-map/components/token-panel/system-panels/CocBestieCombatActions';
import mapStyles from '@/features/world/tactical-map/components/token-panel/system-panels/CocBestiePanel.module.css';
import { useChatDiaryRoll } from './useChatDiaryRoll';

export type CocChatBestiePatch = {
  systemStats?: Record<string, unknown>;
  name?: string;
  initiative?: number;
};

interface Props {
  worldId: string;
  channelId: string | null;
  rollerName: string;
  avatarUrl?: string;
  systemStats: Record<string, unknown>;
  canEdit: boolean;
  onPatch?: (patch: CocChatBestiePatch) => void;
}

const toNum = (v: unknown, fb = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
};
const s = (o: Record<string, unknown>, k: string): string => {
  const v = o[k];
  return v == null ? '' : String(v);
};

export function CocChatBestiePanel({
  worldId,
  channelId,
  rollerName,
  avatarUrl,
  systemStats,
  canEdit,
  onPatch,
}: Props): React.ReactElement {
  const [editing, setEditing] = useState(false);
  const [dName, setDName] = useState('');
  const [dStats, setDStats] = useState<Record<string, unknown>>({});

  const makeOnRoll = useChatDiaryRoll(worldId, channelId);
  const chatRoll = makeOnRoll({ kind: 'bestie', rollerName, avatarUrl });

  const ss = systemStats ?? {};
  const editable = canEdit && !!onPatch;
  const interactive = !!channelId && !editing;

  const hpMax = Math.max(0, toNum(ss['health.max'], 0));
  const hpCur = ss['health.current'] != null ? Math.max(0, toNum(ss['health.current'])) : hpMax;
  const pct = hpMax > 0 ? Math.max(0, Math.min(100, (hpCur / hpMax) * 100)) : 0;
  const initVal =
    ss['characteristics.dex'] != null
      ? toNum(ss['characteristics.dex'])
      : toNum(ss['initiative.current'], 50);

  const rollPercentile = (label: string, target: number): void => {
    chatRoll({ label, kind: 'd100', target });
  };
  const rollDamage = (label: string, dmg: string): void => {
    const d = parseCocDamage(dmg);
    if (!d) return;
    chatRoll({ label, kind: 'mixed', mixed: d.counts, modifier: d.mod });
  };
  const rollInit = (): void => {
    chatRoll(
      { label: 'Iniciativa', kind: 'flat', modifier: initVal, initiative: true },
      (total) => onPatch?.({ initiative: total }),
    );
  };

  const adjustHp = (delta: number): void => {
    if (!editable) return;
    const next = hpMax > 0 ? Math.max(0, Math.min(hpMax, hpCur + delta)) : Math.max(0, hpCur + delta);
    onPatch?.({ systemStats: { ...ss, 'health.current': next } });
  };

  const enterEdit = (): void => {
    setDName(rollerName);
    setDStats({ ...ss });
    setEditing(true);
  };
  const saveEdit = (): void => {
    onPatch?.({ name: dName.trim() || rollerName, systemStats: dStats });
    setEditing(false);
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
    <div className={`${mapStyles.root}${editing ? ' ' + mapStyles.editing : ''}`}>
      {editing && <div className={mapStyles.modeTag}>✏ Režim úprav — měníš hodnoty této potvory</div>}

      <div className={mapStyles.beastHead}>
        <div className={mapStyles.kind}>{s(ss, 'creature_type') || 'Bytost'}</div>
        {editing ? (
          <input
            className={mapStyles.nameEdit}
            value={dName}
            onChange={(e) => setDName(e.target.value)}
            aria-label="Jméno bestie"
            placeholder="Jméno bestie"
          />
        ) : (
          <div className={mapStyles.bname}>{rollerName}</div>
        )}
      </div>

      {interactive && (
        <button
          type="button"
          className={mapStyles.initBtn}
          onClick={rollInit}
          title="Iniciativa = OBR (CoC nehází, jen řadí)"
        >
          ⚑ Do iniciativy = {initVal}
        </button>
      )}
      {editable && (
        <button
          type="button"
          className={mapStyles.editFull}
          onClick={editing ? saveEdit : enterEdit}
        >
          {editing ? '✓ Hotovo (uložit)' : '✏ Upravit bestii'}
        </button>
      )}

      <div className={mapStyles.hp}>
        <span className={mapStyles.hpLbl}>Životy (HP)</span>
        {editing ? (
          <input
            className={mapStyles.hpEdit}
            value={String(dStats['health.max'] ?? '')}
            onChange={(e) => setStat('health.max', e.target.value)}
            aria-label="Životy (max)"
          />
        ) : (
          <>
            <div className={mapStyles.hpBar}>
              <div className={mapStyles.hpFill} style={{ width: `${pct}%` }} />
              <div className={mapStyles.hpTxt}>
                {hpCur} / {hpMax}
              </div>
            </div>
            {editable && (
              <div className={mapStyles.steps}>
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
        <div className={mapStyles.mini}>
          <div className={`${mapStyles.miniBox} ${mapStyles.san}`}>
            <span className={mapStyles.miniK}>SAN</span>
            <span className={mapStyles.miniV}>{s(ss, 'sanity') || '—'}</span>
          </div>
          <div className={mapStyles.miniBox}>
            <span className={mapStyles.miniK}>MP</span>
            <span className={mapStyles.miniV}>{s(ss, 'mp.current') || s(ss, 'mp.max') || '—'}</span>
          </div>
          <div className={mapStyles.miniBox}>
            <span className={mapStyles.miniK}>Štěstí</span>
            <span className={mapStyles.miniV}>{s(ss, 'luck') || '—'}</span>
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

export default CocChatBestiePanel;
