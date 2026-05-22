import { useMemo, useState } from 'react';
import { ShieldCheck, Plus, X, AlertTriangle } from 'lucide-react';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldSettings } from '@/features/world/api/useWorldSettings';
import { useWorldMembers } from '@/features/world/api/useWorldMembers';
import { WorldRole } from '@/shared/types';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { AkjCreateModal } from '../components/AkjCreateModal';
import type { AccessRequirement } from '../../api/pages.types';
import s from './AccessPanel.module.css';

interface Props {
  accessRequirements: AccessRequirement[];
  onChange: (next: AccessRequirement[]) => void;
}

const WORLD_ROLE_LABELS: Record<number, string> = {
  [WorldRole.Zadatel]: 'Žadatel',
  [WorldRole.Ctenar]: 'Čtenář',
  [WorldRole.Hrac]: 'Hráč',
  [WorldRole.Korektor]: 'Korektor',
  [WorldRole.PomocnyPJ]: 'Pomocný PJ',
  [WorldRole.PJ]: 'Pán jeskyně',
};

/**
 * 7.2e — Editor přístupových práv stránky. 4 typy requirementů:
 *  - UserId — whitelist konkrétních hráčů (z useWorldMembers)
 *  - AKJ — minimální číselná úroveň přístupového klíče
 *  - AKJType — pojmenovaná skupina (key z world.settings.akjTypes)
 *  - Role — minimální world role
 *
 * Primární AKJType výběr = dropdown existujících; sekundární „+ Nový AKJ" otevře
 * AkjCreateModal (existence handling + auto-create meta stránky).
 *
 * Stale AKJ detection: pokud `accessRequirements` ukazuje na key, který už není
 * v `world.settings.akjTypes`, chip dostane warning + možnost odebrat.
 */
export function AccessPanel({ accessRequirements, onChange }: Props) {
  const { worldId } = useWorldContext();
  const { data: settings } = useWorldSettings(worldId);
  const { data: members = [] } = useWorldMembers(worldId);

  const akjTypes = settings?.akjTypes ?? [];
  const validAkjKeys = useMemo(() => new Set(akjTypes.map((a) => a.key)), [akjTypes]);

  const [akjModalOpen, setAkjModalOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  function add(req: AccessRequirement) {
    // dedupe
    if (
      accessRequirements.some(
        (r) => r.type === req.type && r.value === req.value,
      )
    )
      return;
    onChange([...accessRequirements, req]);
  }

  function remove(idx: number) {
    onChange(accessRequirements.filter((_, i) => i !== idx));
  }

  const userMatches = useMemo(() => {
    if (userSearch.trim().length < 1) return [];
    const q = userSearch.toLowerCase();
    return members
      .filter((m) => m.user?.username?.toLowerCase().includes(q))
      .slice(0, 6);
  }, [members, userSearch]);

  return (
    <CollapsiblePanel
      title="Přístupová práva"
      icon={<ShieldCheck size={18} aria-hidden />}
      badge={accessRequirements.length > 0 ? `${accessRequirements.length}` : undefined}
    >
      {/* Current requirements chips */}
      {accessRequirements.length > 0 && (
        <div className={s.chips}>
          {accessRequirements.map((req, i) => {
            const isStaleAkjType =
              req.type === 'AKJType' && !validAkjKeys.has(req.value);
            return (
              <span
                key={`${req.type}-${req.value}-${i}`}
                className={`${s.chip} ${isStaleAkjType ? s.chipStale : ''}`}
              >
                <span className={s.chipType}>{req.type}</span>
                <span className={s.chipValue}>
                  {chipLabel(req, akjTypes, members)}
                </span>
                {isStaleAkjType && (
                  <span title="Tento AKJ byl smazán ve světě" className={s.staleIcon}>
                    <AlertTriangle size={12} aria-hidden />
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label={`Odebrat ${req.type} ${req.value}`}
                  className={s.chipRemove}
                >
                  <X size={12} aria-hidden />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Add new requirement — 3 groups */}
      <div className={s.addGrid}>
        {/* AKJ Type */}
        <div className={s.addGroup}>
          <span className={s.addLabel}>AKJ úroveň (skupina)</span>
          <div className={s.addRow}>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  add({ type: 'AKJType', value: e.target.value });
                }
              }}
              className={s.select}
            >
              <option value="">Vybrat AKJ…</option>
              {akjTypes.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.name} (level {a.level})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setAkjModalOpen(true)}
              className={s.addNewBtn}
            >
              <Plus size={14} aria-hidden /> Nový
            </button>
          </div>
        </div>

        {/* World role */}
        <div className={s.addGroup}>
          <span className={s.addLabel}>Minimální role</span>
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) {
                add({ type: 'Role', value: e.target.value });
              }
            }}
            className={s.select}
          >
            <option value="">Vybrat roli…</option>
            {Object.entries(WORLD_ROLE_LABELS).map(([level, label]) => (
              <option key={level} value={level}>
                {label} (≥ {level})
              </option>
            ))}
          </select>
        </div>

        {/* Numeric AKJ */}
        <div className={s.addGroup}>
          <span className={s.addLabel}>AKJ číselná úroveň</span>
          <NumericAkjPicker
            onAdd={(value) => add({ type: 'AKJ', value })}
          />
        </div>

        {/* UserId whitelist */}
        <div className={s.addGroup}>
          <span className={s.addLabel}>Konkrétní hráč (whitelist)</span>
          <input
            type="text"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Hledat uživatele…"
            className={s.searchInput}
          />
          {userMatches.length > 0 && (
            <ul className={s.userList}>
              {userMatches.map((m) => (
                <li key={m.user?.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (m.user?.id) {
                        add({ type: 'UserId', value: m.user.id });
                        setUserSearch('');
                      }
                    }}
                    className={s.userBtn}
                  >
                    {m.user?.username || m.user?.id}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <AkjCreateModal
        open={akjModalOpen}
        onClose={() => setAkjModalOpen(false)}
        onSelected={(key) => add({ type: 'AKJType', value: key })}
      />
    </CollapsiblePanel>
  );
}

function NumericAkjPicker({ onAdd }: { onAdd: (value: string) => void }) {
  const [level, setLevel] = useState('');
  return (
    <div className={s.addRow}>
      <input
        type="number"
        value={level}
        onChange={(e) => setLevel(e.target.value)}
        placeholder="≥ N"
        min={1}
        className={s.numericInput}
      />
      <button
        type="button"
        onClick={() => {
          if (level && Number(level) >= 0) {
            onAdd(level);
            setLevel('');
          }
        }}
        disabled={!level}
        className={s.addNewBtn}
      >
        <Plus size={14} aria-hidden /> Přidat
      </button>
    </div>
  );
}

function chipLabel(
  req: AccessRequirement,
  akjTypes: Array<{ key: string; name: string; level: number }>,
  members: Array<{ user?: { id: string; username: string; displayName?: string } }>,
): string {
  if (req.type === 'AKJType') {
    const akj = akjTypes.find((a) => a.key === req.value);
    return akj ? `${akj.name} (level ${akj.level})` : `${req.value} (smazán)`;
  }
  if (req.type === 'AKJ') return `≥ ${req.value}`;
  if (req.type === 'Role') {
    const label = WORLD_ROLE_LABELS[Number(req.value)];
    return label ?? `level ${req.value}`;
  }
  if (req.type === 'UserId') {
    const m = members.find((x) => x.user?.id === req.value);
    return m?.user?.displayName || m?.user?.username || req.value.slice(0, 8);
  }
  return req.value;
}
