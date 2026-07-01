/**
 * 8.7u — CoC bojový panel pro taktickou mapu (a chat rail).
 *
 * Redesign legacy 10.2c panelu do horror-dossier jazyka deníku (8.7t).
 * Combat panel je HERNÍ PULT — hází se odsud:
 *   - klik na vlastnost / dovednost / zbraň → `onRoll({kind:'d100', target})`,
 *     roll engine vyhodnotí CoC úroveň úspěchu (Extrémní/Výrazný/Běžný/
 *     Neúspěch/Krach) a zobrazí v dicelogu + 3D readoutu (8.7u percentile).
 *   - Iniciativa = OBR (v CoC se nehází, jen řadí) → `kind:'flat'`.
 *   - Životy + Příčetnost = bar s ± (rychlé odečtení zranění / ztráty SAN).
 *
 * Data: `useCharacterDiary` (customData `coc_*`), debounced patch 500ms s draft
 * state proti server-overwrite uprostřed typingu. Permission gate `canEdit`.
 */
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useCharacterDiary } from '@/features/world/pages/api/useCharacterSubdocs';
import { useUpdateCharacterDiary } from '@/features/world/pages/api/useCharacterMutations';
import { mapSceneQueryKey } from '../../../hooks/useMapScene';
import { applyOperationToScene } from '../../../utils/applyOperationToScene';
import type { MapScene, MapToken } from '../../../types';
import styles from './CocCombatPanel.module.css';

// ── Konstanty ────────────────────────────────────────────────────────

const COC_CHARS = [
  { key: 'str', label: 'SIL' },
  { key: 'con', label: 'ODL' },
  { key: 'dex', label: 'OBR' },
  { key: 'int', label: 'INT' },
  { key: 'siz', label: 'VEL' },
  { key: 'pow', label: 'VŮL' },
  { key: 'app', label: 'VZH' },
  { key: 'edu', label: 'VZD' },
] as const;

const COC_MAP_SKILLS = [
  { key: 'spot_hidden', name: 'Postřeh', combat: true },
  { key: 'listen', name: 'Naslouchání' },
  { key: 'dodge', name: 'Úhyb', combat: true },
  { key: 'fighting_brawl', name: 'Rvačka', combat: true },
  { key: 'firearms_handgun', name: 'Pistole', combat: true },
  { key: 'firearms_rifle', name: 'Puška', combat: true },
  { key: 'stealth', name: 'Plížení' },
  { key: 'first_aid', name: 'První pomoc' },
  { key: 'psychology', name: 'Psychologie' },
  { key: 'library_use', name: 'Knihovna' },
  { key: 'occult', name: 'Okultismus' },
  { key: 'cthulhu_mythos', name: 'Mýtus Cthulhu', mythos: true },
  { key: 'persuade', name: 'Přesvědčování' },
  { key: 'fast_talk', name: 'Ukecávání' },
  { key: 'navigate', name: 'Navigace' },
  { key: 'medicine', name: 'Lékařství' },
] as const;

const STATUS_FLAGS = [
  { key: 'temp_insanity', label: 'Doč. šílenství' },
  { key: 'indef_insanity', label: 'Neurč. šílenství' },
  { key: 'major_wound', label: 'Těžké zranění' },
  { key: 'unconscious', label: 'Bezvědomí' },
  { key: 'dying', label: 'Umírá' },
] as const;

const DEBOUNCE_MS = 500;

interface CocWeapon {
  name: string;
  skill: string;
  dmg: string;
  attacks?: string;
  range?: string;
  ammo?: string;
  malf?: string;
}

// ── Props ─────────────────────────────────────────────────────────────

