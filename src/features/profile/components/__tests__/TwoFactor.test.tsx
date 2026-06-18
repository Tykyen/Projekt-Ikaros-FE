import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TotpCard } from '../TotpCard';
import { TrustedDevicesCard } from '../TrustedDevicesCard';

vi.mock('@/features/auth/api/useAuth', () => ({ useMyProfile: vi.fn() }));
vi.mock('@/features/profile/api/useProfile', () => ({
  useTrustedDevices: vi.fn(() => ({ data: [] })),
  useRevokeTrustedDevice: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useDisableTotp: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useRegenerateBackupCodes: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useTotpSetup: vi.fn(() => ({ mutate: vi.fn() })),
  useEnableTotp: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

import { useMyProfile } from '@/features/auth/api/useAuth';
import { useTrustedDevices } from '@/features/profile/api/useProfile';

const mockProfile = useMyProfile as unknown as ReturnType<typeof vi.fn>;
const mockDevices = useTrustedDevices as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => vi.clearAllMocks());

describe('TotpCard (14.1)', () => {
  it('bez 2FA → nabízí zapnutí', () => {
    mockProfile.mockReturnValue({ data: { totpEnabled: false } });
    render(<TotpCard />);
    expect(screen.getByText('Zapnout 2FA')).toBeDefined();
    expect(screen.getByText('Vypnuto')).toBeDefined();
  });

  it('se zapnutým 2FA → nabízí vypnutí + nové kódy', () => {
    mockProfile.mockReturnValue({ data: { totpEnabled: true } });
    render(<TotpCard />);
    expect(screen.getByText('Vypnout 2FA')).toBeDefined();
    expect(screen.getByText('Nové záložní kódy')).toBeDefined();
    expect(screen.getByText('🔒 Aktivní')).toBeDefined();
  });
});

describe('TrustedDevicesCard (14.1)', () => {
  it('bez 2FA → nic nerenderuje', () => {
    mockProfile.mockReturnValue({ data: { totpEnabled: false } });
    mockDevices.mockReturnValue({ data: [] });
    const { container } = render(<TrustedDevicesCard />);
    expect(container.firstChild).toBeNull();
  });

  it('zobrazí zařízení + odznak aktuálního', () => {
    mockProfile.mockReturnValue({ data: { totpEnabled: true } });
    mockDevices.mockReturnValue({
      data: [
        {
          id: 'd1',
          label: 'Chrome · Windows',
          lastUsedAt: '2026-06-18T10:00:00.000Z',
          createdAt: '2026-06-18T10:00:00.000Z',
          current: true,
        },
      ],
    });
    render(<TrustedDevicesCard />);
    expect(screen.getByText('Chrome · Windows')).toBeDefined();
    expect(screen.getByText(/toto zařízení/)).toBeDefined();
  });
});
