/**
 * 16b — DrdhCombatPanel (Dračí Hlídka na taktické mapě, PC i NPC).
 *
 * Kompaktní bojový panel (bojové minimum) sladěný s deníkovým listem
 * `DrdhSheet` (fantasy „Strážní pole" — pergamen + zlato, pečetní medailony).
 * Single source s listem — čte/zapisuje tentýž `diary.customData` přes
 * `token.characterSlug` (prefix `drdh_*`).
 *
 * Vizuál + sekce + texty = schválený prototyp `c:/tmp/drdh-mapa-audit.html`.
 * (Lišta s přepínačem povolání/režimu je JEN demo prototypu — povolání čteme
 * z `drdh_profession_id`, režim z `canEdit`.)
 *
 * Hody (onRoll z props; bez onRoll = read-only, klik nic nedělá):
 *   - Iniciativa = `d6` + oprava Obr, `initiative:true` (NEexploduje)
 *   - Vlastnost  = `d10` + oprava atributu (⌊st/2⌋−5)
 *   - Dovednost  = `d10` + oprava atributu dovednosti + stupeň dovednosti
 *                  (single source = `drdhAttrMod`, shodné s deníkovým součtem)
 *   - Útok zbraní  = `d6+` + (útočnost zbraně `atk` + oprava útočného atributu:
 *                    Sil pro `kind==='melee'`, Obr pro `kind==='ranged'`)
 *   - Obrana zbraní= `d6+` + (obrana zbraně `def` + oprava Obr)
 *   - zranění (`dmg`) jde JEN do zobrazení/labelu, NE do modifieru hodu
 *   (ÚČ/OČ jsou ZRUŠENÉ — zbraň drží jen 3 čísla útočnost/zranění/obrana)
 *
 * Data flow vzorem `Drd16CombatPanel`: `useCharacterDiary` → debounced (~500 ms)
 * `useUpdateCharacterDiary({ customDataPatch })`. `canEdit === false` → readonly.
 *
 * Sekundární zdroj per povolání dle `DRDH_RESOURCE_BY_PROF[prof].kind`
 * (klíče přesně dle `DrdhSheet`):
 *   - adrenalin (válečník) → track 1–20 klikací (`res_adr`)
 *   - dusevni / prizen     → bar ± (`res_ds`/`res_ds_max`, `res_favor`/`res_favor_max`)
 *   - mana (kouzelník)     → bar ± + mini Úroveň/Nasátí (`res_mana_lvl`/`res_mana_nasati`)
 *   - mana_sur (alchymista)→ 2 bary (`res_mana`/`res_mana_max` + `res_sur`/`res_sur_max`)
 *   - kostymy (zloděj)     → bez zdroje (jen poznámka)
 */
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useCharacterDiary } from '@/features/world/pages/api/useCharacterSubdocs';
import { useUpdateCharacterDiary } from '@/features/world/pages/api/useCharacterMutations';
import type { SystemSheetProps } from '@/features/world/pages/CharacterDetailPage/diary-systems/types';
import {
  DRDH_ABBR_TO_ID,
  DRDH_ATTRS,
  DRDH_PROF_BY_ID,
  DRDH_PROF_TABLE,
  DRDH_RESOURCE_BY_PROF,
  drdhAttrMod,
  fmtMod,
  normDrdhAttr,
  type DrdhAbility,
  type DrdhProfessionId,
  type DrdhProfTable,
  type DrdhResourceKind,
  type DrdhSkill,
  type DrdhWeapon,
} from '@/features/world/pages/CharacterDetailPage/diary-systems/sheets/drdh/constants';
import { Modal } from '@/shared/ui/Modal/Modal';
import type { MapToken } from '../../../types';
import styles from './DrdhCombatPanel.module.css';

interface Props {
  token: MapToken;
  sceneId: string;
  worldId: string;
  canEdit: boolean;
  onRoll?: SystemSheetProps['onRoll'];
}

const DEBOUNCE_MS = 500;

function asStr(v: unknown, fallback = ''): string {
  if (v === undefined || v === null) return fallback;
  return String(v);
}

