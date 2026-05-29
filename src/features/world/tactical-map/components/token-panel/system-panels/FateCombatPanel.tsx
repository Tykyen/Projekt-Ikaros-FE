/**
 * 10.2c-edit-9h — Fate kompaktní bojový panel pro TokenInfoPanel.
 *
 * 1:1 port `C:/Matrix/Matrix/frontend/src/components/Map/FateMapDiaryOverlay.tsx`
 * do Ikaros data modelu (customData prefix `fate_*`). Cíl: kompaktní statblok pro
 * boj (aspekty, konflikt/stres, dovednosti s pip trackerem a 4dF rollem), bez
 * RP sekcí (cíle / deník) — ty zůstávají v plném DiaryTab.
 *
 * Vzor: `MatrixCombatPanel.module.css` (synthwave) → tady jemnější amber/sand
 * akcent (Fate vibe). Persist přes `useUpdateCharacterDiary` s 500ms debounce.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useCharacterDiary } from '@/features/world/pages/api/useCharacterSubdocs';
import { useUpdateCharacterDiary } from '@/features/world/pages/api/useCharacterMutations';
import type { MapToken } from '../../../types';
import styles from './FateCombatPanel.module.css';

// ────────────────────────────────────────────────────────────────────────
// Typy
// ────────────────────────────────────────────────────────────────────────

interface AspectRow {
  name: string;
}

interface SkillRow {
  name: string;
  val: string; // 0..6
  note?: string;
}

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

// ────────────────────────────────────────────────────────────────────────
// Stres / konflikt — Fate uses 5-state lineární tracker (V pořádku → Vyřazen).
// Mapping 1:1 z FateMapDiaryOverlay.renderConflictTrack().
// ────────────────────────────────────────────────────────────────────────

const STRESS_STATES: Array<{
  id: number;
  label: string;
  variant: 'normal' | 'warning' | 'danger' | 'critical';
}> = [
  { id: 0, label: 'V pořádku', variant: 'normal' },
  { id: 1, label: 'Lehké zranění', variant: 'warning' },
  { id: 2, label: 'Těžší zranění', variant: 'danger' },
  { id: 3, label: 'Vážnější násl.', variant: 'critical' },
  { id: 4, label: 'Vyřazen', variant: 'critical' },
];

const MAX_PIPS = 6;

// ────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────

function safeParseArr<T>(raw: unknown): T[] {
  if (typeof raw !== 'string' || !raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function readStr(cd: Record<string, unknown>, key: string): string {
  const v = cd[key];
  return typeof v === 'string' ? v : '';
}

// ────────────────────────────────────────────────────────────────────────
// Komponenta
// ────────────────────────────────────────────────────────────────────────

export function FateCombatPanel({
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

  // Local optimistic state pro inputy (debounce write na BE)
  const [localPatch, setLocalPatch] = useState<Record<string, string>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Aktuální data merged: BE diary + localPatch overlay
  const cd = useMemo(() => {
    const base = (diary?.customData ?? {}) as Record<string, unknown>;
    return { ...base, ...localPatch };
  }, [diary, localPatch]);

  const aspects = useMemo<AspectRow[]>(
    () => safeParseArr<AspectRow>(cd.fate_aspects),
    [cd.fate_aspects],
  );
  const skills = useMemo<SkillRow[]>(
    () => safeParseArr<SkillRow>(cd.fate_skills),
    [cd.fate_skills],
  );
  const stressVal = useMemo(() => {
    const raw = readStr(cd, 'fate_conflict');
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [cd]);

  // Cleanup debounce při unmount
  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  const flushPatch = useCallback(
    (patch: Record<string, string>) => {
      if (Object.keys(patch).length === 0) return;
      updateMut.mutate(
        { customDataPatch: patch },
        {
          onSuccess: () => {
            // Po úspěchu vyprázdníme local overlay (server data = pravda)
            setLocalPatch((prev) => {
              const next = { ...prev };
              Object.keys(patch).forEach((k) => delete next[k]);
              return next;
            });
          },
          onError: () => {
            toast.error('Nepodařilo se uložit změny');
          },
        },
      );
    },
    [updateMut],
  );

  const writeKey = useCallback(
    (key: string, value: string) => {
      if (!canEdit) return;
      setLocalPatch((prev) => ({ ...prev, [key]: value }));
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setLocalPatch((current) => {
          flushPatch(current);
          return current;
        });
      }, 500);
    },
    [canEdit, flushPatch],
  );

  // ── Loading / empty ──────────────────────────────────────────────
  if (isLoading) {
    return <div className={styles.loading}>Načítám statblok…</div>;
  }
  if (!diary) {
    return <div className={styles.empty}>Bez deníku.</div>;
  }

  // ── Handlery ──────────────────────────────────────────────────────

  const updateAspect = (i: number, name: string) => {
    const next = aspects.map((a, idx) => (idx === i ? { ...a, name } : a));
    writeKey('fate_aspects', JSON.stringify(next));
  };
  const addAspect = () => {
    writeKey('fate_aspects', JSON.stringify([...aspects, { name: '' }]));
  };
  const removeAspect = (i: number) => {
    const next = aspects.filter((_, idx) => idx !== i);
    writeKey('fate_aspects', JSON.stringify(next));
  };

  const setStress = (id: number) => {
    if (!canEdit) return;
    writeKey('fate_conflict', String(id));
  };

  const updateSkillPip = (i: number, pipIndex: number) => {
    const current = skills[i];
    if (!current) return;
    const currentVal = parseInt(current.val, 10) || 0;
    const nextVal = currentVal === pipIndex + 1 ? pipIndex : pipIndex + 1;
    const next = skills.map((s, idx) =>
      idx === i ? { ...s, val: String(nextVal) } : s,
    );
    writeKey('fate_skills', JSON.stringify(next));
  };

  const handleRollSkill = (skill: SkillRow) => {
    if (!onRoll) return;
    const mod = parseInt(skill.val, 10) || 0;
    onRoll({
      label: skill.name || 'Dovednost',
      modifier: mod,
      kind: 'fate',
    });
  };

  const handleRollInitiative = () => {
    if (!onRoll) return;
    onRoll({ label: 'Iniciativa', modifier: 0, kind: 'fate' });
  };

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className={styles.root}>
      {/* STATY — Iniciativa */}
      <section className={styles.section}>
        <div className={styles.sectionTitleRow}>
          <h3 className={styles.sectionTitle}>Staty</h3>
          {onRoll && (
            <button
              type="button"
              className={styles.initiativeBtn}
              onClick={handleRollInitiative}
              title="Hodit iniciativu (4dF)"
            >
              ⚡ Iniciativa
            </button>
          )}
        </div>

        {/* Stres / konflikt track */}
        <div
          className={styles.conflictTrack}
          role="radiogroup"
          aria-label="Stres / konflikt"
        >
          {STRESS_STATES.map((s) => {
            const active = stressVal === s.id;
            const variantClass =
              s.variant === 'warning'
                ? styles.warning
                : s.variant === 'danger'
                  ? styles.danger
                  : s.variant === 'critical'
                    ? styles.critical
                    : '';
            return (
              <button
                key={s.id}
                type="button"
                className={`${styles.stressBox} ${active ? styles.stressBoxActive : ''} ${active ? variantClass : ''}`}
                onClick={() => setStress(s.id)}
                disabled={!canEdit}
                aria-label={`Stav: ${s.label}`}
                aria-pressed={active}
                role="radio"
                aria-checked={active}
              >
                <span className={styles.stressNode} aria-hidden="true" />
                <span className={styles.stressLabel}>{s.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ASPEKTY */}
      <section className={styles.section}>
        <div className={styles.sectionTitleRow}>
          <h3 className={styles.sectionTitle}>Aspekty</h3>
        </div>
        <div className={styles.aspectsList}>
          {aspects.map((a, i) => (
            <div key={i} className={styles.aspectCard}>
              <input
                className={styles.aspectInput}
                value={a.name || ''}
                disabled={!canEdit}
                onChange={(e) => updateAspect(i, e.target.value)}
                placeholder="Zapiš aspekt…"
                aria-label={`Aspekt ${i + 1}`}
              />
              {canEdit && (
                <button
                  type="button"
                  className={styles.delBtn}
                  onClick={() => removeAspect(i)}
                  aria-label={`Smazat aspekt ${i + 1}`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {canEdit && (
            <button
              type="button"
              className={styles.addBtn}
              onClick={addAspect}
            >
              + Nový aspekt
            </button>
          )}
        </div>
      </section>

      {/* DOVEDNOSTI */}
      <section className={styles.section}>
        <div className={styles.sectionTitleRow}>
          <h3 className={styles.sectionTitle}>Dovednosti</h3>
        </div>
        <div className={styles.skillsList}>
          {skills.length === 0 && (
            <div className={styles.empty}>Žádné dovednosti.</div>
          )}
          {skills.map((skill, i) => {
            const val = parseInt(skill.val, 10) || 0;
            return (
              <div key={i} className={styles.skillRow}>
                <span
                  className={styles.skillName}
                  title={skill.note || skill.name}
                >
                  {skill.name || `Dovednost ${i + 1}`}
                </span>
                <div
                  className={styles.skillPips}
                  role="group"
                  aria-label={`${skill.name || `Dovednost ${i + 1}`} pip tracker`}
                >
                  {Array.from({ length: MAX_PIPS }).map((_, pipIdx) => (
                    <button
                      type="button"
                      key={pipIdx}
                      className={`${styles.pip} ${pipIdx < val ? styles.pipFilled : ''}`}
                      onClick={() => updateSkillPip(i, pipIdx)}
                      disabled={!canEdit}
                      aria-label={`${skill.name || `Dovednost ${i + 1}`} pip ${pipIdx + 1} z ${MAX_PIPS}`}
                      aria-pressed={pipIdx < val}
                      title={`Hodnocení ${pipIdx + 1}`}
                    />
                  ))}
                </div>
                {onRoll && (
                  <button
                    type="button"
                    className={styles.rollBtn}
                    onClick={() => handleRollSkill(skill)}
                    title={`Hodit ${skill.name || 'dovednost'} (4dF${val !== 0 ? ` ${val >= 0 ? '+' : ''}${val}` : ''})`}
                    aria-label={`Hodit ${skill.name || `dovednost ${i + 1}`}`}
                  >
                    🎲
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
