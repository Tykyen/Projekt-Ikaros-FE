/**
 * 16.2a — Matrix kompaktní bojový panel (taktická mapa), HUD redesign.
 *
 * Sladěno s deníkovým listem (MatrixSheet „operátorský HUD"), ořezané na
 * bojové minimum: STATY (Životy/Únava/Ochrana/Runa — barevné tracky +
 * postih readout) · SCHOPNOSTI (pips 1–10, klik = hod 4dF+stupeň) ·
 * PŘETLAKY (segmenty 0–5) · ASPEKTY (chip Nabitý/Vybitý). + ⚡ Iniciativa.
 *
 * Iniciativa = 4dF + ⌊nabité aspekty / 2⌋. Hody jdou přes `onRoll` → mapa.
 *
 * Permission gate:
 *   - canEdit=false (cizí hráč) → JEN STATY readonly (zbytek privátní, skrytý).
 *   - canEdit=true (PJ + vlastník) → vše editovatelné + klikací hody.
 *
 * Auto-save: lokální `customDataPatch`, debounce 500 ms → `useUpdateCharacterDiary`.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { toast } from 'sonner';
import { useCharacterDiary } from '@/features/world/pages/api/useCharacterSubdocs';
import { useUpdateCharacterDiary } from '@/features/world/pages/api/useCharacterMutations';
import { useCharacter } from '@/features/world/pages/api/useCharacter';
import {
  MATRIX_PRESSURE_TYPES,
  MATRIX_SKILL_MAX_PC,
  MATRIX_SKILL_MAX_NPC,
  matrixLevelName,
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

const AUTOSAVE_DEBOUNCE_MS = 500;
const PREFIX = 'matrix_';
const k = (key: string): string => `${PREFIX}${key}`;

/** Barva stupně 1–10 (CSS var z modulu). */
const lvlVar = (lvl: number): string => `var(--lvl-${Math.min(Math.max(lvl, 1), 10)})`;