function safeParseArr<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (typeof v === 'string') {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? (p as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function DrdhCombatPanel({
  token,
  worldId,
  canEdit,
  onRoll,
}: Props): React.ReactElement {
  const { data: diary, isLoading } = useCharacterDiary(
    worldId,
    token.characterSlug,
  );
  const updateMut = useUpdateCharacterDiary(worldId, token.characterSlug);

  const [pending, setPending] = useState<Record<string, unknown>>({});
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [profOpen, setProfOpen] = useState(false);
  const [abilOpen, setAbilOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (flushTimer.current) clearTimeout(flushTimer.current);
    };
  }, []);

  function scheduleFlush(nextPending: Record<string, unknown>): void {
    if (flushTimer.current) clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(() => {
      if (Object.keys(nextPending).length === 0) return;
      updateMut.mutate(
        { customDataPatch: nextPending },
        {
          onSuccess: () => setPending({}),
          onError: (e) =>
            toast.error(
              `Uložení selhalo: ${e instanceof Error ? e.message : 'neznámá chyba'}`,
            ),
        },
      );
    }, DEBOUNCE_MS);
  }

  function writeField(key: string, value: string): void {
    if (!canEdit) return;
    setPending((prev) => {
      const next = { ...prev, [key]: value };
      scheduleFlush(next);
      return next;
    });
  }

  const baseCd = diary?.customData ?? {};
  // Klíče se ukládají s prefixem `drdh_` (makeCdAccess v deníku). Panel čte
  // surová customData → klíče prefixujeme sami helperem `k`.
  const cd: Record<string, unknown> = { ...baseCd, ...pending };
  const k = (key: string): string => `drdh_${key}`;
  const str = (key: string): string => asStr(cd[k(key)]);
  const numOr = (key: string, fallback = 0): number => {
    const n = parseInt(asStr(cd[k(key)]), 10);
    return Number.isNaN(n) ? fallback : n;
  };

  if (isLoading) {
    return (
      <div className={styles.root}>
        <div className={styles.loading}>Načítám deník…</div>
      </div>
    );
  }
  if (!diary) {
    return (
      <div className={styles.root}>
        <div className={styles.empty}>Deník postavy nedostupný.</div>
      </div>
    );
  }

  const prof = (str('profession_id') || 'valecnik') as DrdhProfessionId;
  const profDef = DRDH_PROF_BY_ID[prof] ?? DRDH_PROF_BY_ID.valecnik;
  const resCfg = DRDH_RESOURCE_BY_PROF[prof];
  const profTable: DrdhProfTable = DRDH_PROF_TABLE[prof];

  // Iniciativa = oprava OBR. Hranice smrti auto = −(10 + oprava ODO).
  const obrMod = drdhAttrMod(str('attr_dex'));
  const odoMod = drdhAttrMod(str('attr_con'));
  const autoDeath = -(10 + odoMod);
  const deathLimit = str('hp_death') || String(autoDeath);

  // Jméno postavy NEprefixujeme do labelu — overlay/log ho nesou zvlášť.
  const canRoll = !!onRoll;
  const doRoll = (
    label: string,
    modifier: number,
    kind: 'd6' | 'd6+' | 'd10',
    initiative = false,
    extra?: {
      breakdown?: { label: string; value: number }[];
      damage?: string;
    },
  ): void => {
    onRoll?.({
      label,
      modifier,
      kind,
      ...(initiative && { initiative: true }),
      ...extra,
    });
  };

  // Zranění zbraně se znaménkem pro rozpis (`… = total / +1`). `w.dmg` je string:
  // prázdné → undefined (nezobrazí se); parsovatelné číslo → fmtMod (`+1`/`-1`/`0`,
  // ASCII `-` jako zbytek appky); neparsovatelný text (např. „k6") → vrať jak je.
  const fmtDamage = (dmg: string): string | undefined => {
    const trimmed = dmg.trim();
    if (!trimmed) return undefined;
    const n = parseInt(trimmed, 10);
    return Number.isNaN(n) ? trimmed : fmtMod(n);
  };

  // ± úprava číselného páru cur/max (0..max, max>0 jinak bez horního stropu).
  const adjust = (key: string, maxKey: string, delta: number): void => {
    const max = numOr(maxKey, 0);
    const cur = numOr(key, 0);
    const next = Math.max(0, max > 0 ? Math.min(max, cur + delta) : cur + delta);
    writeField(k(key), String(next));
  };
  // Adrenalin track (1..20): klik na buňku n → n (nebo n−1, je-li n aktivní).
  const setAdr = (n: number): void => {
    if (!canEdit) return;
    const cur = numOr('res_adr', 0);
    writeField(k('res_adr'), String(cur === n ? n - 1 : n));
  };

  const weapons = safeParseArr<DrdhWeapon>(cd[k('weapons')]);
  const skills = safeParseArr<DrdhSkill>(cd[k('skills')]);
  const abilities = safeParseArr<DrdhAbility>(cd[k('abilities')]);
  const profRows = safeParseArr<Record<string, string>>(cd[k(profTable.arrKey)]);

  // Dovednostní součet = oprava atributu dovednosti + stupeň (single source).
  const skillMod = (s: DrdhSkill): number => {
    const id = DRDH_ABBR_TO_ID[s.attr as keyof typeof DRDH_ABBR_TO_ID];
    const mod = id ? drdhAttrMod(str(`attr_${id}`)) : 0;
    const deg = parseInt(s.deg, 10) || 0;
    return mod + deg;
  };

  return (
    <div className={styles.root} data-testid="drdh-combat-panel">
      {/* ── Iniciativa quick-roll (k6 + oprava OBR, neexploduje) ── */}
      {canRoll && (
        <button
          type="button"
          className={styles.initBtn}
          onClick={() => doRoll('Iniciativa', obrMod, 'd6', true)}
          title={`Hodit iniciativu (k6 ${fmtMod(obrMod)})`}
        >
          ⚡ Iniciativa <small>Obr + k6</small>
        </button>
      )}

      {/* ── Životy ── */}
      <Vital
        variant="hp"
        label="Životy"
        cur={numOr('hp')}
        max={numOr('hp_max')}
        canEdit={canEdit}
        onAdjust={(d) => adjust('hp', 'hp_max', d)}
      />
      <div className={styles.hpDeath}>
        Hranice smrti <b>{deathLimit}</b>
      </div>

      {/* ── Sekundární zdroj per povolání ── */}
      <section className={styles.section}>
        <h3 className={styles.title}>
          <span className={styles.seal} aria-hidden="true">
            {profDef.glyph}
          </span>
          {resCfg.title}
        </h3>
        <ResourceBody
          kind={resCfg.kind}
          str={str}
          numOr={numOr}
          canEdit={canEdit}
          adjust={adjust}
          setAdr={setAdr}
        />
      </section>

      {/* ── Vlastnosti (klik = k10 + oprava) ── */}
      <section className={styles.section}>
        <h3 className={styles.title}>
          <span className={styles.seal} aria-hidden="true">
            ★
          </span>
          Vlastnosti <small>klik = k10 + oprava</small>
        </h3>
        {DRDH_ATTRS.map((a) => {
          const deg = str(`attr_${a.id}`);
          const mod = drdhAttrMod(deg);
          return (
            <button
              key={a.id}
              type="button"
              className={styles.statRow}
              disabled={!canRoll}
              style={
                canRoll ? undefined : { cursor: 'default', pointerEvents: 'none' }
              }
              onClick={() => doRoll(a.label, mod, 'd10')}
              title={`Hodit ${a.label} (k10 ${fmtMod(mod)})`}
              aria-label={`Hodit ${a.label}`}
            >
              <span className={styles.statName}>
                {a.label}
                <small>{a.abbr}</small>
              </span>
              <span className={styles.statVal}>{deg || '—'}</span>
              <span
                className={`${styles.statBonus} ${mod < 0 ? styles.neg : mod === 0 ? styles.zero : ''}`.trim()}
              >
                {fmtMod(mod)}
              </span>
            </button>
          );
        })}
      </section>

      {/* ── Dovednosti (klik = k10 + oprava + stupeň) ── */}
      {skills.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.title}>
            <span className={styles.seal} aria-hidden="true">
              🗡
            </span>
            Dovednosti <small>klik = k10 + oprava + stupeň</small>
          </h3>
          {skills.map((s, i) => {
            const total = skillMod(s);
            const deg = parseInt(s.deg, 10) || 0;
            // Rozklad bonusu: oprava atributu zvlášť, výcvik (stupeň) zvlášť.
            const id = DRDH_ABBR_TO_ID[s.attr as keyof typeof DRDH_ABBR_TO_ID];
            const attrM = id ? drdhAttrMod(str(`attr_${id}`)) : 0;
            return (
              <button
                key={`${s.name}-${i}`}
                type="button"
                className={`${styles.statRow} ${styles.skill}`}
                disabled={!canRoll}
                style={
                  canRoll
                    ? undefined
                    : { cursor: 'default', pointerEvents: 'none' }
                }
                onClick={() => doRoll(s.name || 'Dovednost', total, 'd10')}
                title={`Hodit ${s.name || 'dovednost'} (k10 ${fmtMod(total)})`}
                aria-label={`Hodit ${s.name || 'dovednost'}`}
              >
                <span className={styles.statName}>
                  {s.name || '(bez názvu)'}
                  <small>
                    {normDrdhAttr(s.attr)} {fmtMod(attrM)} · výcvik +{deg}
                  </small>
                </span>
                <span
                  className={`${styles.statBonus} ${total < 0 ? styles.neg : total === 0 ? styles.zero : ''}`.trim()}
                >
                  {fmtMod(total)}
                </span>
              </button>
            );
          })}
        </section>
      )}

      {/* ── Pohyb + Velikost (read-only info) ── */}
      <section className={styles.section}>
        <h3 className={styles.title}>
          <span className={styles.seal} aria-hidden="true">
            🏃
          </span>
          Pohyb
        </h3>
        <div className={styles.infoGrid}>
          <div className={styles.infoCard}>
            <div className={styles.infoLab}>Pohyblivost</div>
            <div className={styles.infoVal}>{str('mobility') || '—'}</div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoLab}>Velikost</div>
            <div className={styles.infoVal}>{str('size') || '—'}</div>
          </div>
        </div>
      </section>

      {/* ── Zbraně (útok +vlastnost · obrana +Obr — obojí k6+, oba exploding) ── */}
      {/* Zbraň drží jen 3 čísla (útočnost/zranění/obrana); ÚČ/OČ zrušené. Při
          hodu se přičte oprava atributu: útok = atk + Sil (melee) / Obr (ranged),
          obrana = def + Obr. Zranění (dmg) jde jen do zobrazení, ne do modifieru. */}
      {weapons.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.title}>
            <span className={`${styles.seal} ${styles.crimson}`} aria-hidden="true">
              ⚔
            </span>
            Zbraně <small>útok +vlastnost · obrana +Obr (k6+)</small>
          </h3>
          {weapons.map((w, i) => {
            const ranged = w.kind === 'ranged';
            const atkAbbr = ranged ? 'Obr' : 'Sil';
            const atkAttrMod = drdhAttrMod(str(ranged ? 'attr_dex' : 'attr_str'));
            const atkMod = (parseInt(w.atk, 10) || 0) + atkAttrMod;
            const defMod = (parseInt(w.def, 10) || 0) + obrMod;
            const meta = [
              ranged ? 'dálka' : 'blízko',
              `útoč. ${w.atk || '0'} +${atkAbbr}`,
              `obr. ${w.def || '0'} +Obr`,
              w.dmg ? `zranění ${w.dmg}` : '',
            ]
              .filter(Boolean)
              .join(' · ');
            return (
              <div key={`${w.name}-${i}`} className={styles.weapRow}>
                <div className={styles.weapName}>
                  {w.name || '(bez názvu)'}
                  <small>{meta}</small>
                </div>
                <div className={styles.wacts}>
                  <button
                    type="button"
                    className={styles.watk}
                    disabled={!canRoll}
                    style={
                      canRoll
                        ? undefined
                        : { cursor: 'default', pointerEvents: 'none' }
                    }
                    onClick={() =>
                      doRoll(`Útok: ${w.name || 'zbraň'}`, atkMod, 'd6+', false, {
                        breakdown: [
                          { label: 'útoč', value: parseInt(w.atk, 10) || 0 },
                          { label: atkAbbr, value: atkAttrMod },
                        ],
                        damage: fmtDamage(w.dmg ?? ''),
                      })
                    }
                    aria-label={w.name ? `Útok ${w.name}` : 'Útok zbraní'}
                    title={`Útok ${w.name || 'zbraň'} (k6+ ${fmtMod(atkMod)})${w.dmg ? ` · zranění ${w.dmg}` : ''}`}
                  >
                    ⚔ Útok <b>{fmtMod(atkMod)}</b>
                  </button>
                  <button
                    type="button"
                    className={styles.wdef}
                    disabled={!canRoll}
                    style={
                      canRoll
                        ? undefined
                        : { cursor: 'default', pointerEvents: 'none' }
                    }
                    onClick={() =>
                      doRoll(`Obrana: ${w.name || 'zbraň'}`, defMod, 'd6+', false, {
                        breakdown: [
                          { label: 'obr', value: parseInt(w.def, 10) || 0 },
                          { label: 'Obr', value: obrMod },
                        ],
                      })
                    }
                    aria-label={w.name ? `Obrana ${w.name}` : 'Obrana zbraní'}
                    title={`Obrana ${w.name || 'zbraň'} (k6+ ${fmtMod(defMod)})`}
                  >
                    ⛨ Obrana <b>{fmtMod(defMod)}</b>
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* ── Okna (modal) ── */}
      <div className={styles.winBtns}>
        <button
          type="button"
          className={styles.winBtn}
          onClick={() => setProfOpen(true)}
        >
          📖 {profTable.title}
        </button>
        <button
          type="button"
          className={styles.winBtn}
          onClick={() => setAbilOpen(true)}
        >
          ✦ Zvláštní schopnosti
        </button>
      </div>

      <Modal
        open={profOpen}
        onClose={() => setProfOpen(false)}
        title={profTable.title}
        size="lg"
      >
        {profRows.length === 0 ? (
          <p className={styles.modalEmpty}>Žádný záznam v deníku.</p>
        ) : (
          <table className={styles.mtbl}>
            <thead>
              <tr>
                {profTable.cols.map((c) => (
                  <th key={c.key}>{c.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profRows.map((row, i) => (
                <tr key={i}>
                  {profTable.cols.map((c) => (
                    <td key={c.key}>{row[c.key] || '—'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>

      <Modal
        open={abilOpen}
        onClose={() => setAbilOpen(false)}
        title="Zvláštní schopnosti"
        size="lg"
      >
        {abilities.length === 0 ? (
          <p className={styles.modalEmpty}>Žádné zvláštní schopnosti.</p>
        ) : (
          <table className={styles.mtbl}>
            <thead>
              <tr>
                <th>Název</th>
                <th>Účinek</th>
              </tr>
            </thead>
            <tbody>
              {abilities.map((a, i) => (
                <tr key={i}>
                  <td>{a.name || '—'}</td>
                  <td>{a.desc || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>
    </div>
  );
}

// ── Vital (Životy + zdrojové bary) ───────────────────────────────────────

interface VitalProps {
  variant: 'hp' | 'res' | 'res2';
  label: string;
  cur: number;
  max: number;
  canEdit: boolean;
  onAdjust: (delta: number) => void;
}

function Vital({
  variant,
  label,
  cur,
  max,
  canEdit,
  onAdjust,
}: VitalProps): React.ReactElement {
  const pct = max > 0 ? Math.max(0, Math.min(100, (cur / max) * 100)) : 0;
  return (
    <div className={`${styles.vital} ${styles[variant]}`}>
      <span className={styles.vitalLab}>{label}</span>
      <div className={styles.vbar}>
        <div className={styles.vbarFill} style={{ width: `${pct}%` }} />
        <div className={styles.vbarTxt}>
          {cur} / {max}
        </div>
      </div>
      {canEdit && (
        <div className={styles.vsteps}>
          {[-5, -1, 1].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onAdjust(d)}
              aria-label={`${label} ${d > 0 ? '+' : ''}${d}`}
            >
              {d > 0 ? `+${d}` : d}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sekundární zdroj per povolání ────────────────────────────────────────

interface ResourceBodyProps {
  kind: DrdhResourceKind;
  str: (key: string) => string;
  numOr: (key: string, fallback?: number) => number;
  canEdit: boolean;
  adjust: (key: string, maxKey: string, delta: number) => void;
  setAdr: (n: number) => void;
}

function ResourceBody({
  kind,
  str,
  numOr,
  canEdit,
  adjust,
  setAdr,
}: ResourceBodyProps): React.ReactElement {
  switch (kind) {
    case 'adrenalin': {
      const cur = numOr('res_adr', 0);
      return (
        <div className={styles.adrWrap}>
          <div className={styles.adrTrack}>
            {Array.from({ length: 20 }, (_, idx) => {
              const n = idx + 1;
              return (
                <button
                  key={n}
                  type="button"
                  className={`${styles.adrCell} ${n <= cur ? styles.on : ''}`.trim()}
                  disabled={!canEdit}
                  aria-pressed={n <= cur}
                  aria-label={`Adrenalin ${n}`}
                  onClick={() => setAdr(n)}
                >
                  {n}
                </button>
              );
            })}
          </div>
          <div className={styles.adrFoot}>
            <span>+1 za kolo boje · max 20</span>
            <span>
              Akt.: <b>{cur}</b>
            </span>
          </div>
        </div>
      );
    }
    case 'dusevni':
      return (
        <>
          <Vital
            variant="res"
            label="Duš. síla"
            cur={numOr('res_ds')}
            max={numOr('res_ds_max')}
            canEdit={canEdit}
            onAdjust={(d) => adjust('res_ds', 'res_ds_max', d)}
          />
          <div className={styles.resNote}>Plné doplnění spánkem</div>
        </>
      );
    case 'mana':
      return (
        <>
          <Vital
            variant="res"
            label="Mana"
            cur={numOr('res_mana')}
            max={numOr('res_mana_max')}
            canEdit={canEdit}
            onAdjust={(d) => adjust('res_mana', 'res_mana_max', d)}
          />
          <div className={styles.resMini}>
            <span>
              Úroveň <b>{str('res_mana_lvl') || '0'}</b>
            </span>
            <span>
              Nasátí <b>{str('res_mana_nasati') || '0'}</b>
            </span>
          </div>
        </>
      );
    case 'mana_sur':
      return (
        <>
          <Vital
            variant="res"
            label="Mana"
            cur={numOr('res_mana')}
            max={numOr('res_mana_max')}
            canEdit={canEdit}
            onAdjust={(d) => adjust('res_mana', 'res_mana_max', d)}
          />
          <Vital
            variant="res2"
            label="Suroviny"
            cur={numOr('res_sur')}
            max={numOr('res_sur_max')}
            canEdit={canEdit}
            onAdjust={(d) => adjust('res_sur', 'res_sur_max', d)}
          />
        </>
      );
    case 'prizen':
      return (
        <>
          <Vital
            variant="res"
            label="Přízeň"
            cur={numOr('res_favor')}
            max={numOr('res_favor_max')}
            canEdit={canEdit}
            onAdjust={(d) => adjust('res_favor', 'res_favor_max', d)}
          />
          <div className={styles.resNote}>
            3× denně lze obnovit 1/3 přízně (ráno / odpoledne / večer)
          </div>
        </>
      );
    case 'kostymy':
    default:
      // Zloděj nemá magický zdroj — kostýmy jsou seznam přestrojení (v deníku),
      // do bojového minima nepatří; tady jen poznámka.
      return (
        <div className={styles.resNote}>
          Zloděj nemá magický zdroj — spoléhá na umění a dovednosti.
        </div>
      );
  }
}
