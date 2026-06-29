/**
 * 8.7q (fáze A) — JaD (Jeskyně a draci = český DnD 5e) kompaktní bojový panel.
 *
 * Vzor `DndCombatPanel` (stejná k20 mechanika), data z deníku přes
 * `token.characterSlug`, prefix `dnd_*`, formule z `jad/formulas.ts`.
 * Klik = `onRoll({ kind:'d20', modifier })` → 3D overlay + dice log (parent).
 *
 * Sekce: Staty (HP/OČ/Iniciativa/Rychlost/SO) · Vlastnosti (k20 + ZH) ·
 * jen aktivní Dovednosti · Zbraně · sbalitelné Zdatnosti/Jazyky/Schopnosti.
 * Fatální úspěch/neúspěch (B) a skládaný zásah (C) = navazující fáze.
 */
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useCharacterDiary } from '@/features/world/pages/api/useCharacterSubdocs';
import { useUpdateCharacterDiary } from '@/features/world/pages/api/useCharacterMutations';
import type { SystemSheetProps } from '@/features/world/pages/CharacterDetailPage/diary-systems/types';
import {
  ABIL_MAP,
  SKILLS,
  type DndClassRow,
  type DndFeat,
  type DndWeapon,
} from '@/features/world/pages/CharacterDetailPage/diary-systems/sheets/dnd5e/constants';
import {
  calcMod,
  calcSaveMod,
  calcSkillMod,
  fmtMod,
  parseDamageFormula,
} from '@/features/world/pages/CharacterDetailPage/diary-systems/sheets/dnd5e/formulas';
import type { MapToken } from '../../../types';
import styles from './DndCombatPanel.module.css';

interface Props {
  token: MapToken;
  sceneId: string;
  worldId: string;
  canEdit: boolean;
  onRoll?: SystemSheetProps['onRoll'];
}

