/**
 * 16.2b-mapa — Drd16CombatPanel (Dračí doupě 1.6 na taktické mapě).
 *
 * Kompaktní bojový panel (ořez na bojové minimum) sladěný s deníkovým listem
 * `Drd16Sheet` (fantasy „iluminovaný kodex kováře"). Single source s listem —
 * čte/zapisuje tentýž `diary.customData` přes `token.characterSlug`.
 *
 * Hody (spec-16.2b-mapa R3):
 *   - Vlastnost = `d10` + bonus (`getDrdBonus`)
 *   - Útok / Obrana / Iniciativa = `d6+` (nafukovací k6, exploding)
 *   - Zranění se nepočítá automaticky (dva tokeny → ruční vyhodnocení)
 *
 * Dlouhý obsah (Schopnosti = text, Kouzla = karty) je v otvíracích oknech
 * (`Modal`), protože do úzkého boku se nevejde. Okna lze otevřít obě naráz.
 *
 * Data flow vzorem `Drd2CombatPanel`: `useCharacterDiary` →
 * debounced (~500 ms) `useUpdateCharacterDiary({ customDataPatch })`.
 * `canEdit === false` → readonly (žádné inputy/±/přidávání).
 *
 * Pergamen tělo = self-contained fantasy (`.module.css`) — `--mx-*` skin
 * tokeny jsou laděné na tmavý HUD a na světlém pergamenu by byly nečitelné
 * (stejný důvod, proč list jede self-contained, viz 162b). Skin tokenizace =
 * 16.2c-drd16. Tmavé sdílené plochy (wrapper/log/overlay) skin nesou (F3).
 */
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useCharacterDiary } from '@/features/world/pages/api/useCharacterSubdocs';
import { useUpdateCharacterDiary, isDiaryConflict } from '@/features/world/pages/api/useCharacterMutations';
import type { SystemSheetProps } from '@/features/world/pages/CharacterDetailPage/diary-systems/types';
import {
  DRD16_EMPTY_SPELL,
  DRD16_HAZ_STATS,
  getDrdBonus,
  type Drd16RangedWeapon,
  type Drd16Spell,
  type Drd16Weapon,
} from '@/features/world/pages/CharacterDetailPage/diary-systems/sheets/drd16/constants';
import { Drd16SpellCard } from '@/features/world/pages/CharacterDetailPage/diary-systems/sheets/drd16/Drd16SpellCard';
import { Modal } from '@/shared/ui/Modal/Modal';
import type { MapToken } from '../../../types';
import styles from './Drd16CombatPanel.module.css';

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

const fmtBonus = (b: number): string => (b > 0 ? `+${b}` : String(b));

