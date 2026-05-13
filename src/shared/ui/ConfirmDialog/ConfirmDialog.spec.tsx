import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('vykreslí title, message a obě tlačítka', () => {
    render(
      <ConfirmDialog
        open
        onClose={() => {}}
        title="Odebrat?"
        message="Opravdu chceš?"
        confirmLabel="Odebrat"
        onConfirm={() => {}}
      />,
    );
    expect(screen.getByText('Odebrat?')).toBeInTheDocument();
    expect(screen.getByText('Opravdu chceš?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Odebrat' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zrušit' })).toBeInTheDocument();
  });

  it('klik na confirm volá onConfirm', async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        onClose={() => {}}
        title="x"
        message="y"
        confirmLabel="OK"
        onConfirm={onConfirm}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('klik na cancel volá onClose', async () => {
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        open
        onClose={onClose}
        title="x"
        message="y"
        confirmLabel="OK"
        onConfirm={() => {}}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Zrušit' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('isPending disabluje cancel a aktivuje loading na confirm', () => {
    render(
      <ConfirmDialog
        open
        onClose={() => {}}
        title="x"
        message="y"
        confirmLabel="OK"
        onConfirm={() => {}}
        isPending
      />,
    );
    expect(screen.getByRole('button', { name: 'Zrušit' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'OK' })).toBeDisabled();
  });

  it('není vykreslený když open=false', () => {
    render(
      <ConfirmDialog
        open={false}
        onClose={() => {}}
        title="x"
        message="y"
        confirmLabel="OK"
        onConfirm={() => {}}
      />,
    );
    expect(screen.queryByText('x')).not.toBeInTheDocument();
  });
});
