/**
 * 16.2d-chat — DrD+ bestie panel v railu světového chatu (parita s mapou).
 *
 * Sourozenec mapového `DrdPlusBestiePanel`: sdílí prezentační jádro
 * `DrdPlusBestieCombatActions` (Útoky / Ochrana / Vlastnosti-Tělo-Smysly /
 * Schopnosti / Poznámky, view + inline edit), liší se persistencí a routingem:
 *   - **Hody 2k6+ / ZZ d6** → `useChatDiaryRoll` (overlay + zpráva, atribuce
 *     `bestie`), NE mapový `onMapRoll`. Postih (`systemStats.postih`) přičten.
 *   - **BČ → iniciativa**: `useChatDiaryRoll` `onResult(total)` → `onPatch({initiative})`
 *     (souboj lišta). Katalog (bez `onPatch`) jen hodí.
 *   - **Wound** = pásma z `systemStats.injury` (combatant nemá `token.injury`);
 *     ± steppery + postih (instance) → `onPatch`. Reuse pergamen CSS mapy.
 *   - **Edit** inline (jako mapa, ne modal) → `onPatch` (combatant) na „✓ Hotovo".
 */
import { useState, type ReactNode } from 'react';
import {
  DrdPlusBestieCombatActions,
  type Utok,
  type AbilDraft,
} from '@/features/world/tactical-map/components/token-panel/system-panels/DrdPlusBestieCombatActions';
import mapStyles from '@/features/world/tactical-map/components/token-panel/system-panels/DrdPlusBestiePanel.module.css';
import { useChatDiaryRoll } from './useChatDiaryRoll';

/** Patch nad bestie instancí (combatant). `type` — přiřaditelné k CombatantOp patch. */
export type DrdPlusChatBestiePatch = {
  systemStats?: Record<string, unknown>;
  abilities?: { name: string; description: string }[];
  notes?: string;
  name?: string;
  /** Výsledek hodu iniciativy (BČ) → řazení souboj lišty. */
  initiative?: number;
};

interface Props {
  worldId: string;
  /** Aktivní konverzace — kam hod míří. `null` = roll no-op. */
  channelId: string | null;
  rollerName: string;
  avatarUrl?: string;
  systemStats: Record<string, unknown>;
  abilities: { name: string; description: string }[];
  notes?: string;
  /** Instance PJ — smí wound ± + „✏ Upravit". Katalog = false. */
  canEdit: boolean;
  /** Persist patch na combatanta (instance). Bez něj = read-only katalog. */
  onPatch?: (patch: DrdPlusChatBestiePatch) => void;
}

const toNum = (v: unknown, fb = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
};

