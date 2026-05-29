/**
 * 10.2c-edit-9h — GURPS kompaktní bojový panel pro TokenInfoPanel.
 *
 * Vizuální port 1:1 z `C:/Matrix/Matrix/frontend/src/components/Map/
 * GurpsMapDiaryOverlay.tsx` (Matrix legacy, 405 ř). Na rozdíl od plného
 * `GurpsSheet` deníku zde jen READ-ONLY display + HP/FP editing inputy
 * + klikací attributes/skills/útoky pro 3d6 roll-under hod.
 *
 * GURPS mechanika: 3d6 vs target number (low = lepší). Engine `rollFromSheet`
 * podporuje `'d6'`, takže useme `kind: 'd6'` + modifier z attribute/skill
 * level (positive = bonus, target je level samotný — interpretace v chat
 * message label).
 *
 * Data model: `diary.customData.gurps_*` (1:1 s legacy + Ikaros `GurpsSheet`).
 * Edit: debounced (~500 ms) `useUpdateCharacterDiary({ customDataPatch })`.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useCharacterDiary } from '@/features/world/pages/api/useCharacterSubdocs';
import { useUpdateCharacterDiary } from '@/features/world/pages/api/useCharacterMutations';
import type { MapToken } from '../../../types';
import styles from './GurpsCombatPanel.module.css';

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

/** Klíče v `customData` (prefix `gurps_`). Mirror legacy + `GurpsSheet`. */
const CORE_ATTRS: { key: string; label: string }[] = [
  { key: 'gurps_st', label: 'ST' },
  { key: 'gurps_dx', label: 'DX' },
  { key: 'gurps_iq', label: 'IQ' },
  { key: 'gurps_ht', label: 'HT' },
  { key: 'gurps_will', label: 'Will' },
  { key: 'gurps_per', label: 'Per' },
];

const ENC_LEVELS: { label: string; m: string; d: string }[] = [
  { label: 'Žádné (0)', m: 'gurps_enc_move_0', d: 'gurps_enc_dodge_0' },
  { label: 'Lehké (1)', m: 'gurps_enc_move_1', d: 'gurps_enc_dodge_1' },
  { label: 'Střední (2)', m: 'gurps_enc_move_2', d: 'gurps_enc_dodge_2' },
  { label: 'Těžké (3)', m: 'gurps_enc_move_3', d: 'gurps_enc_dodge_3' },
  { label: 'Velmi těžké (4)', m: 'gurps_enc_move_4', d: 'gurps_enc_dodge_4' },
];

interface GurpsSkillRow {
  name?: string;
  lvl?: string;
  base?: string;
}
interface GurpsMeleeRow {
  name?: string;
  dmg?: string;
  reach?: string;
  parry?: string;
}
interface GurpsRangedRow {
  name?: string;
  dmg?: string;
  acc?: string;
  rng?: string;
  rof?: string;
  shots?: string;
}

function getStr(
  cd: Record<string, unknown> | undefined,
  key: string,
  fallback = '',
): string {
  const v = cd?.[key];
  if (v == null) return fallback;
  return String(v);
}

