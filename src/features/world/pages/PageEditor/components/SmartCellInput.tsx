import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Link2 } from 'lucide-react';
import { LinkPickerPopover } from '@/shared/ui/LinkPicker';
import { useWorldContext } from '@/features/world/context/WorldContext';
import type { PageDirectoryEntry } from '../../api/pages.types';
import { slugify } from '../lib/slugify';
import { useBrokenLinkDecoration } from '../hooks/useBrokenLinkDecoration';
import s from './SmartCellInput.module.css';

interface Props {
  /** HTML obsah buňky (text + inline `<a>` odkazy). */
  value: string;
  onChange: (html: string) => void;
  /** Adresář stránek světa pro autocomplete odkazu. */
  directory: PageDirectoryEntry[];
  placeholder?: string;
}

/** TipTap buňku obaluje do `<p>`; buňka je inline → strip vnější odstavec. */
function cleanHtml(html: string): string {
  const trimmed = html.trim();
  if (trimmed === '<p></p>') return '';
  return trimmed.replace(/^<p>/, '').replace(/<\/p>$/, '');
}

/**
 * 8.5 — Buňka atributové tabulky jako mini rich-text editor. Text +
 * inline odkazy: označíš úsek, 🔗 → vybereš stránku světa nebo URL → ten
 * úsek se stane odkazem. V jedné buňce klidně víc odkazů na různá místa.
 */
export function SmartCellInput({
  value,
  onChange,
  directory,
  placeholder,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState('');
  const linkBtnRef = useRef<HTMLButtonElement>(null);
  const { worldSlug } = useWorldContext();
  // 7.2m — propadlé odkazy v buňce červeně (parita s read mode i ostatními editory).
  const brokenExt = useBrokenLinkDecoration(directory, worldSlug);

  const editor = useEditor(
    {
      extensions: [
        // Minimální sada — jen text + odkazy (žádné nadpisy/seznamy/marky).
        StarterKit.configure({
          heading: false,
          bulletList: false,
          orderedList: false,
          listItem: false,
          blockquote: false,
          codeBlock: false,
          code: false,
          horizontalRule: false,
          strike: false,
          bold: false,
          italic: false,
          link: {
            openOnClick: false,
            autolink: false,
            HTMLAttributes: { rel: null, target: null },
          },
        }),
        Placeholder.configure({ placeholder: placeholder ?? 'Hodnota' }),
        brokenExt,
      ],
      content: value || '',
      immediatelyRender: false,
    editorProps: {
      attributes: { class: s.editor },
      // Single-line — Enter nevkládá nový odstavec.
      handleKeyDown: (_view, event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          return true;
        }
        return false;
      },
    },
      onUpdate: ({ editor: e }) => onChange(cleanHtml(e.getHTML())),
    },
    // Re-init když dorazí directory (jinak by broken ext měl prázdný slug index
    // a všechny odkazy by svítily červeně).
    [brokenExt],
  );

  // Sync externí změny hodnoty (hydratace z BE, aplikace šablony).
  useEffect(() => {
    if (!editor) return;
    if (cleanHtml(editor.getHTML()) === value) return;
    editor.commands.setContent(value || '', { emitUpdate: false });
  }, [editor, value]);

  const linkActive = editor?.isActive('link') ?? false;
  const hasSelection = editor ? !editor.state.selection.empty : false;
  const currentHref =
    (editor?.getAttributes('link').href as string | undefined) ?? '';

  function openPicker() {
    if (!editor) return;
    // Odkaz potřebuje text — bez selekce a bez aktivního odkazu nemáme co
    // označit (title tlačítka napovídá). Předvyplň hledání označeným textem.
    if (!linkActive && !hasSelection) return;
    if (!linkActive) {
      const { from, to } = editor.state.selection;
      setInitialQuery(editor.state.doc.textBetween(from, to).trim());
    } else {
      setInitialQuery('');
    }
    setPickerOpen(true);
  }

  function applyLink(href: string) {
    if (!editor || !href) return;
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
  }

  function removeLink() {
    editor?.chain().focus().extendMarkRange('link').unsetLink().run();
  }

  return (
    <div className={s.wrap}>
      <div className={s.inputRow}>
        <div className={s.editorWrap}>
          <EditorContent editor={editor} />
        </div>
        <button
          ref={linkBtnRef}
          type="button"
          className={`${s.linkBtn} ${linkActive ? s.linkBtnActive : ''}`}
          onClick={() => (pickerOpen ? setPickerOpen(false) : openPicker())}
          title={
            linkActive
              ? 'Upravit odkaz'
              : hasSelection
                ? 'Vložit odkaz na označený text'
                : 'Označ text a přidej odkaz'
          }
          aria-label="Odkaz"
          aria-expanded={pickerOpen}
        >
          <Link2 size={13} aria-hidden />
        </button>
      </div>

      <LinkPickerPopover
        anchorRef={linkBtnRef}
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={applyLink}
        onRemove={linkActive ? removeLink : undefined}
        directory={directory}
        makeSlug={slugify}
        allowUrl
        currentHref={linkActive ? currentHref : undefined}
        initialQuery={initialQuery}
      />
    </div>
  );
}
