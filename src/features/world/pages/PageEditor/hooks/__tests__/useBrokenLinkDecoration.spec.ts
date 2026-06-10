import { describe, it, expect } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import type { DecorationSet } from '@tiptap/pm/view';
import { createBrokenLinkExtension } from '../useBrokenLinkDecoration';
import type { PageDirectoryEntry } from '../../../api/pages.types';

const dir = [{ slug: 'svedsko' }] as PageDirectoryEntry[];

function decorationsFor(html: string) {
  const ext = createBrokenLinkExtension(dir, 'matrix');
  const editor = new Editor({
    extensions: [StarterKit, ext],
    content: html,
  });
  const plugin = editor.state.plugins.find((p) =>
    (p as unknown as { key?: string }).key?.includes('brokenLinkHighlight'),
  );
  const set = plugin?.props.decorations?.call(
    plugin,
    editor.state,
  ) as DecorationSet | null | undefined;
  const found = set?.find() ?? [];
  editor.destroy();
  return found;
}

describe('createBrokenLinkExtension — decorations', () => {
  it('propadlý odkaz (neexistující slug) dostane decoration s class brokenLink', () => {
    const decos = decorationsFor('<p><a href="atlantida">Atlantida</a></p>');
    expect(decos).toHaveLength(1);
    expect((decos[0] as unknown as { type: { attrs: { class: string } } }).type.attrs.class).toBe(
      'brokenLink',
    );
  });

  it('odkaz na existující stránku nedostane decoration', () => {
    expect(decorationsFor('<p><a href="svedsko">Švédsko</a></p>')).toHaveLength(0);
  });

  it('externí odkaz nedostane decoration', () => {
    expect(
      decorationsFor('<p><a href="https://example.com">ext</a></p>'),
    ).toHaveLength(0);
  });

  it('text bez odkazu nedostane decoration', () => {
    expect(decorationsFor('<p>jen text</p>')).toHaveLength(0);
  });

  it('mix: jen propadlý odkaz je označen, validní ne', () => {
    const decos = decorationsFor(
      '<p><a href="svedsko">ok</a> a <a href="atlantida">bad</a></p>',
    );
    expect(decos).toHaveLength(1);
  });
});
