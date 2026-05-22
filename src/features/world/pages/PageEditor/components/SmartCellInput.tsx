import { useEffect, useMemo, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Link2, X, FileText, ExternalLink, FilePlus2 } from 'lucide-react';
import type { PageDirectoryEntry } from '../../api/pages.types';
import { slugify } from '../lib/slugify';
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

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
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
  const [query, setQuery] = useState('');
  const [urlDraft, setUrlDraft] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
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
  });

  // Sync externí změny hodnoty (hydratace z BE, aplikace šablony).
  useEffect(() => {
    if (!editor) return;
    if (cleanHtml(editor.getHTML()) === value) return;
    editor.commands.setContent(value || '', { emitUpdate: false });
  }, [editor, value]);

  // Zavři picker na klik mimo / Escape.
  useEffect(() => {
    if (!pickerOpen) return;
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setPickerOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setPickerOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [pickerOpen]);

  const matches = useMemo(() => {
    const q = normalize(query.trim());
    const list = q
      ? directory.filter(
          (d) =>
            normalize(d.title).includes(q) || normalize(d.slug).includes(q),
        )
      : directory;
    return list.slice(0, 8);
  }, [directory, query]);

  // Odkaz na stránku, která zatím neexistuje — uživatel zadá jen název,
  // slug se odvodí stejnou funkcí jako v editoru (až stránku založí, slug
  // se spáruje a odkaz přestane být „broken").
  const newPageSlug = slugify(query.trim());
  const showCreateOption =
    newPageSlug.length > 0 &&
    !directory.some((d) => d.slug === newPageSlug);

  const linkActive = editor?.isActive('link') ?? false;
  const hasSelection = editor ? !editor.state.selection.empty : false;
  const currentHref =
    (editor?.getAttributes('link').href as string | undefined) ?? '';

  function applyLink(href: string) {
    if (!editor || !href) return;
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    setPickerOpen(false);
    setQuery('');
    setUrlDraft('');
  }

  function removeLink() {
    editor?.chain().focus().extendMarkRange('link').unsetLink().run();
    setPickerOpen(false);
  }

  return (
    <div className={s.wrap} ref={wrapRef}>
      <div className={s.inputRow}>
        <div className={s.editorWrap}>
          <EditorContent editor={editor} />
        </div>
        <button
          type="button"
          className={`${s.linkBtn} ${linkActive ? s.linkBtnActive : ''}`}
          onClick={() => {
            // Otevírám picker — předvyplň hledání označeným textem
            // (např. označíš „Hlavní město" → picker rovnou hledá tu stránku).
            if (!pickerOpen && editor && !linkActive) {
              const { from, to } = editor.state.selection;
              const selected = editor.state.doc.textBetween(from, to).trim();
              if (selected) setQuery(selected);
            }
            setPickerOpen((v) => !v);
          }}
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

      {pickerOpen && (
        <div className={s.picker} role="dialog" aria-label="Odkaz na stránku">
          {linkActive && (
            <div className={s.currentLink}>
              {/^https?:\/\//i.test(currentHref) ? (
                <ExternalLink size={12} aria-hidden />
              ) : (
                <FileText size={12} aria-hidden />
              )}
              <span className={s.currentLinkText}>{currentHref}</span>
              <button
                type="button"
                onClick={removeLink}
                className={s.clearBtn}
                aria-label="Odebrat odkaz"
              >
                <X size={12} aria-hidden />
              </button>
            </div>
          )}

          {!linkActive && !hasSelection ? (
            <p className={s.hint}>
              Nejdřív označ kus textu v buňce, pak vyber cíl odkazu.
            </p>
          ) : (
            <>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Hledat stránku nebo zadat název…"
                className={s.search}
                autoFocus
              />
              <ul className={s.list}>
                {matches.length === 0 && !showCreateOption ? (
                  <li className={s.empty}>Žádná stránka neodpovídá.</li>
                ) : (
                  matches.map((d) => (
                    <li key={d.id}>
                      <button
                        type="button"
                        className={s.option}
                        onClick={() => applyLink(d.slug)}
                      >
                        <FileText size={13} aria-hidden />
                        <span className={s.optionTitle}>{d.title}</span>
                        <span className={s.optionSlug}>/{d.slug}</span>
                      </button>
                    </li>
                  ))
                )}
                {showCreateOption && (
                  <li>
                    <button
                      type="button"
                      className={`${s.option} ${s.optionCreate}`}
                      onClick={() => applyLink(newPageSlug)}
                    >
                      <FilePlus2 size={13} aria-hidden />
                      <span className={s.optionTitle}>
                        Odkázat na „{query.trim()}"
                      </span>
                      <span className={s.optionSlug}>
                        zatím neexistuje
                      </span>
                    </button>
                  </li>
                )}
              </ul>
              <div className={s.urlRow}>
                <input
                  type="text"
                  value={urlDraft}
                  onChange={(e) => setUrlDraft(e.target.value)}
                  placeholder="…nebo URL (https://)"
                  className={s.urlInput}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && urlDraft.trim()) {
                      e.preventDefault();
                      applyLink(urlDraft.trim());
                    }
                  }}
                />
                <button
                  type="button"
                  className={s.urlBtn}
                  disabled={!urlDraft.trim()}
                  onClick={() => applyLink(urlDraft.trim())}
                >
                  OK
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
