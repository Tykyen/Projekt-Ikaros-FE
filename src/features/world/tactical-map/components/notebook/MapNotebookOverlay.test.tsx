/**
 * 17.8 / D-17.8-A11Y — focus trap plného modalu (deník na mapě). TipTap je
 * nahrazen contentEditable divem (věrně: fokusovatelný, NENÍ form field), ať
 * test ověří trap wiring bez tíhy editoru.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MapNotebookOverlay } from './MapNotebookOverlay';

vi.mock('@/shared/ui/RichTextEditor', () => ({
  RichTextEditor: ({ value }: { value: string }) => (
    <div contentEditable aria-label="editor" suppressContentEditableWarning>
      {value}
    </div>
  ),
}));

function renderOverlay() {
  const onClose = vi.fn();
  const onSave = vi.fn().mockResolvedValue(undefined);
  const utils = render(
    <MapNotebookOverlay
      title="Deník"
      initialContent="<p>x</p>"
      onSave={onSave}
      onClose={onClose}
    />,
  );
  return { onClose, onSave, ...utils };
}

describe('MapNotebookOverlay — focus trap', () => {
  let outside: HTMLButtonElement;
  beforeEach(() => {
    outside = document.createElement('button');
    outside.textContent = 'venku';
    document.body.appendChild(outside);
    outside.focus();
  });
  afterEach(() => {
    outside.remove();
  });

  it('má role=dialog + aria-modal', () => {
    renderOverlay();
    const dialog = screen.getByRole('dialog', { name: 'Deník' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('při otevření přesune fokus dovnitř (na křížek)', () => {
    renderOverlay();
    const closeBtn = screen.getByRole('button', { name: 'Zavřít' });
    expect(document.activeElement).toBe(closeBtn);
  });

  it('Tab z editoru (poslední) cyklí zpět na křížek (trap drží)', () => {
    renderOverlay();
    const closeBtn = screen.getByRole('button', { name: 'Zavřít' });
    const editor = screen.getByLabelText('editor');
    editor.focus();

    fireEvent.keyDown(editor, { key: 'Tab' });

    expect(document.activeElement).toBe(closeBtn);
  });

  it('Shift+Tab z křížku (první) cyklí na editor (poslední)', () => {
    renderOverlay();
    const closeBtn = screen.getByRole('button', { name: 'Zavřít' });
    const editor = screen.getByLabelText('editor');
    closeBtn.focus();

    fireEvent.keyDown(closeBtn, { key: 'Tab', shiftKey: true });

    expect(document.activeElement).toBe(editor);
  });

  it('Escape zavře (onClose)', () => {
    const { onClose } = renderOverlay();
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('po zavření (unmount) se fokus vrátí na spouštěč', () => {
    const { unmount } = renderOverlay();
    // fokus je uvnitř overlaye
    expect(document.activeElement).not.toBe(outside);

    unmount();

    expect(document.activeElement).toBe(outside);
  });
});
