/**
 * Příběhy Impéria (pi) bestie panel v railu chatu — PLNÝ statblok, 1:1 s
 * mapovým `PiBestiePanel` (sci-fi HUD), ne osekaná karta (skill princip: v chatu
 * = týž plný panel jako na mapě).
 *
 * Liší se od mapy POUZE data-flow: edit/Iniciativa patchují combatanta přes
 * `onPatch` (debounce), hody jdou přes `useChatDiaryRoll` (overlay + zpráva)
 * místo `onMapRoll`/`useTokenUpdate`. Mechanika identická: HP odvozené
 * `clamp(maxHP+zbroj−zranění)`, zbroj pohlcuje, BOJ inline, schopnosti pips+🎲.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { systemEntitySchemaRegistry } from '@/features/world/tactical-map/schemas/registry';
import {
  PI_SKILL_MAX_NPC,
  piLevelName,
} from '@/features/world/pages/CharacterDetailPage/diary-systems/sheets/pi/constants';
import pi from '@/features/world/tactical-map/components/token-panel/system-panels/PiBestiePanel.module.css';
import { useChatDiaryRoll } from './useChatDiaryRoll';
import type { MatrixChatBestiePatch } from './MatrixChatBestieEditModal';

interface Props {
  worldId: string;
  channelId: string | null;
  systemId: string;
  rollerName: string;
  avatarUrl?: string;
  systemStats: Record<string, unknown>;
  abilities: { name: string; description: string }[];
  notes?: string;
  canEdit: boolean;
  onPatch?: (patch: MatrixChatBestiePatch) => void;
}

interface AbilityDraft {
  label: string;
  value: string;
}

const AUTOSAVE_DEBOUNCE_MS = 500;
const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));
const lvlVar = (lvl: number): string => `var(--lvl-${Math.min(Math.max(lvl, 1), 10)})`;

/** Robustní coerce (CH-040): snapshot {name,description} i cross-system {label,value}. */
function toAbilityDraft(a: unknown): AbilityDraft {
  const raw = a as { name?: string; description?: string; label?: string; value?: string };
  return { label: raw.name ?? raw.label ?? '', value: raw.description ?? raw.value ?? '' };
}

