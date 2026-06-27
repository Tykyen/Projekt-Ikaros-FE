/**
 * 16.2d Fáze 2 — DrD+ bestie panel na taktické mapě.
 *
 * Pergamen „iluminovaný kodex" (sladěno s DrdPlusCombatPanel postav). Čte
 * `token.systemStats` (snapshot drdplus bestie) + `token.injury` (celkové
 * zranění) + `token.abilities` + `token.notes`.
 *
 * Hody (spec §9.2): vlastnosti / tělo / smysly / ÚČ / OČ / BČ = `2d6+`,
 * ZZ = `d6`; postih (`systemStats.postih`) se přičítá k modifieru. **BČ hod
 * navíc zapíše `token.initiative`** (DrD+ iniciativa = z BČ; žádné tlačítko).
 *
 * Mez zranění = číselný režim: 3 pásma (Bez postihu / Postih / Kóma) dopočítaná
 * z `injury` vs `mez_zraneni`; stepper mění `injury`; postih inline.
 *
 * In-place edit („✏ Upravit bestii"): panel přepne do edit režimu, pole = inputy.
 * Uloží `instanceName` + `systemStats` (sanitizace na `drdplus:token`, BE STRICT)
 * + `abilities` + `notes`. Žádný samostatný modal.
 */
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { performSheetRoll } from '../../../utils/rollFromSheet';
import { useTokenUpdate } from '../../../hooks/useTokenUpdate';
import { systemEntitySchemaRegistry } from '../../../schemas/registry';
import type { MapToken, DiceRollCategory } from '../../../types';
import type { MapRollRequest } from '../../../hooks/useMapDiceRoll';
import styles from './DrdPlusBestiePanel.module.css';

interface Props {
  token: MapToken;
  sceneId: string;
  worldId: string;
  systemId: string;
  canEdit: boolean;
  onMapRoll?: (req: MapRollRequest) => void;
}

interface Utok {
  name?: string;
  bc?: unknown;
  uc?: unknown;
  oc?: unknown;
  zz?: unknown;
  type?: string;
}
interface AbilDraft {
  label: string;
  value: string;
}

const toNum = (v: unknown, fb = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
};
/** Hodnota se hází jen když je číselná (Výdrž „—" u neúnavných → nehází). */
const isNumeric = (v: unknown): boolean =>
  v !== '' && v !== null && v !== undefined && Number.isFinite(Number(v));

