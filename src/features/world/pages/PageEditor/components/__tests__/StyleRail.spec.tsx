import { describe, it, expect } from 'vitest';
import { useEffect, useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Editor } from '@tiptap/react';
import { RichTextEditor } from '@/shared/ui/RichTextEditor';
import { StyleRail } from '../StyleRail';

/** Harness — propojí reálný editor přes `onEditorReady` se StyleRailem. */
function Harness({ onEditor }: { onEditor: (e: Editor | null) => void }) {
  const [editor, setEditor] = useState<Editor | null>(null);
  useEffect(() => {
    onEditor(editor);
  }, [editor, onEditor]);
  return (
    <>
      <RichTextEditor value="<p>Ahoj svete</p>" onEditorReady={setEditor} />
      <StyleRail editor={editor} />
    </>
  );
}

async function renderReady() {
  let captured: Editor | null = null;
  render(<Harness onEditor={(e) => { captured = e; }} />);
  await waitFor(() => expect(captured).not.toBeNull());
  return captured!;
}

describe('StyleRail', () => {
  it('editor=null → skeleton, žádná tlačítka', () => {
    render(<StyleRail editor={null} />);
    expect(screen.getByText('Nástroje')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Tučně/ }),
    ).not.toBeInTheDocument();
  });

  it('vykreslí všechna formátovací tlačítka', async () => {
    await renderReady();
    for (const name of [
      /Tučně/,
      /Kurzíva/,
      /Podtržení/,
      /Přeškrtnutí/,
      /Horní index/,
      /Dolní index/,
      /Odrážky/,
      /Číslovaný seznam/,
      /Odkaz/,
      /Smazat formátování/,
      /Zpět/,
    ]) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
  });

  it('klik na Tučně zapne bold na vybraném textu', async () => {
    const editor = await renderReady();
    editor.commands.selectAll();
    await userEvent.click(screen.getByRole('button', { name: /Tučně/ }));
    await waitFor(() => expect(editor.isActive('bold')).toBe(true));
  });

  it('klik na Podtržení zapne underline', async () => {
    const editor = await renderReady();
    editor.commands.selectAll();
    await userEvent.click(screen.getByRole('button', { name: /Podtržení/ }));
    await waitFor(() => expect(editor.isActive('underline')).toBe(true));
  });

  it('blok select přepne odstavec na Nadpis 2', async () => {
    const editor = await renderReady();
    editor.commands.selectAll();
    await userEvent.selectOptions(screen.getByRole('combobox'), 'Nadpis 2');
    await waitFor(() => expect(editor.getHTML()).toContain('<h2>'));
  });

  it('color input reaktivně zrcadlí barvu z editoru', async () => {
    const editor = await renderReady();
    const colorInput = screen.getByLabelText('Barva textu') as HTMLInputElement;
    // StyleRail čte barvu přes useEditorState — po setColor se input
    // hodnota musí přepočítat (důkaz reaktivity railu).
    editor.commands.selectAll();
    editor.chain().focus().setColor('#ff0000').run();
    await waitFor(() => expect(colorInput.value).toBe('#ff0000'));
  });
});
