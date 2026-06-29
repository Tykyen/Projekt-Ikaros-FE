/**
 * Příběhy Impéria (pi) bestie statblok (taktická mapa), sci-fi HUD.
 * Derivát MatrixBestiePanel — sladěný s PiCombatPanel/PiSheet (osekaný Matrix).
 *
 * Mechanika (jako Matrix bestie):
 *   - HP = odvozené `clamp(maxHP + zbroj − zranění, 0, maxHP)` (track), PJ
 *     edituje MAX HP / Zbroj / Zranění; zbroj je skrytá vrstva (hráč nevidí),
 *     `health.current` se ukládá jako výsledek (token HP bar).
 *   - Iniciativa = pole „bonus" (`initiative.base`) + hod 4dF+bonus.
 *   - Pohyb = info. Schopnosti = pips 1–10 + 🎲 hod (4dF+stupeň). Poznámky autosave.
 *
 * Data: `token.systemStats` (pi:token schema) + `token.abilities` + `token.notes`.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { bestiarQueryKey } from '@/features/world/bestiar/hooks/useBestiar';
import type { BestiarResponse } from '@/features/world/bestiar/types';
import { useTokenUpdate } from '../../../hooks/useTokenUpdate';
import { performSheetRoll } from '../../../utils/rollFromSheet';
import { systemEntitySchemaRegistry } from '../../../schemas/registry';
import {
  PI_SKILL_MAX_NPC,
  piLevelName,
} from '@/features/world/pages/CharacterDetailPage/diary-systems/sheets/pi/constants';
import type { MapToken } from '../../../types';
import type { MapRollRequest } from '../../../hooks/useMapDiceRoll';
import styles from './PiBestiePanel.module.css';

interface Props {
  token: MapToken;
  sceneId: string;
  worldId: string;
  systemId: string;
  canEdit: boolean;
  onMapRoll?: (req: MapRollRequest) => void;
}

interface AbilityDraft {
  label: string;
  value: string;
}

const AUTOSAVE_DEBOUNCE_MS = 500;
const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));
const lvlVar = (lvl: number): string => `var(--lvl-${Math.min(Math.max(lvl, 1), 10)})`;

/** Robustní coerce abilities (CH-040): snapshot bývá {name,description}, cross-system {label,value}. */
function toAbilityDraft(a: unknown): AbilityDraft {
  const raw = a as { name?: string; description?: string; label?: string; value?: string };
  return { label: raw.name ?? raw.label ?? '', value: raw.description ?? raw.value ?? '' };
}

