/**
 * 10.2c-edit-9g — CoC kompaktní bojový panel pro TokenInfoPanel.
 *
 * Port 1:1 ze starého `C:/Matrix/Matrix/frontend/src/components/Map/
 * CocMapDiaryOverlay.tsx` (port flow z `useCharacterDiary` místo
 * `characterData` propu, debounced `useUpdateCharacterDiary().mutate
 * ({ customDataPatch })` místo `onCommit`).
 *
 * Vrstvy:
 *   1. Vitals: HP / Sanity / MP / Luck (editable, debounce 500ms; draft state
 *      proti server overwrite uprostřed typingu).
 *   2. Status badges: 5 toggle flagů (Doč/Neurč šílenství, Těžké zranění,
 *      Bezvědomí, Umírá). Klik → toggle (jen `canEdit`).
 *   3. Charakteristiky: 8 boxů readonly (STR/CON/DEX/INT/SIZ/POW/APP/EDU).
 *   4. Klíčové dovednosti: 16 řádků, hodnota klik = d100 roll vůči % targetu.
 *   5. Boj — derived: Pohyb / Stavba / Úhyb / BZ readonly.
 *
 * Permission gate: `canEdit=false` skryje inputy (readonly), nepustí toggle
 * statusů, nezobrazuje editovatelnost (skills zůstávají klikatelné, protože
 * roll je samostatná oprávnění → kontrolovaná přes přítomnost `onRoll`).
 *
 * CoC kostka: **d100** (`kind: 'd100'`) — `rollEngine` podporuje, není potřeba
 * fallback na d20. Modifier je % target hodnota (engine je generic dice +
 * modifier; toast zobrazí výsledek a hráč si interpretuje úspěch ručně).
 */
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useCharacterDiary } from '@/features/world/pages/api/useCharacterSubdocs';
import { useUpdateCharacterDiary } from '@/features/world/pages/api/useCharacterMutations';
import type { MapToken } from '../../../types';
import styles from './CocCombatPanel.module.css';

// ── Konstanty (1:1 port ze starého overlay) ──────────────────────────

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
  { key: 'spot_hidden', name: 'Postřeh' },
  { key: 'listen', name: 'Naslouchání' },
  { key: 'dodge', name: 'Úhyb' },
  { key: 'fighting_brawl', name: 'Rvačka' },
  { key: 'firearms_handgun', name: 'Pistole' },
  { key: 'firearms_rifle', name: 'Puška' },
  { key: 'stealth', name: 'Plížení' },
  { key: 'first_aid', name: 'První pomoc' },
  { key: 'psychology', name: 'Psychologie' },
  { key: 'library_use', name: 'Knihovna' },
  { key: 'occult', name: 'Okultismus' },
  { key: 'cthulhu_mythos', name: 'Mýtus Cthulhu' },
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

// ── Props (kontrakt s TokenInfoPanel / future TokenSystemSheet) ──────

