import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { User } from '@/shared/types';
import type { ChatChannel } from '../../lib/types';
import type { RosterEntry } from '../ChannelMemberPanel';

let mockMembersData: Array<{
  userId: string;
  characterPath?: string;
  user?: { username: string };
}> = [];

type SearchResult =
  | { kind: 'npc'; slug: string; title: string; imageUrl?: string }
  | { kind: 'bestie'; bestie: { id: string; name: string } };

vi.mock('@/features/world/context/WorldContext', () => ({
  useWorldContext: () => ({ world: { system: 'matrix' } }),
}));
vi.mock('@/features/world/api/useWorldMembers', () => ({
  useWorldMembers: () => ({ data: mockMembersData }),
}));
vi.mock('./DiaryRollPanel', () => ({
  DiaryRollPanel: (p: {
    title: string;
    slug: string;
    attribution: { kind: string };
    canEdit: boolean;
  }) => (
    <div data-testid="diary">
      {p.title}|{p.slug}|{p.attribution.kind}|{String(p.canEdit)}
    </div>
  ),
}));
vi.mock('./BestieRollPanel', () => ({
  BestieRollPanel: (p: { bestie: { name: string } }) => (
    <div data-testid="bestie">{p.bestie.name}</div>
  ),
}));
vi.mock('./RailEntitySearch', () => ({
  RailEntitySearch: ({ onSelect }: { onSelect: (r: SearchResult) => void }) => (
    <div>
      <button
        data-testid="pick-npc"
        onClick={() =>
          onSelect({
            kind: 'npc',
            slug: 'duch',
            title: 'Duch',
            imageUrl: 'http://x/d.png',
          })
        }
      >
        npc
      </button>
      <button
        data-testid="pick-bestie"
        onClick={() => onSelect({ kind: 'bestie', bestie: { id: 'b1', name: 'Skřet' } })}
      >
        bestie
      </button>
    </div>
  ),
}));
// 16.1e — combat roster hook (useQuery/mutation). Mock → deterministický roster
// + odchycení add mutace. CombatRosterPanel mockujeme na „+ přidat" tlačítko.
const mockCombatMutate = vi.fn();
vi.mock('../../api/useChannelCombat', () => ({
  useChannelCombatants: () => ({ data: { combatants: [] }, isLoading: false }),
  useCombatantMutation: () => ({ mutate: mockCombatMutate, isPending: false }),
}));
vi.mock('../combat/CombatRosterPanel', () => ({
  CombatRosterPanel: ({ onAdd }: { onAdd: () => void }) => (
    <button data-testid="combat-add" onClick={onAdd}>
      add
    </button>
  ),
}));
// Bestie helpery (addBestie volá oba) — izolace od reálné stavby tokenu.
vi.mock('@/features/world/tactical-map/utils/buildSpawnToken', () => ({
  buildBestieToken: () => ({ systemStats: {} }),
}));
vi.mock('@/features/world/bestiar/lib/bestieAbilities', () => ({
  getBestieAbilities: () => [],
}));
vi.mock('../ChannelMemberPanel', () => ({
  ChannelMemberPanel: ({
    onSelectMember,
    topSlot,
  }: {
    onSelectMember: (e: RosterEntry) => void;
    topSlot?: React.ReactNode;
  }) => (
    <div>
      {topSlot}
      <button
        data-testid="select"
        onClick={() =>
          onSelectMember({
            userId: 'u2',
            username: 'Bob',
            online: true,
            characterPath: 'characters/bob',
          } as RosterEntry)
        }
      >
        members
      </button>
    </div>
  ),
}));

import { ChatContextRail } from './ChatContextRail';

const user = { id: 'u1', username: 'Alice' } as User;
const channel = { id: 'c1', name: 'Test' } as ChatChannel;

// 16.1e — ChatContextRail volá `useChannelCombatants` (useQuery) → render musí
// být obalen QueryClientProvider (D-NEW-chat-combat-test-provider).
function renderRail(isManager: boolean) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <ChatContextRail
        worldId="w1"
        channel={channel}
        activeChannelId="c1"
        isManager={isManager}
        currentUser={user}
        presence={[]}
      />
    </QueryClientProvider>,
  );
}

describe('ChatContextRail (16.1a–e)', () => {
  beforeEach(() => {
    mockMembersData = [];
    mockCombatMutate.mockClear();
  });

  it('hráč bez přiřazené postavy → empty stav', () => {
    mockMembersData = [{ userId: 'u1', user: { username: 'Alice' } }];
    const { getByText, queryByTestId } = renderRail(false);
    expect(getByText(/nemáš ve světě přiřazenou postavu/i)).toBeTruthy();
    expect(queryByTestId('diary')).toBeNull();
  });

  it('hráč s postavou → vlastní deník (self, editable)', () => {
    mockMembersData = [
      { userId: 'u1', characterPath: 'characters/alice', user: { username: 'Alice' } },
    ];
    const { getByTestId } = renderRail(false);
    expect(getByTestId('diary').textContent).toBe('Můj deník|alice|self|true');
  });

  it('PJ → klik na člena → jeho deník (pj)', () => {
    const { getByTestId } = renderRail(true);
    fireEvent.click(getByTestId('select'));
    expect(getByTestId('diary').textContent).toBe('Bob|bob|pj|true');
  });

  // 16.1e — hledání NPC/bestií se přesunulo z „Přítomní" do „Souboj" → „+ přidat";
  // výběr přidá entitu do boje (combat mutace), neotevírá deník.
  it('PJ → Souboj → přidat → NPC ze searche → přidá postavu do boje', () => {
    const { getByTestId, getByRole } = renderRail(true);
    fireEvent.click(getByRole('tab', { name: /Souboj/ }));
    fireEvent.click(getByTestId('combat-add'));
    fireEvent.click(getByTestId('pick-npc'));
    expect(mockCombatMutate).toHaveBeenCalledWith({
      op: 'add',
      data: { kind: 'character', characterSlug: 'duch', isNpc: true },
    });
  });

  it('PJ → Souboj → přidat → bestie ze searche → přidá bestii do boje', () => {
    const { getByTestId, getByRole } = renderRail(true);
    fireEvent.click(getByRole('tab', { name: /Souboj/ }));
    fireEvent.click(getByTestId('combat-add'));
    fireEvent.click(getByTestId('pick-bestie'));
    expect(mockCombatMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        op: 'add',
        data: expect.objectContaining({
          kind: 'bestie',
          bestieId: 'b1',
          name: 'Skřet',
        }),
      }),
    );
  });
});
