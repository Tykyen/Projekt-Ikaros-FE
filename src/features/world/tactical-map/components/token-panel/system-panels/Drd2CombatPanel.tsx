/**
 * 16.2e-mapa — Drd2CombatPanel (Dračí doupě II na taktické mapě).
 *
 * Kompaktní bojový panel sladěný s deníkem `Drd2Sheet` (fantasy pergamen).
 * Single source s listem — čte/zapisuje tentýž `diary.customData` přes
 * `token.characterSlug`, prefix `drd2_` (`makeCdAccess`). Stejný datový model
 * jako nový deník (companions/rituals/special_abilities seznamy).
 *
 * Hody: vše **`2d6+`** (otevřený hod DrD). Povolání = klik na řádek → `2d6+`
 * + úroveň povolání. Iniciativa = `⚡` → `2d6+` bez modifikátoru.
 *
 * Data flow vzorem `DrdPlusCombatPanel`: `useCharacterDiary` → debounced
 * (~500 ms) `useUpdateCharacterDiary({customDataPatch})`. `canEdit === false`
 * → readonly.
 */
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useCharacterDiary } from '@/features/world/pages/api/useCharacterSubdocs';
import { useUpdateCharacterDiary } from '@/features/world/pages/api/useCharacterMutations';
import type { SystemSheetProps } from '@/features/world/pages/CharacterDetailPage/diary-systems/types';
import {
  makeCdAccess,
  type CdAccess,
} from '@/features/world/pages/CharacterDetailPage/diary-systems/_shared/cdAccess';
import type { MapToken } from '../../../types';
import styles from './Drd2CombatPanel.module.css';

interface Props {
  token: MapToken;
  sceneId: string;
  worldId: string;
  canEdit: boolean;
  onRoll?: SystemSheetProps['onRoll'];
}

const DEBOUNCE_MS = 500;

interface Weapon {
  name?: string;
  char?: string;
  note?: string;
}
interface Companion {
  char?: string;
  ability?: string;
  bound?: string;
  pay?: string;
  bond?: number;
}
interface Ritual {
  name?: string;
  charge?: number;
}
interface Prof {
  id: string;
  name: string;
  level: number;
}
interface Zs {
  name?: string;
  source?: string;
  type?: string;
  description?: string;
}

