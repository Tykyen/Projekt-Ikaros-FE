import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditStickyBar } from '../components/EditStickyBar';

describe('EditStickyBar (8.1)', () => {
  it('Uložit je disabled bez změn', () => {
    render(
      <EditStickyBar
        dirty={false}
        isPending={false}
        onSave={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByText('Uložit změny').closest('button')).toBeDisabled();
  });

  it('při dirty ukáže indikátor a povolí Uložit', () => {
    render(
      <EditStickyBar
        dirty
        isPending={false}
        onSave={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByText('Neuložené změny')).toBeInTheDocument();
    expect(
      screen.getByText('Uložit změny').closest('button'),
    ).not.toBeDisabled();
  });

  it('při isPending zamkne obě tlačítka', () => {
    render(
      <EditStickyBar
        dirty
        isPending
        onSave={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByText('Uložit změny').closest('button')).toBeDisabled();
    expect(screen.getByText('Zrušit').closest('button')).toBeDisabled();
  });

  it('volá onSave a onCancel', () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    render(
      <EditStickyBar
        dirty
        isPending={false}
        onSave={onSave}
        onCancel={onCancel}
      />,
    );
    fireEvent.click(screen.getByText('Uložit změny'));
    fireEvent.click(screen.getByText('Zrušit'));
    expect(onSave).toHaveBeenCalledOnce();
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