function parseArr<T>(
  cd: Record<string, unknown> | undefined,
  key: string,
): T[] {
  const v = cd?.[key];
  if (Array.isArray(v)) return v as T[];
  if (typeof v === 'string') {
    try {
      const parsed: unknown = JSON.parse(v || '[]');
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** Bezpečně parsne číselnou hodnotu z customData stringu (fallback 0). */
function asInt(s: string): number {
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : 0;
}

export function GurpsCombatPanel({
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

  const cd = useMemo<Record<string, unknown>>(
    () => (diary?.customData ?? {}) as Record<string, unknown>,
    [diary?.customData],
  );

  // ── Lokální drafty pro HP / FP (debounced commit) ────────────────
  const [hpDraft, setHpDraft] = useState<string>(getStr(cd, 'gurps_hp', '10'));
  const [fpDraft, setFpDraft] = useState<string>(getStr(cd, 'gurps_fp', '10'));
  const hpFocusRef = useRef(false);
  const fpFocusRef = useRef(false);
  const hpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync server → draft jen pokud není focused (jinak nepřepisujeme user input)
  useEffect(() => {
    if (!hpFocusRef.current) setHpDraft(getStr(cd, 'gurps_hp', '10'));
  }, [cd]);
  useEffect(() => {
    if (!fpFocusRef.current) setFpDraft(getStr(cd, 'gurps_fp', '10'));
  }, [cd]);

  // Cleanup debounce timery při unmount
  useEffect(() => {
    return () => {
      if (hpTimerRef.current) clearTimeout(hpTimerRef.current);
      if (fpTimerRef.current) clearTimeout(fpTimerRef.current);
    };
  }, []);

  const commit = (patchKey: string, value: string): void => {
    updateDiary.mutate(
      { customDataPatch: { [patchKey]: value } },
      {
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Uložení selhalo';
          toast.error(`GURPS deník: ${msg}`);
        },
      },
    );
  };

  const scheduleCommit = (
    timerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
    patchKey: string,
    value: string,
  ): void => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => commit(patchKey, value), 500);
  };

  // ── Roll helpers ─────────────────────────────────────────────────

  const rollAttr = (key: string, label: string): void => {
    if (!onRoll) return;
    const target = asInt(getStr(cd, key, '10'));
    onRoll({
      label: `${label} — cíl ${target} (3d6)`,
      modifier: target,
      kind: 'd6',
    });
  };

  const rollSkill = (name: string, lvl: string): void => {
    if (!onRoll) return;
    const target = asInt(lvl);
    onRoll({
      label: `${name || 'Dovednost'} — cíl ${target} (3d6)`,
      modifier: target,
      kind: 'd6',
    });
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
        <div className={styles.empty}>Deník postavy nebyl nalezen.</div>
      </div>
    );
  }

  const skills = parseArr<GurpsSkillRow>(cd, 'gurps_skills');
  const melee = parseArr<GurpsMeleeRow>(cd, 'gurps_melee');
  const ranged = parseArr<GurpsRangedRow>(cd, 'gurps_ranged');

  const totalPoints = getStr(cd, 'gurps_total_points');
  const unspentPoints = getStr(cd, 'gurps_unspent_points');
  const age = getStr(cd, 'gurps_age');
  const height = getStr(cd, 'gurps_height');
  const weight = getStr(cd, 'gurps_weight');
  const sm = getStr(cd, 'gurps_sm');
  const appearance = getStr(cd, 'gurps_appearance');

  return (
    <div className={styles.root}>
      {/* META row (věk/výška/váha/SM) — read-only */}
      {(age || height || weight || sm || appearance || totalPoints) && (
        <div className={styles.metaRow}>
          {age && <span className={styles.metaItem}>Věk: {age}</span>}
          {height && <span className={styles.metaItem}>Výška: {height}</span>}
          {weight && <span className={styles.metaItem}>Váha: {weight}</span>}
          {sm && <span className={styles.metaItem}>SM: {sm}</span>}
          {appearance && (
            <span className={styles.metaItem}>Vzhled: {appearance}</span>
          )}
          {(totalPoints || unspentPoints) && (
            <span className={styles.metaPoints}>
              Body: {totalPoints || '0'}
              {unspentPoints && ` (Neutracené: ${unspentPoints})`}
            </span>
          )}
        </div>
      )}

      {/* STATY: HP, FP, Speed, Move */}
      <section className={styles.section}>
        <div className={styles.sectionTitleRow}>
          <h3 className={styles.sectionTitle}>Staty</h3>
          {onRoll && (
            <button
              type="button"
              className={styles.initiativeBtn}
              onClick={() =>
                onRoll({
                  label: `Iniciativa — cíl ${getStr(cd, 'gurps_basic_speed', '5.0')}`,
                  modifier: 0,
                  kind: 'd6',
                })
              }
              title="Hod iniciativy (3d6)"
            >
              ⚡ Iniciativa
            </button>
          )}
        </div>

        <div className={styles.vitalsGrid}>
          <div className={`${styles.vital} ${styles.vitalAccentHp}`}>
            <span className={styles.vitalLabel}>HP (Životy)</span>
            <input
              className={styles.vitalInput}
              type="text"
              inputMode="numeric"
              value={hpDraft}
              readOnly={!canEdit}
              aria-label="HP aktuální"
              onChange={(e) => {
                if (!canEdit) return;
                const v = e.target.value;
                setHpDraft(v);
                scheduleCommit(hpTimerRef, 'gurps_hp', v || '0');
              }}
              onFocus={() => {
                hpFocusRef.current = true;
              }}
              onBlur={() => {
                hpFocusRef.current = false;
                if (!canEdit) return;
                if (hpTimerRef.current) clearTimeout(hpTimerRef.current);
                commit('gurps_hp', hpDraft || '0');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter')
                  (e.target as HTMLInputElement).blur();
              }}
              autoComplete="off"
            />
            <span className={styles.vitalMax}>
              / {getStr(cd, 'gurps_hp_max', '10')}
            </span>
          </div>

          <div className={`${styles.vital} ${styles.vitalAccentFp}`}>
            <span className={styles.vitalLabel}>FP (Únava)</span>
            <input
              className={styles.vitalInput}
              type="text"
              inputMode="numeric"
              value={fpDraft}
              readOnly={!canEdit}
              aria-label="FP aktuální"
              onChange={(e) => {
                if (!canEdit) return;
                const v = e.target.value;
                setFpDraft(v);
                scheduleCommit(fpTimerRef, 'gurps_fp', v || '0');
              }}
              onFocus={() => {
                fpFocusRef.current = true;
              }}
              onBlur={() => {
                fpFocusRef.current = false;
                if (!canEdit) return;
                if (fpTimerRef.current) clearTimeout(fpTimerRef.current);
                commit('gurps_fp', fpDraft || '0');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter')
                  (e.target as HTMLInputElement).blur();
              }}
              autoComplete="off"
            />
            <span className={styles.vitalMax}>
              / {getStr(cd, 'gurps_fp_max', '10')}
            </span>
          </div>

          <div className={styles.vital}>
            <span className={styles.vitalLabel}>Rychlost</span>
            <span className={styles.vitalValue}>
              {getStr(cd, 'gurps_basic_speed', '5.0')}
            </span>
          </div>

          <div className={styles.vital}>
            <span className={styles.vitalLabel}>Pohyb</span>
            <span className={styles.vitalValue}>
              {getStr(cd, 'gurps_basic_move', '5')}
            </span>
          </div>
        </div>
      </section>

      {/* OBRANA: DR / Parry / Block / TL */}
      <section className={styles.section}>
        <div className={styles.sectionTitleRow}>
          <h3 className={styles.sectionTitle}>Obrana</h3>
        </div>
        <div className={styles.defensesRow}>
          <div className={styles.defenseCard}>
            <span className={styles.defenseLabel}>DR (Zbroj)</span>
            <span className={styles.defenseValue}>
              {getStr(cd, 'gurps_dr', '0')}
            </span>
          </div>
          <div className={styles.defenseCard}>
            <span className={styles.defenseLabel}>Odražení</span>
            <span className={styles.defenseValue}>
              {getStr(cd, 'gurps_parry', '0')}
            </span>
          </div>
          <div className={styles.defenseCard}>
            <span className={styles.defenseLabel}>Blok</span>
            <span className={styles.defenseValue}>
              {getStr(cd, 'gurps_block', '0')}
            </span>
          </div>
          <div className={styles.defenseCard}>
            <span className={styles.defenseLabel}>TL</span>
            <span className={styles.defenseValue}>
              {getStr(cd, 'gurps_tl', '0')}
            </span>
          </div>
        </div>
      </section>

      {/* ATRIBUTY: ST/DX/IQ/HT/Will/Per — klik → 3d6 roll-under */}
      <section className={styles.section}>
        <div className={styles.sectionTitleRow}>
          <h3 className={styles.sectionTitle}>Atributy (klik = 3d6)</h3>
        </div>
        <div className={styles.attrsGrid}>
          {CORE_ATTRS.map((a) => (
            <button
              key={a.key}
              type="button"
              className={styles.attrCard}
              onClick={() => rollAttr(a.key, a.label)}
              disabled={!onRoll}
              aria-label={`Hod na ${a.label}`}
              title={onRoll ? `Hod na ${a.label} (3d6 vs target)` : a.label}
            >
              <span className={styles.attrLabel}>{a.label}</span>
              <span className={styles.attrValue}>
                {getStr(cd, a.key, '10')}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* DERIVED: BL, Thr, Sw */}
      <section className={styles.section}>
        <div className={styles.sectionTitleRow}>
          <h3 className={styles.sectionTitle}>Odvozené</h3>
        </div>
        <div className={styles.derivedRow}>
          <div className={styles.derivedCard}>
            <span className={styles.derivedLabel}>BL (Nosnost)</span>
            <span className={styles.derivedValue}>
              {getStr(cd, 'gurps_basic_lift', '0')}
            </span>
          </div>
          <div className={styles.derivedCard}>
            <span className={styles.derivedLabel}>Thr</span>
            <span className={styles.derivedValue}>
              {getStr(cd, 'gurps_dmg_thr', '0')}
            </span>
          </div>
          <div className={styles.derivedCard}>
            <span className={styles.derivedLabel}>Sw</span>
            <span className={styles.derivedValue}>
              {getStr(cd, 'gurps_dmg_sw', '0')}
            </span>
          </div>
        </div>
      </section>

      {/* ZATÍŽENÍ + Dodge */}
      <section className={styles.section}>
        <div className={styles.sectionTitleRow}>
          <h3 className={styles.sectionTitle}>Zatížení a úhyb</h3>
        </div>
        <div className={styles.tableScroll}>
          <table className={styles.encumbTable}>
            <thead>
              <tr>
                <th>Úroveň</th>
                <th>Move</th>
                <th>Dodge</th>
              </tr>
            </thead>
            <tbody>
              {ENC_LEVELS.map((enc) => (
                <tr key={enc.label}>
                  <td>{enc.label}</td>
                  <td>{getStr(cd, enc.m, '-')}</td>
                  <td className={styles.encumbDodge}>
                    {getStr(cd, enc.d, '-')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* DOVEDNOSTI */}
      <section className={styles.section}>
        <div className={styles.sectionTitleRow}>
          <h3 className={styles.sectionTitle}>Dovednosti (klik = 3d6)</h3>
        </div>
        {skills.length === 0 ? (
          <div className={styles.emptyHint}>Žádné dovednosti</div>
        ) : (
          <div className={styles.skillsList}>
            {skills.map((sk, i) => (
              <button
                key={`${sk.name ?? 'sk'}-${i}`}
                type="button"
                className={styles.skillRow}
                onClick={() => rollSkill(sk.name ?? '', sk.lvl ?? '0')}
                disabled={!onRoll}
                title={
                  onRoll
                    ? `Hod na ${sk.name || 'dovednost'} (cíl ${sk.lvl ?? '?'})`
                    : sk.name
                }
              >
                <span className={styles.skillLvl}>{sk.lvl ?? '-'}</span>
                <span className={styles.skillName}>{sk.name ?? '—'}</span>
                <span className={styles.skillBase}>
                  {sk.base ? `(${sk.base})` : ''}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* BOJ: melee */}
      {melee.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionTitleRow}>
            <h3 className={styles.sectionTitle}>Zbraně na blízko</h3>
          </div>
          <div className={styles.tableScroll}>
            <table className={styles.combatTable}>
              <thead>
                <tr>
                  <th>Zbraň</th>
                  <th>DMG</th>
                  <th>Dosah</th>
                  <th>Parry</th>
                </tr>
              </thead>
              <tbody>
                {melee.map((w, i) => (
                  <tr key={`m-${i}`}>
                    <td>{w.name ?? '—'}</td>
                    <td className={styles.tdDmg}>{w.dmg ?? '-'}</td>
                    <td>{w.reach ?? '-'}</td>
                    <td className={styles.tdParry}>{w.parry ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* BOJ: ranged */}
      {ranged.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionTitleRow}>
            <h3 className={styles.sectionTitle}>Střelné zbraně</h3>
          </div>
          <div className={styles.tableScroll}>
            <table className={styles.combatTable}>
              <thead>
                <tr>
                  <th>Zbraň</th>
                  <th>DMG</th>
                  <th>Acc</th>
                  <th>Rng</th>
                  <th>RoF</th>
                  <th>Shots</th>
                </tr>
              </thead>
              <tbody>
                {ranged.map((w, i) => (
                  <tr key={`r-${i}`}>
                    <td>{w.name ?? '—'}</td>
                    <td className={styles.tdDmg}>{w.dmg ?? '-'}</td>
                    <td className={styles.tdAcc}>{w.acc ?? '-'}</td>
                    <td>{w.rng ?? '-'}</td>
                    <td>{w.rof ?? '-'}</td>
                    <td>{w.shots ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* NOTES */}
      {getStr(cd, 'gurps_notes') && (
        <section className={styles.section}>
          <div className={styles.sectionTitleRow}>
            <h3 className={styles.sectionTitle}>Poznámky</h3>
          </div>
          <div className={styles.notes}>{getStr(cd, 'gurps_notes')}</div>
        </section>
      )}
    </div>
  );
}
