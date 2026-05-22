import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import { TextStyle, Color } from '@tiptap/extension-text-style';
import type { AnyExtension } from '@tiptap/core';

/**
 * 3.2b — TipTap extensions pro literární obsah. Záměrně bez `code`,
 * `codeBlock`, `horizontalRule` (přeplnění pro prózu). Heading omezený na
 * H2/H3 (H1 vyhrazený pro page title mimo content).
 *
 * 3.3x — `Image` extension volitelně přes `opts.enableImage` (Cloudinary
 * upload přes RTEToolbar).
 *
 * 7.2a — `Table` extension volitelně přes `opts.enableTable` (wiki stránky
 * potřebují tabulky uvnitř obsahu; literární články ne). Resizable disabled —
 * je to UX peklo na mobilu.
 *
 * 7.2g — `Suggestion`-based wikilink extension se přidává mimo `getExtensions`
 * (potřebuje runtime přístup k `usePagesDirectory`); viz `useWikilinkExtension`.
 *
 * Link i Underline jsou součást StarterKit v3 — Link konfigurujeme přes `link`
 * klíč, Underline je zapnutý defaultně (samostatné balíčky by způsobily
 * duplicitu).
 *
 * 8.2 — Superscript/Subscript + TextStyle/Color pro StyleRail toolbar.
 * Registrované **vždy** (i pro readOnly viewer — musí umět renderovat barvu
 * a horní/dolní index). `Color` vyžaduje `TextStyle` jako základ (mark
 * `textStyle` nese `color` atribut), proto registrujeme oba.
 */
export function getExtensions(
  opts: {
    placeholder?: string;
    enableImage?: boolean;
    enableTable?: boolean;
    additionalExtensions?: AnyExtension[];
  } = {},
) {
  const extensions: AnyExtension[] = [
    StarterKit.configure({
      heading: { levels: [2, 3] },
      codeBlock: false,
      code: false,
      horizontalRule: false,
      link: {
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer nofollow',
          target: '_blank',
        },
      },
    }),
    Placeholder.configure({
      placeholder: opts.placeholder ?? 'Začněte psát…',
      showOnlyWhenEditable: true,
      showOnlyCurrent: false,
    }),
    Superscript,
    Subscript,
    TextStyle,
    Color,
  ];

  if (opts.enableImage) {
    extensions.push(
      Image.configure({ inline: false, allowBase64: false }),
    );
  }

  if (opts.enableTable) {
    extensions.push(
      Table.configure({ resizable: false, HTMLAttributes: { class: 'rte-table' } }),
      TableRow,
      TableHeader,
      TableCell,
    );
  }

  if (opts.additionalExtensions) {
    extensions.push(...opts.additionalExtensions);
  }

  return extensions;
}
