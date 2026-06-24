import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ChatNavLink } from './ChatNavLink';

const unreadMock = vi.fn();
vi.mock('@/features/world/api/useWorldChat', () => ({
  useWorldChatUnread: () => unreadMock(),
}));

function renderLink() {
  return render(
    <MemoryRouter>
      <ChatNavLink worldSlug="matrix" worldId="w1" />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  unreadMock.mockReset();
});

describe('ChatNavLink', () => {
  it('odkazuje do chatu světa a má label', () => {
    unreadMock.mockReturnValue(0);
    renderLink();
    expect(screen.getByRole('link').getAttribute('href')).toBe(
      '/svet/matrix/chat',
    );
    expect(screen.getByText('Chat')).toBeTruthy();
  });

  it('neukáže badge při 0 nepřečtených', () => {
    unreadMock.mockReturnValue(0);
    renderLink();
    expect(screen.queryByLabelText(/nepřečtených/)).toBeNull();
  });

  it('ukáže počet nepřečtených', () => {
    unreadMock.mockReturnValue(5);
    renderLink();
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('zkrátí velký počet na 99+', () => {
    unreadMock.mockReturnValue(150);
    renderLink();
    expect(screen.getByText('99+')).toBeTruthy();
  });
});
