/**
 * 16.2d Fáze 2 — DrD+ bestie panel na taktické mapě.
 *
 * Pergamen „iluminovaný kodex" (sladěno s DrdPlusCombatPanel postav). Čte
 * `token.systemStats` (snapshot drdplus bestie) + `token.injury` (celkové
 * zranění) + `token.abilities` + `token.notes`.
 *
 * Bojové jádro (Útoky / Ochrana / Vlastnosti-Tělo-Smysly / Schopnosti / Poznámky,
 * view + inline edit) je SDÍLENÉ s chatem přes `DrdPlusBestieCombatActions`
 * (16.2d-chat parita). Tady zůstává jen mapová specifika: persistence přes
 * `useTokenUpdate`, routing `onMapRoll`, a **wound z `token.injury`** (vkládá se
 * do jádra jako `woundSlot`).
 *
 * Hody (spec §9.2): vlastnosti / tělo / smysly / ÚČ / OČ / BČ = `2d6+`, ZZ = `d6`;
 * postih (`systemStats.postih`) se přičítá k modifieru. **BČ navíc zapíše
 * `token.initiative`** (DrD+ iniciativa = z BČ; žádné tlačítko).
 */
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { performSheetRoll } from '../../../utils/rollFromSheet';
import { useTokenUpdate } from '../../../hooks/useTokenUpdate';
import { systemEntitySchemaRegistry } from '../../../schemas/registry';
import type { MapToken, DiceRollCategory } from '../../../types';
import type { MapRollRequest } from '../../../hooks/useMapDiceRoll';
import {
  DrdPlusBestieCombatActions,
  type Utok,
  type AbilDraft,
} from './DrdPlusBestieCombatActions';
import styles from './DrdPlusBestiePanel.module.css';

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

