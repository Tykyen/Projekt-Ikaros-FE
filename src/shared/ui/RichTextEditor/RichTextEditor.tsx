import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect } from 'react';
import { getExtensions } from './extensions';
import { RTEBubbleMenu } from './BubbleMenu';
import s from './RichTextEditor.module.css';

export interface RichTextEditorProps {
  /** HTML obsah (TipTap output je HTML string). */
  value: string;
  /** Volá se při změně obsahu (TipTap onUpdate). Nezávisí na auto-save. */
  onChange?: (html: string) => void;
  /** Placeholder text (default „Začněte psát…"). */
  placeholder?: string;
  /** Maximální délka HTML obsahu. Soft limit (přesah → onChange se nezavolá). */
  maxLength?: number;
  /** Read-only mode pro detail page (skryje bubble menu, prosezené prose styling). */
  readOnly?: boolean;
  /** Aktivuje drop cap pro první písmeno (jen v readOnly). */
  withDropCap?: boolean;
  /** ARIA label pro contenteditable oblast (accessibility / testy). */
  ariaLabel?: string;
  className?: string;
}

/**
 * 3.2b — sdílený TipTap editor. Bubble menu se 7 tlačítky (B/I/H2/H3/quote/list/link).
 *
 * Read-only mode (`<RichTextEditor value={article.content} readOnly withDropCap />`)
 * renderuje HTML jako prose s typografií Editorial Atelier (max-width 65ch,
 * Crimson Pro body font, Fraunces drop cap přes CSS `::first-letter`).
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder,
  maxLength,
  readOnly,
  withDropCap,
  ariaLabel,
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: getExtensions({ placeholder }),
    content: value,
    editable: !readOnly,
    immediatelyRender: false,
    // ⚠️ editorProps musí být vždy objekt — TipTap `createView` čte
    // `editorProps.dispatchTransaction` bez null-checku; `undefined` → crash.
    editorProps: ariaLabel
      ? { attributes: { 'aria-label': ariaLabel, role: 'textbox' } }
      : {},
    onUpdate({ editor }) {
      if (readOnly) return;
      const html = editor.getHTML();
      if (maxLength && html.length > maxLength) return;
      onChange?.(html);
    },
  });

  // Sync external value changes (BE load, restore from local draft).
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() === value) return;
    editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  if (!editor) return null;

  const wrapperClass = [
    s.wrapper,
    readOnly ? s.readOnly : '',
    withDropCap ? s.withDropCap : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClass}>
      {!readOnly && <RTEBubbleMenu editor={editor} />}
      <EditorContent editor={editor} className={s.content} />
    </div>
  );
}
