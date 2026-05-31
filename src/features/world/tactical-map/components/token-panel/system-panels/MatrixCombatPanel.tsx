/**
 * 10.2c-edit-9h — Kompaktní bojový panel pro Matrix systém v TokenInfoPanel.
 *
 * Port 1:1 ze starého Matrixu `C:/Matrix/Matrix/frontend/src/components/Map/
 * CharacterDiary.tsx` ř.568-820 (sekce STATY / DOVEDNOSTI / PŘETLAKY /
 * ASPEKTY) na Ikaros data model (`customData` prefix `matrix_*`).
 *
 * Cíl: V tactical-map TokenInfoPanel hráč nepotřebuje plný editor deníku
 * (`DiaryTab → MatrixSheet`) — chce jen rychlý bojový statblok s roll
 * tlačítky. Plná editace (přidávání schopností, jazyky, výbava…) zůstává
 * v `/world/:slug/postavy/:slug`.
 *
 * Permission gate:
 *   - `canEdit=true` (PJ + vlastník) → STATY (editovatelné) + DOVEDNOSTI
 *     (klikatelné rolly) + PŘETLAKY (toggle segmenty) + ASPEKTY (toggle
 *     nabitý/vybitý).
 *   - `canEdit=false` (cizí hráč) → JEN STATY readonly (zbývající sekce
 *     skryté — privátní info).
 *
 * Auto-save: lokální `customDataPatch` state, debounce 500 ms → mutate
 * přes `useUpdateCharacterDiary`. Důvod debounce: NumericInput change
 * onChange při každém keystroke; bez debounce ~5 mutací/sek při psaní
 * dvouciferného čísla.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useCharacterDiary } from '@/features/world/pages/api/useCharacterSubdocs';
import { useUpdateCharacterDiary } from '@/features/world/pages/api/useCharacterMutations';
import {
  MATRIX_HEALTH_PENALTY,
  MATRIX_PRESSURE_TYPES,
  MATRIX_TIREDNESS_PENALTY,
  type MatrixTagValue,
} from '@/features/world/pages/CharacterDetailPage/diary-systems/sheets/matrix/constants';
import type { MapToken } from '../../../types';
import styles from './MatrixCombatPanel.module.css';

interface Props {
  token: MapToken;
  sceneId: string;
  worldId: string;
  /** PJ + own character = true → edit/roll dostupné. Cizí hráč → false → readonly. */
  canEdit: boolean;
  /** Rolls trigger (obvykle wrapper kolem `performSheetRoll`). */
  onRoll?: (req: {
    label: string;
    modifier: number;
    kind: 'fate' | 'd20' | 'd6' | 'd10';
  }) => void;
}

/** Debounce auto-save interval (ms) — viz hlavička. */
const AUTOSAVE_DEBOUNCE_MS = 500;

const PREFIX = 'matrix_';
const k = (key: string): string => `${PREFIX}${key}`;

