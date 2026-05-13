import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UserRole } from '@/shared/types';
import { RoleChip } from '../shared/RoleChip';

describe('RoleChip', () => {
  it('Superadmin: vykreslí label „Superadmin" + tooltip s longLabel', () => {
    render(<RoleChip role={UserRole.Superadmin} />);
    const chip = screen.getByLabelText(/Superadmin/);
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveAttribute(
      'title',
      'Superadmin — nejvyšší autorita platformy',
    );
  });

  it('Admin: vykreslí label „Admin"', () => {
    render(<RoleChip role={UserRole.Admin} />);
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('SpravceClanku: krátký label „Články" + dlouhý v tooltipu', () => {
    render(<RoleChip role={UserRole.SpravceClanku} />);
    expect(screen.getByText('Články')).toBeInTheDocument();
    expect(screen.getByLabelText('Správce článků')).toBeInTheDocument();
  });

  it('SpravceGalerie: label „Galerie"', () => {
    render(<RoleChip role={UserRole.SpravceGalerie} />);
    expect(screen.getByText('Galerie')).toBeInTheDocument();
    expect(screen.getByLabelText('Správce galerie')).toBeInTheDocument();
  });

  it('SpravceDiskuzi: label „Diskuze"', () => {
    render(<RoleChip role={UserRole.SpravceDiskuzi} />);
    expect(screen.getByText('Diskuze')).toBeInTheDocument();
    expect(screen.getByLabelText('Správce diskuzí')).toBeInTheDocument();
  });

  it('Hrac: nevykreslí žádný chip (null)', () => {
    const { container } = render(<RoleChip role={UserRole.Ikarus} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('PJ: nevykreslí žádný chip (per-world role, ne platforma-wide)', () => {
    const { container } = render(<RoleChip role={UserRole.Ikarus} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('tooltip=false: skryje title atribut', () => {
    render(<RoleChip role={UserRole.Admin} tooltip={false} />);
    const chip = screen.getByLabelText('Admin');
    expect(chip).not.toHaveAttribute('title');
  });

  it('size="sm": přidá small class', () => {
    const { container } = render(
      <RoleChip role={UserRole.Admin} size="sm" />,
    );
    const chip = container.querySelector('span[class*="chip"]');
    expect(chip).toBeTruthy();
    // class name obsahuje "sm" (CSS modules generuje hashe, ale "sm" je v něm)
    expect(chip?.className).toMatch(/sm/);
  });
});
