import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
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

function renderRail(isManager: boolean) {
  return render(
    <ChatContextRail
      worldId="w1"
      channel={channel}
      activeChannelId="c1"
      isManager={isManager}
      currentUser={user}
      presence={[]}
    />,
  );
}

describe('ChatContextRail (16.1a–c)', () => {
  beforeEach(() => {
    mockMembersData = [];
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

  it('PJ → výběr NPC ze searche → deník NPC (npc)', () => {
    const { getByTestId } = renderRail(true);
    fireEvent.click(getByTestId('pick-npc'));
    expect(getByTestId('diary').textContent).toBe('Duch|duch|npc|true');
  });

  it('PJ → výběr bestie ze searche → statblok bestie', () => {
    const { getByTestId, queryByTestId } = renderRail(true);
    fireEvent.click(getByTestId('pick-bestie'));
    expect(queryByTestId('diary')).toBeNull();
    expect(getByTestId('bestie').textContent).toBe('Skřet');
  });
});