export function MatrixCombatPanel({
  token,
  sceneId: _sceneId, // reservováno (může se hodit pro budoucí sceneId-scoped operace)
  worldId,
  canEdit,
  onRoll,
}: Props): React.ReactElement {
  void _sceneId;
  const { data: diary, isLoading } = useCharacterDiary(
    worldId,
    token.characterSlug,
  );
  const updateDiary = useUpdateCharacterDiary(worldId, token.characterSlug);

  // Lokální patch overlay (delta merge nad serverovými customData)
  const [patch, setPatch] = useState<Record<string, unknown>>({});
  const pendingPatchRef = useRef<Record<string, unknown>>({});
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sjednocený view: server cd + lokální patch overlay
  const cd: Record<string, unknown> = useMemo(() => {
    const base = diary?.customData ?? {};
    return { ...base, ...patch };
  }, [diary?.customData, patch]);

  // Po úspěšném save (server odpověděl) vyčistíme overlay
  // — server už drží novou pravdu, lokální patch by jinak overshadowed novější změny.
  // Reakce na async výsledek mutace (server odpověděl) — legitimní effekt.
  useEffect(() => {
    if (updateDiary.isSuccess) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPatch({});
      pendingPatchRef.current = {};
      // reset flag pro další save
      updateDiary.reset();
    }
  }, [updateDiary]);

  // Cleanup pending timer při unmount
  useEffect(
    () => () => {
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    },
    [],
  );

  const flush = useCallback((): void => {
    const next = pendingPatchRef.current;
    if (Object.keys(next).length === 0) return;
    updateDiary.mutate(
      { customDataPatch: next },
      {
        onError: (err) =>
          toast.error(
            `Uložení selhalo: ${err instanceof Error ? err.message : 'neznámá chyba'}`,
          ),
      },
    );
  }, [updateDiary]);

  const scheduleSave = useCallback((): void => {
    if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    flushTimerRef.current = setTimeout(flush, AUTOSAVE_DEBOUNCE_MS);
  }, [flush]);

  const setField = useCallback(
    (key: string, value: unknown): void => {
      if (!canEdit) return;
      const fullKey = k(key);
      setPatch((p) => ({ ...p, [fullKey]: value }));
      pendingPatchRef.current = {
        ...pendingPatchRef.current,
        [fullKey]: value,
      };
      scheduleSave();
    },
    [canEdit, scheduleSave],
  );

  // ── Read helpers ────────────────────────────────────────────────
  const readStr = (key: string, fallback = ''): string => {
    const v = cd[k(key)];
    if (v === undefined || v === null) return fallback;
    return String(v);
  };
  const readNum = (key: string, fallback = 0): number => {
    const parsed = parseInt(readStr(key, String(fallback)), 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const readArr = <T,>(key: string): T[] => {
    const v = cd[k(key)];
    if (Array.isArray(v)) return v as T[];
    if (typeof v === 'string') {
      try {
        const parsed = JSON.parse(v || '[]');
        return Array.isArray(parsed) ? (parsed as T[]) : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  // ── Loading / error ────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={styles.loading} role="status" aria-live="polite">
        Načítám deník…
      </div>
    );
  }
  if (!diary) {
    return (
      <p className={styles.error}>Deník se nepodařilo načíst.</p>
    );
  }

  // ── Derived values ─────────────────────────────────────────────
  const health = readNum('health', 5);
  const tiredness = readNum('tiredness', 0);
  const armor = readNum('armor', 0);
  const magicHealth = readNum('magicHealth', 0);
  const abilities = readArr<MatrixTagValue>('abilities');
  const aspects = readArr<MatrixTagValue>('aspects');

  const isAspectCharged = (val: string): boolean => {
    const v = (val || '').toLowerCase();
    return v !== 'vybitý' && v !== 'vybity' && v.toUpperCase() !== 'V';
  };

  // Iniciativa modifier = ⌊nabitých aspektů / 2⌋ (port `CharacterDiary.tsx` ř.578-583)
  const chargedAspectsCount = aspects.filter((a) =>
    isAspectCharged(a.value || ''),
  ).length;
  const initiativeModifier = Math.floor(chargedAspectsCount / 2);

  const handleInitiative = (): void => {
    onRoll?.({
      label: 'Iniciativa',
      modifier: initiativeModifier,
      kind: 'fate',
    });
  };

  const handleSkillRoll = (ability: MatrixTagValue): void => {
    const mod = parseInt(ability.value, 10) || 0;
    onRoll?.({ label: ability.label, modifier: mod, kind: 'fate' });
  };

  const handlePressureToggle = (
    pressureKey: string,
    segmentIdx: number,
  ): void => {
    const current = readNum(`pressure_${pressureKey}`, -1);
    const next = current === segmentIdx ? -1 : segmentIdx;
    setField(`pressure_${pressureKey}`, String(next));
  };

  const handleAspectToggle = (index: number): void => {
    const arr = readArr<MatrixTagValue>('aspects');
    const row = arr[index];
    if (!row) return;
    const charged = isAspectCharged(row.value || '');
    const copy = arr.map((r, i) =>
      i === index ? { ...r, value: charged ? 'Vybitý' : 'Nabitý' } : r,
    );
    setField('aspects', JSON.stringify(copy));
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div data-system="matrix">
      {/* ────────── STATY ────────── */}
      <section className={styles.section} aria-labelledby="matrix-stats-title">
        <div className={styles.sectionTitleRow}>
          <span id="matrix-stats-title" className={styles.sectionTitle}>
            Staty
          </span>
          {canEdit && onRoll && (
            <button
              type="button"
              className={styles.initiativeBtn}
              onClick={handleInitiative}
              title={`Iniciativa = 4dF + ⌊nabitých aspektů (${chargedAspectsCount}) / 2⌋ = +${initiativeModifier}`}
            >
              ⚡ Iniciativa
            </button>
          )}
        </div>

        <div className={styles.statsGrid}>
          {/* Životy */}
          <div className={`${styles.statCard} ${styles.statCardHealth}`}>
            <div className={styles.statLabel}>Životy</div>
            <div className={styles.statMain}>
              <div className={styles.statInputWrap}>
                {canEdit ? (
                  <input
                    type="number"
                    min={0}
                    max={5}
                    className={styles.statInput}
                    value={health}
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10);
                      setField(
                        'health',
                        String(Number.isFinite(n) ? n : 0),
                      );
                    }}
                    aria-label="Životy"
                  />
                ) : (
                  <span className={styles.statValue}>{health}</span>
                )}
              </div>
              <span className={styles.statValueMax}>/ 5</span>
            </div>
            <HealthPenaltyStrip health={health} />
          </div>

          {/* Únava */}
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Únava</div>
            <div className={styles.statMain}>
              <div className={styles.statInputWrap}>
                {canEdit ? (
                  <input
                    type="number"
                    min={0}
                    max={25}
                    className={styles.statInput}
                    value={tiredness}
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10);
                      setField(
                        'tiredness',
                        String(Number.isFinite(n) ? n : 0),
                      );
                    }}
                    aria-label="Únava"
                  />
                ) : (
                  <span className={styles.statValue}>{tiredness}</span>
                )}
              </div>
              <span className={styles.statValueMax}>/ 25</span>
            </div>
            <TirednessPenaltyStrip tiredness={tiredness} />
          </div>

          {/* Vesta + Runa */}
          <div className={styles.secondaryGrid}>
            <div className={`${styles.statCard} ${styles.statCardArmor}`}>
              <div className={styles.statLabel}>Vesta</div>
              <div className={styles.statInputWrap}>
                {canEdit ? (
                  <input
                    type="number"
                    min={0}
                    className={styles.statInput}
                    value={armor}
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10);
                      setField(
                        'armor',
                        String(Number.isFinite(n) ? n : 0),
                      );
                    }}
                    aria-label="Vesta"
                  />
                ) : (
                  <span className={styles.statValue}>{armor}</span>
                )}
              </div>
            </div>
            <div className={`${styles.statCard} ${styles.statCardMagic}`}>
              <div className={styles.statLabel}>Runa</div>
              <div className={styles.statInputWrap}>
                {canEdit ? (
                  <input
                    type="number"
                    min={0}
                    className={styles.statInput}
                    value={magicHealth}
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10);
                      setField(
                        'magicHealth',
                        String(Number.isFinite(n) ? n : 0),
                      );
                    }}
                    aria-label="Runa"
                  />
                ) : (
                  <span className={styles.statValue}>{magicHealth}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cizí hráč → tady končí. STATY je vše co vidí. */}
      {!canEdit && null}

      {/* ────────── DOVEDNOSTI ────────── */}
      {canEdit && abilities.length > 0 && (
        <section
          className={styles.section}
          aria-labelledby="matrix-skills-title"
        >
          <div className={styles.sectionTitleRow}>
            <span
              id="matrix-skills-title"
              className={styles.sectionTitle}
            >
              Dovednosti
            </span>
          </div>
          <div className={styles.skillGrid}>
            {abilities.map((ability, idx) => (
              <div key={idx} className={styles.skillCard}>
                <span className={styles.skillLabel}>
                  {ability.label || '(bez názvu)'}
                </span>
                {onRoll && ability.label ? (
                  <button
                    type="button"
                    className={`${styles.skillValue} ${styles.skillValueAction}`}
                    onClick={() => handleSkillRoll(ability)}
                    title={`Hodit ${ability.label} (4dF + ${ability.value})`}
                    aria-label={`Hodit ${ability.label}`}
                  >
                    {ability.value}
                  </button>
                ) : (
                  <span className={styles.skillValue}>{ability.value}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ────────── PŘETLAKY ────────── */}
      {canEdit && (
        <section
          className={styles.section}
          aria-labelledby="matrix-pressure-title"
        >
          <div className={styles.sectionTitleRow}>
            <span
              id="matrix-pressure-title"
              className={styles.sectionTitle}
            >
              Přetlaky
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
            }}
          >
            {MATRIX_PRESSURE_TYPES.map((p) => {
              const current = readNum(`pressure_${p.key}`, -1);
              return (
                <div className={styles.pressureRow} key={p.key}>
                  <span className={styles.pressureLabel}>{p.label}</span>
                  <div
                    className={styles.pressureRail}
                    role="group"
                    aria-label={`Přetlak ${p.label}`}
                  >
                    {Array.from({ length: 5 }).map((_, i) => {
                      const active = current >= i;
                      return (
                        <button
                          type="button"
                          key={i}
                          className={`${styles.pressureSegment} ${active ? styles.pressureSegmentActive : ''}`}
                          onClick={() => handlePressureToggle(p.key, i)}
                          aria-label={`${p.label} přetlak ${i + 1} z 5`}
                          aria-pressed={active}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ────────── ASPEKTY ────────── */}
      {canEdit && aspects.length > 0 && (
        <section
          className={styles.section}
          aria-labelledby="matrix-aspects-title"
        >
          <div className={styles.sectionTitleRow}>
            <span
              id="matrix-aspects-title"
              className={styles.sectionTitle}
            >
              Aspekty
            </span>
          </div>
          <div className={styles.aspectGrid}>
            {aspects.map((aspect, idx) => {
              const charged = isAspectCharged(aspect.value || '');
              const cardClass = charged
                ? `${styles.aspectCard} ${styles.aspectCardCharged}`
                : `${styles.aspectCard} ${styles.aspectCardDepleted}`;
              const chipClass = charged
                ? `${styles.aspectChip} ${styles.aspectChipCharged}`
                : `${styles.aspectChip} ${styles.aspectChipDepleted}`;
              return (
                <div key={idx} className={cardClass}>
                  <span className={styles.aspectLabel}>
                    {aspect.label || '(bez názvu)'}
                  </span>
                  <button
                    type="button"
                    className={chipClass}
                    onClick={() => handleAspectToggle(idx)}
                    aria-label={`Aspekt ${aspect.label || idx + 1}: ${charged ? 'nabitý' : 'vybitý'} — klikni pro přepnutí`}
                    aria-pressed={charged}
                    title={
                      charged ? 'Klikni pro vybití' : 'Klikni pro nabití'
                    }
                  >
                    {charged ? 'Nabitý' : 'Vybitý'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Penalty strips (lokální helper komponenty)
// ════════════════════════════════════════════════════════════════

function HealthPenaltyStrip({
  health,
}: {
  health: number;
}): React.ReactElement {
  return (
    <div className={styles.penaltyStrip}>
      {MATRIX_HEALTH_PENALTY.map((penalty, i) => {
        let isActive = false;
        let modClass = '';
        const val = String(penalty);
        if (i === 0) {
          isActive = health >= 4;
        } else if (i === 1) {
          isActive = health === 2 || health === 3;
          modClass = styles.penaltyPillWarning;
        } else if (i === 2) {
          isActive = health === 1;
          modClass = styles.penaltyPillOrange;
        } else if (i === 3) {
          isActive = health === 0;
          modClass = styles.penaltyPillDanger;
        }
        const cls = [
          styles.penaltyPill,
          modClass,
          isActive ? styles.penaltyPillActive : '',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <div
            key={`he${i}`}
            className={cls}
            aria-label={`Penalty ${val}${isActive ? ' (aktivní)' : ''}`}
          >
            {val}
          </div>
        );
      })}
    </div>
  );
}

function TirednessPenaltyStrip({
  tiredness,
}: {
  tiredness: number;
}): React.ReactElement {
  return (
    <div className={styles.penaltyStrip}>
      {MATRIX_TIREDNESS_PENALTY.map((penalty, i) => {
        let isActive = false;
        let modClass = '';
        let display = String(penalty);
        if (i === 0) {
          isActive = tiredness >= 0 && tiredness <= 5;
        } else if (i === 1) {
          isActive = tiredness >= 6 && tiredness <= 10;
          modClass = styles.penaltyPillWarning;
        } else if (i === 2) {
          isActive = tiredness >= 11 && tiredness <= 15;
          modClass = styles.penaltyPillOrange;
        } else if (i === 3) {
          isActive = tiredness >= 16 && tiredness <= 20;
          modClass = styles.penaltyPillPurple;
          display = 'Bez';
        } else if (i === 4) {
          isActive = tiredness >= 21;
          modClass = styles.penaltyPillDanger;
          display = 'Smrt';
        }
        const cls = [
          styles.penaltyPill,
          modClass,
          isActive ? styles.penaltyPillActive : '',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <div
            key={`ti${i}`}
            className={cls}
            title={String(penalty)}
            aria-label={`Únava ${display}${isActive ? ' (aktivní)' : ''}`}
          >
            {display}
          </div>
        );
      })}
    </div>
  );
}

export default MatrixCombatPanel;