export function PiChatBestiePanel({
  worldId,
  channelId,
  systemId,
  rollerName,
  avatarUrl,
  systemStats,
  abilities: abilitiesProp,
  notes: notesProp,
  canEdit,
  onPatch,
}: Props): React.ReactElement {
  const makeOnRoll = useChatDiaryRoll(worldId, channelId);
  const onRoll = makeOnRoll({ kind: 'bestie', rollerName, avatarUrl });
  const interactive = !!channelId;
  const editable = canEdit && !!onPatch;

  const [stats, setStats] = useState<Record<string, unknown>>(() => ({ ...(systemStats ?? {}) }));
  const [abilities, setAbilities] = useState<AbilityDraft[]>(() =>
    (abilitiesProp ?? []).map(toAbilityDraft),
  );
  const [notes, setNotes] = useState<string>(notesProp ?? '');

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
  const hpMod = hp >= Math.ceil(maxHp * 0.6) ? '' : hp >= Math.ceil(maxHp * 0.3) ? 'warn' : 'crit';

  // ── autosave (debounce) → onPatch combatanta ──
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<{
    stats: Record<string, unknown>;
    abilities: AbilityDraft[];
    notes: string;
  } | null>(null);

  const flush = useCallback(() => {
    const p = pendingRef.current;
    if (!p || !onPatch) return;
    pendingRef.current = null;
    const schema = systemEntitySchemaRegistry.get(systemId, 'token');
    const known = new Set(schema?.sections.flatMap((s) => s.fields.map((f) => f.key)) ?? []);
    const cleanStats =
      known.size > 0 ? Object.fromEntries(Object.entries(p.stats).filter(([k]) => known.has(k))) : p.stats;
    onPatch({
      systemStats: cleanStats,
      abilities: p.abilities.filter((a) => a.label.trim()).map((a) => ({ name: a.label.trim(), description: a.value })),
      notes: p.notes,
    });
  }, [onPatch, systemId]);

  const scheduleSave = useCallback(
    (next: { stats?: Record<string, unknown>; abilities?: AbilityDraft[]; notes?: string }) => {
      if (!editable) return;
      pendingRef.current = {
        stats: next.stats ?? pendingRef.current?.stats ?? stats,
        abilities: next.abilities ?? pendingRef.current?.abilities ?? abilities,
        notes: next.notes ?? pendingRef.current?.notes ?? notes,
      };
      if (flushTimer.current) clearTimeout(flushTimer.current);
      flushTimer.current = setTimeout(flush, AUTOSAVE_DEBOUNCE_MS);
    },
    [editable, stats, abilities, notes, flush],
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

  const handleInitiative = (): void => {
    onRoll({ label: 'Iniciativa', modifier: initBase, kind: 'fate' }, (total) => onPatch?.({ initiative: total }));
  };
  const handleAbilityRoll = (a: AbilityDraft): void => {
    onRoll({ label: a.label, modifier: parseInt(a.value, 10) || 0, kind: 'fate' });
  };

  return (
    <div className={pi.panel} data-system="pi">
      {/* ZDRAVÍ */}
      <section className={pi.section}>
        <h3 className={pi.title}>Zdraví</h3>
        <div className={pi.hpHead}>
          <span className={pi.hpLab}>❤ Životy</span>
          <span className={pi.hpNum}>{hp}<small>/{maxHp}</small></span>
        </div>
        <div className={pi.track}>
          {Array.from({ length: Math.max(0, maxHp) }).map((_, i) => (
            <i key={i} className={pi.seg} data-on={i < hp} data-mod={i < hp ? hpMod : ''} />
          ))}
        </div>
        {editable && armor > 0 && (
          <div className={pi.absorb}>
            <span>🛡 Zbroj pohlcuje:</span>
            <span className={pi.absorbPill}>{armorLeft} / {armor}</span>
            <span className={pi.absorbHint}>(skryté hráči)</span>
          </div>
        )}
      </section>

      {/* BOJ (jen PJ) */}
      {editable && (
        <section className={pi.section}>
          <h3 className={pi.title}>
            Boj
            {interactive && (
              <button type="button" className={pi.init} onClick={handleInitiative} title={`Iniciativa = 4dF + ${initBase}`}>
                ⚡ Iniciativa
              </button>
            )}
          </h3>
          <div className={pi.boj}>
            <NumField label="Max HP" value={maxHp} min={1} onChange={(v) => setStat('health.max', v)} />
            <NumField label="🛡 Zbroj" value={armor} min={0} onChange={(v) => setStat('armor', v)} />
            <NumField label="Zranění" value={injury} min={0} onChange={(v) => setStat('injury', v)} />
            <NumField label="Pohyb" hint="(info)" value={num('movement', 5)} min={0} onChange={(v) => setStat('movement', v)} />
            <NumField label="⚡ Iniciativa (bonus)" wide value={initBase} onChange={(v) => setStat('initiative.base', v)} />
          </div>
        </section>
      )}

      {/* SCHOPNOSTI */}
      <section className={pi.section}>
        <h3 className={pi.title}>Schopnosti</h3>
        <div className={pi.list}>
          {abilities.map((a, i) => {
            const lvl = parseInt(a.value, 10) || 0;
            const total = Math.max(PI_SKILL_MAX_NPC, lvl);
            return (
              <div key={i} className={pi.skill} style={{ ['--lvlc' as string]: lvlVar(lvl) } as CSSProperties}>
                {editable ? (
                  <input
                    className={pi.skillInput}
                    value={a.label}
                    placeholder="Název"
                    onChange={(e) => updateAbility(i, { label: e.target.value })}
                    aria-label="Název schopnosti"
                  />
                ) : (
                  <span className={pi.skillName}>{a.label || '(bez názvu)'}</span>
                )}
                <span className={pi.pips}>
                  {Array.from({ length: total }).map((_, p) => {
                    const on = p < lvl;
                    return editable ? (
                      <button
                        key={p}
                        type="button"
                        className={pi.pip}
                        data-on={on}
                        style={on ? ({ ['--lvlc' as string]: lvlVar(lvl) } as CSSProperties) : undefined}
                        onClick={() => updateAbility(i, { value: String(p + 1) })}
                        aria-label={`Stupeň ${p + 1}`}
                      />
                    ) : (
                      <i key={p} className={pi.pip} data-on={on} style={on ? ({ ['--lvlc' as string]: lvlVar(lvl) } as CSSProperties) : undefined} />
                    );
                  })}
                </span>
                <span className={pi.lvl} title={`${lvl} — ${piLevelName(lvl)}`}>{lvl}</span>
                {a.label.trim() && (
                  <button
                    type="button"
                    className={pi.roll}
                    disabled={!interactive}
                    onClick={() => handleAbilityRoll(a)}
                    title={`Hodit ${a.label} (4dF + ${lvl})`}
                    aria-label={`Hodit ${a.label}`}
                  >
                    🎲
                  </button>
                )}
                {editable && (
                  <button type="button" className={pi.del} onClick={() => removeAbility(i)} title="Smazat" aria-label="Smazat schopnost">
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {editable && (
          <button type="button" className={pi.add} onClick={addAbility}>
            + Přidat schopnost
          </button>
        )}
      </section>

      {/* POZNÁMKY (jen PJ, autosave) */}
      {editable && (
        <section className={pi.section}>
          <h3 className={pi.title}>Poznámky (tato instance)</h3>
          <textarea
            className={pi.notes}
            value={notes}
            placeholder="Poznámky jen k tomuhle tokenu…"
            onChange={(e) => setNotesVal(e.target.value)}
            rows={3}
            aria-label="Poznámky instance"
          />
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
    <div className={pi.fld} style={wide ? { gridColumn: '1 / -1' } : undefined}>
      <label>
        {label}
        {hint && <span className={pi.fldHint}> {hint}</span>}
      </label>
      <input
        className={pi.num}
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(Math.max(min ?? -999, parseInt(e.target.value, 10) || 0))}
        aria-label={label}
      />
    </div>
  );
}

export default PiChatBestiePanel;
