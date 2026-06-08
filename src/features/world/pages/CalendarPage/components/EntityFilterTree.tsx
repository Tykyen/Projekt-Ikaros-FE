import { useEffect, useMemo, useState } from 'react';
import { Search, ChevronRight, X, CalendarRange, User, Users, MapPin } from 'lucide-react';
import {
  ENTITY_GROUP_LABELS,
  ENTITY_GROUP_ORDER,
  type EntityGroup,
  type EntityIndex,
  type EntityIndexEntry,
} from '../hooks/useEntityIndex';
import s from './EntityFilterTree.module.css';

interface Props {
  index: EntityIndex;
  hiddenEntities: Set<string>;
  onToggleEntity: (id: string) => void;
  /** 9.2-followup — PJ klik na swatch → editace barvy entity (jen character entity se slugem). */
  onEntityColorClick: (entry: EntityIndexEntry) => void;
  onHideAll: () => void;
  onReset: () => void;
  expandedGroups: Set<EntityGroup>;
  onToggleGroup: (group: EntityGroup) => void;
}

const GROUP_ICON: Record<EntityGroup, React.ReactNode> = {
  gameEvents: <CalendarRange size={14} />,
  players: <User size={14} />,
  npcs: <Users size={14} />,
  locations: <MapPin size={14} />,
};

type GroupCheckState = 'all' | 'none' | 'mixed';

/**
 * 9.4 — Hierarchický filter strom postav v sidebaru.
 *
 * Funkce:
 *  - Search box (debounce 150ms) přes všechny entity, case-insensitive substring
 *  - 4 groups (Akce/Hráči/NPC/Lokace), každá collapsible (default closed)
 *  - Group checkbox = tri-state (all/none/mixed), klik toggluje všechny v group
 *  - Bulk actions: „Schovat vše", „Reset"
 *  - V search modu: group automaticky expanded pokud má match, ostatní skryté
 */
