import { useMemo } from 'react';
import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import tippy, { type Instance, type Props } from 'tippy.js';
import { WikilinkSuggestion, type SuggestionListRef } from '../components/WikilinkSuggestion';
import type { PageDirectoryEntry } from '../../api/pages.types';

/**
 * 7.2g — TipTap extension pro `[[wikilink]]` autocomplete. Typing `[[` v
 * editoru otevře dropdown stránek světa (z `usePagesDirectory`). Klik vloží
 * `<a href="<slug>">title</a>`.
 *
 * Pozn: používáme `tippy.js` pro positioning — minimalistická lib, pravděpodobně
 * už v deps (BubbleMenu z TipTap ji používá). Pokud chybí, fallback na fixed pos.
 */
export function useWikilinkExtension(directory: PageDirectoryEntry[]) {
  // Memo extension referenčně stabilní — TipTap by jinak při každém re-render
  // re-mountoval editor (state loss).
  return useMemo(() => {
    return Extension.create({
      name: 'wikilink',
      addProseMirrorPlugins() {
        return [
          Suggestion({
            editor: this.editor,
            char: '[[',
            allowSpaces: true,
            items: ({ query }) => fuzzyMatch(directory, query, 8),
            command: ({ editor, range, props }) => {
              const item = props as PageDirectoryEntry;
              editor
                .chain()
                .focus()
                .insertContentAt(range, [
                  {
                    type: 'text',
                    marks: [
                      {
                        type: 'link',
                        attrs: { href: item.slug, target: null, rel: null },
                      },
                    ],
                    text: item.title,
                  },
                  { type: 'text', text: ' ' },
                ])
                .run();
            },
            render: () => {
              let component: ReactRenderer<SuggestionListRef> | null = null;
              let popup: Instance<Props>[] = [];

              return {
                onStart: (props) => {
                  component = new ReactRenderer(WikilinkSuggestion, {
                    props,
                    editor: props.editor,
                  });
                  if (!props.clientRect) return;
                  popup = tippy('body', {
                    getReferenceClientRect: props.clientRect as () => DOMRect,
                    appendTo: () => document.body,
                    content: component.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: 'manual',
                    placement: 'bottom-start',
                  });
                },
                onUpdate: (props) => {
                  component?.updateProps(props);
                  if (!props.clientRect) return;
                  popup[0]?.setProps({
                    getReferenceClientRect: props.clientRect as () => DOMRect,
                  });
                },
                onKeyDown: (props) => {
                  if (props.event.key === 'Escape') {
                    popup[0]?.hide();
                    return true;
                  }
                  return component?.ref?.onKeyDown(props) ?? false;
                },
                onExit: () => {
                  popup[0]?.destroy();
                  component?.destroy();
                },
              };
            },
          }),
        ];
      },
    });
  }, [directory]);
}

/**
 * Lokální fuzzy match — reuse pattern z 7.1 `fuzzyMatch.ts`. Inline pro vyhnutí
 * se cross-feature dep (PageViewer ↔ PageEditor).
 */
function fuzzyMatch(items: PageDirectoryEntry[], query: string, limit: number) {
  const q = normalize(query.trim().toLowerCase());
  if (!q) return items.slice(0, limit);
  return items
    .map((it) => {
      const t = normalize(it.title.toLowerCase());
      const s = normalize(it.slug.toLowerCase());
      if (t.startsWith(q) || s.startsWith(q)) return { item: it, score: 1000 };
      const ti = t.indexOf(q);
      if (ti >= 0) return { item: it, score: 500 - ti };
      const si = s.indexOf(q);
      if (si >= 0) return { item: it, score: 400 - si };
      return { item: it, score: 0 };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.item);
}

function normalize(str: string): string {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '');
}
