import { useMemo, useState } from 'react';
import { Lock, Plus, X, ShieldPlus, ChevronUp, ChevronDown } from 'lucide-react';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldMembers } from '@/features/world/api/useWorldMembers';
import { WorldRole } from '@/shared/types';
import { RichTextEditor } from '@/shared/ui/RichTextEditor';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { HeroUploadCard } from '../components/HeroUploadCard';
import { TablePanel } from './TablePanel';
import type {
  AccessRequirement,
  AkjTab,
  PageTable,
} from '../../api/pages.types';
import s from './AkjTabsPanel.module.css';

const EMPTY_TABLE: PageTable = {
  hasTable: false,
  title: '',
  headers: [],
  values: [],
};

interface Props {
  akjTabs: AkjTab[];
  onChange: (next: AkjTab[]) => void;
}

const WORLD_ROLE_LABELS: Record<number, string> = {
  [WorldRole.Ctenar]: 'Čtenář',
  [WorldRole.Hrac]: 'Hráč',
  [WorldRole.Korektor]: 'Korektor',
  [WorldRole.PomocnyPJ]: 'Pomocný PJ',
  [WorldRole.PJ]: 'Pán jeskyně',
};

/* ── access[] helpery — clearance/role drží max 1 záznam, hráči N ── */
const clearanceOf = (a: AccessRequirement[]) =>
  a.find((r) => r.type === 'AKJ')?.value ?? '';
const roleOf = (a: AccessRequirement[]) =>
  a.find((r) => r.type === 'Role')?.value ?? '';
const userIdsOf = (a: AccessRequirement[]) =>
  a.filter((r) => r.type === 'UserId').map((r) => r.value);

function setSingle(
  a: AccessRequirement[],
  type: 'AKJ' | 'Role',
  value: string,
): AccessRequirement[] {
  const without = a.filter((r) => r.type !== type);
  return value ? [...without, { type, value }] : without;
}

function freshTab(preset?: 'pj'): AkjTab {
  if (preset === 'pj') {
    return {
      id: crypto.randomUUID(),
      name: 'PJ informace',
      order: 0,
      access: [{ type: 'Role', value: String(WorldRole.PomocnyPJ) }],
    };
  }
  return { id: crypto.randomUUID(), name: 'Nová AKJ záložka', order: 0, access: [] };
}

/**
 * spec-akj-protected-tabs — editor chráněných záložek stránky. Každá záložka má
 * pravidlo viditelnosti (clearance / role / konkrétní hráči, OR) a volitelný
 * override obrázku + textu (jinak dědí ze základní stránky).
 */
