/**
 * 10.2c-edit-9g — Drd2CombatPanel.
 *
 * Kompaktní bojový panel pro Dračí doupě II — port 1:1 vizuálu ze starého
 * Matrix `c:/Matrix/Matrix/frontend/src/components/Map/Drd2MapDiaryOverlay.tsx`.
 *
 * V tactical-map TokenInfoPanelu nahrazuje plný Drd2Sheet (který byl
 * určen pro plnou CharacterDetailPage). Tady chceme jen kompaktní statblok
 * pro PJ/hráče v boji:
 *   - Celková úroveň (využitá / celková)
 *   - 3 zdroje: Tělo / Duše / Vliv (akt/max + jizvy)
 *   - Ohrožení + Výhoda mega boxy
 *   - Rasová ZS + Povahový rys (jen pokud vyplněno)
 *   - Zbraně a Zbroje (klik = roll s bonusem z `char` pole)
 *   - Pomocník (jen pokud vyplněno)
 *   - Základní / Pokročilá povolání — klik na řádek = roll s úrovní jako mod
 *   - Mistrovská povolání — group badge (info-only)
 *   - Zvláštní schopnosti
 *   - Poznámky (stavy a efekty)
 *
 * Data flow:
 *   1. `useCharacterDiary` → `diary.customData.drd2_*`
 *   2. Edits → debounced (~500ms) `useUpdateCharacterDiary({ customDataPatch })`
 *   3. Roll → `onRoll({ label, modifier, kind: 'd6' })` (engine = 2k6+ ekvivalent
 *      přes generic dice; modifier z úrovně povolání).
 *
 * Permission gate:
 *   - `canEdit === false` → readonly view, žádné edit inputy ani roll buttons.
 *   - `canEdit === true` → plně interaktivní.
 */
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  useCharacterDiary,
} from '@/features/world/pages/api/useCharacterSubdocs';
import { useUpdateCharacterDiary } from '@/features/world/pages/api/useCharacterMutations';
import type { MapToken } from '../../../types';
import styles from './Drd2CombatPanel.module.css';

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

interface BasicProf {
  id: string;
  name: string;
  level: number;
}
interface AdvProf extends BasicProf {
  requires?: string[];
}
interface MasterAbility {
  name: string;
  sourceMaster: string;
  isReservedSkill?: boolean;
}
interface SpecAbility {
  name: string;
  description: string;
  source?: string;
  type?: string;
}
interface Weapon {
  name: string;
  char?: string;
  note?: string;
}

const MASTER_PROF_NAMES: Record<string, string> = {
  cernokneznik: 'Černokněžník',
  divotvurce: 'Divotvůrce',
  inkvizitor: 'Inkvizitor',
  mstitel: 'Mstitel',
  nicitel: 'Ničitel',
  paladin: 'Paladin',
  stin: 'Stín',
  vudce: 'Vůdce',
  zivlomag: 'Živlomág',
  zrec: 'Žrec',
};

const RESOURCE_COLORS = {
  body: '#e74c3c',
  soul: '#8872ff',
  influence: '#f1c40f',
} as const;

const DEBOUNCE_MS = 500;

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

function asStr(v: unknown, fallback = ''): string {
  if (v === undefined || v === null) return fallback;
  return String(v);
}