export function DrdPlusChatBestiePanel({
  worldId,
  channelId,
  rollerName,
  avatarUrl,
  systemStats,
  abilities,
  notes,
  canEdit,
  onPatch,
}: Props): React.ReactElement {
  const [editing, setEditing] = useState(false);
  const [dName, setDName] = useState('');
  const [dStats, setDStats] = useState<Record<string, unknown>>({});
  const [dAbil, setDAbil] = useState<AbilDraft[]>([]);
  const [dNotes, setDNotes] = useState('');

  const makeOnRoll = useChatDiaryRoll(worldId, channelId);
  const chatRoll = makeOnRoll({ kind: 'bestie', rollerName, avatarUrl });

  const ss = systemStats ?? {};
  const mez = Math.max(1, toNum(ss.mez_zraneni, 1));
  const postih = toNum(ss.postih);
  const injury = toNum(ss.injury);
  const editable = canEdit && !!onPatch;
  const interactive = !!channelId && !editing;

  // Hody: postih přičten tady; `initiative` (BČ) → persist do combatant.initiative.
  const onRoll = (
    label: string,
    baseMod: number,
    kind: '2d6+' | 'd6',
    initiative?: boolean,
  ): void => {
    const modifier = baseMod + postih;
    if (initiative) {
      chatRoll({ label, modifier, kind }, (total) => onPatch?.({ initiative: total }));
    } else {
      chatRoll({ label, modifier, kind });
    }
  };

  // ── edit draft helpers (parita s mapou) ──
  const setStat = (key: string, v: unknown): void =>
    setDStats((s) => ({ ...s, [key]: v }));
  const setUtok = (i: number, patch: Partial<Utok>): void =>
    setDStats((s) => {
      const arr = [...((Array.isArray(s.utoky) ? s.utoky : []) as Utok[])];
      arr[i] = { ...arr[i], ...patch };
      return { ...s, utoky: arr };
    });
  const addUtok = (): void =>
    setDStats((s) => ({
      ...s,
      utoky: [
        ...((Array.isArray(s.utoky) ? s.utoky : []) as Utok[]),
        { name: '', bc: 0, uc: 0, oc: 0, zz: 0, type: 'B' },
      ],
    }));
  const delUtok = (i: number): void =>
    setDStats((s) => ({
      ...s,
      utoky: ((Array.isArray(s.utoky) ? s.utoky : []) as Utok[]).filter(
        (_, j) => j !== i,
      ),
    }));

  const enterEdit = (): void => {
    setDName(rollerName);
    setDStats({ ...ss });
    setDAbil(abilities.map((a) => ({ label: a.name, value: a.description })));
    setDNotes(notes ?? '');
    setEditing(true);
  };
  const saveEdit = (): void => {
    // Combatant systemStats je volný (žádná BE strict validace) → injury zůstane.
    onPatch?.({
      name: dName.trim() || rollerName,
      systemStats: dStats,
      abilities: dAbil
        .filter((a) => a.label.trim())
        .map((a) => ({ name: a.label.trim(), description: a.value })),
      notes: dNotes,
    });
    setEditing(false);
  };

  const adjustInjury = (delta: number): void => {
    if (!editable) return;
    const next = Math.max(0, Math.min(3 * mez, injury + delta));
    onPatch?.({ systemStats: { ...ss, injury: next } });
  };
  const setPostihVal = (v: number): void => {
    if (!editable) return;
    onPatch?.({ systemStats: { ...ss, postih: v } });
  };

  // wound pásma (dopočet z injury vs mez)
  const bez = Math.min(injury, mez);
  const postihBand = Math.max(0, Math.min(injury - mez, mez));
  const koma = Math.max(0, Math.min(injury - 2 * mez, mez));
  const pct = (x: number): string => `${Math.round((x / mez) * 100)}%`;
  const wband = (cls: string, label: string, filled: number): ReactNode => (
    <div className={`${mapStyles.wnum} ${cls}`}>
      <span className={mapStyles.wlbl}>{label}</span>
      <span className={mapStyles.wbar}>
        <i style={{ width: pct(filled) }} />
      </span>
      <span className={mapStyles.wcount}>
        {filled}/{mez}
      </span>
    </div>
  );

  // wound sekce (chat: systemStats.injury) — slot mezi Útoky a Ochranu jádra
  const woundSlot = (
    <>
      <div className={mapStyles.stitle}>
        Mez zranění <small>zranění po pásmech · postih ↓</small>
      </div>
      {editing ? (
        <div className={mapStyles.readRow}>
          <span className={mapStyles.rk}>Mez zranění</span>
          <input
            className={mapStyles.ed}
            value={String(dStats.mez_zraneni ?? '')}
            onChange={(e) => setStat('mez_zraneni', e.target.value)}
            aria-label="Mez zranění"
          />
        </div>
      ) : (
        <>
          {wband(mapStyles.bez, 'Bez postihu', bez)}
          {wband(mapStyles.postihBand, 'Postih', postihBand)}
          {wband(mapStyles.koma, 'Kóma', koma)}
          {editable && (
            <div className={mapStyles.wsteps}>
              {[-5, -1, 1, 5].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => adjustInjury(d)}
                  aria-label={`Zranění ${d > 0 ? '+' : ''}${d}`}
                >
                  {d > 0 ? `+${d}` : d}
                </button>
              ))}
            </div>
          )}
          <div className={mapStyles.postihField}>
            <label htmlFor="dp-chat-postih">Postih za zranění</label>
            <input
              id="dp-chat-postih"
              type="number"
              value={postih}
              disabled={!editable}
              onChange={(e) => setPostihVal(parseInt(e.target.value, 10) || 0)}
            />
          </div>
        </>
      )}
    </>
  );

  return (
    <div className={`${mapStyles.root}${editing ? ' ' + mapStyles.editing : ''}`}>
      {editing && (
        <div className={mapStyles.modeTag}>✏ Režim úprav — měníš hodnoty této potvory</div>
      )}

      {/* Jméno editovatelné jen v edit módu; ve view nese jméno obal railu. */}
      {editing && (
        <div className={mapStyles.head}>
          <input
            className={mapStyles.nameEdit}
            value={dName}
            onChange={(e) => setDName(e.target.value)}
            aria-label="Jméno bestie"
            placeholder="Jméno bestie"
          />
        </div>
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

      <DrdPlusBestieCombatActions
        ss={ss}
        dStats={dStats}
        editing={editing}
        interactive={interactive}
        onRoll={onRoll}
        setStat={setStat}
        setUtok={setUtok}
        addUtok={addUtok}
        delUtok={delUtok}
        abilities={abilities}
        dAbil={dAbil}
        setDAbil={setDAbil}
        notes={notes ?? ''}
        dNotes={dNotes}
        setDNotes={setDNotes}
        woundSlot={woundSlot}
      />
    </div>
  );
}

export default DrdPlusChatBestiePanel;
