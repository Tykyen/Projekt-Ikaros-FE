/**
 * 16b-chat — Dračí Hlídka bestie panel v railu světového chatu (parita s mapou).
 *
 * Sourozenec mapového `DrdhBestiePanel`: sdílí prezentační jádro
 * `DrdhBestieCombatActions` (Meta / Atributy / Útoky / Obrana / Odolnosti /
 * okna), liší se persistencí a routingem:
 *   - **Hody** → `useChatDiaryRoll` (overlay + zpráva, atribuce `bestie`),
 *     NE mapový `onMapRoll`. Atribut = `d10`, Útok = `d6+` (+ damage).
 *   - **Iniciativa** = `⚡` (`d6` + oprava OBR) → `onResult(total)` → `onPatch({initiative})`.
 *   - **HP** žije v `systemStats` (combatant nemá `token.currentHp`): `hp` = max,
 *     `hp_cur` = aktuální; ± přes `onPatch`. Reuse pergamen CSS mapy.
 *   - **Edit** inline → `onPatch` (combatant; systemStats VOLNÝ, bez BE strict).
 */
import { useState } from 'react';
import {
  DrdhBestieCombatActions,
  type DrdhAttack,
  type DrdhResist,
  type DrdhBestieAbility,
} from '@/features/world/tactical-map/components/token-panel/system-panels/DrdhBestieCombatActions';
import { drdhAttrMod } from '@/features/world/pages/CharacterDetailPage/diary-systems/sheets/drdh/constants';
import mapStyles from '@/features/world/tactical-map/components/token-panel/system-panels/DrdhBestiePanel.module.css';
import { useChatDiaryRoll } from './useChatDiaryRoll';

export type DrdhChatBestiePatch = {
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
  rollerName: string;
  avatarUrl?: string;
  systemStats: Record<string, unknown>;
  /** Instance PJ — smí HP ± + „✏ Upravit". Katalog = false. */
  canEdit: boolean;
  /** Persist patch na combatanta (instance). Bez něj = read-only katalog. */
  onPatch?: (patch: DrdhChatBestiePatch) => void;
}

const toNum = (v: unknown, fb = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
};

export function DrdhChatBestiePanel({
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

  const hpMax = Math.max(0, toNum(ss.hp, 0));
  const hpCur = ss.hp_cur != null ? Math.max(0, toNum(ss.hp_cur)) : hpMax;
  const initMod =
    ss.initiative != null ? toNum(ss.initiative) : drdhAttrMod(toNum(ss.dex));
  const deathLimit = -(10 + drdhAttrMod(toNum(ss.con)));
  const pct = hpMax > 0 ? Math.max(0, Math.min(100, (hpCur / hpMax) * 100)) : 0;

  // Hod atributu (d10) / útoku (d6+ + damage); iniciativa řeší rollInit.
  const onRoll = (
    label: string,
    modifier: number,
    kind: 'd10' | 'd6+',
    damage?: string,
  ): void => {
    chatRoll({ label, modifier, kind, ...(damage ? { damage } : {}) });
  };
  const rollInit = (): void => {
    chatRoll({ label: 'Iniciativa', modifier: initMod, kind: 'd6', initiative: true }, (total) =>
      onPatch?.({ initiative: total }),
    );
  };

  const adjustHp = (delta: number): void => {
    if (!editable) return;
    const next =
      hpMax > 0
        ? Math.max(0, Math.min(hpMax, hpCur + delta))
        : Math.max(0, hpCur + delta);
    onPatch?.({ systemStats: { ...ss, hp_cur: next } });
  };

  // ── inline edit ──
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
          title="Hodit iniciativu (k6 + oprava OBR)"
        >
          ⚡ Iniciativa
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

      {/* Životy = HP (ze systemStats) */}
      <div className={mapStyles.hp}>
        <span className={mapStyles.hpLbl}>Životy</span>
        {editing ? (
          <input
            className={mapStyles.hpEdit}
            value={String(dStats.hp ?? '')}
            onChange={(e) => setStat('hp', e.target.value)}
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
        <div className={mapStyles.hpDeath}>
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

export default DrdhChatBestiePanel;
