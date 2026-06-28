/**
 * 16.2e-chat — DrD II bestie panel v railu světového chatu (parita s mapou).
 *
 * Sourozenec mapového `Drd2BestiePanel`: sdílí prezentační jádro
 * `Drd2BestieCombatActions` (Hranice / Charakteristiky / Zvláštní schopnosti),
 * liší se persistencí a routingem:
 *   - **Hody 2k6+** → `useChatDiaryRoll` (overlay + zpráva, atribuce `bestie`),
 *     NE mapový `onMapRoll`.
 *   - **Iniciativa** = `⚡` → `useChatDiaryRoll` `onResult(total)` → `onPatch({initiative})`.
 *   - **Sudba (HP)** žije v `systemStats` (combatant nemá `token.currentHp`):
 *     `sudba` = max, `sudba_cur` = aktuální; ± přes `onPatch`. Reuse pergamen CSS mapy.
 *   - **Edit** inline → `onPatch` (combatant; systemStats VOLNÝ, bez BE strict).
 */
import { useState } from 'react';
import {
  Drd2BestieCombatActions,
  type Charakteristika,
  type ZvlSchopnost,
} from '@/features/world/tactical-map/components/token-panel/system-panels/Drd2BestieCombatActions';
import mapStyles from '@/features/world/tactical-map/components/token-panel/system-panels/Drd2BestiePanel.module.css';
import { useChatDiaryRoll } from './useChatDiaryRoll';

export type Drd2ChatBestiePatch = {
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
  /** Instance PJ — smí Sudba ± + „✏ Upravit". Katalog = false. */
  canEdit: boolean;
  /** Persist patch na combatanta (instance). Bez něj = read-only katalog. */
  onPatch?: (patch: Drd2ChatBestiePatch) => void;
}

const toNum = (v: unknown, fb = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
};

export function Drd2ChatBestiePanel({
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

  const sudbaMax = Math.max(0, toNum(ss.sudba, 0));
  const sudbaCur =
    ss.sudba_cur != null ? Math.max(0, toNum(ss.sudba_cur)) : sudbaMax;
  const initBase = toNum(ss['initiative.base']);
  const pct = sudbaMax > 0 ? Math.max(0, Math.min(100, (sudbaCur / sudbaMax) * 100)) : 0;

  // Hod charakteristiky / iniciativy (2k6+); iniciativa → persist combatant.initiative.
  const onRoll = (label: string, baseMod: number): void => {
    chatRoll({ label, modifier: baseMod, kind: '2d6+' });
  };
  const rollInit = (): void => {
    chatRoll({ label: 'Iniciativa', modifier: initBase, kind: '2d6+' }, (total) =>
      onPatch?.({ initiative: total }),
    );
  };

  const adjustHp = (delta: number): void => {
    if (!editable) return;
    const next =
      sudbaMax > 0
        ? Math.max(0, Math.min(sudbaMax, sudbaCur + delta))
        : Math.max(0, sudbaCur + delta);
    onPatch?.({ systemStats: { ...ss, sudba_cur: next } });
  };

  // ── inline edit ──
  const enterEdit = (): void => {
    setDName(rollerName);
    setDStats({ ...ss });
    setEditing(true);
  };
  const saveEdit = (): void => {
    onPatch?.({
      name: dName.trim() || rollerName,
      systemStats: dStats,
    });
    setEditing(false);
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
          title="Hodit iniciativu (2k6 + iniciativa)"
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

      {/* Sudba = HP (ze systemStats) */}
      <div className={mapStyles.sudba}>
        <span className={mapStyles.sudbaLbl}>Sudba</span>
        {editing ? (
          <input
            className={mapStyles.sudbaEdit}
            value={String(dStats.sudba ?? '')}
            onChange={(e) => setStat('sudba', e.target.value)}
            aria-label="Sudba (max)"
          />
        ) : (
          <>
            <div className={mapStyles.hpBar}>
              <div className={mapStyles.hpFill} style={{ width: `${pct}%` }} />
              <div className={mapStyles.hpTxt}>
                {sudbaCur} / {sudbaMax}
              </div>
            </div>
            {editable && (
              <div className={mapStyles.steps}>
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

export default Drd2ChatBestiePanel;
