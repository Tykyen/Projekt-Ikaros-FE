import { useRef, useState } from 'react';
import { type Editor, useEditorState } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Superscript,
  Subscript,
  List,
  ListOrdered,
  Link2,
  Eraser,
  Undo2,
  RotateCcw,
} from 'lucide-react';
import { LinkPickerPopover, type LinkSuggestion } from '@/shared/ui/LinkPicker';
import { NamedColorPalette } from '@/shared/ui';
import s from './StyleRail.module.css';

interface Props {
  /** Editor instance z `RichTextEditor` (přes `onEditorReady`). Null = ještě
   *  nehydratovaný → rail je disabled. */
  editor: Editor | null;
  /** Adresář stránek světa pro link picker (bez něj = jen URL režim). */
  directory?: LinkSuggestion[];
  /** Odvození slugu pro „zatím neexistuje" volbu (typicky `slugify`). */
  makeSlug?: (query: string) => string;
}

const DEFAULT_COLOR = '#dce6ff';

/**
 * 8.2 — Permanentní toolbar „Nástroje" vpravo od textového editoru.
 *
 * Reaktivita přes `useEditorState` — selektor přepočítá active stavy po každé
 * změně selekce/transakce, takže tlačítka korektně svítí. Bez něj by rail
 * zamrzl (TipTap editor je mutable, React o změnách neví).
 */