export function DrdPlusBestiePanel({
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
  const [dAbil, setDAbil] = useState<AbilDraft[]>([]);
  const [dNotes, setDNotes] = useState('');

  const ss = (token.systemStats ?? {}) as Record<string, unknown>;
  const rollerName = token.instanceName ?? 'Bestie';
  const interactive = canEdit && !!onMapRoll && !editing;
  const mez = Math.max(1, toNum(ss.mez_zraneni, 1));
  const postih = toNum(ss.postih);
  const injury = toNum(token.injury);

  // ── sanitizace systemStats na klíče `drdplus:token` (BE validateForPatch STRICT) ──
  const sanitize = (stats: Record<string, unknown>): Record<string, unknown> => {
    const sch = systemEntitySchemaRegistry.get('drdplus', 'token');
    const known = new Set(
      sch?.sections.flatMap((s) => s.fields.map((f) => f.key)) ?? [],
    );
    return known.size > 0
      ? Object.fromEntries(Object.entries(stats).filter(([k]) => known.has(k)))
      : stats;
  };

  // ── hody ── (postih přičten tady; `initiative` → token.initiative)
  const roll = (
    label: string,
    mod: number,
    kind: '2d6+' | 'd6',
    category: DiceRollCategory,
  ): void => {
    if (!onMapRoll) return;
    const res = performSheetRoll({
      label,
      modifier: mod + postih,
      kind,
      rollerName,
    });
    if (!res) return;
    onMapRoll({
      category,
      dicePayload: res.dicePayload,
      tokenId: token.id,
      rollerKind: 'bestie',
      rollerName,
    });
    // BČ určuje iniciativu → zapiš total do token.initiative (řazení v boji).
    if (category === 'initiative') {
      update.mutate({
        tokenId: token.id,
        patch: { initiative: res.total },
        skipInvalidate: true,
      });
    }
  };
  /** Adaptér pro sdílené jádro: `initiative` flag → mapová DiceRollCategory. */
  const onRoll = (
    label: string,
    baseMod: number,
    kind: '2d6+' | 'd6',
    initiative?: boolean,
  ): void => roll(label, baseMod, kind, initiative ? 'initiative' : 'skill');

  const adjustInjury = (delta: number): void => {
    if (!canEdit) return;
    const next = Math.max(0, Math.min(3 * mez, injury + delta));
    update.mutate({ tokenId: token.id, patch: { injury: next } });
  };

  const setPostih = (v: number): void => {
    if (!canEdit) return;
    update.mutate({
      tokenId: token.id,
      patch: { systemStats: sanitize({ ...ss, postih: v }) },
    });
  };

  const enterEdit = (): void => {
    setDName(token.instanceName ?? '');
    setDStats({ ...ss });
    setDAbil(
      (token.abilities ?? []).map((a) => ({ label: a.name, value: a.description })),
    );
    setDNotes(token.notes ?? '');
    setEditing(true);
  };

  const saveEdit = (): void => {
    update.mutate(
      {
        tokenId: token.id,
        patch: {
          instanceName: dName.trim() || token.instanceName,
          systemStats: sanitize(dStats),
          abilities: dAbil
            .filter((a) => a.label.trim())
            .map((a) => ({ name: a.label.trim(), description: a.value })),
          notes: dNotes,
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

  const setStat = (key: string, v: unknown): void =>
    setDStats((s) => ({ ...s, [key]: v }));

  // útoky draft helpers
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

  // wound pásma (dopočet z injury vs mez)
  const bez = Math.min(injury, mez);
  const postihBand = Math.max(0, Math.min(injury - mez, mez));
  const koma = Math.max(0, Math.min(injury - 2 * mez, mez));
  const pct = (x: number): string => `${Math.round((x / mez) * 100)}%`;

  const wband = (cls: string, label: string, filled: number): ReactNode => (
    <div className={`${styles.wnum} ${cls}`}>
      <span className={styles.wlbl}>{label}</span>
      <span className={styles.wbar}>
        <i style={{ width: pct(filled) }} />
      </span>
      <span className={styles.wcount}>
        {filled}/{mez}
      </span>
    </div>
  );

  // wound sekce (mapová: token.injury) — vkládá se do sdíleného jádra mezi Útoky a Ochranu
  const woundSlot = (
    <>
      <div className={styles.stitle}>
        Mez zranění <small>zranění po pásmech · postih ↓</small>
      </div>
      {editing ? (
        <div className={styles.readRow}>
          <span className={styles.rk}>Mez zranění</span>
          <input
            className={styles.ed}
            value={String(dStats.mez_zraneni ?? '')}
            onChange={(e) => setStat('mez_zraneni', e.target.value)}
            aria-label="Mez zranění"
          />
        </div>
      ) : (
        <>
          {wband(styles.bez, 'Bez postihu', bez)}
          {wband(styles.postihBand, 'Postih', postihBand)}
          {wband(styles.koma, 'Kóma', koma)}
          {canEdit && (
            <div className={styles.wsteps}>
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
          <div className={styles.postihField}>
            <label htmlFor={`postih-${token.id}`}>Postih za zranění</label>
            <input
              id={`postih-${token.id}`}
              type="number"
              value={postih}
              disabled={!canEdit}
              onChange={(e) => setPostih(parseInt(e.target.value, 10) || 0)}
            />
          </div>
        </>
      )}
    </>
  );

  return (
    <div className={`${styles.root}${editing ? ' ' + styles.editing : ''}`}>
      {editing && (
        <div className={styles.modeTag}>✏ Režim úprav — měníš hodnoty této potvory</div>
      )}

      {/* Jméno bestie — editovatelné jen v edit módu. Ve view módu erb + jméno +
          „Bestie" vynechány: jméno už nese obal tokenu (TokenInfoPanel chrome). */}
      {editing && (
        <div className={styles.head}>
          <input
            className={styles.nameEdit}
            value={dName}
            onChange={(e) => setDName(e.target.value)}
            aria-label="Jméno bestie"
            placeholder="Jméno bestie"
          />
        </div>
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
        abilities={token.abilities ?? []}
        dAbil={dAbil}
        setDAbil={setDAbil}
        notes={token.notes ?? ''}
        dNotes={dNotes}
        setDNotes={setDNotes}
        woundSlot={woundSlot}
      />
    </div>
  );
}

export default DrdPlusBestiePanel;