const getStr = (
  cd: Record<string, unknown>,
  key: string,
  fallback = '',
): string => {
  const v = cd[`dnd_${key}`];
  return v === undefined || v === null ? fallback : String(v);
};
const getInt = (
  cd: Record<string, unknown>,
  key: string,
  fallback = 0,
): number => {
  const n = parseInt(getStr(cd, key, String(fallback)), 10);
  return Number.isFinite(n) ? n : fallback;
};
function parseJson<T>(cd: Record<string, unknown>, key: string): T[] {
  const raw = cd[`dnd_${key}`];
  if (Array.isArray(raw)) return raw as T[];
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw || '[]');
      return Array.isArray(p) ? (p as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** Krátký popis multipovolání: „Bojovník 3 / Tulák 2". */
function classSummary(rows: DndClassRow[]): string {
  return rows
    .filter((r) => r.c)
    .map((r) => `${r.c}${r.l ? ` ${r.l}` : ''}`)
    .join(' / ');
}

export function DndCombatPanel({
  token,
  worldId,
  canEdit,
  onRoll,
}: Props): React.ReactElement {
  const { data: diary, isLoading } = useCharacterDiary(
    worldId,
    token.characterSlug,
  );
  const updateDiary = useUpdateCharacterDiary(worldId, token.characterSlug);

  // ── HP draft (focus-aware sync, commit na blur) ──────────────────────
  const cd0 = diary?.customData ?? {};
  const beHp = getStr(cd0, 'hpCur', '');
  const [hpDraft, setHpDraft] = useState(beHp);
  const hpFocus = useRef(false);
  useEffect(() => {
    if (!hpFocus.current) setHpDraft(beHp);
  }, [beHp]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );
  const save = (patch: Record<string, unknown>): void => {
    updateDiary.mutate(
      { customDataPatch: patch },
      { onError: () => toast.error('Uložení JaD deníku selhalo') },
    );
  };

  if (isLoading) {
    return (
      <div className={styles.root}>
        <div className={styles.muted}>Načítání deníku…</div>
      </div>
    );
  }
  if (!diary) {
    return (
      <div className={styles.root}>
        <div className={styles.muted}>Deník postavy není dostupný.</div>
      </div>
    );
  }

  const cd = diary.customData ?? {};
  const profBonus = getInt(cd, 'profBonus', 2);
  const getScore = (k: string) => getInt(cd, `abi_${k}`, 10);
  const getModFor = (k: string) => calcMod(getScore(k));
  const isSaveProf = (k: string) => getStr(cd, `save_${k}`) === '1';
  const saveModFor = (k: string) =>
    calcSaveMod(getModFor(k), isSaveProf(k), profBonus);
  const skillProf = (n: string) => getInt(cd, `skill_${n}`, 0);
  const skillModFor = (n: string, a: string) =>
    calcSkillMod(getModFor(a), skillProf(n), profBonus);

  const dexMod = getModFor('dex');
  // Vizuální HP pruh (kolik životů zbývá) — barva dle zdraví.
  const hpCurNum = parseInt(hpDraft || '0', 10) || 0;
  const hpMaxNum = parseInt(getStr(cd0, 'hpMax', '0'), 10) || 0;
  const hpPct =
    hpMaxNum > 0 ? Math.max(0, Math.min(100, (hpCurNum / hpMaxNum) * 100)) : 0;
  const classRows = parseJson<DndClassRow>(cd, 'classes');
  const totalLevel = classRows.reduce(
    (s, r) => s + (parseInt(r.l || '0', 10) || 0),
    0,
  );
  const weapons = parseJson<DndWeapon>(cd, 'weapons');
  const profs = parseJson<string>(cd, 'profs');
  const langs = parseJson<string>(cd, 'langs');
  const feats = parseJson<DndFeat>(cd, 'feats');
  const activeSkills = SKILLS.filter((s) => skillProf(s.n) > 0);
  const spellEnabled = getStr(cd, 'spellEnabled') === '1';

  const canRoll = !!onRoll && canEdit;
  // k20 hody JaD nesou fatální detekci (nat 20 = fatální úspěch, nat 1 = neúspěch).
  const roll = (label: string, modifier: number, initiative = false): void => {
    if (!canRoll) return;
    onRoll?.({
      label,
      modifier,
      kind: 'd20',
      critOnD20: true,
      ...(initiative && { initiative: true }),
    });
  };
  // Zásah = skládaný hod dle formule zbraně (`2k10+2k6+2k4+5`).
  const rollDamage = (
    label: string,
    dmg: { mixed: Record<string, number>; modifier: number },
  ): void => {
    if (!canRoll) return;
    onRoll?.({ label, kind: 'mixed', mixed: dmg.mixed, modifier: dmg.modifier });
  };

  const commitHp = (): void => {
    if (!canEdit) return;
    const cleaned = hpDraft.replace(/[^\d-]/g, '') || '0';
    save({ dnd_hpCur: cleaned });
  };
  const adjustHp = (delta: number): void => {
    if (!canEdit) return;
    const cur = parseInt(hpDraft || '0', 10) || 0;
    const next = String(cur + delta);
    setHpDraft(next);
    save({ dnd_hpCur: next });
  };

  return (
    <div className={styles.root} data-testid="dnd-combat-panel">
      {/* ── Hlavička: povolání + úroveň ── */}
      <div className={styles.header}>
        <span className={styles.profLine}>
          {classSummary(classRows) || 'Bez povolání'}
        </span>
        <span className={styles.levelBadge}>úr. {totalLevel}</span>
        {canRoll && (
          <button
            type="button"
            className={styles.initBtn}
            onClick={() => roll('Iniciativa', dexMod, true)}
            title={`Iniciativa (k20 ${fmtMod(dexMod)})`}
          >
            ⚡ Iniciativa {fmtMod(dexMod)}
          </button>
        )}
      </div>

      {/* ── Staty ── */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.accent}`}>
          <span className={styles.statLabel}>Životy</span>
          <div className={styles.hpRow}>
            {canEdit && (
              <button
                type="button"
                className={styles.hpStep}
                onClick={() => adjustHp(-1)}
                aria-label="Ubrat život"
              >
                −
              </button>
            )}
            <input
              className={styles.hpInput}
              inputMode="numeric"
              value={hpDraft}
              readOnly={!canEdit}
              onChange={(e) => {
                if (canEdit) setHpDraft(e.target.value);
              }}
              onFocus={() => {
                hpFocus.current = true;
              }}
              onBlur={() => {
                hpFocus.current = false;
                commitHp();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              aria-label="Aktuální životy"
            />
            {canEdit && (
              <button
                type="button"
                className={styles.hpStep}
                onClick={() => adjustHp(1)}
                aria-label="Přidat život"
              >
                +
              </button>
            )}
          </div>
          <span className={styles.hpMax}>/ {getStr(cd, 'hpMax', '—')}</span>
          <div
            className={styles.hpBar}
            title={`${hpCurNum} / ${hpMaxNum || '—'} životů`}
          >
            <div
              className={styles.hpBarFill}
              style={{ width: `${hpPct}%` }}
            />
          </div>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>OČ</span>
          <span className={styles.statValue}>{getStr(cd, 'ac', '10')}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Iniciativa</span>
          <span className={styles.statValue}>{fmtMod(dexMod)}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Rychlost</span>
          <span className={`${styles.statValue} ${styles.small}`}>
            {getStr(cd, 'speed', '9 m')}
          </span>
        </div>
        {spellEnabled && (
          <div className={styles.statCard}>
            <span className={styles.statLabel}>SO kouzel</span>
            <span className={styles.statValue}>
              {getStr(cd, 'qc_ss_dc', '—')}
            </span>
          </div>
        )}
      </div>

      {/* ── Vlastnosti (k20) + ZH ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Vlastnosti</h3>
        <div className={styles.abilGrid}>
          {ABIL_MAP.map(({ k, l }) => {
            const mod = getModFor(k);
            const zh = saveModFor(k);
            return (
              <div key={k} className={styles.abilCard}>
                <button
                  type="button"
                  className={styles.abilMain}
                  disabled={!canRoll}
                  onClick={() => roll(l, mod)}
                  title={`Hodit ${l} (k20 ${fmtMod(mod)})`}
                >
                  <span className={styles.abilName}>
                    {l.slice(0, 3).toUpperCase()}
                  </span>
                  <span className={styles.abilMod}>{fmtMod(mod)}</span>
                </button>
                <button
                  type="button"
                  className={`${styles.zhBtn} ${isSaveProf(k) ? styles.proficient : ''}`}
                  disabled={!canRoll}
                  onClick={() => roll(`ZH ${l}`, zh)}
                  title={`Záchranný hod ${l} (k20 ${fmtMod(zh)})`}
                >
                  ZH {fmtMod(zh)}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Dovednosti (jen aktivní) ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Dovednosti</h3>
        {activeSkills.length === 0 ? (
          <div className={styles.muted}>Žádné aktivní dovednosti.</div>
        ) : (
          <div className={styles.skillList}>
            {activeSkills.map(({ n, a }) => {
              const mod = skillModFor(n, a);
              return (
                <button
                  key={n}
                  type="button"
                  className={styles.skillRow}
                  disabled={!canRoll}
                  onClick={() => roll(n, mod)}
                  title={`Hodit ${n} (k20 ${fmtMod(mod)})`}
                >
                  <span
                    className={`${styles.skillBubble} ${skillProf(n) === 2 ? styles.profFull : styles.profHalf}`}
                    aria-hidden
                  />
                  <span className={styles.skillBonus}>{fmtMod(mod)}</span>
                  <span className={styles.skillName}>{n}</span>
                  <span className={styles.skillAbil}>
                    ({a.toUpperCase()})
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Zbraně ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Zbraně</h3>
        {weapons.length === 0 ? (
          <div className={styles.muted}>Žádné zbraně v deníku.</div>
        ) : (
          weapons.map((w, i) => {
            const bonus = parseInt(String(w.b).replace(/[^\d-]/g, ''), 10);
            const bonusMod = Number.isFinite(bonus) ? bonus : 0;
            const dmg = parseDamageFormula(w.d);
            return (
              <div key={`${w.n}-${i}`} className={styles.weaponRow}>
                <span className={styles.weaponName}>{w.n || 'Bez názvu'}</span>
                <button
                  type="button"
                  className={styles.weaponAtk}
                  disabled={!canRoll}
                  onClick={() => roll(`Útok: ${w.n || 'zbraň'}`, bonusMod)}
                  title={`Útok ${w.n} (k20 ${fmtMod(bonusMod)})`}
                >
                  ⚔ {w.b || fmtMod(bonusMod)}
                </button>
                <button
                  type="button"
                  className={styles.weaponDmg}
                  disabled={!canRoll || !dmg}
                  onClick={() =>
                    dmg && rollDamage(`Zranění: ${w.n || 'zbraň'}`, dmg)
                  }
                  title={
                    dmg
                      ? `Hodit zranění ${w.d}`
                      : `Zásah „${w.d || ''}" není platná formule (např. 1k8+3)`
                  }
                >
                  {w.d || '—'}
                </button>
              </div>
            );
          })
        )}
      </section>

      {/* ── Sbalitelné: Zdatnosti / Jazyky / Schopnosti ── */}
      {profs.length > 0 && (
        <details className={styles.collapse}>
          <summary>Zdatnosti ({profs.length})</summary>
          <ul className={styles.tagList}>
            {profs.map((p, i) => (
              <li key={i}>{p || '—'}</li>
            ))}
          </ul>
        </details>
      )}
      {langs.length > 0 && (
        <details className={styles.collapse}>
          <summary>Jazyky ({langs.length})</summary>
          <ul className={styles.tagList}>
            {langs.map((p, i) => (
              <li key={i}>{p || '—'}</li>
            ))}
          </ul>
        </details>
      )}
      {feats.length > 0 && (
        <details className={styles.collapse}>
          <summary>Schopnosti ({feats.length})</summary>
          <div className={styles.featList}>
            {feats.map((f, i) => (
              <div key={i} className={styles.featItem}>
                {f.n && <strong>{f.n}</strong>}
                {f.d && <p>{f.d}</p>}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
