/**
 * 8.7r krok 2 — JaD bestie panel v railu světového chatu (parita s mapou).
 *
 * Sourozenec mapového `JadBestiePanel`: sdílí prezentační jádro
 * `JadBestieCombatActions` (vlastnosti / útoky / záchrany / schopnosti / kouzla,
 * klikací k20). Liší se persistencí:
 *   - **Hody** → `useChatDiaryRoll` (overlay + zpráva, atribuce `bestie`), k20
 *     s fatálním úspěchem/neúspěchem + skládaný zásah (mixed).
 *   - **Iniciativa** = k20 + Obr → `onResult(total)` → `onPatch({initiative})`.
 *   - **Výdrž (HP)** žije v `systemStats` (`vydrz` = max, `vydrz_cur` = aktuální).
 *   - **Edit** přes generic `EntitySchemaForm` (jad:token) → `onPatch`.
 */
import { useState } from 'react';
import {
  JadBestieCombatActions,
  type JadBestieRollReq,
} from '@/features/world/tactical-map/components/token-panel/system-panels/JadBestieCombatActions';
import mapStyles from '@/features/world/tactical-map/components/token-panel/system-panels/JadBestiePanel.module.css';
import { EntitySchemaForm } from '@/features/world/tactical-map/components/schema-form/EntitySchemaForm';
import { systemEntitySchemaRegistry } from '@/features/world/tactical-map/schemas/registry';
import { calcMod, fmtMod } from '@/features/world/pages/CharacterDetailPage/diary-systems/sheets/jad/formulas';
import { useChatDiaryRoll } from './useChatDiaryRoll';

export type JadChatBestiePatch = {
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
  onPatch?: (patch: JadChatBestiePatch) => void;
}

const toNum = (v: unknown, fb = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
};
const str = (ss: Record<string, unknown>, k: string): string => {
  const v = ss[k];
  return v === undefined || v === null ? '' : String(v);
};

export function JadChatBestiePanel({
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

  const vydrzMax = Math.max(0, toNum(ss.vydrz, 0));
  const vydrzCur =
    ss.vydrz_cur != null ? Math.max(0, toNum(ss.vydrz_cur)) : vydrzMax;
  const pct = vydrzMax > 0 ? Math.max(0, Math.min(100, (vydrzCur / vydrzMax) * 100)) : 0;
  const hpColor = pct > 50 ? '#5a7d3a' : pct > 25 ? '#c08a2e' : '#9d2932';
  const obrMod = calcMod(toNum(ss['attributes.dex'], 10));

  // k20 / mixed hod → chat (iniciativa navíc persist přes onResult).
  const doRoll = (req: JadBestieRollReq): void => {
    chatRoll({
      label: req.label,
      modifier: req.modifier,
      kind: req.kind,
      critOnD20: req.critOnD20,
      mixed: req.mixed,
    });
  };
  const rollInit = (): void => {
    chatRoll(
      { label: 'Iniciativa', modifier: obrMod, kind: 'd20', critOnD20: true },
      (total) => onPatch?.({ initiative: total }),
    );
  };

  const adjustHp = (delta: number): void => {
    if (!editable) return;
    const next =
      vydrzMax > 0
        ? Math.max(0, Math.min(vydrzMax, vydrzCur + delta))
        : Math.max(0, vydrzCur + delta);
    onPatch?.({ systemStats: { ...ss, vydrz_cur: next } });
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

  const tokenSchema = systemEntitySchemaRegistry.get('jad', 'token');

  return (
    <div className={`${mapStyles.root}${editing ? ' ' + mapStyles.editing : ''}`}>
      {editing && (
        <div className={mapStyles.modeTag}>✏ Režim úprav — měníš tuto bestii</div>
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

      {!editing && (
        <div className={mapStyles.header}>
          <span className={mapStyles.bestieName}>{rollerName}</span>
          <span className={mapStyles.tags}>
            {[str(ss, 'velikost'), str(ss, 'presvedceni')]
              .filter(Boolean)
              .join(' · ')}
            {ss['nebezpecnost'] !== undefined && ` · N ${str(ss, 'nebezpecnost')}`}
          </span>
        </div>
      )}

      <div className={mapStyles.topRow}>
        {interactive && (
          <button
            type="button"
            className={mapStyles.initBtn}
            onClick={rollInit}
            title={`Iniciativa (k20 ${fmtMod(obrMod)})`}
          >
            ⚡ Iniciativa {fmtMod(obrMod)}
          </button>
        )}
        {editable && (
          <button
            type="button"
            className={mapStyles.editBtn}
            onClick={editing ? saveEdit : enterEdit}
          >
            {editing ? '✓ Hotovo (uložit)' : '✏ Upravit'}
          </button>
        )}
      </div>

      {!editing && (
        <>
          <div className={mapStyles.hpWrap}>
            <span className={mapStyles.hpLbl}>Životy</span>
            <div className={mapStyles.hpBar}>
              <div
                className={mapStyles.hpFill}
                style={{ width: `${pct}%`, background: hpColor }}
              />
              <div className={mapStyles.hpTxt}>
                {vydrzCur} / {vydrzMax}
              </div>
            </div>
            {editable && (
              <div className={mapStyles.steps}>
                {[-5, -1, 1, 5].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => adjustHp(d)}
                    aria-label={`HP ${d > 0 ? '+' : ''}${d}`}
                  >
                    {d > 0 ? `+${d}` : d}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={mapStyles.statline}>
            <span>OČ {str(ss, 'obranne_cislo') || '—'}</span>
            <span>
              Rychlost {str(ss, 'rychlost') || '—'}
              {str(ss, 'rychlost_text') ? ` (${str(ss, 'rychlost_text')})` : ''}
            </span>
            <span>PV {str(ss, 'pasivni_vnimani') || '—'}</span>
          </div>

          <JadBestieCombatActions
            ss={ss}
            interactive={interactive}
            onRoll={doRoll}
          />
        </>
      )}

      {editing && tokenSchema && (
        <EntitySchemaForm
          schema={tokenSchema}
          value={dStats}
          onChange={setDStats}
        />
      )}
    </div>
  );
}

export default JadChatBestiePanel;