const STAT_FIELDS: ReadonlyArray<[string, string]> = [
  ['sil', 'Síla'],
  ['obr', 'Obratnost'],
  ['zrc', 'Zručnost'],
  ['vol', 'Vůle'],
  ['int', 'Inteligence'],
  ['chr', 'Charisma'],
];
const BODY_FIELDS: ReadonlyArray<[string, string]> = [
  ['odolnost', 'Odolnost'],
  ['vydrz', 'Výdrž'],
  ['rychlost', 'Rychlost'],
];
const SENSE_FIELDS: ReadonlyArray<[string, string]> = [
  ['hmat', 'Hmat'],
  ['chut', 'Chuť'],
  ['cich', 'Čich'],
  ['sluch', 'Sluch'],
  ['zrak', 'Zrak'],
];

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
  const imageUrl = token.characterData?.imageUrl;
  const glyph = (token.instanceName ?? 'B').trim().charAt(0).toUpperCase();

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

  // ── hody ──
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
  const utoky = (Array.isArray(ss.utoky) ? ss.utoky : []) as Utok[];
  const dUtoky = (Array.isArray(dStats.utoky) ? dStats.utoky : []) as Utok[];
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

  // ── render helpers ──
  const statRow = (key: string, label: string): ReactNode => {
    if (editing) {
      const isText = key === 'vydrz';
      return (
        <div className={styles.rollRow} key={key}>
          <span className={styles.rName}>{label}</span>
          <input
            className={`${styles.ed}${isText ? ' ' + styles.edTxt : ''}`}
            value={String(dStats[key] ?? '')}
            onChange={(e) => setStat(key, e.target.value)}
            aria-label={label}
          />
        </div>
      );
    }
    const raw = ss[key];
    const rollable = interactive && isNumeric(raw);
    return (
      <button
        key={key}
        type="button"
        className={styles.rollRow}
        disabled={!rollable}
        onClick={() => roll(label, toNum(raw), '2d6+', 'skill')}
        aria-label={rollable ? `Hodit ${label}` : label}
      >
        <span className={styles.rName}>{label}</span>
        <span className={styles.rVal}>
          {raw === '' || raw === undefined || raw === null ? '—' : String(raw)}
        </span>
      </button>
    );
  };

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

  return (
    <div className={`${styles.root}${editing ? ' ' + styles.editing : ''}`}>
      {editing && (
        <div className={styles.modeTag}>✏ Režim úprav — měníš hodnoty této potvory</div>
      )}

      {/* hlavička: erb (obrázek bestie) + jméno */}
      <div className={styles.head}>
        <svg className={styles.erb} viewBox="0 0 96 112" aria-hidden="true">
          <defs>
            <clipPath id={`shield-${token.id}`}>
              <path d="M6 6 H90 V64 Q90 96 48 108 Q6 96 6 64 Z" />
            </clipPath>
          </defs>
          {imageUrl ? (
            <image
              href={imageUrl}
              x="6"
              y="6"
              width="84"
              height="102"
              clipPath={`url(#shield-${token.id})`}
              preserveAspectRatio="xMidYMid slice"
            />
          ) : (
            <text className={styles.glyph} x="48" y="74">
              {glyph}
            </text>
          )}
          <path
            className={styles.crest}
            d="M6 6 H90 V64 Q90 96 48 108 Q6 96 6 64 Z"
          />
        </svg>
        <div className={styles.titles}>
          {editing ? (
            <input
              className={styles.nameEdit}
              value={dName}
              onChange={(e) => setDName(e.target.value)}
              aria-label="Jméno bestie"
            />
          ) : (
            <div className={styles.name}>{token.instanceName ?? 'Bestie'}</div>
          )}
          <div className={styles.sub}>Bestie</div>
        </div>
      </div>

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

      {/* ÚTOKY */}
      <div className={styles.stitle}>
        Útoky{' '}
        <small>BČ/ÚČ/OČ = 2k6+ · ZZ = 1k6 · BČ určí i iniciativu ⚡</small>
      </div>
      {!editing &&
        utoky.map((a, i) => (
          <div className={styles.weap} key={i}>
            <div className={styles.weapName}>{String(a.name || '(bez názvu)')}</div>
            <div className={styles.chips}>
              <button
                type="button"
                className={`${styles.chip} ${styles.bc}`}
                disabled={!interactive}
                aria-label={`${a.name || 'Útok'} BČ (iniciativa)`}
                onClick={() =>
                  roll(`${a.name || 'Útok'} — BČ`, toNum(a.bc), '2d6+', 'initiative')
                }
              >
                BČ<b>{toNum(a.bc)}</b>
              </button>
              <button
                type="button"
                className={styles.chip}
                disabled={!interactive}
                aria-label={`${a.name || 'Útok'} ÚČ`}
                onClick={() => roll(`${a.name || 'Útok'} — ÚČ`, toNum(a.uc), '2d6+', 'skill')}
              >
                ÚČ<b>{toNum(a.uc)}</b>
              </button>
              <button
                type="button"
                className={styles.chip}
                disabled={!interactive}
                aria-label={`${a.name || 'Útok'} OČ`}
                onClick={() => roll(`${a.name || 'Útok'} — OČ`, toNum(a.oc), '2d6+', 'skill')}
              >
                OČ<b>{toNum(a.oc)}</b>
              </button>
              <button
                type="button"
                className={`${styles.chip} ${styles.zz}`}
                disabled={!interactive}
                aria-label={`${a.name || 'Útok'} ZZ`}
                onClick={() =>
                  roll(`${a.name || 'Útok'} — ZZ`, toNum(a.zz), 'd6', 'skill')
                }
              >
                ZZ<b>
                  {toNum(a.zz)}
                  {a.type ? ` ${a.type}` : ''}
                </b>
              </button>
            </div>
          </div>
        ))}
      {!editing && utoky.length === 0 && (
        <p className={styles.hint}>Žádné útoky.</p>
      )}
      {editing &&
        dUtoky.map((a, i) => (
          <div className={styles.weap} key={i}>
            <div className={styles.weapName}>
              <input
                className={`${styles.ed} ${styles.edTxt}`}
                value={String(a.name ?? '')}
                onChange={(e) => setUtok(i, { name: e.target.value })}
                aria-label="Název útoku"
              />
              <button
                type="button"
                className={styles.del}
                onClick={() => delUtok(i)}
                aria-label="Odebrat útok"
              >
                ✕
              </button>
            </div>
            <div className={styles.chips}>
              {(['bc', 'uc', 'oc', 'zz'] as const).map((k) => (
                <span className={styles.atkPair} key={k}>
                  <span className={styles.atkLbl}>{k.toUpperCase()}</span>
                  <input
                    className={styles.ed}
                    value={String(a[k] ?? '')}
                    onChange={(e) => setUtok(i, { [k]: e.target.value })}
                    aria-label={k.toUpperCase()}
                  />
                </span>
              ))}
              <select
                className={styles.ed}
                value={a.type ?? 'B'}
                onChange={(e) => setUtok(i, { type: e.target.value })}
                aria-label="Typ zranění"
              >
                <option>B</option>
                <option>S</option>
                <option>D</option>
              </select>
            </div>
          </div>
        ))}
      {editing && (
        <button type="button" className={styles.miniAdd} onClick={addUtok}>
          + Přidat útok
        </button>
      )}

      {/* MEZ ZRANĚNÍ */}
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

      {/* OCHRANA */}
      <div className={styles.stitle}>Ochrana</div>
      <div className={styles.readRow}>
        <span className={styles.rk}>Ochrana</span>
        {editing ? (
          <input
            className={styles.ed}
            value={String(dStats.ochrana ?? '')}
            onChange={(e) => setStat('ochrana', e.target.value)}
            aria-label="Ochrana"
          />
        ) : (
          <span className={styles.rv}>{toNum(ss.ochrana)}</span>
        )}
      </div>

      <hr className={styles.rule} />

      {/* VLASTNOSTI */}
      <div className={styles.stitle}>
        Vlastnosti <small>klik = 2k6+</small>
      </div>
      <div className={styles.grid2}>
        {STAT_FIELDS.map(([k, l]) => statRow(k, l))}
      </div>

      {/* TĚLO */}
      <div className={styles.stitle}>
        Tělo a pohyb <small>klik = 2k6+ · „—" se nehází</small>
      </div>
      {BODY_FIELDS.map(([k, l]) => statRow(k, l))}

      {/* SMYSLY */}
      <div className={styles.stitle}>
        Smysly <small>klik = 2k6+</small>
      </div>
      <div className={styles.grid2}>
        {SENSE_FIELDS.map(([k, l]) => statRow(k, l))}
      </div>

      <hr className={styles.rule} />

      {/* SCHOPNOSTI */}
      <div className={styles.stitle}>
        Schopnosti <small>{editing ? 'úprava' : 'jen k nahlédnutí'}</small>
      </div>
      {!editing &&
        (token.abilities ?? []).map((a, i) => (
          <div className={styles.ability} key={i}>
            <span className={styles.ak}>{a.name}</span>
            <span className={styles.av}>{a.description}</span>
          </div>
        ))}
      {!editing && (token.abilities ?? []).length === 0 && (
        <p className={styles.hint}>Žádné schopnosti.</p>
      )}
      {editing &&
        dAbil.map((a, i) => (
          <div className={styles.ability} key={i}>
            <input
              className={`${styles.ed} ${styles.edTxt}`}
              value={a.label}
              onChange={(e) =>
                setDAbil((arr) =>
                  arr.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)),
                )
              }
              aria-label="Název schopnosti"
            />
            <input
              className={`${styles.ed} ${styles.edTxt}`}
              value={a.value}
              onChange={(e) =>
                setDAbil((arr) =>
                  arr.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)),
                )
              }
              aria-label="Hodnota schopnosti"
            />
            <button
              type="button"
              className={styles.del}
              onClick={() => setDAbil((arr) => arr.filter((_, j) => j !== i))}
              aria-label="Odebrat schopnost"
            >
              ✕
            </button>
          </div>
        ))}
      {editing && (
        <button
          type="button"
          className={styles.miniAdd}
          onClick={() => setDAbil((arr) => [...arr, { label: '', value: '' }])}
        >
          + Přidat schopnost
        </button>
      )}

      {/* POZNÁMKY */}
      <div className={styles.stitle}>
        Poznámky <small>{editing ? 'úprava' : 'jen k nahlédnutí'}</small>
      </div>
      {editing ? (
        <textarea
          className={styles.edWide}
          rows={4}
          value={dNotes}
          onChange={(e) => setDNotes(e.target.value)}
          aria-label="Poznámky"
        />
      ) : token.notes && token.notes.trim() ? (
        <div className={styles.notes}>{token.notes}</div>
      ) : (
        <p className={styles.hint}>Bez poznámek.</p>
      )}
    </div>
  );
}

export default DrdPlusBestiePanel;
