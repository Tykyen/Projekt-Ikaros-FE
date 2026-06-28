/**
 * 8.7r krok 2 — JaD bestie panel na taktické mapě.
 *
 * Pergamen, k20 mechanika (JaD = český DnD 5e). Čte `token.systemStats`
 * (snapshot jad bestie); Výdrž = HP tokenu (`token.currentHp/maxHp`). Statblok
 * jádro (vlastnosti/útoky/záchrany/schopnosti/kouzla, klikací k20) je SDÍLENÉ
 * s chatem přes `JadBestieCombatActions`. Tady mapová specifika: HP ±,
 * iniciativa (k20 + Obr → token.initiative), edit přes generic `EntitySchemaForm`.
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { performSheetRoll } from '../../../utils/rollFromSheet';
import { useTokenUpdate } from '../../../hooks/useTokenUpdate';
import { systemEntitySchemaRegistry } from '../../../schemas/registry';
import { EntitySchemaForm } from '../../schema-form/EntitySchemaForm';
import {
  calcMod,
  fmtMod,
} from '@/features/world/pages/CharacterDetailPage/diary-systems/sheets/jad/formulas';
import type { MapToken } from '../../../types';
import type { MapRollRequest } from '../../../hooks/useMapDiceRoll';
import {
  JadBestieCombatActions,
  type JadBestieRollReq,
} from './JadBestieCombatActions';
import styles from './JadBestiePanel.module.css';

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
const str = (ss: Record<string, unknown>, k: string): string => {
  const v = ss[k];
  return v === undefined || v === null ? '' : String(v);
};

export function JadBestiePanel({
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
  const hpColor = pct > 50 ? '#5a7d3a' : pct > 25 ? '#c08a2e' : '#9d2932';
  const obrMod = calcMod(toNum(ss['attributes.dex'], 10));

  const sanitize = (stats: Record<string, unknown>): Record<string, unknown> => {
    const sch = systemEntitySchemaRegistry.get('jad', 'token');
    const known = new Set(
      sch?.sections.flatMap((s) => s.fields.map((f) => f.key)) ?? [],
    );
    return known.size > 0
      ? Object.fromEntries(Object.entries(stats).filter(([k]) => known.has(k)))
      : stats;
  };

  // k20 / mixed hod z jádra (+ fatální tie-break u iniciativy).
  const doRoll = (req: JadBestieRollReq, initiative = false): void => {
    if (!onMapRoll) return;
    const res = performSheetRoll({
      label: req.label,
      modifier: req.modifier,
      kind: req.kind,
      critOnD20: req.critOnD20,
      mixed: req.mixed,
      rollerName,
    });
    if (!res) return;
    onMapRoll({
      category: initiative ? 'initiative' : 'skill',
      dicePayload: res.dicePayload,
      tokenId: token.id,
      rollerKind: 'bestie',
      rollerName,
    });
    if (initiative) {
      const initVal =
        res.crit === 'success'
          ? res.total + 100
          : res.crit === 'fail'
            ? res.total - 100
            : res.total;
      update.mutate({
        tokenId: token.id,
        patch: { initiative: initVal },
        skipInvalidate: true,
      });
    }
  };

  const adjustHp = (delta: number): void => {
    if (!canEdit) return;
    const next =
      maxHp > 0
        ? Math.max(0, Math.min(maxHp, currentHp + delta))
        : Math.max(0, currentHp + delta);
    update.mutate({ tokenId: token.id, patch: { currentHp: next } });
  };

  const enterEdit = (): void => {
    setDName(token.instanceName ?? '');
    setDStats({ ...ss });
    setEditing(true);
  };
  const saveEdit = (): void => {
    const newMax = toNum(dStats.vydrz, maxHp);
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
            `Uložení selhalo: ${e instanceof Error ? e.message : 'chyba'}`,
          ),
      },
    );
  };

  const tokenSchema = systemEntitySchemaRegistry.get('jad', 'token');

  return (
    <div className={`${styles.root}${editing ? ' ' + styles.editing : ''}`}>
      {editing && (
        <div className={styles.modeTag}>✏ Režim úprav — měníš tuto bestii</div>
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

      {!editing && (
        <div className={styles.header}>
          <span className={styles.bestieName}>{rollerName}</span>
          <span className={styles.tags}>
            {[str(ss, 'velikost'), str(ss, 'presvedceni')]
              .filter(Boolean)
              .join(' · ')}
            {ss['nebezpecnost'] !== undefined && ` · N ${str(ss, 'nebezpecnost')}`}
          </span>
        </div>
      )}

      <div className={styles.topRow}>
        {interactive && (
          <button
            type="button"
            className={styles.initBtn}
            onClick={() =>
              doRoll(
                { label: 'Iniciativa', modifier: obrMod, kind: 'd20', critOnD20: true },
                true,
              )
            }
            title={`Iniciativa (k20 ${fmtMod(obrMod)})`}
          >
            ⚡ Iniciativa {fmtMod(obrMod)}
          </button>
        )}
        {canEdit && (
          <button
            type="button"
            className={styles.editBtn}
            onClick={editing ? saveEdit : enterEdit}
            disabled={update.isPending}
          >
            {editing ? '✓ Hotovo (uložit)' : '✏ Upravit'}
          </button>
        )}
      </div>

      {!editing && (
        <>
          {/* Výdrž = HP */}
          <div className={styles.hpWrap}>
            <span className={styles.hpLbl}>Životy</span>
            <div className={styles.hpBar}>
              <div
                className={styles.hpFill}
                style={{ width: `${pct}%`, background: hpColor }}
              />
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
                    aria-label={`HP ${d > 0 ? '+' : ''}${d}`}
                  >
                    {d > 0 ? `+${d}` : d}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Statické staty */}
          <div className={styles.statline}>
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
            onRoll={(req) => doRoll(req)}
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

export default JadBestiePanel;
