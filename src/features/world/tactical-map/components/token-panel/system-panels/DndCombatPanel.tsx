/**
 * 10.2c-edit-9h — D&D 5e kompaktní bojový panel pro TokenInfoPanel.
 *
 * 1:1 port `c:/Matrix/Matrix/frontend/src/components/Map/DndMapDiaryOverlay.tsx`
 * na Ikaros data model (customData prefix `dnd_*`). Liší se:
 *   - data source = `useCharacterDiary(worldId, token.characterSlug)` (ne prop)
 *   - edit save = debounced `useUpdateCharacterDiary().mutate({ customDataPatch })`
 *   - rolly = `onRoll({ label, modifier, kind: 'd20' })` (parent rozhodne, jak provést)
 *
 * Sekce (zachované ze starého overlay):
 *   1. STATY (HP/AC/Rychlost/Iniciativa/Spell DC)
 *   2. Death saves (jen `canEdit`)
 *   3. Atributy (STR/DEX/CON/INT/WIS/CHA) — readonly display
 *   4. Záchranné hody (klik = d20 roll)
 *   5. Dovednosti (klik = d20 roll s prof. bonus)
 *   6. Útoky (klik = d20 attack roll s bonus)
 *
 * Sekce vyřazené:
 *   - Spell sloty / kouzla — defer na full sheet (kombat UX irelevance)
 *   - Personality / features textareas (full sheet only)
 *   - Inspirace / hit dice (málo relevantní v live bojí; v full sheet)
 */
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  useCharacterDiary,
} from '@/features/world/pages/api/useCharacterSubdocs';
import { useUpdateCharacterDiary } from '@/features/world/pages/api/useCharacterMutations';
import {
  ABILITY_KEYS,
  ABILITY_LABELS,
  SKILLS,
  type AbilityKey,
  type DndAttack,
} from '@/features/world/pages/CharacterDetailPage/diary-systems/sheets/dnd5e/constants';
import type { MapToken } from '../../../types';
import styles from './DndCombatPanel.module.css';

interface Props {
  token: MapToken;
  sceneId: string;
  worldId: string;
  canEdit: boolean;
  onRoll?: (req: {
    label: string;
    modifier: number;
    kind: 'fate' | 'd20' | 'd6' | 'd10';
  }) => void;
}

const HP_DEBOUNCE_MS = 500;

const abilityMod = (score: number): number => Math.floor((score - 10) / 2);
const fmtMod = (m: number): string => (m >= 0 ? `+${m}` : `${m}`);

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
  const raw = getStr(cd, key, String(fallback));
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
};

function parseAttacks(cd: Record<string, unknown>): DndAttack[] {
  const raw = getStr(cd, 'attacks', '[]');
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DndAttack[]) : [];
  } catch {
    return [];
  }
}

