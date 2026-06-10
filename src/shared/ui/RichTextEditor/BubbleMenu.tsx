import { useRef, useState } from 'react';
import { BubbleMenu as TipTapBubbleMenu } from '@tiptap/react/menus';
import type { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  Quote,
  List,
  Link2,
} from 'lucide-react';
import { LinkPickerPopover, type LinkSuggestion } from '@/shared/ui/LinkPicker';
import s from './BubbleMenu.module.css';

interface Props {
  editor: Editor;
  /** Adresář stránek světa pro link picker. Bez něj = jen URL režim (články). */
  linkDirectory?: LinkSuggestion[];
  /** Odvození slugu pro „zatím neexistuje" volbu (typicky `slugify`). */
  makeSlug?: (query: string) => string;
}

/**
 * 3.2b — bubble menu nad textovou selekcí. 7 tlačítek (B, I, H2, H3, „",
 * •, link). Žádný top toolbar — Medium-like clean writing experience.
 *
 * 7.2n — odkaz přes sdílený `LinkPickerPopover` (autocomplete stránek +
 * „zatím neexistuje" + URL), místo nativního `window.prompt`. Adresář je
 * volitelný — editor stránek ho předá, články/novinky ne (→ jen URL).
 */
export function RTEBubbleMenu({ editor, linkDirectory, makeSlug }: Props) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkQuery, setLinkQuery] = useState('');
  const linkBtnRef = useRef<HTMLButtonElement>(null);

  function openLink() {
    if (!editor.isActive('link')) {
      const { from, to } = editor.state.selection;
      setLinkQuery(editor.state.doc.textBetween(from, to).trim());
    } else {
      setLinkQuery('');
    }
    setLinkOpen(true);
  }

  function applyLink(href: string) {
    if (!href) return;
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
  }

  function removeLink() {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
  }

  const linkActive = editor.isActive('link');
  const currentHref =
    (editor.getAttributes('link').href as string | undefined) ?? '';

  return (
    <>
      <TipTapBubbleMenu
        editor={editor}
        options={{ placement: 'top' }}
        className={s.menu}
      >
        <Button
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          icon={<Bold size={14} />}
          title="Tučně (⌘B)"
        />
        <Button
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          icon={<Italic size={14} />}
          title="Kurzíva (⌘I)"
        />
        <Button
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          icon={<Heading2 size={14} />}
          title="Nadpis 2"
        />
        <Button
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          icon={<Heading3 size={14} />}
          title="Nadpis 3"
        />
        <Button
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          icon={<Quote size={14} />}
          title="Citát"
        />
        <Button
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          icon={<List size={14} />}
          title="Odrážky"
        />
        <button
          ref={linkBtnRef}
          type="button"
          onClick={() => (linkOpen ? setLinkOpen(false) : openLink())}
          className={linkActive ? s.btnActive : s.btn}
          title="Odkaz (⌘K)"
          aria-label="Odkaz (⌘K)"
          aria-pressed={linkActive}
          aria-expanded={linkOpen}
        >
          <Link2 size={14} />
        </button>
      </TipTapBubbleMenu>

      <LinkPickerPopover
        anchorRef={linkBtnRef}
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        onPick={applyLink}
        onRemove={linkActive ? removeLink : undefined}
        directory={linkDirectory}
        makeSlug={makeSlug}
        allowUrl
        currentHref={linkActive ? currentHref : undefined}
        initialQuery={linkQuery}
      />
    </>
  );
}

interface ButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
}

function Button({ active, onClick, icon, title }: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active ? s.btnActive : s.btn}
      title={title}
      aria-label={title}
      aria-pressed={active}
    >
      {icon}
    </button>
  );
}
