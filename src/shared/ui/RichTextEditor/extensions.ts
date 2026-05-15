import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

/**
 * 3.2b — TipTap extensions pro literární obsah. Záměrně bez `code`,
 * `codeBlock`, `horizontalRule` (přeplnění pro prózu). Heading omezený na
 * H2/H3 (H1 vyhrazený pro page title mimo content).
 *
 * Bez `Image` / `Table` — 3.3 přidá Cloudinary Image extension; tabulky
 * pro literární obsah nejsou potřeba.
 *
 * Link je součást StarterKit v3 — konfigurujeme ho přes `link` klíč
 * (samostatný `@tiptap/extension-link` by způsobil duplicitu).
 */
export function getExtensions(opts: { placeholder?: string } = {}) {
  return [
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
  ];
}