const num = (s: string, d = 0): number => {
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? d : n;
};

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

  const [pending, setPending] = useState<Record<string, unknown>>({});
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    return () => {
      if (flushTimer.current) clearTimeout(flushTimer.current);
    };
  }, []);

  function scheduleFlush(next: Record<string, unknown>): void {
    if (flushTimer.current) clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(() => {
      if (Object.keys(next).length === 0) return;
      updateMut.mutate(
        { customDataPatch: next },
        {
          onSuccess: () => setPending({}),
          onError: (e) =>
            toast.error(
              `Uložení selhalo: ${e instanceof Error ? e.message : 'neznámá chyba'}`,
            ),
        },
      );
    }, DEBOUNCE_MS);
  }

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

  const cd: Record<string, unknown> = { ...(diary.customData ?? {}), ...pending };

  const handleChange: SystemSheetProps['onChange'] = (nextChange) => {
    if (!('customDataPatch' in nextChange)) return;
    setPending((prev) => {
      const merged = { ...prev, ...nextChange.customDataPatch };
      scheduleFlush(merged);
      return merged;
    });
  };
  const cda: CdAccess = makeCdAccess(
    cd,
    'drd2_',
    canEdit ? handleChange : undefined,
  );

  const basicProfs = cda.parseJsonArr<Prof>('basic_professions');
  const advProfs = cda.parseJsonArr<Prof>('advanced_professions');
  const masterProfs = cda.parseJsonArr<Prof>('master_professions');
  const usedLevel =
    basicProfs.reduce((s, p) => s + (p.level || 0), 0) +
    advProfs.reduce((s, p) => s + (p.level || 0), 0) +
    masterProfs.reduce((s, p) => s + (p.level || 0), 0);

  const weapons = cda.parseJsonArr<Weapon>('weapons');
  const companions = cda.parseJsonArr<Companion>('companions');
  const rituals = cda.parseJsonArr<Ritual>('rituals');
  const abilities = cda.parseJsonArr<Zs>('special_abilities');

  const doRoll = (label: string, mod: number, initiative = false): void => {
    onRoll?.({
      label,
      modifier: mod,
      kind: '2d6+',
      ...(initiative && { initiative: true }),
    });
  };

  const toggle = (key: string): void =>
    setOpen((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div className={styles.root}>
      {/* Hlavička: úroveň + iniciativa (jméno nese token chrome) */}
      <div className={styles.head}>
        <span className={styles.lvl} aria-label="Využitá úroveň">
          Ú {usedLevel}/{cda.g('total_level') || usedLevel}
        </span>
        {onRoll && (
          <button
            type="button"
            className={styles.initBtn}
            onClick={() => doRoll('Iniciativa', 0, true)}
            title="Iniciativa (2k6)"
          >
            ⚡ Iniciativa
          </button>
        )}
      </div>

      {/* Zdroje */}
      <h3 className={styles.lg}>Zdroje a jizvy</h3>
      <SegTrack label="Tělo" k="body" variant="body" cda={cda} canEdit={canEdit} />
      <SegTrack label="Duše" k="soul" variant="soul" cda={cda} canEdit={canEdit} />
      <SegTrack label="Vliv" k="influence" variant="infl" cda={cda} canEdit={canEdit} />

      {/* Boj */}
      <h3 className={styles.lg}>Boj</h3>
      <Gauge label="Ohrožení" k="threat" variant="threat" cda={cda} canEdit={canEdit} />
      <Gauge label="Výhoda" k="advantage" variant="adv" cda={cda} canEdit={canEdit} />
      <textarea
        className={styles.states}
        value={cda.g('state_effects')}
        disabled={!canEdit}
        onChange={(e) => cda.set('state_effects', e.target.value)}
        placeholder="stavy a efekty…"
        aria-label="Stavy a efekty"
      />

      {/* Povolání — klik = 2k6 + úroveň */}
      <h3 className={styles.lg}>
        Povolání <small>klik = 2k6 + úroveň</small>
      </h3>
      {basicProfs.length > 0 && <div className={styles.sub}>Základní</div>}
      {basicProfs.map((p, i) => (
        <ProfRow
          key={p.id}
          prof={p}
          arrKey="basic_professions"
          idx={i}
          rows={basicProfs}
          cda={cda}
          canEdit={canEdit}
          onRoll={onRoll ? () => doRoll(p.name, p.level || 0) : undefined}
        />
      ))}
      {advProfs.length > 0 && <div className={styles.sub}>Pokročilá</div>}
      {advProfs.map((p, i) => (
        <ProfRow
          key={p.id}
          prof={p}
          arrKey="advanced_professions"
          idx={i}
          rows={advProfs}
          cda={cda}
          canEdit={canEdit}
          onRoll={onRoll ? () => doRoll(p.name, p.level || 0) : undefined}
        />
      ))}
      {masterProfs.length > 0 && <div className={styles.sub}>Mistrovská</div>}
      {masterProfs.map((p, i) => (
        <ProfRow
          key={p.id}
          prof={p}
          arrKey="master_professions"
          idx={i}
          rows={masterProfs}
          cda={cda}
          canEdit={canEdit}
          onRoll={onRoll ? () => doRoll(p.name, p.level || 0) : undefined}
        />
      ))}

      {/* Zbraně — rozevírací, read-only */}
      <CollSection
        title="Zbraně a zbroje"
        count={weapons.length}
        readonly
        open={!!open.weap}
        onToggle={() => toggle('weap')}
      >
        {weapons.map((w, i) => (
          <div className={styles.roRow} key={i}>
            <b>{w.name || '—'}</b>
            <span>{[w.char, w.note].filter(Boolean).join(' · ') || '—'}</span>
          </div>
        ))}
      </CollSection>

      {/* Pomocníci — rozevírací, editovatelné */}
      <CollSection
        title="Pomocníci"
        count={companions.length}
        open={!!open.comp}
        onToggle={() => toggle('comp')}
      >
        {companions.map((c, i) => (
          <CompanionCard key={i} row={c} idx={i} cda={cda} canEdit={canEdit} />
        ))}
        {canEdit && (
          <button
            type="button"
            className={styles.add}
            onClick={() =>
              cda.addArr<Companion>('companions', {
                char: '',
                ability: '',
                bound: '',
                pay: '',
                bond: 0,
              })
            }
          >
            + přidat pomocníka
          </button>
        )}
      </CollSection>

      {/* Rituály — rozevírací, editovatelné */}
      <CollSection
        title="Rituální předměty"
        count={rituals.length}
        open={!!open.rit}
        onToggle={() => toggle('rit')}
      >
        {rituals.map((r, i) => (
          <RitualCard key={i} row={r} idx={i} cda={cda} canEdit={canEdit} />
        ))}
        {canEdit && (
          <button
            type="button"
            className={styles.add}
            onClick={() => cda.addArr<Ritual>('rituals', { name: '', charge: 0 })}
          >
            + přidat rituální předmět
          </button>
        )}
      </CollSection>

      {/* Zvláštní schopnosti — rozevírací, read-only */}
      <CollSection
        title="Zvláštní schopnosti"
        count={abilities.length}
        readonly
        open={!!open.zs}
        onToggle={() => toggle('zs')}
      >
        {abilities.map((a, i) => (
          <div className={styles.roRow} key={i}>
            <b>
              {a.name || '—'}
              {(a.source || a.type) && (
                <span className={styles.tag}>
                  {[a.source, a.type].filter(Boolean).join(' · ')}
                </span>
              )}
            </b>
            {a.description && <span>{a.description}</span>}
          </div>
        ))}
      </CollSection>
    </div>
  );
}

