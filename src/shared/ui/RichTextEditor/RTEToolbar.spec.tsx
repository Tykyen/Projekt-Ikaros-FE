import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { Editor } from '@tiptap/react';
import { RTEToolbar } from './RTEToolbar';

function makeEditor() {
  const run = vi.fn();
  const setImage = vi.fn(() => ({ run }));
  const focus = vi.fn(() => ({ setImage }));
  const chain = vi.fn(() => ({ focus }));
  return { editor: { chain } as unknown as Editor, setImage, run };
}

describe('RTEToolbar', () => {
  it('zobrazí tlačítko Obrázek', () => {
    const { editor } = makeEditor();
    render(<RTEToolbar editor={editor} onImageUpload={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Vložit obrázek' })).toBeTruthy();
  });

  it('po uploadu vloží obrázek do editoru', async () => {
    const { editor, setImage } = makeEditor();
    const onImageUpload = vi.fn().mockResolvedValue('https://cdn/x.jpg');
    render(<RTEToolbar editor={editor} onImageUpload={onImageUpload} />);

    const file = new File(['x'], 'x.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText('Vybrat obrázek k vložení');
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(onImageUpload).toHaveBeenCalledWith(file));
    await waitFor(() =>
      expect(setImage).toHaveBeenCalledWith({ src: 'https://cdn/x.jpg' }),
    );
  });
});
