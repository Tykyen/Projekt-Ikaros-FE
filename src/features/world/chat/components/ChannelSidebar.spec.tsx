import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ChannelSidebar } from './ChannelSidebar';
import type { GroupWithChannels } from '../lib/types';

// Mock chat prefs — default kanál `g1` rozbalený (expandedGroups) pro testy
// viditelnosti konverzací; jednotlivý test může přepnout na sbalený.
const prefsState = vi.hoisted(() => ({ expanded: ['g1'] as string[] }));
vi.mock('../api/useChatPrefs', () => ({
  useChatPrefs: () => ({
    groupOrder: [],
    channelOrder: {},
    expandedGroups: prefsState.expanded,
    pinnedOrder: [],
    setGroupOrder: vi.fn(),
    setChannelOrder: vi.fn(),
    toggleExpanded: vi.fn(),
    setPinnedOrder: vi.fn(),
  }),
}));

function wrap(ui: ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{ui}</QueryClientProvider>;
}

const groups: GroupWithChannels[] = [
  {
    group: { id: 'g1', worldId: 'w1', name: 'Globální', order: 0 },
    channels: [
      {
        id: 'c1',
        groupId: 'g1',
        worldId: 'w1',
        name: 'obecný',
        isGlobal: false,
        accessMode: 'all',
        allowedRoles: [],
        allowedMemberIds: [],
        order: 0,
        type: 'all',
      },
    ],
  },
];

const baseProps = {
  worldId: 'w1',
  // 6.7c (revize) — kanály defaultně sbalené, sbalený ukáže jen aktivní konverzaci.
  // Mock prefs drží `g1` rozbalený pro testy viditelnosti; `c1` = aktivní.
  activeChannelId: 'c1',
  unread: new Map<string, number>(),
  onSelectChannel: () => {},
  onAddGroup: () => {},
  onAddChannel: () => {},
  onEditGroup: () => {},
  onEditChannel: () => {},
};

describe('ChannelSidebar', () => {
  beforeEach(() => {
    prefsState.expanded = ['g1'];
  });

  it('vykreslí kanály a jejich konverzace', () => {
    render(
      wrap(
        <ChannelSidebar groups={groups} canManage={false} {...baseProps} />,
      ),
    );
    expect(screen.getByText('Globální')).toBeInTheDocument();
    expect(screen.getByText('obecný')).toBeInTheDocument();
  });

  it('prázdný stav když svět nemá žádné kanály', () => {
    render(
      wrap(<ChannelSidebar groups={[]} canManage={false} {...baseProps} />),
    );
    expect(screen.getByText(/žádné kanály/i)).toBeInTheDocument();
  });

  it('tlačítko „Nový kanál" jen pro PJ (canManage)', () => {
    const { rerender } = render(
      wrap(
        <ChannelSidebar groups={groups} canManage={false} {...baseProps} />,
      ),
    );
    expect(
      screen.queryByRole('button', { name: /Nový kanál/ }),
    ).not.toBeInTheDocument();
    rerender(
      wrap(<ChannelSidebar groups={groups} canManage {...baseProps} />),
    );
    expect(
      screen.getByRole('button', { name: /Nový kanál/ }),
    ).toBeInTheDocument();
  });

  it('Settings ikony pro kanál i konverzaci se zobrazí jen pro PJ', () => {
    render(
      wrap(
        <ChannelSidebar groups={groups} canManage={false} {...baseProps} />,
      ),
    );
    expect(
      screen.queryByRole('button', { name: /Upravit kanál/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Upravit konverzaci/ }),
    ).not.toBeInTheDocument();
  });

  it('klik na Settings u kanálu předá konkrétní group do onEditGroup', async () => {
    const onEditGroup = vi.fn();
    render(
      wrap(
        <ChannelSidebar
          groups={groups}
          canManage
          {...baseProps}
          onEditGroup={onEditGroup}
        />,
      ),
    );
    await userEvent.click(
      screen.getByRole('button', { name: /Upravit kanál/ }),
    );
    expect(onEditGroup).toHaveBeenCalledWith(groups[0].group);
  });

  it('klik na Settings u konverzace předá konkrétní channel do onEditChannel', async () => {
    const onEditChannel = vi.fn();
    render(
      wrap(
        <ChannelSidebar
          groups={groups}
          canManage
          {...baseProps}
          onEditChannel={onEditChannel}
        />,
      ),
    );
    await userEvent.click(
      screen.getByRole('button', { name: /Upravit konverzaci/ }),
    );
    expect(onEditChannel).toHaveBeenCalledWith(groups[0].channels[0]);
  });

  // 6.7b — osobní reorder řadí KAŽDÝ hráč → handle se zobrazí i ne-PJ
  // (dřív 6.5a/b gated na canManage; spec-6.7 §6.7b/R5 to ruší).
  it('drag handle se zobrazí i pro ne-PJ (osobní reorder)', () => {
    render(
      wrap(
        <ChannelSidebar groups={groups} canManage={false} {...baseProps} />,
      ),
    );
    expect(
      screen.getByRole('button', { name: /Přesunout kanál Globální/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Přesunout konverzaci obecný/ }),
    ).toBeInTheDocument();
  });

  it('drag handle pro kanál i konverzaci se zobrazí PJ', () => {
    render(
      wrap(<ChannelSidebar groups={groups} canManage {...baseProps} />),
    );
    expect(
      screen.getByRole('button', { name: /Přesunout kanál Globální/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Přesunout konverzaci obecný/ }),
    ).toBeInTheDocument();
  });

  // 6.7c revize — sbalený kanál ukáže jen aktivní konverzaci, BEZ reorder handle.
  it('sbalený kanál ukáže aktivní konverzaci bez drag handle', () => {
    prefsState.expanded = []; // g1 sbalený
    render(
      wrap(<ChannelSidebar groups={groups} canManage {...baseProps} />),
    );
    // aktivní konverzace (c1) je vidět i ve sbaleném kanálu (Matrix styl)
    expect(screen.getByText('obecný')).toBeInTheDocument();
    // ale bez drag handle — reorder jen v rozbaleném kanálu
    expect(
      screen.queryByRole('button', { name: /Přesunout konverzaci obecný/ }),
    ).not.toBeInTheDocument();
  });
});