export function AkjTabsPanel({ akjTabs, onChange }: Props) {
  function add(preset?: 'pj') {
    onChange([...akjTabs, { ...freshTab(preset), order: akjTabs.length }]);
  }
  function update(id: string, patch: Partial<AkjTab>) {
    onChange(akjTabs.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }
  function remove(id: string) {
    onChange(
      akjTabs.filter((t) => t.id !== id).map((t, i) => ({ ...t, order: i })),
    );
  }
  function move(id: string, dir: -1 | 1) {
    const idx = akjTabs.findIndex((t) => t.id === id);
    const to = idx + dir;
    if (to < 0 || to >= akjTabs.length) return;
    const next = [...akjTabs];
    [next[idx], next[to]] = [next[to], next[idx]];
    onChange(next.map((t, i) => ({ ...t, order: i })));
  }

  return (
    <CollapsiblePanel
      title="Chráněné záložky (AKJ)"
      icon={<Lock size={18} aria-hidden />}
      badge={akjTabs.length > 0 ? `${akjTabs.length}` : undefined}
    >
      <p className={s.hint}>
        Každá záložka se zobrazí v liště jen tomu, kdo splní aspoň jednu
        podmínku. PJ vidí vše, pomocný PJ jen co mu povolíš. Obrázek a text se
        dají přepsat — co necháš prázdné, dědí ze základní stránky.
      </p>

      <div className={s.addRow}>
        <button type="button" className={s.addBtn} onClick={() => add()}>
          <Plus size={14} aria-hidden /> AKJ záložka
        </button>
        <button type="button" className={s.addBtn} onClick={() => add('pj')}>
          <ShieldPlus size={14} aria-hidden /> PJ informace
        </button>
      </div>

      {akjTabs.map((tab, i) => (
        <AkjTabCard
          key={tab.id}
          tab={tab}
          isFirst={i === 0}
          isLast={i === akjTabs.length - 1}
          onUpdate={(patch) => update(tab.id, patch)}
          onRemove={() => remove(tab.id)}
          onMove={(dir) => move(tab.id, dir)}
        />
      ))}
    </CollapsiblePanel>
  );
}

function AkjTabCard({
  tab,
  isFirst,
  isLast,
  onUpdate,
  onRemove,
  onMove,
}: {
  tab: AkjTab;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (patch: Partial<AkjTab>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const { worldId } = useWorldContext();
  const { data: members = [] } = useWorldMembers(worldId);
  const [userSearch, setUserSearch] = useState('');

  const grantedUserIds = userIdsOf(tab.access);
  const userMatches = useMemo(() => {
    if (userSearch.trim().length < 1) return [];
    const q = userSearch.toLowerCase();
    return members
      .filter(
        (m) =>
          m.user?.username?.toLowerCase().includes(q) &&
          !grantedUserIds.includes(m.user.id),
      )
      .slice(0, 6);
  }, [members, userSearch, grantedUserIds]);

  function setAccess(next: AccessRequirement[]) {
    onUpdate({ access: next });
  }
  function setOverride(patch: {
    imageUrl?: string;
    content?: string;
    table?: PageTable;
  }) {
    onUpdate({ contentOverride: { ...tab.contentOverride, ...patch } });
  }

  return (
    <div className={s.card}>
      <div className={s.cardHead}>
        <input
          type="text"
          className={s.nameInput}
          value={tab.name}
          placeholder="Název záložky"
          onChange={(e) => onUpdate({ name: e.target.value })}
        />
        <div className={s.cardActions}>
          <button
            type="button"
            className={s.iconBtn}
            disabled={isFirst}
            onClick={() => onMove(-1)}
            aria-label="Posunout nahoru"
          >
            <ChevronUp size={14} aria-hidden />
          </button>
          <button
            type="button"
            className={s.iconBtn}
            disabled={isLast}
            onClick={() => onMove(1)}
            aria-label="Posunout dolů"
          >
            <ChevronDown size={14} aria-hidden />
          </button>
          <button
            type="button"
            className={s.removeBtn}
            onClick={onRemove}
            aria-label={`Smazat záložku ${tab.name}`}
          >
            <X size={14} aria-hidden />
          </button>
        </div>
      </div>

      {/* Kdo vidí */}
      <fieldset className={s.access}>
        <legend className={s.legend}>Kdo vidí</legend>
        <div className={s.accessGrid}>
          <label className={s.field}>
            <span className={s.fieldLabel}>Globální úroveň (clearance)</span>
            <input
              type="number"
              min={0}
              className={s.input}
              value={clearanceOf(tab.access)}
              placeholder="—"
              onChange={(e) =>
                setAccess(setSingle(tab.access, 'AKJ', e.target.value))
              }
            />
          </label>
          <label className={s.field}>
            <span className={s.fieldLabel}>Minimální role</span>
            <select
              className={s.input}
              value={roleOf(tab.access)}
              onChange={(e) =>
                setAccess(setSingle(tab.access, 'Role', e.target.value))
              }
            >
              <option value="">—</option>
              {Object.entries(WORLD_ROLE_LABELS).map(([level, label]) => (
                <option key={level} value={level}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <span className={s.fieldLabel}>Konkrétní hráči</span>
        {grantedUserIds.length > 0 && (
          <div className={s.chips}>
            {grantedUserIds.map((uid) => {
              const m = members.find((x) => x.user?.id === uid);
              return (
                <span key={uid} className={s.chip}>
                  {m?.user?.username ?? uid.slice(0, 8)}
                  <button
                    type="button"
                    onClick={() =>
                      setAccess(
                        tab.access.filter(
                          (r) => !(r.type === 'UserId' && r.value === uid),
                        ),
                      )
                    }
                    aria-label={`Odebrat hráče ${m?.user?.username ?? uid}`}
                  >
                    <X size={12} aria-hidden />
                  </button>
                </span>
              );
            })}
          </div>
        )}
        <input
          type="text"
          className={s.input}
          value={userSearch}
          placeholder="Hledat hráče…"
          onChange={(e) => setUserSearch(e.target.value)}
        />
        {userMatches.length > 0 && (
          <ul className={s.userList}>
            {userMatches.map((m) => (
              <li key={m.user?.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (m.user?.id) {
                      setAccess([
                        ...tab.access,
                        { type: 'UserId', value: m.user.id },
                      ]);
                      setUserSearch('');
                    }
                  }}
                >
                  {m.user?.username ?? m.user?.id}
                </button>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      {/* Override obsahu */}
      <fieldset className={s.access}>
        <legend className={s.legend}>Obsah záložky (jinak dědí)</legend>
        <span className={s.fieldLabel}>Obrázek</span>
        <p className={s.subHint}>
          Prázdné = dědí obrázek základní stránky.
        </p>
        <div className={s.imageWrap}>
          <HeroUploadCard
            compact
            value={tab.contentOverride?.imageUrl ?? ''}
            onChange={(url) => setOverride({ imageUrl: url })}
          />
        </div>

        <span className={s.fieldLabel}>Text</span>
        <RichTextEditor
          value={tab.contentOverride?.content ?? ''}
          onChange={(html) => setOverride({ content: html })}
          placeholder="Text, který uvidí jen ti s přístupem…"
        />

        <span className={s.fieldLabel}>Atributy &amp; metadata (boxy)</span>
        <p className={s.subHint}>
          Prázdné = dědí tabulku základní stránky.
        </p>
        <TablePanel
          table={tab.contentOverride?.table ?? EMPTY_TABLE}
          onChange={(table) => setOverride({ table })}
        />
      </fieldset>
    </div>
  );
}
