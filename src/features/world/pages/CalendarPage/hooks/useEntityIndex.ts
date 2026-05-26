import { useMemo } from 'react';

export type EntityGroup = 'gameEvents' | 'players' | 'npcs' | 'locations';

export interface EntityIndexEntry {
  /** Unique id pro hiddenEntities Set (gameEvent: 'game-events' synthetic, jinak characterId). */
  id: string;
  /** Display name. */
  name: string;
  /** Barva pro swatch. */
  color: string;
  /** Group affiliation. */
  group: EntityGroup;
  /** Lowercased name pro fast search. */
  searchKey: string;
  /** Počet eventů od této entity v aktuálním měsíci. */
  eventCount: number;
}

export interface EntityIndex {
  groups: Record<EntityGroup, EntityIndexEntry[]>;
  /** Vrátí entity matching search query (case-insensitive substring nad name). */
  search: (query: string) => EntityIndexEntry[];
  /** Total počet entit napříč všemi groups. */
  totalCount: number;
}

interface InputEvent {
  origin:
    | { kind: 'gameEvent' }
    | { kind: 'character'; raw: { characterId: string; name: string; color: string; kind: 'persona' | 'location'; isNpc: boolean } };
}

/**
 * 9.4 — Build memoized index entit z unified events. Klíč pro Filter Tree.
 *
 * Eventy se grupují per Typ → unique entity per group → seřazené dle name.
 * Pro gameEvents máme jediný synthetic „entity" s id `game-events`.
 */
export function useEntityIndex(events: ReadonlyArray<InputEvent>): EntityIndex {
  return useMemo(() => {
    const groups: Record<EntityGroup, Map<string, EntityIndexEntry>> = {
      gameEvents: new Map(),
      players: new Map(),
      npcs: new Map(),
      locations: new Map(),
    };

    for (const ev of events) {
      if (ev.origin.kind === 'gameEvent') {
        const id = 'game-events';
        const existing = groups.gameEvents.get(id);
        if (existing) {
          existing.eventCount += 1;
        } else {
          groups.gameEvents.set(id, {
            id,
            name: 'Akce světa',
            color: '#7c5cff',
            group: 'gameEvents',
            searchKey: 'akce světa',
            eventCount: 1,
          });
        }
        continue;
      }
      const ch = ev.origin.raw;
      const group: EntityGroup =
        ch.kind === 'location' ? 'locations' : ch.isNpc ? 'npcs' : 'players';
      const existing = groups[group].get(ch.characterId);
      if (existing) {
        existing.eventCount += 1;
      } else {
        groups[group].set(ch.characterId, {
          id: ch.characterId,
          name: ch.name,
          color: ch.color,
          group,
          searchKey: ch.name.toLowerCase(),
          eventCount: 1,
        });
      }
    }

    const finalGroups: Record<EntityGroup, EntityIndexEntry[]> = {
      gameEvents: [...groups.gameEvents.values()],
      players: [...groups.players.values()].sort((a, b) => a.name.localeCompare(b.name, 'cs')),
      npcs: [...groups.npcs.values()].sort((a, b) => a.name.localeCompare(b.name, 'cs')),
      locations: [...groups.locations.values()].sort((a, b) => a.name.localeCompare(b.name, 'cs')),
    };

    const totalCount =
      finalGroups.gameEvents.length +
      finalGroups.players.length +
      finalGroups.npcs.length +
      finalGroups.locations.length;

    function search(query: string): EntityIndexEntry[] {
      const q = query.trim().toLowerCase();
      if (!q) return [];
      const out: EntityIndexEntry[] = [];
      for (const group of ['gameEvents', 'players', 'npcs', 'locations'] as const) {
        for (const e of finalGroups[group]) {
          if (e.searchKey.includes(q)) out.push(e);
        }
      }
      return out;
    }

    return { groups: finalGroups, search, totalCount };
  }, [events]);
}

export const ENTITY_GROUP_LABELS: Record<EntityGroup, string> = {
  gameEvents: 'Akce světa',
  players: 'Postavy hráčů',
  npcs: 'NPC',
  locations: 'Lokace',
};

export const ENTITY_GROUP_ORDER: readonly EntityGroup[] = [
  'gameEvents',
  'players',
  'npcs',
  'locations',
];
