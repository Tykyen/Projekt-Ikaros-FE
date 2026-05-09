import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserAvatar } from './UserAvatar';

describe('UserAvatar', () => {
  it('zobrazí src když je k dispozici', () => {
    render(
      <UserAvatar src="https://cdn.example/avatar.webp" alt="Tyky" />,
    );
    const img = screen.getByAltText('Tyky') as HTMLImageElement;
    expect(img.src).toContain('https://cdn.example/avatar.webp');
  });

  it('fallback na default male WebP když src není', () => {
    render(<UserAvatar alt="Bezavatar" />);
    const img = screen.getByAltText('Bezavatar') as HTMLImageElement;
    expect(img.src).toContain('/defaults/avatars/male');
  });

  it('fallback na default female WebP per defaultType', () => {
    render(<UserAvatar defaultType="female" alt="Žena" />);
    const img = screen.getByAltText('Žena') as HTMLImageElement;
    expect(img.src).toContain('/defaults/avatars/female');
  });

  it('fallback na default being WebP per defaultType', () => {
    render(<UserAvatar defaultType="being" alt="Bytost" />);
    const img = screen.getByAltText('Bytost') as HTMLImageElement;
    expect(img.src).toContain('/defaults/avatars/being');
  });

  it('size sm/md používá -sm variantu', () => {
    render(<UserAvatar defaultType="male" size="sm" alt="Malý" />);
    const img = screen.getByAltText('Malý') as HTMLImageElement;
    expect(img.src).toContain('male-sm');
  });

  it('size lg/xl používá full variantu', () => {
    render(<UserAvatar defaultType="male" size="xl" alt="Velký" />);
    const img = screen.getByAltText('Velký') as HTMLImageElement;
    expect(img.src).not.toContain('-sm');
    expect(img.src).toContain('male.webp');
  });
});