export function Drd2CombatPanel({
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

  // ── Local pending patch (debounced flush) ──
  const [pending, setPending] = useState<Record<string, unknown>>({});
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
          onSuccess: () => {
            setPending({});
          },
          onError: (e) =>
            toast.error(
              `Uložení selhalo: ${e instanceof Error ? e.message : 'neznámá chyba'}`,
            ),
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

  // ── Effective customData = base z BE merged s pending edits ──
  const baseCd = diary?.customData ?? {};
  const cd: Record<string, unknown> = { ...baseCd, ...pending };

  const str = (k: string): string => asStr(cd[k]);

  if (isLoading) {
    return (
      <div className={styles.root}>
        <div className={styles.loading}>NAČÍTÁM DATA…</div>
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

  const basicProfs = safeParseArr<BasicProf>(cd['drd2_basic_professions']);
  const advProfs = safeParseArr<AdvProf>(cd['drd2_advanced_professions']);
  const masterAbilities = safeParseArr<MasterAbility>(
    cd['drd2_master_abilities'],
  );
  const specAbilities = safeParseArr<SpecAbility>(cd['drd2_special_abilities']);
  const weapons = safeParseArr<Weapon>(cd['drd2_weapons']);
  const usedLevel =
    basicProfs.reduce((s, p) => s + (Number(p.level) || 0), 0) +
    advProfs.reduce((s, p) => s + (Number(p.level) || 0), 0);

  // Master groups by sourceMaster
  const masterGroups: Record<string, MasterAbility[]> = {};
  masterAbilities.forEach((a) => {
    if (!masterGroups[a.sourceMaster]) masterGroups[a.sourceMaster] = [];
    masterGroups[a.sourceMaster].push(a);
  });

  const rollerName =
    token.instanceName ?? token.characterData?.name ?? 'Postava';

  const doRoll = (label: string, modifier: number): void => {
    if (!onRoll) return;
    onRoll({ label: `${rollerName} — ${label}`, modifier, kind: 'd6' });
  };

  return (
    <div className={styles.root}>
      {/* Iniciativa quick-roll */}
      {onRoll && (
        <div className={styles.initRow}>
          <button
            type="button"
            className={styles.initBtn}
            onClick={() => doRoll('Iniciativa', 0)}
            title="Hodit iniciativu (d6)"
          >
            ⚡ Iniciativa
          </button>
        </div>
      )}

      {/* Celková úroveň */}
      <div className={styles.totalLevel}>
        <span className={styles.totalLevelLabel}>
          Úroveň (využitá / celková)
        </span>
        <div className={styles.totalLevelValue}>
          <span className={styles.totalLevelUsed} aria-label="Využitá úroveň">
            {usedLevel}
          </span>
          <span className={styles.totalLevelSep}>/</span>
          <input
            className={styles.totalLevelInput}
            value={str('drd2_total_level') || String(usedLevel)}
            disabled={!canEdit}
            onChange={(e) => writeField('drd2_total_level', e.target.value)}
            aria-label="Celková úroveň"
          />
        </div>
      </div>

      <div className={styles.grid}>
        {/* LEVÝ SLOUPEC */}
        <div className={styles.column}>
          {/* Zdroje */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Zdroje</h3>
            <ResourceBar
              label="Tělo"
              color={RESOURCE_COLORS.body}
              curKey="drd2_body"
              maxKey="drd2_body_max"
              scarsKey="drd2_body_scars"
              cd={cd}
              canEdit={canEdit}
              writeField={writeField}
            />
            <ResourceBar
              label="Duše"
              color={RESOURCE_COLORS.soul}
              curKey="drd2_soul"
              maxKey="drd2_soul_max"
              scarsKey="drd2_soul_scars"
              cd={cd}
              canEdit={canEdit}
              writeField={writeField}
            />
            <ResourceBar
              label="Vliv"
              color={RESOURCE_COLORS.influence}
              curKey="drd2_influence"
              maxKey="drd2_influence_max"
              scarsKey="drd2_influence_scars"
              cd={cd}
              canEdit={canEdit}
              writeField={writeField}
            />
          </div>

          {/* Ohrožení / Výhoda */}
          <div className={styles.section}>
            <div className={styles.megaGrid}>
              <div className={`${styles.megaBox} ${styles.megaBoxDanger}`}>
                <div
                  className={`${styles.megaLabel} ${styles.megaLabelDanger}`}
                >
                  Ohrožení
                </div>
                <input
                  className={`${styles.megaInput} ${styles.megaInputDanger}`}
                  value={str('drd2_threat')}
                  disabled={!canEdit}
                  onChange={(e) => writeField('drd2_threat', e.target.value)}
                  aria-label="Ohrožení"
                />
              </div>
              <div className={`${styles.megaBox} ${styles.megaBoxAdvantage}`}>
                <div
                  className={`${styles.megaLabel} ${styles.megaLabelAdvantage}`}
                >
                  Výhoda
                </div>
                <input
                  className={`${styles.megaInput} ${styles.megaInputAdvantage}`}
                  value={str('drd2_advantage')}
                  disabled={!canEdit}
                  onChange={(e) => writeField('drd2_advantage', e.target.value)}
                  aria-label="Výhoda"
                />
              </div>
            </div>
          </div>

          {/* Rasa & Povaha */}
          {(str('drd2_race_ability') || str('drd2_personality')) && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Rasa a Povaha</h3>
              <div className={styles.identityCard}>
                {str('drd2_race_ability') && (
                  <div
                    className={`${styles.identityLine} ${styles.identityLineRace}`}
                  >
                    <strong>Rasová ZS:</strong> {str('drd2_race_ability')}
                  </div>
                )}
                {str('drd2_personality') && (
                  <div
                    className={`${styles.identityLine} ${styles.identityLinePersonality}`}
                  >
                    <strong>Rys:</strong> {str('drd2_personality')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Zbraně */}
          {weapons.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Zbraně a Zbroje</h3>
              {weapons.map((w, i) => {
                const charMod = parseInt(asStr(w.char), 10) || 0;
                const interactive = !!onRoll && !!w.name;
                return (
                  <button
                    key={i}
                    type="button"
                    className={styles.weaponRow}
                    style={
                      interactive
                        ? undefined
                        : { cursor: 'default', pointerEvents: 'none' }
                    }
                    disabled={!interactive}
                    onClick={() => {
                      if (interactive) {
                        doRoll(`Zbraň: ${w.name}`, charMod);
                      }
                    }}
                    aria-label={`Zbraň ${w.name}`}
                  >
                    <div className={styles.weaponName}>
                      {w.name || '(bez názvu)'}
                    </div>
                    {(w.char || w.note) && (
                      <div className={styles.weaponMeta}>
                        {w.char && (
                          <span>
                            Char: <b>{w.char}</b>
                          </span>
                        )}
                        {w.note && <span>Pozn: {w.note}</span>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Pomocník */}
          {str('drd2_comp_char') && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Pomocník</h3>
              <div className={styles.identityCard}>
                <div className={styles.identityLineRace}>
                  <strong>{str('drd2_comp_char')}</strong>
                </div>
                {str('drd2_comp_bond') && (
                  <div>Pouto: {str('drd2_comp_bond')}</div>
                )}
                {str('drd2_comp_pay') && (
                  <div>Platba: {str('drd2_comp_pay')}</div>
                )}
                {str('drd2_comp_bound') && (
                  <div>Hranice: {str('drd2_comp_bound')}</div>
                )}
                {str('drd2_comp_spec') && (
                  <div>ZS: {str('drd2_comp_spec')}</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* PRAVÝ SLOUPEC */}
        <div className={styles.column}>
          {/* Základní povolání */}
          {basicProfs.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Základní Povolání</h3>
              {basicProfs.map((p, i) => (
                <ProfessionRow
                  key={`b-${i}`}
                  name={p.name}
                  level={Number(p.level) || 0}
                  variant="basic"
                  onClick={
                    onRoll
                      ? () =>
                          doRoll(`Povolání: ${p.name}`, Number(p.level) || 0)
                      : undefined
                  }
                />
              ))}
            </div>
          )}

          {/* Pokročilá povolání */}
          {advProfs.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Pokročilá Povolání</h3>
              {advProfs.map((p, i) => (
                <ProfessionRow
                  key={`a-${i}`}
                  name={p.name}
                  level={Number(p.level) || 0}
                  variant="advanced"
                  onClick={
                    onRoll
                      ? () =>
                          doRoll(`Povolání: ${p.name}`, Number(p.level) || 0)
                      : undefined
                  }
                />
              ))}
            </div>
          )}

          {/* Mistrovská povolání */}
          {Object.keys(masterGroups).length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Mistrovská Povolání</h3>
              <div className={styles.masterGroupList}>
                {Object.entries(masterGroups).map(([mpId, abilities]) => (
                  <div key={mpId} className={styles.masterRow}>
                    <span className={styles.masterName}>
                      {MASTER_PROF_NAMES[mpId] ?? mpId}
                    </span>
                    <span className={styles.masterSep}>–</span>
                    <span className={styles.masterCount}>
                      {abilities.length} ZS
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Zvláštní schopnosti */}
          {specAbilities.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Zvláštní schopnosti</h3>
              {specAbilities.map(
                (za, i) =>
                  za.name && (
                    <div key={i} className={styles.specRow}>
                      <div className={styles.specName}>{za.name}</div>
                      {za.description && (
                        <div className={styles.specDesc}>{za.description}</div>
                      )}
                    </div>
                  ),
              )}
            </div>
          )}

          {/* Stavy a efekty (poznámky) */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Stavy a efekty</h3>
            <textarea
              className={styles.notesArea}
              value={str('drd2_state_effects')}
              disabled={!canEdit}
              onChange={(e) =>
                writeField('drd2_state_effects', e.target.value)
              }
              placeholder="Otrávení, probíhající kouzla, stavy…"
              aria-label="Stavy a efekty"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// ResourceBar (Tělo / Duše / Vliv)
// ────────────────────────────────────────────────────────────────────────

interface ResourceBarProps {
  label: string;
  color: string;
  curKey: string;
  maxKey: string;
  scarsKey: string;
  cd: Record<string, unknown>;
  canEdit: boolean;
  writeField: (k: string, v: string) => void;
}

function ResourceBar({
  label,
  color,
  curKey,
  maxKey,
  scarsKey,
  cd,
  canEdit,
  writeField,
}: ResourceBarProps): React.ReactElement {
  const curStr = asStr(cd[curKey]);
  const maxStr = asStr(cd[maxKey]);
  const scarsStr = asStr(cd[scarsKey]);
  const cur = parseInt(curStr, 10) || 0;
  const max = parseInt(maxStr, 10) || 0;
  const pct = max > 0 ? Math.max(0, Math.min(100, (cur / max) * 100)) : 0;

  return (
    <div className={styles.resource}>
      <div className={styles.resourceHeader}>
        <span className={styles.resourceLabel} style={{ color }}>
          {label}
        </span>
        <div className={styles.resourceInputs}>
          <input
            className={styles.resourceInputCur}
            style={{ color }}
            value={curStr}
            disabled={!canEdit}
            onChange={(e) => writeField(curKey, e.target.value)}
            aria-label={`${label} aktuální`}
          />
          <span className={styles.resourceSep}>/</span>
          <input
            className={styles.resourceInputMax}
            value={maxStr}
            disabled={!canEdit}
            onChange={(e) => writeField(maxKey, e.target.value)}
            aria-label={`${label} maximum`}
          />
        </div>
      </div>
      <div className={styles.resourceBar}>
        <div
          className={styles.resourceBarFill}
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      {scarsStr && (
        <div className={styles.resourceScars}>Jizvy: {scarsStr}</div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// ProfessionRow
// ────────────────────────────────────────────────────────────────────────

interface ProfessionRowProps {
  name: string;
  level: number;
  variant: 'basic' | 'advanced';
  onClick?: () => void;
}

function ProfessionRow({
  name,
  level,
  variant,
  onClick,
}: ProfessionRowProps): React.ReactElement {
  const interactive = !!onClick;
  return (
    <button
      type="button"
      className={`${styles.professionRow} ${variant === 'advanced' ? styles.professionRowAdvanced : ''}`.trim()}
      onClick={onClick}
      disabled={!interactive}
      style={
        interactive ? undefined : { cursor: 'default', pointerEvents: 'none' }
      }
      aria-label={`Povolání ${name} úroveň ${level}`}
    >
      <span
        className={`${styles.professionName} ${variant === 'advanced' ? styles.professionNameAdv : ''}`.trim()}
      >
        {name}
      </span>
      <span className={styles.professionRight}>
        <span className={styles.pipRow}>
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={`${styles.pip} ${i < level ? styles.pipActive : ''}`.trim()}
            />
          ))}
        </span>
        <span className={styles.professionLevel}>{level}</span>
      </span>
    </button>
  );
}