export function MatrixCombatPanel({
  token,
  sceneId: _sceneId,
  worldId,
  canEdit,
  onRoll,
}: Props): React.ReactElement {
  void _sceneId;
  const { data: diary, isLoading } = useCharacterDiary(worldId, token.characterSlug);
  const { data: character } = useCharacter(worldId, token.characterSlug);
  const isNpc = !!character?.isNpc;
  const updateDiary = useUpdateCharacterDiary(worldId, token.characterSlug);

  const [patch, setPatch] = useState<Record<string, unknown>>({});
  const pendingPatchRef = useRef<Record<string, unknown>>({});
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cd: Record<string, unknown> = useMemo(() => {
    const base = diary?.customData ?? {};
    return { ...base, ...patch };
  }, [diary?.customData, patch]);

  useEffect(() => {
    if (updateDiary.isSuccess) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPatch({});
      pendingPatchRef.current = {};
      updateDiary.reset();
    }
  }, [updateDiary]);

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
      pendingPatchRef.current = { ...pendingPatchRef.current, [fullKey]: value };
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

  if (isLoading) {
    return (
      <div className={styles.loading} role="status" aria-live="polite">
        Načítám deník…
      </div>
    );
  }
  if (!diary) {
    return <p className={styles.error}>Deník se nepodařilo načíst.</p>;
  }

  // ── Derived ────────────────────────────────────────────────────
  const health = readNum('health', 5);
  const tiredness = readNum('tiredness', 0);
  const armor = readNum('armor', 0);
  const magicHealth = readNum('magicHealth', 0);
  const abilities = readArr<MatrixTagValue>('abilities');
  const aspects = readArr<MatrixTagValue>('aspects');
  const skillMax = isNpc ? MATRIX_SKILL_MAX_NPC : MATRIX_SKILL_MAX_PC;

  const isAspectCharged = (val: string): boolean => {
    const v = (val || '').toLowerCase();
    return v !== 'vybitý' && v !== 'vybity' && v.toUpperCase() !== 'V';
  };

  // Iniciativa modifier = ⌊nabitých aspektů / 2⌋
  const chargedAspectsCount = aspects.filter((a) => isAspectCharged(a.value || '')).length;
  const initiativeModifier = Math.floor(chargedAspectsCount / 2);

  const handleInitiative = (): void => {
    onRoll?.({ label: 'Iniciativa', modifier: initiativeModifier, kind: 'fate' });
  };
  const handleSkillRoll = (ability: MatrixTagValue): void => {
    const mod = parseInt(ability.value, 10) || 0;
    onRoll?.({ label: ability.label, modifier: mod, kind: 'fate' });
  };
  const handlePressureToggle = (pressureKey: string, segmentIdx: number): void => {
    const current = readNum(`pressure_${pressureKey}`, -1);
    setField(`pressure_${pressureKey}`, String(current === segmentIdx ? segmentIdx - 1 : segmentIdx));
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

  // postihy (status readout)
  const hpMod = health >= 4 ? '' : health >= 2 ? 'warn' : 'crit';
  const hpPen =
    health >= 4 ? ['0', ''] : health >= 2 ? ['−1', 'warn'] : health >= 1 ? ['−2', 'warn'] : ['SMRT', 'crit'];
  const tPen =
    tiredness <= 5
      ? ['0', '']
      : tiredness <= 10
        ? ['−1', 'warn']
        : tiredness <= 15
          ? ['−2', 'warn']
          : tiredness <= 20
            ? ['BEZ', 'warn']
            : ['SMRT', 'crit'];

  return (
    <div className={styles.panel} data-system="matrix">
      {/* ───── STATY ───── */}
      <section className={styles.section} aria-labelledby="mx-cp-stats">
        <div className={styles.titleRow}>
          <span id="mx-cp-stats" className={styles.title}>Staty</span>
          {canEdit && onRoll && (
            <button
              type="button"
              className={styles.initBtn}
              onClick={handleInitiative}
              title={`Iniciativa = 4dF + ⌊nabité aspekty (${chargedAspectsCount}) / 2⌋ = +${initiativeModifier}`}
            >
              ⚡ Iniciativa
            </button>
          )}
        </div>

        <VitalRow label="❤ Životy" name="Životy" valueKey="health" value={health} max={5} kind="hp" mod={hpMod} canEdit={canEdit} setField={setField} pen={hpPen} />
        <VitalRow label="⚡ Únava" name="Únava" valueKey="tiredness" value={tiredness} max={25} kind="tired" canEdit={canEdit} setField={setField} pen={tPen} noTrack />

        <div className={styles.vit2col}>
          <VitalRow label="🛡 Ochrana" name="Ochrana" valueKey="armor" value={armor} max={Math.max(armor, 3)} kind="arm" canEdit={canEdit} setField={setField} compact />
          <VitalRow label="◇ Runa" name="Runa" valueKey="magicHealth" value={magicHealth} max={Math.max(magicHealth, 2)} kind="rune" canEdit={canEdit} setField={setField} compact />
        </div>
      </section>

      {/* cizí hráč → konec (STATY je vše co vidí) */}
      {canEdit && (
        <>
          {/* ───── SCHOPNOSTI ───── */}
          {abilities.length > 0 && (
            <section className={styles.section} aria-labelledby="mx-cp-skills">
              <div className={styles.titleRow}>
                <span id="mx-cp-skills" className={styles.title}>Schopnosti</span>
              </div>
              <div className={styles.list}>
                {abilities.map((ability, idx) => {
                  const lvl = parseInt(ability.value, 10) || 0;
                  const total = Math.max(skillMax, lvl);
                  const rollable = Boolean(onRoll && ability.label);
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={styles.skill}
                      style={{ ['--lvlc' as string]: lvlVar(lvl) } as CSSProperties}
                      onClick={() => rollable && handleSkillRoll(ability)}
                      disabled={!rollable}
                      title={rollable ? `Hodit ${ability.label} (4dF + ${lvl})` : ability.label}
                      aria-label={rollable ? `Hodit ${ability.label}` : ability.label}
                    >
                      <span className={styles.skillName}>{ability.label || '(bez názvu)'}</span>
                      <span className={styles.skillRight}>
                        <Pips lvl={lvl} total={total} />
                        <span className={styles.skillLvl} title={`${lvl} — ${matrixLevelName(lvl)}`}>{lvl}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* ───── PŘETLAKY ───── */}
          <section className={styles.section} aria-labelledby="mx-cp-pressure">
            <div className={styles.titleRow}>
              <span id="mx-cp-pressure" className={styles.title}>Přetlaky</span>
            </div>
            <div className={styles.pressure}>
              {MATRIX_PRESSURE_TYPES.map((p) => {
                const current = readNum(`pressure_${p.key}`, -1);
                return (
                  <div className={styles.prRow} key={p.key}>
                    <span className={styles.prLabel}>{p.label}</span>
                    <div className={styles.prRail} role="group" aria-label={`Přetlak ${p.label}`}>
                      {Array.from({ length: 5 }).map((_, i) => {
                        const on = current >= i;
                        return (
                          <button
                            key={i}
                            type="button"
                            className={styles.prSeg}
                            data-on={on ? String(i + 1) : 'off'}
                            onClick={() => handlePressureToggle(p.key, i)}
                            aria-label={`${p.label} ${i + 1} z 5`}
                            aria-pressed={on}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ───── ASPEKTY ───── */}
          {aspects.length > 0 && (
            <section className={styles.section} aria-labelledby="mx-cp-aspects">
              <div className={styles.titleRow}>
                <span id="mx-cp-aspects" className={styles.title}>Aspekty</span>
              </div>
              <div className={styles.list}>
                {aspects.map((aspect, idx) => {
                  const charged = isAspectCharged(aspect.value || '');
                  return (
                    <div className={styles.aspect} data-charged={charged} key={idx}>
                      <span className={styles.aspectName}>{aspect.label || '(bez názvu)'}</span>
                      <button
                        type="button"
                        className={styles.chip}
                        data-charged={charged}
                        onClick={() => handleAspectToggle(idx)}
                        aria-pressed={charged}
                        title={charged ? 'Klikni pro vybití' : 'Klikni pro nabití'}
                      >
                        {charged ? 'Nabitý' : 'Vybitý'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

// ── Pips (barva dle stupně) ──────────────────────────────────────
function Pips({ lvl, total }: { lvl: number; total: number }): React.ReactElement {
  return (
    <span className={styles.pips}>
      {Array.from({ length: total }).map((_, i) => {
        const on = i < lvl;
        return (
          <i
            key={i}
            className={styles.pip}
            data-on={on}
            style={on ? ({ ['--lvlc' as string]: lvlVar(lvl) } as CSSProperties) : undefined}
          />
        );
      })}
    </span>
  );
}

// ── Vital row (track + číslo + postih) ───────────────────────────
function VitalRow({
  label,
  name,
  valueKey,
  value,
  max,
  kind,
  mod,
  canEdit,
  setField,
  pen,
  noTrack,
  compact,
}: {
  label: string;
  name: string;
  valueKey: string;
  value: number;
  max: number;
  kind: 'hp' | 'tired' | 'arm' | 'rune';
  mod?: string;
  canEdit: boolean;
  setField: (key: string, value: unknown) => void;
  pen?: string[];
  noTrack?: boolean;
  compact?: boolean;
}): React.ReactElement {
  return (
    <div className={styles.vit}>
      <div className={styles.vitHead}>
        <span className={styles.vitLab}>{label}</span>
        <span className={styles.vitNum}>
          {canEdit ? (
            <input
              type="number"
              min={0}
              className={styles.num}
              value={value}
              onChange={(e) => setField(valueKey, String(Math.max(0, parseInt(e.target.value, 10) || 0)))}
              aria-label={name}
            />
          ) : (
            value
          )}
          {!compact && <small>/{max}</small>}
        </span>
      </div>
      {!noTrack && (
        <div className={styles.track}>
          {Array.from({ length: max }).map((_, i) => (
            <i key={i} className={styles.seg} data-kind={kind} data-on={i < value} data-mod={i < value ? mod || '' : ''} />
          ))}
        </div>
      )}
      {pen && (
        <div className={styles.status}>
          <span>Postih:</span>
          <span className={styles.badge} data-mod={pen[1]}>{pen[0]}</span>
        </div>
      )}
    </div>
  );
}

export default MatrixCombatPanel;
