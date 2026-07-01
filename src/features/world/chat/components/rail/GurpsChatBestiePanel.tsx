/**
 * GURPS 4E bestie panel v railu světového chatu (parita s mapou).
 *
 * Sourozenec mapového `GurpsBestiePanel`: sdílí jádro `GurpsBestieCombatActions`,
 * liší se persistencí a routingem:
 *   - Hody → `useChatDiaryRoll` (overlay + zpráva, atribuce `bestie`). Atribut /
 *     zásah = `3d6` (roll-under), škody = `mixed{d6}`.
 *   - Iniciativa = `flat` (Základní rychlost) → `onResult` → `onPatch({initiative})`.
 *   - HP žije v `systemStats` (`health.max` / `health.current`); ± přes `onPatch`.
 *   - Edit inline → `onPatch` (combatant; systemStats VOLNÝ, bez BE strict).
 */
import { useState } from 'react';
import {
  GurpsBestieCombatActions,
  parseBestieDamage,
  type GurpsBestieAttack,
  type GurpsBestieAbility,
} from '@/features/world/tactical-map/components/token-panel/system-panels/GurpsBestieCombatActions';
import { basicSpeed } from '@/features/world/pages/CharacterDetailPage/diary-systems/sheets/gurps/formulas';
import mapStyles from '@/features/world/tactical-map/components/token-panel/system-panels/GurpsBestiePanel.module.css';
import { useChatDiaryRoll } from './useChatDiaryRoll';

export type GurpsChatBestiePatch = {
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
  onPatch?: (patch: GurpsChatBestiePatch) => void;
}

const toNum = (v: unknown, fb = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
};

export function GurpsChatBestiePanel({
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
    ss['basic_speed'] != null
      ? toNum(ss['basic_speed'])
      : Math.round(basicSpeed(toNum(ss['attributes.dx'], 10), toNum(ss['attributes.ht'], 10)) * 100) / 100;

  const rollUnder = (label: string, target: number): void => {
    chatRoll({ label, kind: '3d6', target });
  };
  const rollDamage = (label: string, dmg: string): void => {
    const d = parseBestieDamage(dmg);
    if (!d) return;
    chatRoll({ label, kind: 'mixed', mixed: { d6: d.count }, modifier: d.mod });
  };
  const rollInit = (): void => {
    chatRoll(
      { label: 'Iniciativa', kind: 'flat', modifier: initVal, initiative: true },
      (total) => onPatch?.({ initiative: total }),
    );
  };

  const adjustHp = (delta: number): void => {
    if (!editable) return;
    const next =
      hpMax > 0 ? Math.max(0, Math.min(hpMax, hpCur + delta)) : Math.max(0, hpCur + delta);
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
    <div className={`${mapStyles.root}${editing ? ' ' + mapStyles.editing : ''}`}>
      {editing && (
        <div className={mapStyles.modeTag}>✏ Režim úprav — měníš hodnoty této potvory</div>
      )}
      {editing && (
        <input
          className={mapStyles.nameEdit}
          value={dName}
          onChange={(e) => setDName(e.target.value)}
          aria-label="Jméno bestie"
          placeholder="Jméno bestie"
        />
      )}

      {interactive && (
        <button
          type="button"
          className={mapStyles.initBtn}
          onClick={rollInit}
          title="Iniciativa = Základní rychlost (GURPS nehází)"
        >
          ⚑ Do iniciativy = {String(initVal).replace('.', ',')}
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

export default GurpsChatBestiePanel;