export interface CocCombatPanelProps {
  token: MapToken;
  sceneId: string;
  worldId: string;
  canEdit: boolean;
  onRoll?: (req: {
    label: string;
    modifier: number;
    kind: 'fate' | 'd20' | 'd6' | 'd10' | 'd100';
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

  const cd: Record<string, unknown> = diary?.customData ?? {};

  // Drafts pro 4 vitals — drží lokální string mezi typingem aby
  // debounced mutace nezahodila rozepsanou hodnotu.
  const [hpDraft, setHpDraft] = useState('0');
  const [sanDraft, setSanDraft] = useState('0');
  const [mpDraft, setMpDraft] = useState('0');
  const [luckDraft, setLuckDraft] = useState('0');

  const hpFocus = useRef(false);
  const sanFocus = useRef(false);
  const mpFocus = useRef(false);
  const luckFocus = useRef(false);

  // Debounce timery (per-key) — jediný in-flight timer per pole.
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Sync drafts ← server, ale jen pokud uživatel pole needituje.
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

  // Cleanup timers na unmount.
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      Object.values(timers).forEach((t) => clearTimeout(t));
    };
  }, []);

  // Debounced patch — 500ms idle před PATCH.
  function debouncedPatch(key: string, value: unknown): void {
    if (!canEdit) return;
    const fullKey = `coc_${key}`;
    if (timersRef.current[fullKey]) {
      clearTimeout(timersRef.current[fullKey]);
    }
    timersRef.current[fullKey] = setTimeout(() => {
      updateDiary.mutate(
        { customDataPatch: { [fullKey]: value } },
        {
          onError: () => toast.error('Uložení selhalo'),
        },
      );
      delete timersRef.current[fullKey];
    }, DEBOUNCE_MS);
  }

  // Okamžitý patch (status toggle) — bez debounce.
  function immediatePatch(key: string, value: unknown): void {
    if (!canEdit) return;
    updateDiary.mutate(
      { customDataPatch: { [`coc_${key}`]: value } },
      {
        onError: () => toast.error('Uložení selhalo'),
      },
    );
  }

  // Skill roll — d100 vs target %.
  function rollSkill(skillName: string, percent: number): void {
    if (!onRoll) return;
    onRoll({
      label: skillName,
      modifier: percent,
      kind: 'd100',
    });
  }

  // ── Render: loading / empty ──────────────────────────────────────

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

  // ── Vital input renderer ─────────────────────────────────────────

  function vitalInput(
    draft: string,
    setDraft: (v: string) => void,
    focusRef: React.MutableRefObject<boolean>,
    commitKey: string,
    ariaLabel: string,
  ): React.ReactElement {
    return (
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
            debouncedPatch(commitKey, v || '0');
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
        aria-label={ariaLabel}
      />
    );
  }

  return (
    <div className={styles.root}>
      {/* ═══ VITALS ═══ */}
      <div className={styles.vitalsRow}>
        <div className={`${styles.vital} ${styles.vitalDanger}`}>
          <span className={styles.vitalLabel}>Životy</span>
          {vitalInput(hpDraft, setHpDraft, hpFocus, 'hp_cur', 'Aktuální životy')}
          <span className={styles.vitalMax}>
            / {gString(cd, 'hp_max', '?')}
          </span>
        </div>
        <div className={`${styles.vital} ${styles.vitalSanity}`}>
          <span className={styles.vitalLabel}>Příčetnost</span>
          {vitalInput(
            sanDraft,
            setSanDraft,
            sanFocus,
            'san_cur',
            'Aktuální příčetnost',
          )}
          <span className={styles.vitalMax}>
            / {gString(cd, 'san_start', '?')}
          </span>
        </div>
        <div className={styles.vital}>
          <span className={styles.vitalLabel}>Magie</span>
          {vitalInput(mpDraft, setMpDraft, mpFocus, 'mp_cur', 'Aktuální magie')}
          <span className={styles.vitalMax}>
            / {gString(cd, 'mp_max', '?')}
          </span>
        </div>
        <div className={styles.vital}>
          <span className={styles.vitalLabel}>Štěstí</span>
          {vitalInput(
            luckDraft,
            setLuckDraft,
            luckFocus,
            'luck_cur',
            'Aktuální štěstí',
          )}
        </div>
      </div>

      {/* ═══ STATUS BADGES ═══ */}
      <div className={styles.statusRow}>
        {STATUS_FLAGS.map((flag) => {
          const active = gBool(cd, flag.key);
          const cls = `${styles.statusBadge} ${active ? styles.statusBadgeActive : ''}`;
          return (
            <button
              key={flag.key}
              type="button"
              className={cls}
              disabled={!canEdit}
              onClick={() => immediatePatch(flag.key, String(!active))}
              aria-pressed={active}
            >
              {flag.label}
            </button>
          );
        })}
      </div>

      {/* ═══ CHARACTERISTICS ═══ */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Vlastnosti</div>
        <div className={styles.charsGrid}>
          {COC_CHARS.map((c) => (
            <div key={c.key} className={styles.charBox}>
              <div className={styles.charLabel}>{c.label}</div>
              <div className={styles.charVal}>
                {gString(cd, `${c.key}_reg`, '—')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ KEY SKILLS ═══ */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Klíčové dovednosti</div>
        <div className={styles.skillsList}>
          {COC_MAP_SKILLS.map((sk) => {
            const valStr = gString(cd, `sk_${sk.key}_reg`, '');
            const valNum = parseInt(valStr, 10);
            const hasValue = valStr !== '' && !Number.isNaN(valNum);
            const clickable = !!onRoll && hasValue;
            const cls = `${styles.skillVal} ${clickable ? styles.skillValClickable : ''}`;
            return (
              <div key={sk.key} className={styles.skillRow}>
                <span className={styles.skillName}>{sk.name}</span>
                <button
                  type="button"
                  className={cls}
                  disabled={!clickable}
                  onClick={() => clickable && rollSkill(sk.name, valNum)}
                  title={
                    clickable ? `Hod d100 vs ${valStr} %` : 'Není nastavena hodnota'
                  }
                  aria-label={`Hod ${sk.name}`}
                >
                  {hasValue ? valStr : '—'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ WEAPONS ═══ */}
      {weapons.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Zbraně</div>
          {weapons.map((w, i) => {
            const skillNum = parseInt(w.skill ?? '', 10);
            const skillClickable =
              !!onRoll && !Number.isNaN(skillNum) && skillNum > 0;
            return (
              <div key={i} className={styles.weaponRow}>
                <span className={styles.weaponName}>
                  {w.name || `Zbraň ${i + 1}`}
                </span>
                <button
                  type="button"
                  className={styles.weaponSkill}
                  disabled={!skillClickable}
                  onClick={() =>
                    skillClickable &&
                    rollSkill(w.name || `Zbraň ${i + 1}`, skillNum)
                  }
                  aria-label={`Hod útok ${w.name || `Zbraň ${i + 1}`}`}
                >
                  {w.skill || '—'}
                </button>
                <span className={styles.weaponDmg}>{w.dmg || '—'}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ COMBAT DERIVED ═══ */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Boj</div>
        <div className={styles.combatDerived}>
          <div className={styles.charBox}>
            <div className={styles.charLabel}>Pohyb</div>
            <div className={styles.charVal}>{gString(cd, 'move', '—')}</div>
          </div>
          <div className={styles.charBox}>
            <div className={styles.charLabel}>Stavba</div>
            <div className={styles.charVal}>{gString(cd, 'build', '—')}</div>
          </div>
          <div className={styles.charBox}>
            <div className={styles.charLabel}>Úhyb</div>
            <div className={styles.charVal}>
              {gString(cd, 'dodge_reg', '—')}
            </div>
          </div>
          <div className={styles.charBox}>
            <div className={styles.charLabel}>BZ</div>
            <div className={styles.charVal}>
              {gString(cd, 'damage_bonus', '—')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CocCombatPanel;