export function PiBestiePanel({
  token,
  sceneId,
  worldId,
  systemId,
  canEdit,
  onMapRoll,
}: Props): React.ReactElement {
  const qc = useQueryClient();
  const update = useTokenUpdate(sceneId, worldId);

  const baseStats: Record<string, unknown> = useMemo(() => {
    const s: Record<string, unknown> =
      token.systemStats && Object.keys(token.systemStats).length > 0
        ? { ...token.systemStats }
        : {
            'health.current': token.currentHp,
            'health.max': token.maxHp,
            armor: token.armor,
            injury: token.injury,
            movement: token.movement,
            'initiative.current': token.initiative,
            'initiative.base': token.initiativeBase,
          };
    if (s['health.max'] === undefined) s['health.max'] = token.maxHp ?? 10;
    return s;
  }, [token]);

  const [stats, setStats] = useState<Record<string, unknown>>(baseStats);
  const [abilities, setAbilities] = useState<AbilityDraft[]>(
    (token.abilities ?? []).map(toAbilityDraft),
  );
  const [notes, setNotes] = useState<string>(token.notes ?? '');

  const cached = qc.getQueryData<BestiarResponse>(bestiarQueryKey(worldId, systemId));
  const bestie = token.templateId
    ? [...(cached?.user ?? []), ...(cached?.world ?? []), ...(cached?.system ?? [])].find(
        (b) => b.id === token.templateId,
      )
    : null;
  const templateNotes = canEdit ? bestie?.notes : undefined;

  const num = (key: string, fb = 0): number => {
    const v = stats[key];
    const n = typeof v === 'number' ? v : parseInt(String(v ?? fb), 10);
    return Number.isFinite(n) ? n : fb;
  };
  const maxHp = num('health.max', 10);
  const armor = num('armor', 0);
  const injury = num('injury', 0);
  const hp = clamp(maxHp + armor - injury, 0, maxHp);
  const armorLeft = Math.max(0, armor - injury);
  const initBase = num('initiative.base', 0);

  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<{
    stats: Record<string, unknown>;
    abilities: AbilityDraft[];
    notes: string;
  } | null>(null);

  const flush = useCallback(() => {
    const p = pendingRef.current;
    if (!p) return;
    pendingRef.current = null;
    const schema = systemEntitySchemaRegistry.get(systemId, 'token');
    const known = new Set(schema?.sections.flatMap((s) => s.fields.map((f) => f.key)) ?? []);
    const cleanStats =
      known.size > 0 ? Object.fromEntries(Object.entries(p.stats).filter(([k]) => known.has(k))) : p.stats;
    update.mutate(
      {
        tokenId: token.id,
        patch: {
          systemStats: cleanStats,
          abilities: p.abilities
            .filter((a) => a.label.trim())
            .map((a) => ({ name: a.label.trim(), description: a.value })),
          notes: p.notes,
        },
      },
      { onError: (e) => toast.error(`Uložení selhalo: ${e instanceof Error ? e.message : 'chyba'}`) },
    );
  }, [systemId, token.id, update]);

  const scheduleSave = useCallback(
    (next: { stats?: Record<string, unknown>; abilities?: AbilityDraft[]; notes?: string }) => {
      if (!canEdit) return;
      pendingRef.current = {
        stats: next.stats ?? pendingRef.current?.stats ?? stats,
        abilities: next.abilities ?? pendingRef.current?.abilities ?? abilities,
        notes: next.notes ?? pendingRef.current?.notes ?? notes,
      };
      if (flushTimer.current) clearTimeout(flushTimer.current);
      flushTimer.current = setTimeout(flush, AUTOSAVE_DEBOUNCE_MS);
    },
    [canEdit, stats, abilities, notes, flush],
  );

  useEffect(() => () => { if (flushTimer.current) clearTimeout(flushTimer.current); }, []);

  const setStat = (key: string, value: number): void => {
    setStats((prev) => {
      const next = { ...prev, [key]: value };
      const nMax = key === 'health.max' ? value : num('health.max', 10);
      const nArmor = key === 'armor' ? value : num('armor', 0);
      const nInj = key === 'injury' ? value : num('injury', 0);
      next['health.current'] = clamp(nMax + nArmor - nInj, 0, nMax);
      scheduleSave({ stats: next });
      return next;
    });
  };

  const updateAbility = (i: number, patch: Partial<AbilityDraft>): void => {
    setAbilities((prev) => {
      const next = prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a));
      scheduleSave({ abilities: next });
      return next;
    });
  };
  const addAbility = (): void => {
    setAbilities((prev) => {
      const next = [...prev, { label: '', value: '1' }];
      scheduleSave({ abilities: next });
      return next;
    });
  };
  const removeAbility = (i: number): void => {
    setAbilities((prev) => {
      const next = prev.filter((_, idx) => idx !== i);
      scheduleSave({ abilities: next });
      return next;
    });
  };
  const setNotesVal = (v: string): void => {
    setNotes(v);
    scheduleSave({ notes: v });
  };

  const rollerName = token.instanceName ?? 'Bestie';
  const handleInitiative = (): void => {
    const res = performSheetRoll({ label: 'Iniciativa', modifier: initBase, kind: 'fate', rollerName });
    if (!res) return;
    onMapRoll?.({ category: 'initiative', dicePayload: res.dicePayload, tokenId: token.id, rollerKind: 'bestie', rollerName });
    update.mutate({ tokenId: token.id, patch: { initiative: res.total }, skipInvalidate: true });
    setStats((s) => ({ ...s, 'initiative.current': res.total }));
  };
  const handleAbilityRoll = (a: AbilityDraft): void => {
    const res = performSheetRoll({ label: a.label, modifier: parseInt(a.value, 10) || 0, kind: 'fate', rollerName });
    if (!res) return;
    onMapRoll?.({ category: 'skill', dicePayload: res.dicePayload, tokenId: token.id, rollerKind: 'bestie', rollerName });
  };

  const hpMod = hp >= Math.ceil(maxHp * 0.6) ? '' : hp >= Math.ceil(maxHp * 0.3) ? 'warn' : 'crit';

  return (
    <div className={styles.panel} data-system="pi">
      {/* ZDRAVÍ */}
      <section className={styles.section}>
        <h3 className={styles.title}>Zdraví</h3>
        <div className={styles.hpHead}>
          <span className={styles.hpLab}>❤ Životy</span>
          <span className={styles.hpNum}>{hp}<small>/{maxHp}</small></span>
        </div>
        <div className={styles.track}>
          {Array.from({ length: Math.max(0, maxHp) }).map((_, i) => (
            <i key={i} className={styles.seg} data-on={i < hp} data-mod={i < hp ? hpMod : ''} />
          ))}
        </div>
        {canEdit && armor > 0 && (
          <div className={styles.absorb}>
            <span>🛡 Zbroj pohlcuje:</span>
            <span className={styles.absorbPill}>{armorLeft} / {armor}</span>
            <span className={styles.absorbHint}>(skryté hráči)</span>
          </div>
        )}
      </section>

      {/* BOJ (jen PJ) */}
      {canEdit && (
        <section className={styles.section}>
          <h3 className={styles.title}>
            Boj
            <button type="button" className={styles.init} onClick={handleInitiative} title={`Iniciativa = 4dF + ${initBase}`}>
              ⚡ Iniciativa
            </button>
          </h3>
          <div className={styles.boj}>
            <NumField label="Max HP" value={maxHp} min={1} onChange={(v) => setStat('health.max', v)} />
            <NumField label="🛡 Zbroj" value={armor} min={0} onChange={(v) => setStat('armor', v)} />
            <NumField label="Zranění" value={injury} min={0} onChange={(v) => setStat('injury', v)} />
            <NumField label="Pohyb" hint="(info)" value={num('movement', 5)} min={0} onChange={(v) => setStat('movement', v)} />
            <NumField label="⚡ Iniciativa (bonus)" wide value={initBase} onChange={(v) => setStat('initiative.base', v)} />
          </div>
        </section>
      )}

      {/* SCHOPNOSTI */}
      <section className={styles.section}>
        <h3 className={styles.title}>Schopnosti</h3>
        <div className={styles.list}>
          {abilities.map((a, i) => {
            const lvl = parseInt(a.value, 10) || 0;
            const total = Math.max(PI_SKILL_MAX_NPC, lvl);
            return (
              <div key={i} className={styles.skill} style={{ ['--lvlc' as string]: lvlVar(lvl) } as CSSProperties}>
                {canEdit ? (
                  <input
                    className={styles.skillInput}
                    value={a.label}
                    placeholder="Název"
                    onChange={(e) => updateAbility(i, { label: e.target.value })}
                    aria-label="Název schopnosti"
                  />
                ) : (
                  <span className={styles.skillName}>{a.label || '(bez názvu)'}</span>
                )}
                <span className={styles.pips}>
                  {Array.from({ length: total }).map((_, p) => {
                    const on = p < lvl;
                    return canEdit ? (
                      <button
                        key={p}
                        type="button"
                        className={styles.pip}
                        data-on={on}
                        style={on ? ({ ['--lvlc' as string]: lvlVar(lvl) } as CSSProperties) : undefined}
                        onClick={() => updateAbility(i, { value: String(p + 1) })}
                        aria-label={`Stupeň ${p + 1}`}
                      />
                    ) : (
                      <i key={p} className={styles.pip} data-on={on} style={on ? ({ ['--lvlc' as string]: lvlVar(lvl) } as CSSProperties) : undefined} />
                    );
                  })}
                </span>
                <span className={styles.lvl} title={`${lvl} — ${piLevelName(lvl)}`}>{lvl}</span>
                {a.label.trim() && (
                  <button type="button" className={styles.roll} onClick={() => handleAbilityRoll(a)} title={`Hodit ${a.label} (4dF + ${lvl})`} aria-label={`Hodit ${a.label}`}>
                    🎲
                  </button>
                )}
                {canEdit && (
                  <button type="button" className={styles.del} onClick={() => removeAbility(i)} title="Smazat" aria-label="Smazat schopnost">
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {canEdit && (
          <button type="button" className={styles.add} onClick={addAbility}>
            + Přidat schopnost
          </button>
        )}
      </section>

      {/* POZNÁMKY (jen PJ, autosave) */}
      {canEdit && (
        <section className={styles.section}>
          <h3 className={styles.title}>Poznámky (tato instance)</h3>
          <textarea
            className={styles.notes}
            value={notes}
            placeholder="Poznámky jen k tomuhle tokenu…"
            onChange={(e) => setNotesVal(e.target.value)}
            rows={3}
            aria-label="Poznámky instance"
          />
          {templateNotes && templateNotes.trim() && (
            <div className={styles.tmpl}>
              <b>📜 Poznámky k šabloně:</b> {templateNotes}
              <span className={styles.tmplHint}> (jen pro PJ, edit v Bestiáři)</span>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function NumField({
  label,
  hint,
  value,
  min,
  wide,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min?: number;
  wide?: boolean;
  onChange: (v: number) => void;
}): React.ReactElement {
  return (
    <div className={styles.fld} style={wide ? { gridColumn: '1 / -1' } : undefined}>
      <label>
        {label}
        {hint && <span className={styles.fldHint}> {hint}</span>}
      </label>
      <input
        className={styles.num}
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(Math.max(min ?? -999, parseInt(e.target.value, 10) || 0))}
        aria-label={label}
      />
    </div>
  );
}

export default PiBestiePanel;