export function EntityFilterTree({
  index,
  hiddenEntities,
  onToggleEntity,
  onEntityColorClick,
  onHideAll,
  onReset,
  expandedGroups,
  onToggleGroup,
}: Props) {
  const [searchInput, setSearchInput] = useState('');
  const [debounced, setDebounced] = useState('');

  // Debounce 150ms ručně (use-debounce není v package.json). setState v
  // setTimeout callbacku je async, ne synchronně v effect body — react-hooks
  // pravidlo set-state-in-effect to neflagne.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchInput), 150);
    return () => clearTimeout(t);
  }, [searchInput]);

  const isSearching = debounced.trim().length > 0;
  const matches = useMemo(
    () => (isSearching ? index.search(debounced) : []),
    [isSearching, debounced, index],
  );
  const matchIds = useMemo(() => new Set(matches.map((m) => m.id)), [matches]);

  // Pro každou group spočítáme: visible entries + tri-state.
  function groupState(group: EntityGroup): {
    entries: EntityIndexEntry[];
    check: GroupCheckState;
    expanded: boolean;
  } {
    const all = index.groups[group];
    const entries = isSearching ? all.filter((e) => matchIds.has(e.id)) : all;
    if (entries.length === 0) return { entries, check: 'none', expanded: false };
    const hiddenCount = entries.filter((e) => hiddenEntities.has(e.id)).length;
    const check: GroupCheckState =
      hiddenCount === 0 ? 'all' : hiddenCount === entries.length ? 'none' : 'mixed';
    const expanded = isSearching ? entries.length > 0 : expandedGroups.has(group);
    return { entries, check, expanded };
  }

  function handleGroupToggle(_group: EntityGroup, entries: EntityIndexEntry[], check: GroupCheckState) {
    // tri-state: all → none (schovat všechny), none/mixed → all (zobrazit všechny).
    const shouldHide = check === 'all';
    for (const e of entries) {
      const isHidden = hiddenEntities.has(e.id);
      if (shouldHide && !isHidden) onToggleEntity(e.id);
      if (!shouldHide && isHidden) onToggleEntity(e.id);
    }
  }

  if (index.totalCount === 0) {
    return (
      <div className={s.empty}>
        <p>Žádné události v aktuálním měsíci.</p>
      </div>
    );
  }

  return (
    <div className={s.wrap}>
      <div className={s.searchBox}>
        <Search size={14} className={s.searchIcon} aria-hidden />
        <input
          type="search"
          className={s.searchInput}
          placeholder="Hledat entitu…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label="Hledat v entitách"
        />
        {searchInput && (
          <button
            type="button"
            className={s.searchClear}
            onClick={() => setSearchInput('')}
            aria-label="Vymazat hledání"
          >
            <X size={12} aria-hidden />
          </button>
        )}
      </div>

      <ul className={s.tree} role="tree" aria-label="Filtr entit kalendáře">
        {ENTITY_GROUP_ORDER.map((group) => {
          const { entries, check, expanded } = groupState(group);
          if (isSearching && entries.length === 0) return null;
          return (
            <li key={group} className={s.groupNode} role="treeitem" aria-expanded={expanded}>
              <div className={s.groupRow}>
                <button
                  type="button"
                  className={`${s.expandBtn} ${expanded ? s.expanded : ''}`}
                  onClick={() => !isSearching && onToggleGroup(group)}
                  aria-label={`${expanded ? 'Sbalit' : 'Rozbalit'} ${ENTITY_GROUP_LABELS[group]}`}
                  disabled={isSearching}
                >
                  <ChevronRight size={12} aria-hidden />
                </button>
                <label className={s.groupLabel}>
                  <input
                    type="checkbox"
                    className={s.groupCheck}
                    checked={check === 'all'}
                    ref={(el) => {
                      if (el) el.indeterminate = check === 'mixed';
                    }}
                    onChange={() => handleGroupToggle(group, entries, check)}
                    aria-label={`${check === 'all' ? 'Skrýt' : 'Zobrazit'} skupinu ${ENTITY_GROUP_LABELS[group]}`}
                  />
                  <span className={s.groupIcon}>{GROUP_ICON[group]}</span>
                  <span className={s.groupName}>{ENTITY_GROUP_LABELS[group]}</span>
                  <span className={s.groupCount}>{entries.length}</span>
                </label>
              </div>
              {expanded && (
                <ul className={s.entityList}>
                  {entries.map((e) => (
                    <li key={e.id} className={s.entityRow} role="treeitem">
                      <label className={s.entityLabel}>
                        <input
                          type="checkbox"
                          className={s.entityCheck}
                          checked={!hiddenEntities.has(e.id)}
                          onChange={() => onToggleEntity(e.id)}
                          aria-label={`${hiddenEntities.has(e.id) ? 'Zobrazit' : 'Skrýt'} ${e.name}`}
                        />
                        {e.slug ? (
                          <button
                            type="button"
                            className={s.entitySwatchBtn}
                            onClick={(ev) => {
                              ev.preventDefault();
                              ev.stopPropagation();
                              onEntityColorClick(e);
                            }}
                            aria-label={`Změnit barvu — ${e.name}`}
                            title="Změnit barvu entity"
                          >
                            <span
                              className={s.entitySwatch}
                              style={{ background: e.color }}
                              aria-hidden
                            />
                          </button>
                        ) : (
                          <span
                            className={s.entitySwatch}
                            style={{ background: e.color }}
                            aria-hidden
                          />
                        )}
                        <span className={s.entityName}>{e.name}</span>
                        <span className={s.entityCount} aria-label={`${e.eventCount} eventů`}>
                          {e.eventCount}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      <div className={s.bulkActions}>
        <button type="button" className={s.bulkBtn} onClick={onHideAll}>
          Schovat vše
        </button>
        <button type="button" className={s.bulkBtn} onClick={onReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
