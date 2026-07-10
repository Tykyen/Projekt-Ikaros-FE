/**
 * 16.2d-mapa — DrdPlusCombatPanel (Dračí doupě Plus na taktické mapě).
 *
 * Kompaktní bojový panel sladěný s deníkem `DrdPlusSheet` (pergamen „iluminovaný
 * kodex"). Single source s listem — čte/zapisuje tentýž `diary.customData`
 * přes `token.characterSlug`, prefix `drdp_` (`makeCdAccess`).
 *
 * Hody (spec-16.2d-mapa R3): vše **`2d6+`** (otevřený hod DrD+) + příslušná
 * veličina + **postih** (zranění + únava, auto-odečet), KROMĚ zbraňového
 * **ZZ = `d6` + ZZ** (1k6, ne eskalující). Velikost a Hmotnost se nehází.
 * Iniciativa = `2d6+`.
 *
 * Profese se NEvybírá na mapě — bere se z deníku (`drdp_profession`), erb =
 * jen identita. Dlouhý read-only obsah profese (kouzla, formule, démoni, …)
 * se otevírá uprostřed (`Modal`) a **reusuje deníkové komponenty v `disabled`
 * módu** (proto statický import scoped `drdplus.css` + wrapper `.dp-sheet`).
 *
 * Data flow vzorem `Drd16CombatPanel`: `useCharacterDiary` → debounced
 * (~500 ms) `useUpdateCharacterDiary({customDataPatch})`. `canEdit === false`
 * → readonly (žádné úpravy magenergie/náklonnosti/vlivu/postihu/životů).
 *
 * Pergamen tělo = self-contained (`.module.css`, `--dd-*` + per-profese
 * `--acc`) — sdílené skin tokeny jsou laděné na tmavý HUD (viz 16.2b).
 */
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { useCharacterDiary } from '@/features/world/pages/api/useCharacterSubdocs';
import { useUpdateCharacterDiary } from '@/features/world/pages/api/useCharacterMutations';
import type { SystemSheetProps } from '@/features/world/pages/CharacterDetailPage/diary-systems/types';
import {
  makeCdAccess,
  type CdAccess,
} from '@/features/world/pages/CharacterDetailPage/diary-systems/_shared/cdAccess';
import {
  DRDPLUS_PROFESSIONS,
  DRDPLUS_STATS,
  DRDPLUS_DERIVED,
  WIZARD_PROJEVY,
  type DrdPlusProfessionId,
} from '@/features/world/pages/CharacterDetailPage/diary-systems/sheets/drdplus/constants';
import {
  JsonTable,
  Scale,
} from '@/features/world/pages/CharacterDetailPage/diary-systems/sheets/drdplus/DrdPlusShared';
import {
  SpellList,
  FormuleList,
  DemonList,
} from '@/features/world/pages/CharacterDetailPage/diary-systems/sheets/drdplus/DrdPlusCards';
import { Modal } from '@/shared/ui/Modal/Modal';
import { activateOnKey } from '@/shared/lib/a11y';
import type { MapToken } from '../../../types';
// Okna „k nahlédnutí" reusují deníkové komponenty (.dp-* třídy scoped na .dp-sheet).
import '@/features/world/pages/CharacterDetailPage/diary-systems/styles/drdplus.css';
import styles from './DrdPlusCombatPanel.module.css';

interface Props {
  token: MapToken;
  sceneId: string;
  worldId: string;
  canEdit: boolean;
  onRoll?: SystemSheetProps['onRoll'];
}

const DEBOUNCE_MS = 500;
/** Odvozené vlastnosti, které se hází (Velikost a Hmotnost se nehází — R5). */
const DERIVED_ROLLABLE = DRDPLUS_DERIVED.filter(
  (s) => s !== 'Velikost' && s !== 'Hmotnost',
);

