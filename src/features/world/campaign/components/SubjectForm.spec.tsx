import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SubjectForm } from './SubjectForm';

describe('SubjectForm', () => {
  it('odešle jméno + rozparsované štítky', () => {
    const onSubmit = vi.fn();
    render(
      <SubjectForm open onClose={() => {}} onSubmit={onSubmit} />,
    );
    fireEvent.change(screen.getByPlaceholderText('Jméno subjektu'), {
      target: { value: 'Aragorn' },
    });
    fireEvent.change(screen.getByPlaceholderText('politika, magie'), {
      target: { value: 'král, hrdina ,' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Vytvořit' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      name: 'Aragorn',
      tags: ['král', 'hrdina'],
    });
  });

  it('bez jména neodešle a ukáže chybu', () => {
    const onSubmit = vi.fn();
    render(<SubjectForm open onClose={() => {}} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: 'Vytvořit' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Jméno je povinné')).toBeTruthy();
  });
});