export function DndCombatPanel({
  token,
  worldId,
  canEdit,
  onRoll,
}: Props): React.ReactElement {
  // sceneId není v této vrstvě potřeba (diary patch chodí přímo na character
  // endpoint, ne přes scene operations); ponecháno v Props pro signature consistency.
  const { data: diary, isLoading } = useCharacterDiary(
    worldId,
    token.characterSlug,
  );
  const updateDiary = useUpdateCharacterDiary(worldId, token.characterSlug);

  // ── Local HP draft (focus-aware sync; debounced save) ────────────────
  const initialCurrentHp = diary
    ? getStr(diary.customData ?? {}, 'currentHP', '0')
    : '0';
  const initialTempHp = diary
    ? getStr(diary.customData ?? {}, 'tempHP', '0')
    : '0';
  const [currentHpDraft, setCurrentHpDraft] = useState(initialCurrentHp);
  const [tempHpDraft, setTempHpDraft] = useState(initialTempHp);
  const currentHpFocusRef = useRef(false);
  const tempHpFocusRef = useRef(false);

  // Sync drafts z BE (jen pokud user není focused na input)
  const beCurrentHp = diary
    ? getStr(diary.customData ?? {}, 'currentHP', '0')
    : '0';
  const beTempHp = diary ? getStr(diary.customData ?? {}, 'tempHP', '0') : '0';

  useEffect(() => {
    if (!currentHpFocusRef.current) setCurrentHpDraft(beCurrentHp);
  }, [beCurrentHp]);

  useEffect(() => {
    if (!tempHpFocusRef.current) setTempHpDraft(beTempHp);
  }, [beTempHp]);

  // ── Debounced save helper ────────────────────────────────────────────
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleSave = (patch: Record<string, unknown>): void => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateDiary.mutate(
        { customDataPatch: patch },
        {
          onError: () => toast.error('Uložení D&D deníku selhalo'),
        },
      );
      debounceRef.current = null;
    }, HP_DEBOUNCE_MS);
  };

  const immediateSave = (patch: Record<string, unknown>): void => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    updateDiary.mutate(
      { customDataPatch: patch },
      {
        onError: () => toast.error('Uložení D&D deníku selhalo'),
      },
    );
  };

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  if (isLoading) {
    return (
      <div className={styles.root}>
        <div className={styles.loading}>Načítání deníku…</div>
      </div>
    );
  }
  if (!diary) {
    return (
      <div className={styles.root}>
        <div className={styles.empty}>Deník postavy není dostupný.</div>
      </div>
    );
  }

  const cd = diary.customData ?? {};
  const profBonus = getInt(cd, 'profBonus', 2);

  const getScore = (k: AbilityKey): number =>
    getInt(cd, `ability_${k}`, 10);
  const getAbilityModFor = (k: AbilityKey): number =>
    abilityMod(getScore(k));

  const isSaveProf = (k: AbilityKey): boolean =>
    getStr(cd, `save_prof_${k}`) === '1';
  const saveModFor = (k: AbilityKey): number => {
    const base = getAbilityModFor(k);
    return isSaveProf(k) ? base + profBonus : base;
  };

  const getSkillProf = (name: string): number =>
    getInt(cd, `skill_prof_${name}`, 0);
  const getSkillMod = (name: string, ability: AbilityKey): number => {
    const base = getAbilityModFor(ability);
    const prof = getSkillProf(name);
    if (prof === 2) return base + profBonus * 2;
    if (prof === 1) return base + profBonus;
    return base;
  };

  const attacks = parseAttacks(cd);
  const deathSuccess = getInt(cd, 'deathSuccess', 0);
  const deathFail = getInt(cd, 'deathFail', 0);

  // ── Roll helpers ─────────────────────────────────────────────────────
  const triggerRoll = (label: string, modifier: number): void => {
    if (!onRoll || !canEdit) return;
    onRoll({ label, modifier, kind: 'd20' });
  };

  const handleHpCommit = (
    key: 'currentHP' | 'tempHP',
    draftValue: string,
  ): void => {
    if (!canEdit) return;
    const cleaned = draftValue.replace(/\D/g, '') || '0';
    immediateSave({ [`dnd_${key}`]: cleaned });
  };

  const handleDeathPip = (
    type: 'deathSuccess' | 'deathFail',
    index: 1 | 2 | 3,
  ): void => {
    if (!canEdit) return;
    const current = type === 'deathSuccess' ? deathSuccess : deathFail;
    const next = current >= index ? index - 1 : index;
    immediateSave({ [`dnd_${type}`]: String(next) });
  };

  const dexMod = getAbilityModFor('dex');

  return (
    <div className={styles.root} data-testid="dnd-combat-panel">
      {/* ═══ 1. STATY ═══ */}
      <section className={styles.section}>
        <div className={styles.sectionTitleRow}>
          <h3 className={styles.sectionTitle}>Staty</h3>
          {canEdit && onRoll && (
            <button
              type="button"
              className={styles.initiativeBtn}
              onClick={() => triggerRoll('Iniciativa', dexMod)}
              title={`Hodit iniciativu (1d20 ${fmtMod(dexMod)})`}
            >
              ⚡ Iniciativa {fmtMod(dexMod)}
            </button>
          )}
        </div>

        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.accent}`}>
            <span className={styles.statLabel}>Aktuální HP</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="\d*"
              className={styles.hpInput}
              value={currentHpDraft}
              onChange={(e) => {
                if (!canEdit) return;
                const v = e.target.value;
                if (/^\d*$/.test(v)) setCurrentHpDraft(v);
              }}
              onFocus={() => {
                currentHpFocusRef.current = true;
              }}
              onBlur={() => {
                currentHpFocusRef.current = false;
                handleHpCommit('currentHP', currentHpDraft);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter')
                  (e.target as HTMLInputElement).blur();
              }}
              readOnly={!canEdit}
              autoComplete="off"
              aria-label="Aktuální životy"
            />
            <span className={styles.hpMax}>/ {getStr(cd, 'maxHP', '0')}</span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statLabel}>Dočasné HP</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="\d*"
              className={styles.hpInput}
              value={tempHpDraft}
              onChange={(e) => {
                if (!canEdit) return;
                const v = e.target.value;
                if (/^\d*$/.test(v)) setTempHpDraft(v);
              }}
              onFocus={() => {
                tempHpFocusRef.current = true;
              }}
              onBlur={() => {
                tempHpFocusRef.current = false;
                handleHpCommit('tempHP', tempHpDraft);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter')
                  (e.target as HTMLInputElement).blur();
              }}
              readOnly={!canEdit}
              autoComplete="off"
              aria-label="Dočasné životy"
            />
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
            <span className={`${styles.statValue} ${styles.statValueSmall}`}>
              {getStr(cd, 'speed', '9 m')}
            </span>
          </div>

          {getStr(cd, 'spellEnabled') === '1' && (
            <div className={styles.statCard}>
              <span className={styles.statLabel}>SO kouzel</span>
              <span className={styles.statValue}>
                {getStr(cd, 'spellDC', '—')}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ═══ 2. Death saves (jen edit) ═══ */}
      {canEdit && (
        <section className={styles.section}>
          <div className={styles.sectionTitleRow}>
            <h3 className={styles.sectionTitle}>Záchrany proti smrti</h3>
          </div>
          <div className={styles.deathRow}>
            <span>Úspěchy</span>
            <div className={styles.deathPips}>
              {[1, 2, 3].map((i) => (
                <button
                  key={`s${i}`}
                  type="button"
                  className={`${styles.deathPip} ${styles.success} ${
                    deathSuccess >= i ? styles.filled : ''
                  }`}
                  onClick={() =>
                    handleDeathPip('deathSuccess', i as 1 | 2 | 3)
                  }
                  aria-label={`Úspěch ${i} z 3`}
                />
              ))}
            </div>
          </div>
          <div className={styles.deathRow}>
            <span>Neúspěchy</span>
            <div className={styles.deathPips}>
              {[1, 2, 3].map((i) => (
                <button
                  key={`f${i}`}
                  type="button"
                  className={`${styles.deathPip} ${styles.fail} ${
                    deathFail >= i ? styles.filled : ''
                  }`}
                  onClick={() => handleDeathPip('deathFail', i as 1 | 2 | 3)}
                  aria-label={`Neúspěch ${i} z 3`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ 3. Saving throws ═══ */}
      <section className={styles.section}>
        <div className={styles.sectionTitleRow}>
          <h3 className={styles.sectionTitle}>Záchranné hody</h3>
        </div>
        <div className={styles.savesGrid}>
          {ABILITY_KEYS.map((k) => {
            const mod = saveModFor(k);
            const prof = isSaveProf(k);
            return (
              <button
                key={k}
                type="button"
                className={`${styles.saveCard} ${prof ? styles.proficient : ''}`}
                disabled={!canEdit || !onRoll}
                onClick={() =>
                  triggerRoll(`Záchrana ${ABILITY_LABELS[k]}`, mod)
                }
                title={
                  canEdit && onRoll
                    ? `Hodit záchranu ${ABILITY_LABELS[k]} (1d20 ${fmtMod(mod)})`
                    : ABILITY_LABELS[k]
                }
                aria-label={`Záchrana ${ABILITY_LABELS[k]} ${fmtMod(mod)}`}
              >
                <span className={styles.saveLabel}>
                  {ABILITY_LABELS[k].slice(0, 3)}
                </span>
                <span className={styles.saveMod}>{fmtMod(mod)}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ═══ 4. Skills ═══ */}
      <section className={styles.section}>
        <div className={styles.sectionTitleRow}>
          <h3 className={styles.sectionTitle}>Dovednosti</h3>
        </div>
        <div className={styles.skillsList}>
          {SKILLS.map((sk) => {
            const prof = getSkillProf(sk.name);
            const mod = getSkillMod(sk.name, sk.ability);
            const bubbleCls =
              prof === 2
                ? styles.profFull
                : prof === 1
                  ? styles.profHalf
                  : '';
            return (
              <button
                key={sk.name}
                type="button"
                className={styles.skillRow}
                disabled={!canEdit || !onRoll}
                onClick={() => triggerRoll(sk.name, mod)}
                title={
                  canEdit && onRoll
                    ? `Hodit ${sk.name} (1d20 ${fmtMod(mod)})`
                    : sk.name
                }
              >
                <span
                  className={`${styles.skillBubble} ${bubbleCls}`}
                  aria-hidden
                />
                <span className={styles.skillBonus}>{fmtMod(mod)}</span>
                <span className={styles.skillName}>{sk.name}</span>
                <span className={styles.skillAbility}>
                  ({ABILITY_LABELS[sk.ability].slice(0, 3)})
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ═══ 5. Attacks ═══ */}
      <section className={styles.section}>
        <div className={styles.sectionTitleRow}>
          <h3 className={styles.sectionTitle}>Útoky</h3>
        </div>
        {attacks.length === 0 ? (
          <div className={styles.actionEmpty}>Žádné útoky v deníku.</div>
        ) : (
          attacks.map((atk, i) => {
            const bonusNum = parseInt(String(atk.bonus).replace(/[^\d-]/g, ''), 10);
            const bonusMod = Number.isFinite(bonusNum) ? bonusNum : 0;
            return (
              <button
                key={`${atk.name}-${i}`}
                type="button"
                className={styles.actionRow}
                disabled={!canEdit || !onRoll}
                onClick={() =>
                  triggerRoll(
                    `Útok: ${atk.name || 'bez názvu'}`,
                    bonusMod,
                  )
                }
                title={
                  canEdit && onRoll
                    ? `Hodit útok ${atk.name} (1d20 ${fmtMod(bonusMod)}) — zranění ${atk.damage}`
                    : atk.name
                }
              >
                <span className={styles.actionName}>
                  {atk.name || 'Bez názvu'}
                </span>
                <span className={styles.actionBonus}>
                  {atk.bonus || fmtMod(bonusMod)}
                </span>
                <span className={styles.actionDamage}>
                  {atk.damage || '—'}
                </span>
              </button>
            );
          })
        )}
      </section>
    </div>
  );
}