// ── Segmentová stupnice zdroje ──────────────────────────────────────────

interface SegProps {
  label: string;
  k: string;
  variant: 'body' | 'soul' | 'infl';
  cda: CdAccess;
  canEdit: boolean;
}

function SegTrack({ label, k, variant, cda, canEdit }: SegProps): React.ReactElement {
  const max = Math.max(1, Math.min(20, num(cda.g(`${k}_max`, '10'), 10)));
  const cur = Math.max(0, Math.min(max, num(cda.g(k, '0'), 0)));
  return (
    <div className={`${styles.res} ${styles[variant]}`}>
      <div className={styles.resTop}>
        <span className={styles.resName}>{label}</span>
        <span className={styles.resVal} aria-label={`${label} stav`}>
          <b>{cur}</b> / {max}
        </span>
      </div>
      <div className={styles.track} role="group" aria-label={`${label} stupnice`}>
        {Array.from({ length: max }, (_, i) => i + 1).map((i) => (
          <button
            type="button"
            key={i}
            className={`${styles.seg}${i <= cur ? ' ' + styles.on : ''}`}
            disabled={!canEdit}
            onClick={() => cda.set(k, String(cur === i ? i - 1 : i))}
            aria-label={`${label} ${i}`}
            aria-pressed={i <= cur}
          />
        ))}
      </div>
      <input
        className={styles.scar}
        value={cda.g(`${k}_scars`)}
        disabled={!canEdit}
        onChange={(e) => cda.set(`${k}_scars`, e.target.value)}
        placeholder="jizvy…"
        aria-label={`${label} jizvy`}
      />
    </div>
  );
}

// ── Stupnice Ohrožení / Výhoda (1–9) ────────────────────────────────────

interface GaugeProps {
  label: string;
  k: string;
  variant: 'threat' | 'adv';
  cda: CdAccess;
  canEdit: boolean;
}