interface ZbranRow {
  zbran?: string;
  bc?: unknown;
  uc?: unknown;
  zz?: unknown;
  oc?: unknown;
}
interface DovRow {
  dovednost?: string;
  bonus?: unknown;
}
interface VlivRow {
  osoba?: string;
  body?: unknown;
}

const toInt = (v: unknown): number => {
  const n = parseInt(String(v ?? ''), 10);
  return Number.isNaN(n) ? 0 : n;
};

export function DrdPlusCombatPanel({
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
  const [win, setWin] = useState<string | null>(null);
  const uid = useId();

  useEffect(() => {
    return () => {
      if (flushTimer.current) clearTimeout(flushTimer.current);
    };
  }, []);

  function scheduleFlush(next: Record<string, unknown>): void {
    if (flushTimer.current) clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(() => {
      if (Object.keys(next).length === 0) return;
      updateMut.mutate(
        { customDataPatch: next },
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

  const cd: Record<string, unknown> = { ...(diary.customData ?? {}), ...pending };

  // Stejné write-semantiky jako deník (delta merge), jen napojené na debounced
  // mutaci. Ve readonly (canEdit=false) je onChange undefined → settery no-op.
  const handleChange: SystemSheetProps['onChange'] = (nextChange) => {
    if (!('customDataPatch' in nextChange)) return;
    setPending((prev) => {
      const merged = { ...prev, ...nextChange.customDataPatch };
      scheduleFlush(merged);
      return merged;
    });
  };
  const cda: CdAccess = makeCdAccess(
    cd,
    'drdp_',
    canEdit ? handleChange : undefined,
  );
  const { g } = cda;
  const numOr = (key: string): number => toInt(g(key));

  const prof = (g('profession') || 'bojovnik') as DrdPlusProfessionId;
  const profDef =
    DRDPLUS_PROFESSIONS.find((p) => p.id === prof) ?? DRDPLUS_PROFESSIONS[0];

  // Postih (zranění + únava) se odečítá od KAŽDÉHO hodu (R4). Jméno postavy
  // do labelu neprefixujeme — log/overlay ho nesou zvlášť (useMapDiceRoll).
  const postih = numOr('zraneni_postih') + numOr('unava_postih');
  const doRoll = (
    label: string,
    baseMod: number,
    kind: '2d6+' | 'd6',
    initiative = false,
  ): void => {
    // `initiative` přidáváme jen když true → neinit hody volají onRoll beze změny
    // tvaru (konzument: `req.initiative ?? labelRegex`).
    onRoll?.({ label, modifier: baseMod + postih, kind, ...(initiative && { initiative: true }) });
  };

  const has = (arrKey: string): boolean =>
    cda.parseJsonArr(arrKey).length > 0;

  const rollRow = (
    key: string,
    name: string,
    val: number,
    baseMod: number,
  ): ReactNode => (
    <button
      key={key}
      type="button"
      className={styles.rollRow}
      disabled={!onRoll}
      onClick={() => doRoll(name, baseMod, '2d6+')}
      aria-label={`Hodit ${name}`}
    >
      <span className={styles.rName}>{name}</span>
      <span className={styles.rVal}>{val || '—'}</span>
    </button>
  );

  const chip = (
    lbl: string,
    val: unknown,
    kind: '2d6+' | 'd6',
    label: string,
    zz = false,
    initiative = false,
  ): ReactNode => {
    const n = toInt(val);
    return (
      <button
        type="button"
        className={`${styles.chip}${zz ? ' ' + styles.zz : ''}`}
        disabled={!onRoll}
        onClick={() => doRoll(label, n, kind, initiative)}
        aria-label={`Hodit ${label}`}
      >
        {lbl}
        <b>{n}</b>
      </button>
    );
  };

  const openBtn = (key: string, label: string, sub?: string): ReactNode => (
    <button
      key={key}
      type="button"
      className={styles.openBtn}
      onClick={() => setWin(key)}
    >
      📖 {label}
      {sub && <small>{sub}</small>}
    </button>
  );

  const nakloInput = (label: string, key: string): ReactNode => (
    <div className={styles.naklo} key={key}>
      <span className={styles.nakloLbl}>{label}</span>
      <input
        className={styles.nakloInput}
        type="number"
        value={g(key) || '0'}
        disabled={!canEdit}
        aria-label={label}
        onChange={(e) => cda.set(key, parseInt(e.target.value, 10) || 0)}
      />
    </div>
  );

  const weapons = cda.parseJsonArr<ZbranRow>('zbrane');
  const skills = cda.parseJsonArr<DovRow>('dovednosti');

  const vlivTable = (): ReactNode => {
    const rows = cda.parseJsonArr<VlivRow>('pri_vlivosoby');
    if (rows.length === 0) return null;
    return (
      <>
        <div className={styles.stitle}>
          Vliv u osob <small>velikost úprava</small>
        </div>
        <table className={styles.vlivTbl}>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className={styles.vlivName}>{String(r.osoba || '(osoba)')}</td>
                <td>
                  <input
                    className={styles.vlivInput}
                    value={String(r.body ?? '')}
                    disabled={!canEdit}
                    aria-label={`Velikost vlivu ${i + 1}`}
                    onChange={(e) =>
                      cda.updateArr<VlivRow>('pri_vlivosoby', i, {
                        body: e.target.value,
                      })
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  };

  function renderProf(): ReactNode {
    switch (prof) {
      case 'bojovnik':
        return has('w_finty') ? (
          <div className={styles.openBtns}>{openBtn('finty-b', 'Bojové finty')}</div>
        ) : (
          <p className={styles.hint}>Žádné finty.</p>
        );
      case 'carodej':
        return (
          <>
            <div className={styles.manaField}>
              <label htmlFor={`${uid}-wiz-aktualni`}>Aktuální magenergie</label>
              <input
                id={`${uid}-wiz-aktualni`}
                value={g('wiz_aktualni')}
                disabled={!canEdit}
                aria-label="Aktuální magenergie"
                onChange={(e) => cda.set('wiz_aktualni', e.target.value)}
              />
            </div>
            <div className={styles.openBtns}>
              {has('wiz_kouzla') && openBtn('kouzla', 'Kouzla')}
              {openBtn('obory', 'Obory')}
            </div>
          </>
        );
      case 'hranicar':
        return (
          <div className={styles.openBtns}>
            {has('ran_zam') && openBtn('zamereni', 'Zaměření')}
            {(g('ran_totem') || g('ran_totem_mech')) &&
              openBtn('totem', 'Totem')}
          </div>
        );
      case 'knez':
        return (
          <>
            <div className={styles.grid2}>
              {rollRow(
                'asp-sila',
                'Síla aspektu',
                numOr('pri_silaas'),
                numOr('pri_silaas'),
              )}
              {rollRow(
                'asp-neo',
                'Neovlivnitelnost',
                numOr('pri_neovliv'),
                numOr('pri_neovliv'),
              )}
            </div>
            {vlivTable()}
            {has('pri_zazraky') && (
              <div className={styles.openBtns}>
                {openBtn('zazraky', 'Zázračné schopnosti')}
              </div>
            )}
          </>
        );
      case 'theurg':
        return (
          <>
            <div className={styles.stitle}>
              Nakloněnost <small>úprava (i záporná)</small>
            </div>
            {nakloInput('Denní', 'nakl_denni')}
            {nakloInput('Měsíční', 'nakl_mesicni')}
            {nakloInput('Roční', 'nakl_rocni')}
            {nakloInput('Životní', 'nakl_zivotni')}
            <div className={styles.openBtns}>
              {has('the_schopnosti') &&
                openBtn('the-schopnosti', 'Theurgické schopnosti')}
              {has('formule') && openBtn('formule', 'Formule')}
              {has('demoni') && openBtn('demoni', 'Démoni')}
              {has('the_vazby') && openBtn('vazby', 'Vazby')}
            </div>
          </>
        );
      case 'zlodej':
        return (
          <div className={styles.openBtns}>
            {has('thi_schopnosti') && openBtn('zlo-schopnosti', 'Schopnosti')}
            {has('thi_finty') && openBtn('finty-z', 'Finty')}
          </div>
        );
      default:
        return null;
    }
  }

  function windowNode(key: string): { title: string; node: ReactNode } {
    switch (key) {
      case 'finty-b':
        return {
          title: 'Bojové finty',
          node: (
            <JsonTable
              cda={cda}
              arrKey="w_finty"
              disabled
              addLabel=""
              cols={[
                { key: 'name', label: 'Název' },
                { key: 'weapon', label: 'Zbraň' },
                { key: 'prevaha', label: 'Převaha' },
                { key: 'note', label: 'Poznámka' },
              ]}
            />
          ),
        };
      case 'kouzla':
        return { title: 'Kouzla', node: <SpellList cda={cda} disabled /> };
      case 'obory':
        return {
          title: 'Obory',
          node: (
            <div>
              {WIZARD_PROJEVY.map((p) => (
                <Scale
                  key={p}
                  label={p}
                  max={10}
                  value={numOr(`wiz_proj_${p}`)}
                  disabled
                  onChange={() => {}}
                />
              ))}
            </div>
          ),
        };
      case 'zamereni':
        return {
          title: 'Zaměření',
          node: (
            <JsonTable
              cda={cda}
              arrKey="ran_zam"
              disabled
              addLabel=""
              cols={[
                { key: 'name', label: 'Zaměření' },
                { key: 'mech', label: 'Mechanismus' },
                { key: 'znalost', label: 'Znalost', type: 'num' },
                { key: 'praxe', label: 'Praxe', type: 'num' },
              ]}
            />
          ),
        };
      case 'totem':
        return {
          title: 'Totem',
          node: (
            <div className="dp-field">
              <label htmlFor={`${uid}-ran-totem`}>Zvíře totemu</label>
              <input
                id={`${uid}-ran-totem`}
                value={g('ran_totem')}
                disabled
                aria-label="Zvíře totemu"
              />
              <label htmlFor={`${uid}-ran-totem-mech`} style={{ marginTop: 8 }}>
                Mechanismy
              </label>
              <textarea
                id={`${uid}-ran-totem-mech`}
                rows={3}
                value={g('ran_totem_mech')}
                disabled
                aria-label="Mechanismy totemu"
              />
            </div>
          ),
        };
      case 'zazraky':
        return {
          title: 'Zázračné schopnosti',
          node: (
            <JsonTable
              cda={cda}
              arrKey="pri_zazraky"
              disabled
              addLabel=""
              cols={[
                { key: 'name', label: 'Schopnost' },
                { key: 'stupen', label: 'Stupeň', type: 'tri' },
                { key: 'hloubka', label: 'Hloubka', type: 'tri' },
                { key: 'note', label: 'Poznámky' },
              ]}
            />
          ),
        };
      case 'the-schopnosti':
        return {
          title: 'Theurgické schopnosti',
          node: (
            <JsonTable
              cda={cda}
              arrKey="the_schopnosti"
              disabled
              addLabel=""
              cols={[
                { key: 'name', label: 'Schopnost' },
                { key: 'znalost', label: 'Znalost', type: 'tri' },
                { key: 'bonus', label: 'Bonusy' },
                { key: 'note', label: 'Poznámky' },
              ]}
            />
          ),
        };
      case 'formule':
        return { title: 'Formule', node: <FormuleList cda={cda} disabled /> };
      case 'demoni':
        return { title: 'Démoni', node: <DemonList cda={cda} disabled /> };
      case 'vazby':
        return {
          title: 'Vazby',
          node: (
            <JsonTable
              cda={cda}
              arrKey="the_vazby"
              disabled
              addLabel=""
              cols={[
                { key: 'osoba', label: 'Osoba / entita' },
                { key: 'sila', label: 'Síla vazby', type: 'num' },
              ]}
            />
          ),
        };
      case 'zlo-schopnosti':
        return {
          title: 'Schopnosti',
          node: (
            <JsonTable
              cda={cda}
              arrKey="thi_schopnosti"
              disabled
              addLabel=""
              cols={[
                { key: 'name', label: 'Schopnost' },
                { key: 'znalost', label: 'Znalost', type: 'tri' },
                { key: 'bonus', label: 'Bonus' },
                { key: 'hod', label: 'Hod' },
                { key: 'note', label: 'Poznámka' },
              ]}
            />
          ),
        };
      case 'finty-z':
        return {
          title: 'Finty',
          node: (
            <JsonTable
              cda={cda}
              arrKey="thi_finty"
              disabled
              addLabel=""
              cols={[
                { key: 'name', label: 'Název' },
                { key: 'weapon', label: 'Zbraň' },
                { key: 'prevaha', label: 'Převaha' },
                { key: 'note', label: 'Poznámka' },
              ]}
            />
          ),
        };
      default:
        return { title: '', node: null };
    }
  }

  const activeWin = win ? windowNode(win) : null;

  return (
    <div className={styles.root} data-prof={prof}>
      {/* Hlavička (erb + jméno + profese) vynechána: jméno postavy nese obal
          tokenu (TokenInfoPanel chrome), profese je v sekci „Profese" níž. */}
      {onRoll && (
        <button
          type="button"
          className={styles.initBtn}
          onClick={() => doRoll('Boj', numOr('boj_b'), '2d6+', true)}
          title="Boj — určuje iniciativu (2k6+ + Boj)"
        >
          ⚡ Boj
        </button>
      )}

      {/* Zbraně — nad životy */}
      {weapons.length > 0 && (
        <section className={styles.sec}>
          <h3 className={styles.stitle}>
            Kombinace zbraní <small>BČ/ÚČ/OČ = 2k6+ · ZZ = 1k6+ · BČ určí i iniciativu ⚡</small>
          </h3>
          {weapons.map((w, i) => (
            <div className={styles.weap} key={i}>
              <div className={styles.weapName}>
                {String(w.zbran || '(bez názvu)')}
              </div>
              <div className={styles.chips}>
                {chip('BČ', w.bc, '2d6+', `${w.zbran || 'Zbraň'} — BČ`, false, true)}
                {chip('ÚČ', w.uc, '2d6+', `${w.zbran || 'Zbraň'} — ÚČ`)}
                {chip('ZZ', w.zz, 'd6', `${w.zbran || 'Zbraň'} — ZZ`, true)}
                {chip('OČ', w.oc, '2d6+', `${w.zbran || 'Zbraň'} — OČ`)}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Životy a únava */}
      <section className={styles.sec}>
        <h3 className={styles.stitle}>
          Životy a únava <small>klik na políčko = stav</small>
        </h3>
        <div className={styles.wgroup}>Zranění</div>
        <WoundTrack
          cda={cda}
          prefix="zraneni"
          komaLabel="Bezvědomí"
          postihLabel="Postih za zranění"
          canEdit={canEdit}
        />
        <div className={styles.wgroup}>Únava</div>
        <WoundTrack
          cda={cda}
          prefix="unava"
          komaLabel="Vyčerpání"
          postihLabel="Postih za únavu"
          canEdit={canEdit}
        />
      </section>

      {/* Hlavní vlastnosti */}
      <section className={styles.sec}>
        <h3 className={styles.stitle}>
          Hlavní vlastnosti <small>klik = 2k6+ + síla</small>
        </h3>
        {DRDPLUS_STATS.map((s) => {
          const v = numOr(`stat_${s}`);
          return rollRow(s, s, v, v);
        })}
      </section>

      {/* Odvozené vlastnosti (bez Velikosti a Hmotnosti) */}
      <section className={styles.sec}>
        <h3 className={styles.stitle}>
          Odvozené vlastnosti <small>klik = 2k6+ + schopnost</small>
        </h3>
        <div className={styles.grid2}>
          {DERIVED_ROLLABLE.map((s) => {
            const v = numOr(`odv_${s}`);
            return rollRow(s, s, v, v);
          })}
        </div>
      </section>

      {/* Dovednosti */}
      {skills.length > 0 && (
        <section className={styles.sec}>
          <h3 className={styles.stitle}>
            Dovednosti <small>klik = 2k6+ + Bonus</small>
          </h3>
          {skills.map((sk, i) => {
            const b = toInt(sk.bonus);
            return rollRow(`sk${i}`, String(sk.dovednost || '(dovednost)'), b, b);
          })}
        </section>
      )}

      <hr className={styles.rule} />

      {/* Profese (dle drdp_profession) */}
      <section className={styles.sec}>
        <h3 className={styles.stitle}>Profese — {profDef.label}</h3>
        {renderProf()}
      </section>

      <Modal
        open={!!win}
        onClose={() => setWin(null)}
        title={activeWin?.title ?? ''}
        size="lg"
      >
        <div className="dp-sheet" data-prof={prof}>
          {activeWin?.node}
        </div>
      </Modal>
    </div>
  );
}

// ── WoundTrack (lišta zranění / únavy) ──────────────────────────────────

interface WoundTrackProps {
  cda: CdAccess;
  prefix: string;
  komaLabel: string;
  postihLabel: string;
  canEdit: boolean;
}

function WoundTrack({
  cda,
  prefix,
  komaLabel,
  postihLabel,
  canEdit,
}: WoundTrackProps): React.ReactElement {
  const mez = Math.max(1, parseInt(cda.g(`${prefix}_mez`, '10'), 10) || 10);
  const smrt = cda.bool(`${prefix}_smrt`);
  const filled = parseInt(cda.g(`${prefix}_val`, '0'), 10) || 0;
  const rows: { cls: string; lbl: string }[] = [
    { cls: styles.bez, lbl: 'Bez postihu' },
    { cls: styles.postihRow, lbl: 'Postih' },
    { cls: styles.koma, lbl: komaLabel },
  ];
  if (smrt) rows.push({ cls: styles.smrt, lbl: 'Smrt' });
  let idx = 0;
  return (
    <div className={styles.wtrack}>
      {rows.map((r) => (
        <div key={r.lbl} className={`${styles.wrow} ${r.cls}`}>
          <span className={styles.wlbl}>{r.lbl}</span>
          <div className={styles.wcells}>
            {Array.from({ length: mez }, () => {
              const ci = idx++;
              const setCell = () =>
                cda.set(`${prefix}_val`, ci + 1 === filled ? 0 : ci + 1);
              return (
                <span
                  key={ci}
                  className={`${styles.wcell}${ci < filled ? ' ' + styles.on : ''}`}
                  role="button"
                  tabIndex={canEdit ? 0 : -1}
                  aria-label={`Nastavit ${ci + 1}`}
                  aria-pressed={ci < filled}
                  aria-disabled={!canEdit || undefined}
                  onClick={canEdit ? setCell : undefined}
                  onKeyDown={canEdit ? activateOnKey(setCell) : undefined}
                />
              );
            })}
          </div>
        </div>
      ))}
      <div className={styles.postihField}>
        <label>{postihLabel}</label>
        <input
          type="number"
          value={cda.g(`${prefix}_postih`, '0')}
          disabled={!canEdit}
          aria-label={postihLabel}
          onChange={(e) =>
            cda.set(`${prefix}_postih`, parseInt(e.target.value, 10) || 0)
          }
        />
      </div>
    </div>
  );
}
