import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import type { Extension, Node } from '@tiptap/core';
import { useEffect } from 'react';
import { getExtensions } from './extensions';
import { RTEBubbleMenu } from './BubbleMenu';
import { RTEToolbar } from './RTEToolbar';
import type { LinkSuggestion } from '@/shared/ui/LinkPicker';
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
  /**
   * 3.3x — nahraje obrázek a vrátí jeho URL. Když zadáno, aktivuje se
   * `Image` extension + toolbar s tlačítkem „Obrázek".
   */
  onImageUpload?: (file: File) => Promise<string>;
  /**
   * 7.2a — Aktivuje `@tiptap/extension-table` pro wiki stránky. Defaultně off
   * (literární články nepoužívají tabulky).
   */
  enableTable?: boolean;
  /**
   * 7.2g — Volitelné TipTap extensions navíc (např. wikilink suggestion).
   * Předávají se přímo do `getExtensions`.
   */
  additionalExtensions?: (Extension | Node)[];
  /**
   * 8.2 — Vystaví editor instanci ven (např. pro externí StyleRail toolbar).
   * Volá se s instancí jakmile je editor ready, a s `null` při unmountu.
   */
  onEditorReady?: (editor: Editor | null) => void;
  /**
   * 7.2n — Adresář stránek světa pro link picker v bubble menu. Bez něj
   * picker degraduje na URL režim (články/novinky nemají stránky světa).
   */
  linkDirectory?: LinkSuggestion[];
  /** Odvození slugu pro „zatím neexistuje" volbu (typicky `slugify`). */
  linkMakeSlug?: (query: string) => string;
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
  onImageUpload,
  enableTable,
  additionalExtensions,
  onEditorReady,
  linkDirectory,
  linkMakeSlug,
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: getExtensions({
      placeholder,
      enableImage: !!onImageUpload,
      // Read mode musí umět vyrenderovat tabulky uložené v contentu (jinak je
      // TipTap tiše zahodí). Vzor: Superscript/Color jsou taky vždy v readOnly.
      enableTable: enableTable || readOnly,
      additionalExtensions,
    }),
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

  // 8.2 — vystav editor instanci ven (StyleRail). Cleanup → null při unmountu.
  useEffect(() => {
    if (!onEditorReady) return;
    onEditorReady(editor);
    return () => onEditorReady(null);
  }, [editor, onEditorReady]);

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
      {!readOnly && onImageUpload && (
        <RTEToolbar editor={editor} onImageUpload={onImageUpload} />
      )}
      {!readOnly && (
        <RTEBubbleMenu
          editor={editor}
          linkDirectory={linkDirectory}
          makeSlug={linkMakeSlug}
        />
      )}
      <EditorContent editor={editor} className={s.content} />
    </div>
  );
}