function Gauge({ label, k, variant, cda, canEdit }: GaugeProps): React.ReactElement {
  const cur = Math.max(0, Math.min(9, num(cda.g(k, '0'), 0)));
  return (
    <div className={`${styles.gauge} ${styles[variant]}`}>
      <span className={styles.gaugeLbl}>{label}</span>
      <span className={styles.gaugeBig} aria-label={label}>
        {cur}
      </span>
      <div className={styles.rungs} role="group" aria-label={`${label} stupnice`}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <button
            type="button"
            key={i}
            className={`${styles.rung}${i <= cur ? ' ' + styles.on : ''}`}
            disabled={!canEdit}
            onClick={() => cda.set(k, String(cur === i ? i - 1 : i))}
            aria-label={`${label} ${i}`}
            aria-pressed={i <= cur}
          >
            {i}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Řádek povolání (klik = hod 2k6 + úroveň) ────────────────────────────

interface ProfRowProps {
  prof: Prof;
  arrKey: string;
  idx: number;
  rows: Prof[];
  cda: CdAccess;
  canEdit: boolean;
  onRoll?: () => void;
}

function ProfRow({
  prof,
  arrKey,
  idx,
  rows,
  cda,
  canEdit,
  onRoll,
}: ProfRowProps): React.ReactElement {
  const setLevel = (lvl: number): void => {
    const copy = [...rows];
    copy[idx] = { ...prof, level: lvl };
    cda.set(arrKey, JSON.stringify(copy));
  };
  return (
    <div
      className={styles.prof}
      role="button"
      tabIndex={onRoll ? 0 : -1}
      aria-label={`Hodit povolání ${prof.name}`}
      onClick={() => onRoll?.()}
      onKeyDown={(e) => {
        if (onRoll && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onRoll();
        }
      }}
    >
      <span className={styles.profSeal} aria-hidden>
        {prof.name.charAt(0)}
      </span>
      <span className={styles.profName}>{prof.name}</span>
      <div className={styles.pips} role="group" aria-label={`${prof.name} úroveň`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            className={`${styles.dot}${prof.level >= n ? ' ' + styles.on : ''}`}
            disabled={!canEdit}
            onClick={(e) => {
              e.stopPropagation();
              setLevel(prof.level === n ? n - 1 : n);
            }}
            aria-label={`${prof.name} úroveň ${n}`}
            aria-pressed={prof.level >= n}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Rozevírací sekce ────────────────────────────────────────────────────

interface CollProps {
  title: string;
  count: number;
  readonly?: boolean;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollSection({
  title,
  count,
  readonly,
  open,
  onToggle,
  children,
}: CollProps): React.ReactElement {
  return (
    <div className={`${styles.coll}${open ? ' ' + styles.collOpen : ''}`}>
      <button
        type="button"
        className={styles.collH}
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className={styles.collTitle}>{title}</span>
        <span className={styles.collCount}>{count}</span>
        <span className={styles.collMode}>{readonly ? 'jen čtení' : 'úpravy'}</span>
        <span className={styles.collArr}>▸</span>
      </button>
      {open && <div className={styles.collBody}>{children}</div>}
    </div>
  );
}

// ── Karta pomocníka (edit) ──────────────────────────────────────────────

interface CompanionCardProps {
  row: Companion;
  idx: number;
  cda: CdAccess;
  canEdit: boolean;
}

function CompanionCard({
  row,
  idx,
  cda,
  canEdit,
}: CompanionCardProps): React.ReactElement {
  const bond = Math.max(0, Math.min(11, row.bond || 0));
  const fields: [keyof Companion, string][] = [
    ['char', 'Charakter.'],
    ['ability', 'Schopnost'],
    ['bound', 'Hranice'],
    ['pay', 'Platba'],
  ];
  return (
    <div className={styles.edCard}>
      {canEdit && (
        <button
          type="button"
          className={styles.del}
          onClick={() => cda.removeArr('companions', idx)}
          aria-label="Smazat pomocníka"
        >
          ✕
        </button>
      )}
      <div className={styles.edGrid}>
        {fields.map(([f, lbl]) => (
          <label className={styles.fr} key={f}>
            <span>{lbl}</span>
            <input
              className={styles.edLine}
              value={(row[f] as string) || ''}
              disabled={!canEdit}
              onChange={(e) =>
                cda.updateArr<Companion>('companions', idx, {
                  [f]: e.target.value,
                })
              }
              aria-label={`Pomocník ${idx + 1} ${lbl}`}
            />
          </label>
        ))}
      </div>
      <div className={styles.bondLbl}>Pouto</div>
      <div className={styles.pipRow} role="group" aria-label={`Pomocník ${idx + 1} pouto`}>
        {Array.from({ length: 11 }, (_, k) => k + 1).map((k) => (
          <button
            type="button"
            key={k}
            className={`${styles.pipSq}${k <= bond ? ' ' + styles.on : ''}`}
            disabled={!canEdit}
            onClick={() =>
              cda.updateArr<Companion>('companions', idx, {
                bond: bond === k ? k - 1 : k,
              })
            }
            aria-label={`Pouto ${k}`}
            aria-pressed={k <= bond}
          />
        ))}
      </div>
    </div>
  );
}

// ── Karta rituálu (edit) ────────────────────────────────────────────────

interface RitualCardProps {
  row: Ritual;
  idx: number;
  cda: CdAccess;
  canEdit: boolean;
}

function RitualCard({
  row,
  idx,
  cda,
  canEdit,
}: RitualCardProps): React.ReactElement {
  const charge = Math.max(0, Math.min(5, row.charge || 0));
  return (
    <div className={styles.edCard}>
      {canEdit && (
        <button
          type="button"
          className={styles.del}
          onClick={() => cda.removeArr('rituals', idx)}
          aria-label="Smazat rituální předmět"
        >
          ✕
        </button>
      )}
      <input
        className={styles.edLine}
        value={row.name || ''}
        disabled={!canEdit}
        onChange={(e) =>
          cda.updateArr<Ritual>('rituals', idx, { name: e.target.value })
        }
        placeholder="rituální předmět…"
        aria-label={`Rituál ${idx + 1} název`}
      />
      <div className={styles.bondLbl}>Náboj</div>
      <div className={styles.pipRow} role="group" aria-label={`Rituál ${idx + 1} náboj`}>
        {[1, 2, 3, 4, 5].map((k) => (
          <button
            type="button"
            key={k}
            className={`${styles.pipSq} ${styles.charge}${k <= charge ? ' ' + styles.on : ''}`}
            disabled={!canEdit}
            onClick={() =>
              cda.updateArr<Ritual>('rituals', idx, {
                charge: charge === k ? k - 1 : k,
              })
            }
            aria-label={`Náboj ${k}`}
            aria-pressed={k <= charge}
          />
        ))}
      </div>
    </div>
  );
}