export function StyleRail({ editor, directory, makeSlug }: Props) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkQuery, setLinkQuery] = useState('');
  const linkBtnRef = useRef<HTMLButtonElement>(null);

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e?.isActive('bold') ?? false,
      italic: e?.isActive('italic') ?? false,
      underline: e?.isActive('underline') ?? false,
      strike: e?.isActive('strike') ?? false,
      superscript: e?.isActive('superscript') ?? false,
      subscript: e?.isActive('subscript') ?? false,
      bulletList: e?.isActive('bulletList') ?? false,
      orderedList: e?.isActive('orderedList') ?? false,
      link: e?.isActive('link') ?? false,
      color:
        (e?.getAttributes('textStyle').color as string | undefined) ?? '',
      block: e?.isActive('heading', { level: 2 })
        ? 'h2'
        : e?.isActive('heading', { level: 3 })
          ? 'h3'
          : 'paragraph',
      canUndo: e?.can().undo() ?? false,
    }),
  });

  if (!editor || !state) {
    return (
      <div className={s.rail} aria-hidden>
        <div className={s.railLabel}>Nástroje</div>
        <div className={s.skeleton} />
      </div>
    );
  }

  const chain = () => editor.chain().focus();

  function setBlock(value: string) {
    if (value === 'paragraph') {
      chain().setParagraph().run();
    } else {
      chain()
        .toggleHeading({ level: value === 'h2' ? 2 : 3 })
        .run();
    }
  }

  // Arrow (ne function declaration) → drží narrowing editor/state z guardu výše.
  const openLink = () => {
    // Předvyplň hledání označeným textem (pokud nestojíme na existujícím odkazu).
    if (!state.link) {
      const { from, to } = editor.state.selection;
      setLinkQuery(editor.state.doc.textBetween(from, to).trim());
    } else {
      setLinkQuery('');
    }
    setLinkOpen(true);
  };

  function applyLink(href: string) {
    if (!href) return;
    chain().extendMarkRange('link').setLink({ href }).run();
  }

  function removeLink() {
    chain().extendMarkRange('link').unsetLink().run();
  }

  const currentHref =
    (editor.getAttributes('link').href as string | undefined) ?? '';

  return (
    <div className={s.rail}>
      <div className={s.railLabel}>Nástroje</div>

      {/* Inline formátování. */}
      <div className={s.group}>
        <RailBtn
          active={state.bold}
          onClick={() => chain().toggleBold().run()}
          title="Tučně (⌘B)"
          icon={<Bold size={15} />}
        />
        <RailBtn
          active={state.italic}
          onClick={() => chain().toggleItalic().run()}
          title="Kurzíva (⌘I)"
          icon={<Italic size={15} />}
        />
        <RailBtn
          active={state.underline}
          onClick={() => chain().toggleUnderline().run()}
          title="Podtržení (⌘U)"
          icon={<Underline size={15} />}
        />
        <RailBtn
          active={state.strike}
          onClick={() => chain().toggleStrike().run()}
          title="Přeškrtnutí"
          icon={<Strikethrough size={15} />}
        />
        <RailBtn
          active={state.superscript}
          onClick={() => chain().toggleSuperscript().run()}
          title="Horní index"
          icon={<Superscript size={15} />}
        />
        <RailBtn
          active={state.subscript}
          onClick={() => chain().toggleSubscript().run()}
          title="Dolní index"
          icon={<Subscript size={15} />}
        />
      </div>

      {/* Seznamy. */}
      <div className={s.group}>
        <RailBtn
          active={state.bulletList}
          onClick={() => chain().toggleBulletList().run()}
          title="Odrážky"
          icon={<List size={15} />}
        />
        <RailBtn
          active={state.orderedList}
          onClick={() => chain().toggleOrderedList().run()}
          title="Číslovaný seznam"
          icon={<ListOrdered size={15} />}
        />
      </div>

      {/* Odkaz. */}
      <button
        ref={linkBtnRef}
        type="button"
        className={`${s.wideBtn} ${state.link ? s.wideBtnActive : ''}`}
        onClick={() => (linkOpen ? setLinkOpen(false) : openLink())}
        title="Odkaz (⌘K)"
        aria-expanded={linkOpen}
      >
        <Link2 size={14} aria-hidden /> Odkaz
      </button>
      <LinkPickerPopover
        anchorRef={linkBtnRef}
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        onPick={applyLink}
        onRemove={state.link ? removeLink : undefined}
        directory={directory}
        makeSlug={makeSlug}
        allowUrl
        currentHref={state.link ? currentHref : undefined}
        initialQuery={linkQuery}
      />

      {/* Akce. */}
      <div className={s.group}>
        <RailBtn
          onClick={() => chain().unsetAllMarks().run()}
          title="Smazat formátování"
          icon={<Eraser size={15} />}
        />
        <RailBtn
          onClick={() => chain().undo().run()}
          disabled={!state.canUndo}
          title="Zpět"
          icon={<Undo2 size={15} />}
        />
      </div>

      {/* Barva textu. */}
      <div className={s.colorRow}>
        <span className={s.colorLabel}>Barva textu</span>
        <div className={s.colorControls}>
          <input
            type="color"
            className={s.colorInput}
            value={state.color || DEFAULT_COLOR}
            onChange={(e) => chain().setColor(e.target.value).run()}
            aria-label="Barva textu"
          />
          <button
            type="button"
            className={s.iconBtn}
            onClick={() => chain().unsetColor().run()}
            title="Výchozí barva"
            aria-label="Výchozí barva"
          >
            <RotateCcw size={13} aria-hidden />
          </button>
        </div>
        <NamedColorPalette
          value={state.color || undefined}
          onPick={(hex) => chain().setColor(hex).run()}
        />
      </div>

      {/* Blok / nadpis. */}
      <label className={s.blockRow}>
        <span className={s.colorLabel}>Blok</span>
        <select
          className={s.blockSelect}
          value={state.block}
          onChange={(e) => setBlock(e.target.value)}
        >
          <option value="paragraph">Odstavec</option>
          <option value="h2">Nadpis 2</option>
          <option value="h3">Nadpis 3</option>
        </select>
      </label>
    </div>
  );
}

interface RailBtnProps {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
}

function RailBtn({ active, disabled, onClick, title, icon }: RailBtnProps) {
  return (
    <button
      type="button"
      className={`${s.iconBtn} ${active ? s.iconBtnActive : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={active}
    >
      {icon}
    </button>
  );
}
