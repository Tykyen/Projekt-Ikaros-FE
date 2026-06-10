import { useMemo } from 'react';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { classifyPageLink } from '../../PageViewer/hooks/classifyPageLink';
import type { PageDirectoryEntry } from '../../api/pages.types';

/**
 * 7.2m — Zvýraznění propadlých odkazů v editoru (parita s read-mode 7.1d).
 *
 * Read mode označí odkaz na neexistující stránku červeně (`useBrokenLinks` →
 * `.brokenLink`), ale TipTap editor tu logiku neměl → PJ nepoznal, který odkaz
 * je propadlý. Tenhle ProseMirror plugin projde link marky dokumentu, každý
 * `href` klasifikuje **stejnou sdílenou funkcí** jako read mode
 * (`classifyPageLink`) a propadlé obtáhne inline `Decoration` s class
 * `.brokenLink`.
 *
 * 📚 Decoration je vizuální overlay — class se nikdy nezapíše do uloženého HTML
 * (na rozdíl od read-mode hooku NEpřepisujeme href ani neměníme obsah; v
 * editoru se ukládá to, co je napsané). ProseMirror volá `decorations(state)`
 * při každé změně dokumentu → po opravě odkazu na existující stránku červená
 * zmizí sama.
 *
 * Memoizováno na `[directory, worldSlug]` (vzor `useWikilinkExtension`) — bez
 * stabilní reference by TipTap re-mountoval editor. Při async doteku directory
 * proběhne jeden re-mount (directory je ale obvykle už v cache).
 */
/**
 * Čistá factory extension (bez React) — vystavená kvůli testovatelnosti.
 * Hook níž ji jen memoizuje.
 */
export function createBrokenLinkExtension(
  directory: PageDirectoryEntry[],
  worldSlug: string,
) {
  const slugSet = new Set(directory.map((d) => d.slug));

  return Extension.create({
    name: 'brokenLinkHighlight',
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: new PluginKey('brokenLinkHighlight'),
          props: {
            decorations(state) {
              const decos: Decoration[] = [];
              state.doc.descendants((node, pos) => {
                if (!node.isText) return;
                const link = node.marks.find((m) => m.type.name === 'link');
                if (!link) return;
                const href = (link.attrs.href as string | null) ?? '';
                const cls = classifyPageLink(href, { slugSet, worldSlug });
                if (cls.kind === 'broken') {
                  decos.push(
                    Decoration.inline(pos, pos + node.nodeSize, {
                      class: 'brokenLink',
                    }),
                  );
                }
              });
              return DecorationSet.create(state.doc, decos);
            },
          },
        }),
      ];
    },
  });
}

export function useBrokenLinkDecoration(
  directory: PageDirectoryEntry[],
  worldSlug: string,
) {
  return useMemo(
    () => createBrokenLinkExtension(directory, worldSlug),
    [directory, worldSlug],
  );
}