export function Drd16CombatPanel({
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
  const [abilOpen, setAbilOpen] = useState(false);
  const [spellOpen, setSpellOpen] = useState(false);

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
          onError: (e) => {
            // 29.1 — DIARY_CONFLICT řeší hook (toast + refetch); zahodit pending,
            // ať se panel srovná na pravdivé HP (žádný clobber cizí změny).
            if (isDiaryConflict(e)) {
              setPending({});
              return;
            }
            toast.error(
              `Uložení selhalo: ${e instanceof Error ? e.message : 'neznámá chyba'}`,
            );
          },
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
  const cd: Record<string, unknown> = { ...baseCd, ...pending };
  const str = (k: string): string => asStr(cd[k]);
  const numOr = (k: string, fallback = 0): number => {
    const n = parseInt(asStr(cd[k]), 10);
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

  // Jméno postavy se NEprefixuje do labelu — roll log i overlay ho nesou
  // zvlášť (z `useMapDiceRoll.rollerName`), jinak by se duplikovalo.
  const doRoll = (
    label: string,
    modifier: number,
    kind: 'd6+' | 'd10',
  ): void => {
    onRoll?.({ label, modifier, kind });
  };

  const adjust = (key: string, maxKey: string, delta: number): void => {
    const max = numOr(maxKey, 0);
    const cur = numOr(key, 0);
    const next = Math.max(0, max > 0 ? Math.min(max, cur + delta) : cur + delta);
    writeField(key, String(next));
  };

  const meleeWeapons = safeParseArr<Drd16Weapon>(cd['meleeWeapons']);
  const rangedWeapons = safeParseArr<Drd16RangedWeapon>(cd['rangedWeapons']);
  const spells = safeParseArr<Drd16Spell>(cd['spells']);

  const writeSpell = (i: number, patch: Partial<Drd16Spell>): void => {
    const next = spells.map((s, idx) => (idx === i ? { ...s, ...patch } : s));
    writeField('spells', JSON.stringify(next));
  };
  const addSpell = (): void => {
    writeField('spells', JSON.stringify([...spells, DRD16_EMPTY_SPELL]));
  };
  const removeSpell = (i: number): void => {
    writeField('spells', JSON.stringify(spells.filter((_, idx) => idx !== i)));
  };

  return (
    <div className={styles.root}>
      {/* Iniciativa quick-roll (d6+) */}
      {onRoll && (
        <button
          type="button"
          className={styles.initBtn}
          onClick={() => doRoll('Iniciativa', 0, 'd6+')}
          title="Hodit iniciativu (d6+)"
        >
          ⚡ Iniciativa
        </button>
      )}

      {/* Vitals: Životy / Magy */}
      <Vital
        variant="hp"
        label="Životy"
        cur={numOr('hp_current')}
        max={numOr('hp_max')}
        canEdit={canEdit}
        onAdjust={(d) => adjust('hp_current', 'hp_max', d)}
      />
      <Vital
        variant="ma"
        label="Magy"
        cur={numOr('mana_current')}
        max={numOr('mana_max')}
        canEdit={canEdit}
        onAdjust={(d) => adjust('mana_current', 'mana_max', d)}
      />

      {/* Vlastnosti — klik = d10 + bonus */}
      <section className={styles.section}>
        <h3 className={styles.title}>
          Vlastnosti <small>klik = k10 + bonus</small>
        </h3>
        {DRD16_HAZ_STATS.map((stat) => {
          const val = numOr(`${stat.key}_val`);
          const bonus = getDrdBonus(val);
          return (
            <button
              key={stat.key}
              type="button"
              className={styles.statRow}
              disabled={!onRoll}
              style={
                onRoll ? undefined : { cursor: 'default', pointerEvents: 'none' }
              }
              onClick={() => doRoll(stat.label, bonus, 'd10')}
              title={`Hodit ${stat.label} (k10 ${fmtBonus(bonus)})`}
              aria-label={`Hodit ${stat.label}`}
            >
              <span className={styles.statName}>{stat.label}</span>
              <span className={styles.statVal}>{val || '—'}</span>
              <span
                className={`${styles.statBonus} ${bonus < 0 ? styles.neg : bonus === 0 ? styles.zero : ''}`.trim()}
              >
                {fmtBonus(bonus)}
              </span>
            </button>
          );
        })}
      </section>

      {/* Pohyb & Postřeh — jen zobrazení */}
      <section className={styles.section}>
        <h3 className={styles.title}>Pohyb &amp; Postřeh</h3>
        <div className={styles.infoGrid}>
          <div className={styles.infoCard}>
            <div className={styles.infoLab}>Základní pohyb</div>
            <div className={styles.infoVal}>{str('mov_val') || '—'}</div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoLab}>Postřeh</div>
            <div className={styles.perGrid}>
              <span />
              <span className={styles.perHead}>Náh.</span>
              <span className={styles.perHead}>Hled.</span>
              <span className={styles.perRow}>Obj.</span>
              <span className={styles.perVal}>{str('per_obj_rand') || '—'}</span>
              <span className={styles.perVal}>{str('per_obj_seek') || '—'}</span>
              <span className={styles.perRow}>Mech.</span>
              <span className={styles.perVal}>{str('per_mec_rand') || '—'}</span>
              <span className={styles.perVal}>{str('per_mec_seek') || '—'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Obrana — klik = OČ + d6+ */}
      <section className={styles.section}>
        <h3 className={styles.title}>
          Obrana <small>klik = OČ + k6+</small>
        </h3>
        <button
          type="button"
          className={styles.defBtn}
          disabled={!onRoll}
          style={
            onRoll ? undefined : { cursor: 'default', pointerEvents: 'none' }
          }
          onClick={() => doRoll('Obrana', numOr('defense'), 'd6+')}
          aria-label="Hodit obranu"
        >
          <span className={styles.defLab}>Obranné číslo</span>
          <span className={styles.defVal}>{str('defense') || '0'}</span>
        </button>
      </section>

      {/* Zbraně — klik = ÚČ + d6+ */}
      {(meleeWeapons.length > 0 || rangedWeapons.length > 0) && (
        <section className={styles.section}>
          <h3 className={styles.title}>
            Zbraně <small>klik = ÚČ + k6+</small>
          </h3>
          {meleeWeapons.map((w, i) => (
            <WeaponRow
              key={`m-${i}`}
              kind="na blízko"
              name={w.weapon}
              uc={w.uc}
              utoc={w.utoc}
              extra={w.oz ? `OZ ${w.oz}` : ''}
              onRoll={
                onRoll && w.weapon
                  ? () =>
                      doRoll(`Útok: ${w.weapon}`, parseInt(w.uc, 10) || 0, 'd6+')
                  : undefined
              }
            />
          ))}
          {rangedWeapons.map((w, i) => (
            <WeaponRow
              key={`r-${i}`}
              kind="střelná"
              name={w.weapon}
              uc={w.uc}
              utoc={w.utoc}
              extra={[w.small, w.medium, w.large].filter(Boolean).join(' / ')}
              onRoll={
                onRoll && w.weapon
                  ? () =>
                      doRoll(`Útok: ${w.weapon}`, parseInt(w.uc, 10) || 0, 'd6+')
                  : undefined
              }
            />
          ))}
        </section>
      )}

      {/* Okna */}
      <div className={styles.winBtns}>
        <button
          type="button"
          className={styles.winBtn}
          onClick={() => setAbilOpen(true)}
        >
          📖 Schopnosti
        </button>
        <button
          type="button"
          className={styles.winBtn}
          onClick={() => setSpellOpen(true)}
        >
          📖 Kouzla
        </button>
      </div>

      <Modal
        open={abilOpen}
        onClose={() => setAbilOpen(false)}
        title="Zvláštní schopnosti"
        size="lg"
      >
        {canEdit ? (
          <textarea
            className={styles.abilArea}
            value={str('special_abilities')}
            onChange={(e) => writeField('special_abilities', e.target.value)}
            placeholder="Schopnosti povolání, finty, bojové triky, alchymistické recepty…"
            aria-label="Zvláštní schopnosti"
          />
        ) : (
          <p className={styles.abilText}>
            {str('special_abilities') || 'Žádné zvláštní schopnosti.'}
          </p>
        )}
      </Modal>

      <Modal
        open={spellOpen}
        onClose={() => setSpellOpen(false)}
        title="Kouzla / Spellbook"
        size="lg"
      >
        {spells.map((spell, i) => (
          <Drd16SpellCard
            key={i}
            spell={{ ...DRD16_EMPTY_SPELL, ...spell }}
            editable={canEdit}
            onChange={(patch) => writeSpell(i, patch)}
            onRemove={() => removeSpell(i)}
          />
        ))}
        {canEdit && (
          <button type="button" className={styles.addSpell} onClick={addSpell}>
            + Přidat kouzlo
          </button>
        )}
        {!canEdit && spells.length === 0 && (
          <p className={styles.abilText}>Žádná kouzla.</p>
        )}
      </Modal>
    </div>
  );
}

// ── Vital (Životy / Magy) ──────────────────────────────────────────────

interface VitalProps {
  variant: 'hp' | 'ma';
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
          {[-5, -1, 1, 5].map((d) => (
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

// ── WeaponRow ──────────────────────────────────────────────────────────

interface WeaponRowProps {
  kind: string;
  name: string;
  uc: string;
  utoc: string;
  extra: string;
  onRoll?: () => void;
}

function WeaponRow({
  kind,
  name,
  uc,
  utoc,
  extra,
  onRoll,
}: WeaponRowProps): React.ReactElement {
  const interactive = !!onRoll;
  return (
    <button
      type="button"
      className={styles.weapon}
      disabled={!interactive}
      style={
        interactive ? undefined : { cursor: 'default', pointerEvents: 'none' }
      }
      onClick={onRoll}
      aria-label={name ? `Útok ${name}` : 'Zbraň'}
    >
      <span className={styles.weapName}>{name || '(bez názvu)'}</span>
      {uc && <span className={styles.weapUc}>ÚČ {uc}</span>}
      <span className={styles.weapMeta}>
        <span className={styles.weapKind}>{kind}</span>
        {utoc && (
          <span>
            Útoč <b>{utoc}</b>
          </span>
        )}
        {extra && <span>{extra}</span>}
      </span>
    </button>
  );
}