export interface CocCombatPanelProps {
  token: MapToken;
  sceneId: string;
  worldId: string;
  canEdit: boolean;
  onRoll?: (req: {
    label: string;
    /** CoC: cíl % dovednosti/vlastnosti (roll „pod cíl"). */
    target?: number;
    /** Iniciativa (OBR) = plochá hodnota bez hodu. */
    modifier?: number;
    kind: 'd100' | 'flat';
    initiative?: boolean;
  }) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────

function gString(
  cd: Record<string, unknown>,
  key: string,
  fallback = '',
): string {
  const v = cd[`coc_${key}`];
  if (v === undefined || v === null) return fallback;
  return String(v);
}

function gBool(cd: Record<string, unknown>, key: string): boolean {
  const v = cd[`coc_${key}`];
  return v === true || v === 'true';
}

function gNum(cd: Record<string, unknown>, key: string): number | null {
  const n = parseInt(gString(cd, key), 10);
  return Number.isFinite(n) ? n : null;
}

function parseWeapons(cd: Record<string, unknown>): CocWeapon[] {
  const raw = cd['coc_weapons'];
  if (Array.isArray(raw)) return raw as CocWeapon[];
  if (typeof raw === 'string') {
    try {
      const parsed: unknown = JSON.parse(raw || '[]');
      return Array.isArray(parsed) ? (parsed as CocWeapon[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function pct(cur: number | null, max: number | null): number {
  if (cur == null || max == null || max <= 0) return 0;
  return Math.max(0, Math.min(100, (cur / max) * 100));
}

// ── Komponenta ────────────────────────────────────────────────────────

export function CocCombatPanel({
  token,
  worldId,
  canEdit,
  onRoll,
}: CocCombatPanelProps): React.ReactElement {
  const { data: diary, isLoading } = useCharacterDiary(
    worldId,
    token.characterSlug,
  );
  const updateDiary = useUpdateCharacterDiary(worldId, token.characterSlug);
  const qc = useQueryClient();

  const cd: Record<string, unknown> = diary?.customData ?? {};

  // Token HP bar na mapě čte `token.characterData.customData.coc_hp_cur`
  // (BE enrich snapshot ze spawnu), který deníková mutace neobnoví → zelený
  // bar zamrzne na staré hodnotě. Optimisticky propíšeme HP do scény cache, ať
  // token reaguje hned (8.7u-fix4). Jen na mapě (scéna existuje); v chatu no-op.
  // Deník zůstává zdrojem pravdy — snapshot se dorovná při příštím refetchi.
  function syncTokenHp(value: string): void {
    const sceneKey = mapSceneQueryKey(worldId);
    const scene = qc.getQueryData<MapScene | null>(sceneKey);
    if (!scene) return;
    const tk = scene.tokens.find((t) => t.id === token.id);
    if (!tk) return;
    const nextCharData = {
      ...(tk.characterData ?? {}),
      customData: {
        ...(tk.characterData?.customData ?? {}),
        coc_hp_cur: value,
      },
    };
    qc.setQueryData(
      sceneKey,
      applyOperationToScene(scene, {
        type: 'token.update',
        tokenId: token.id,
        patch: { characterData: nextCharData } as Partial<MapToken>,
      }),
    );
  }

  const [hpDraft, setHpDraft] = useState('0');
  const [sanDraft, setSanDraft] = useState('0');
  const [mpDraft, setMpDraft] = useState('0');
  const [luckDraft, setLuckDraft] = useState('0');

  const hpFocus = useRef(false);
  const sanFocus = useRef(false);
  const mpFocus = useRef(false);
  const luckFocus = useRef(false);

  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (!hpFocus.current) setHpDraft(gString(cd, 'hp_cur', '0'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cd['coc_hp_cur']]);
  useEffect(() => {
    if (!sanFocus.current) setSanDraft(gString(cd, 'san_cur', '0'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cd['coc_san_cur']]);
  useEffect(() => {
    if (!mpFocus.current) setMpDraft(gString(cd, 'mp_cur', '0'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cd['coc_mp_cur']]);
  useEffect(() => {
    if (!luckFocus.current) setLuckDraft(gString(cd, 'luck_cur', '0'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cd['coc_luck_cur']]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      Object.values(timers).forEach((t) => clearTimeout(t));
    };
  }, []);

  function debouncedPatch(key: string, value: unknown): void {
    if (!canEdit) return;
    const fullKey = `coc_${key}`;
    if (timersRef.current[fullKey]) clearTimeout(timersRef.current[fullKey]);
    timersRef.current[fullKey] = setTimeout(() => {
      updateDiary.mutate(
        { customDataPatch: { [fullKey]: value } },
        { onError: () => toast.error('Uložení selhalo') },
      );
      delete timersRef.current[fullKey];
    }, DEBOUNCE_MS);
  }

  function immediatePatch(key: string, value: unknown): void {
    if (!canEdit) return;
    updateDiary.mutate(
      { customDataPatch: { [`coc_${key}`]: value } },
      { onError: () => toast.error('Uložení selhalo') },
    );
  }

  /** Hod „pod cíl" (dovednost / vlastnost / zbraň). */
  function rollTarget(label: string, target: number): void {
    onRoll?.({ label, target, kind: 'd100' });
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
        <div className={styles.empty}>Deník není k dispozici.</div>
      </div>
    );
  }

  const weapons = parseWeapons(cd);
  const hpMax = gNum(cd, 'hp_max');
  const sanMax = gNum(cd, 'san_start');
  const dexReg = gNum(cd, 'dex_reg');
  // Rvačka (default útok beze zbraně) — vždy dostupná. Cíl = wpn0_skill, jinak
  // dovednost Boj zblízka (Rvačka).
  const brawlName = gString(cd, 'wpn0_name', 'Rvačka') || 'Rvačka';
  const brawlSkill = gNum(cd, 'wpn0_skill') ?? gNum(cd, 'sk_fighting_brawl_reg');
  const brawlDmg = gString(cd, 'wpn0_dmg', '1K3 + BZ') || '1K3 + BZ';

  // ── Vital bar renderer (HP / SAN — bar + ±) ──────────────────────

  function vitalBar(
    variant: 'hp' | 'san',
    label: string,
    draft: string,
    setDraft: (v: string) => void,
    focusRef: React.MutableRefObject<boolean>,
    curKey: string,
    maxLabel: string,
    max: number | null,
  ): React.ReactElement {
    // Bar čte DRAFT (živá hodnota), ne server cur → ± / typing se projeví hned,
    // ne až po refetchi (8.7u-fix1).
    const draftNum = parseInt(draft, 10);
    const barCur = Number.isFinite(draftNum) ? draftNum : null;
    function adjust(delta: number): void {
      if (!canEdit) return;
      const base = parseInt(draft, 10) || 0;
      const next = Math.max(0, max != null ? Math.min(max, base + delta) : base + delta);
      setDraft(String(next));
      debouncedPatch(curKey, String(next));
      if (curKey === 'hp_cur') syncTokenHp(String(next));
    }
    return (
      <div className={`${styles.vital} ${styles[variant]}`}>
        <div className={styles.vitalTop}>
          <span className={styles.vitalLabel}>{label}</span>
          <span className={styles.vitalNum}>
            {draft}
            <small> / {max ?? '?'}</small>
          </span>
        </div>
        <div className={styles.vitalBar}>
          <i
            className={styles.vitalBarFill}
            style={{ width: `${pct(barCur, max)}%` }}
          />
        </div>
        <div className={styles.vitalPm}>
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => adjust(-1)}
            aria-label={`${label} −1`}
          >
            −
          </button>
          <input
            type="text"
            inputMode="numeric"
            pattern="\d*"
            className={styles.vitalInput}
            value={draft}
            onChange={(e) => {
              if (!canEdit) return;
              const v = e.target.value;
              if (/^\d*$/.test(v)) {
                setDraft(v);
                debouncedPatch(curKey, v || '0');
                if (curKey === 'hp_cur') syncTokenHp(v || '0');
              }
            }}
            onFocus={() => {
              focusRef.current = true;
            }}
            onBlur={() => {
              focusRef.current = false;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            readOnly={!canEdit}
            autoComplete="off"
            aria-label={maxLabel}
          />
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => adjust(1)}
            aria-label={`${label} +1`}
          >
            +
          </button>
        </div>
      </div>
    );
  }

  function minVital(
    variant: 'mp' | 'luck',
    label: string,
    draft: string,
    setDraft: (v: string) => void,
    focusRef: React.MutableRefObject<boolean>,
    curKey: string,
    maxKey: string | null,
    ariaLabel: string,
  ): React.ReactElement {
    return (
      <div className={`${styles.minVital} ${styles[variant]}`}>
        <span className={styles.minLabel}>{label}</span>
        <span className={styles.minNums}>
          <input
            type="text"
            inputMode="numeric"
            pattern="\d*"
            className={styles.minInput}
            value={draft}
            onChange={(e) => {
              if (!canEdit) return;
              const v = e.target.value;
              if (/^\d*$/.test(v)) {
                setDraft(v);
                debouncedPatch(curKey, v || '0');
              }
            }}
            onFocus={() => {
              focusRef.current = true;
            }}
            onBlur={() => {
              focusRef.current = false;
            }}
            readOnly={!canEdit}
            autoComplete="off"
            aria-label={ariaLabel}
          />
          {maxKey && (
            <span className={styles.minMax}>/ {gString(cd, maxKey, '?')}</span>
          )}
        </span>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {/* ═══ VITALS ═══ */}
      <div className={styles.vitalsRow}>
        {vitalBar(
          'hp',
          'Životy',
          hpDraft,
          setHpDraft,
          hpFocus,
          'hp_cur',
          'Aktuální životy',
          hpMax,
        )}
        {vitalBar(
          'san',
          'Příčetnost',
          sanDraft,
          setSanDraft,
          sanFocus,
          'san_cur',
          'Aktuální příčetnost',
          sanMax,
        )}
      </div>
      <div className={styles.minRow}>
        {minVital('mp', 'Magie', mpDraft, setMpDraft, mpFocus, 'mp_cur', 'mp_max', 'Aktuální magie')}
        {minVital('luck', 'Štěstí', luckDraft, setLuckDraft, luckFocus, 'luck_cur', null, 'Aktuální štěstí')}
      </div>

      {/* ═══ STATUS PEČETI ═══ */}
      <div className={styles.seals}>
        {STATUS_FLAGS.map((flag) => {
          const active = gBool(cd, flag.key);
          return (
            <button
              key={flag.key}
              type="button"
              className={`${styles.seal} ${active ? styles.sealOn : ''}`}
              disabled={!canEdit}
              onClick={() => immediatePatch(flag.key, String(!active))}
              aria-pressed={active}
            >
              {flag.label}
            </button>
          );
        })}
      </div>

      {/* ═══ VLASTNOSTI (klik = hod) ═══ */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          Vlastnosti · hod
          <button
            type="button"
            className={styles.initBtn}
            disabled={!onRoll || dexReg == null}
            onClick={() =>
              dexReg != null &&
              onRoll?.({
                label: 'Iniciativa',
                modifier: dexReg,
                kind: 'flat',
                initiative: true,
              })
            }
            title="Iniciativa dle OBR (v CoC se nehází)"
            aria-label="Iniciativa"
          >
            Init ▶ {dexReg ?? '—'}
          </button>
        </div>
        <div className={styles.charsGrid}>
          {COC_CHARS.map((c) => {
            const val = gNum(cd, `${c.key}_reg`);
            const clickable = !!onRoll && val != null;
            return (
              <button
                key={c.key}
                type="button"
                className={styles.charChip}
                disabled={!clickable}
                onClick={() => val != null && rollTarget(c.label, val)}
                title={clickable ? `Hod 1k100 vs ${val} %` : 'Bez hodnoty'}
                aria-label={`Hod ${c.label}`}
              >
                <span className={styles.charKey}>{c.label}</span>
                <span className={styles.charVal}>{val ?? '—'}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ DOVEDNOSTI (klik = hod) ═══ */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Dovednosti · hod</div>
        <div className={styles.skillsGrid}>
          {COC_MAP_SKILLS.map((sk) => {
            const val = gNum(cd, `sk_${sk.key}_reg`);
            const clickable = !!onRoll && val != null;
            const cls = [
              styles.skill,
              'combat' in sk && sk.combat ? styles.skillCombat : '',
              'mythos' in sk && sk.mythos ? styles.skillMythos : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <button
                key={sk.key}
                type="button"
                className={cls}
                disabled={!clickable}
                onClick={() => val != null && rollTarget(sk.name, val)}
                title={clickable ? `Hod 1k100 vs ${val} %` : 'Bez hodnoty'}
                aria-label={`Hod ${sk.name}`}
              >
                <span className={styles.skillName}>{sk.name}</span>
                <span className={styles.skillVal}>{val ?? '—'}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ ZBRANĚ (vždy vč. Rvačky) ═══ */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Zbraně</div>
        {/* Default útok beze zbraně — Rvačka */}
        <div className={styles.weaponRow}>
          <span className={styles.weaponName}>{brawlName}</span>
          <button
            type="button"
            className={styles.weaponSkill}
            disabled={!onRoll || brawlSkill == null}
            onClick={() =>
              brawlSkill != null && rollTarget(brawlName, brawlSkill)
            }
            aria-label={`Hod útok ${brawlName}`}
          >
            {brawlSkill ?? '—'}
          </button>
          <span className={styles.weaponDmg}>{brawlDmg}</span>
        </div>
        {weapons.map((w, i) => {
          const skillNum = parseInt(w.skill ?? '', 10);
          const name = w.name || `Zbraň ${i + 1}`;
          const clickable =
            !!onRoll && Number.isFinite(skillNum) && skillNum > 0;
          return (
            <div key={i} className={styles.weaponRow}>
              <span className={styles.weaponName}>{name}</span>
              <button
                type="button"
                className={styles.weaponSkill}
                disabled={!clickable}
                onClick={() => clickable && rollTarget(name, skillNum)}
                aria-label={`Hod útok ${name}`}
              >
                {w.skill || '—'}
              </button>
              <span className={styles.weaponDmg}>{w.dmg || '—'}</span>
            </div>
          );
        })}
      </div>

      {/* ═══ BOJ — odvozené ═══ */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Boj</div>
        <div className={styles.derived}>
          <div className={styles.dBox}>
            <span className={styles.dKey}>Pohyb</span>
            <span className={styles.dVal}>{gString(cd, 'move', '—')}</span>
          </div>
          <div className={styles.dBox}>
            <span className={styles.dKey}>Stavba</span>
            <span className={styles.dVal}>{gString(cd, 'build', '—')}</span>
          </div>
          <div className={styles.dBox}>
            <span className={styles.dKey}>Úhyb</span>
            <span className={styles.dVal}>{gString(cd, 'dodge_reg', '—')}</span>
          </div>
          <div className={styles.dBox}>
            <span className={styles.dKey}>BZ</span>
            <span className={styles.dVal}>
              {gString(cd, 'damage_bonus', '—')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CocCombatPanel;
