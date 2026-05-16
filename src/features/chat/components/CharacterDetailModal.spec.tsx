import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CharacterDetailModal } from './CharacterDetailModal';

// usePublicUserProfile mockujeme — testujeme jen render stavů modalu.
const useProfile = vi.fn();
vi.mock('@/features/users/api/usePublicUserProfile', () => ({
  usePublicUserProfile: (id?: string) => useProfile(id),
}));

const profile = {
  id: 'u1',
  characterName: 'Aragorn',
  characterBio: 'Hraničář ze severu.',
  characterAvatarUrl: null,
  defaultAvatarType: 'being',
};

describe('CharacterDetailModal', () => {
  beforeEach(() => useProfile.mockReset());

  it('userId null → modal se nevykreslí', () => {
    useProfile.mockReturnValue({ data: undefined, isLoading: false });
    render(<CharacterDetailModal userId={null} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('success → ukáže jméno i popis postavy', () => {
    useProfile.mockReturnValue({ data: profile, isLoading: false });
    render(<CharacterDetailModal userId="u1" onClose={vi.fn()} />);
    expect(screen.getByText('Aragorn')).toBeInTheDocument();
    expect(screen.getByText('Hraničář ze severu.')).toBeInTheDocument();
  });

  it('403 → hláška o skrytém profilu', () => {
    useProfile.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { status: 403 },
    });
    render(<CharacterDetailModal userId="u1" onClose={vi.fn()} />);
    expect(
      screen.getByText('Profil této postavy je skrytý.'),
    ).toBeInTheDocument();
  });

  it('jiná chyba → obecná hláška', () => {
    useProfile.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { status: 500 },
    });
    render(<CharacterDetailModal userId="u1" onClose={vi.fn()} />);
    expect(
      screen.getByText('Postavu se nepodařilo načíst.'),
    ).toBeInTheDocument();
  });
});
