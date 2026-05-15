# Implementační plán 3.2b — Sdílený TipTap editor

**Status:** Návrh — čeká na potvrzení PJ
**Spec:** [spec-3.2.md §8](./spec-3.2.md)
**Větev:** `feat/krok-3.2b-shared-tiptap-editor`
**Odhad:** ~450 ř. FE + ~250 ř. FE testů
**Repo:** `Projekt-ikaros-FE`

⚠️ **Paralelně s 3.2a** — nezávisí na BE, ale 3.2c ho použije.

---

## Postup vysoké úrovně

| # | Fáze | Cíl |
|---|---|---|
| A | Dependencies | npm install TipTap + fontsource |
| B | Theme tokens | Nové `--prose-*` a `--cat-*` v `theme.css` |
| C | TipTap extensions config | `extensions.ts` |
| D | `BubbleMenu` komponent | 7 tlačítek nad selection |
| E | `useDraftAutoSave` hook | localStorage debounced |
| F | `RichTextEditor` komponent | Hlavní wrapper + readOnly mode |
| G | Prose CSS | drop cap, max-width 65ch |
| H | Testy | +10 cases |
| I | Lint + build + commit + PR |

⚠️ **PJ checkpoint po každé fázi.** Pokud „pokračuj sám", přeskočíme.

---

## Fáze A — Dependencies

### A1. Install

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-placeholder
npm install @fontsource-variable/fraunces @fontsource-variable/crimson-pro @fontsource-variable/jetbrains-mono
```

### A2. Verify bundle

```bash
npm run build
# Check dist/assets/ for new chunks
```

⚠️ **Cílový bundle delta:** < +250KB gzip celkem (TipTap ~50KB, fonty ~180KB subsetted).

### A3. Commit

```
chore(deps): A. add TipTap + fontsource variable fonts
```

---

## Fáze B — Theme tokens

### B1. Nový soubor `src/app/styles/prose-tokens.css`

```css
:root {
  /* Prose typografie */
  --prose-font-display: 'Fraunces Variable', ui-serif, Georgia, serif;
  --prose-font-body: 'Crimson Pro Variable', ui-serif, Georgia, serif;
  --prose-font-mono: 'JetBrains Mono Variable', ui-monospace, monospace;
  --prose-max-width: 65ch;
  --prose-line-height: 1.7;
  --prose-paragraph-spacing: 1.5em;
  --prose-drop-cap-size: 5em;
  --prose-drop-cap-line-height: 0.85;
  --prose-divider-glyphs: '✦', '❦', '❧', '☙';

  /* Kategorie default barvy */
  --cat-povidky: #64b5f6;
  --cat-poezie:  #ce93d8;
  --cat-uvahy:   #ffb74d;
  --cat-recenze: #4caf50;
  --cat-postavy: #ff8a65;
  --cat-ostatni: #8b98a5;

  /* Status badges */
  --status-draft:     var(--text-muted, #8b98a5);
  --status-pending:   #ff9800;
  --status-published: #4caf50;
  --status-rejected:  #ff4444;
}
```

### B2. Import v `src/main.tsx`

```ts
import './app/styles/prose-tokens.css';
import '@fontsource-variable/fraunces/wght.css';
import '@fontsource-variable/crimson-pro/wght.css';
import '@fontsource-variable/jetbrains-mono/wght.css';
```

⚠️ **Preload jen kritické fonty** v `index.html`:

```html
<link rel="preload" href="/assets/fraunces-wght.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/crimson-pro-wght.woff2" as="font" type="font/woff2" crossorigin>
```

### B3. Commit

```
feat(theme): B. prose-tokens.css + font imports
```

---

## Fáze C — TipTap extensions config

### C1. `src/shared/components/RichTextEditor/extensions.ts`

```ts
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

export function getExtensions(opts: { placeholder?: string } = {}) {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3] },
      codeBlock: false,
      code: false,
      horizontalRule: false,
      // Bullet list + ordered list + blockquote zůstávají
    }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
    }),
    Placeholder.configure({
      placeholder: opts.placeholder ?? 'Začněte psát…',
      showOnlyWhenEditable: true,
      showOnlyCurrent: false,
    }),
  ];
}
```

### C2. Commit

```
feat(rte): C. TipTap extensions config (StarterKit + Link + Placeholder)
```

---

## Fáze D — `BubbleMenu`

### D1. `src/shared/components/RichTextEditor/BubbleMenu.tsx`

```tsx
import { BubbleMenu as TipTapBubbleMenu, Editor } from '@tiptap/react';
import { Bold, Italic, Heading2, Heading3, Quote, List, Link2 } from 'lucide-react';
import s from './BubbleMenu.module.css';

interface Props { editor: Editor; }

export function BubbleMenu({ editor }: Props) {
  return (
    <TipTapBubbleMenu editor={editor} tippyOptions={{ duration: 100 }} className={s.menu}>
      <Button active={editor.isActive('bold')}     onClick={() => editor.chain().focus().toggleBold().run()}     icon={<Bold size={14} />} title="Tučně (⌘B)" />
      <Button active={editor.isActive('italic')}   onClick={() => editor.chain().focus().toggleItalic().run()}   icon={<Italic size={14} />} title="Kurzíva (⌘I)" />
      <Button active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} icon={<Heading2 size={14} />} title="Nadpis 2" />
      <Button active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} icon={<Heading3 size={14} />} title="Nadpis 3" />
      <Button active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} icon={<Quote size={14} />} title="Citát" />
      <Button active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} icon={<List size={14} />} title="Odrážky" />
      <Button active={editor.isActive('link')} onClick={() => promptLink(editor)} icon={<Link2 size={14} />} title="Odkaz (⌘K)" />
    </TipTapBubbleMenu>
  );
}

function promptLink(editor: Editor) {
  const prev = editor.getAttributes('link').href;
  const url = window.prompt('URL odkazu:', prev ?? '');
  if (url === null) return; // cancel
  if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
  editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
}

function Button({ active, onClick, icon, title }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string }) {
  return (
    <button type="button" onClick={onClick} className={active ? s.btnActive : s.btn} title={title} aria-label={title}>
      {icon}
    </button>
  );
}
```

⚠️ **Pozdější iterace D-NEW:** custom link dialog (ne `window.prompt`). MVP stačí.

### D2. `BubbleMenu.module.css`

```css
.menu {
  display: flex;
  gap: 2px;
  background: var(--surface-elevated);
  border: 1px solid var(--frame-border);
  border-radius: 6px;
  padding: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.btn, .btnActive {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn:hover { background: var(--surface-base); color: var(--text-strong); }

.btnActive {
  background: var(--accent);
  color: var(--surface-base);
}
```

### D3. Commit

```
feat(rte): D. BubbleMenu with 7 toolbar buttons
```

---

## Fáze E — `useDraftAutoSave` hook

### E1. `src/shared/components/RichTextEditor/useDraftAutoSave.ts`

```ts
import { useEffect, useState, useRef, useCallback } from 'react';

interface Options { debounceMs?: number; }

interface Result {
  hasUnsavedLocal: boolean;
  restoreCandidate: string | null;
  clearLocalDraft: () => void;
}

export function useDraftAutoSave(
  key: string | undefined,
  value: string,
  options: Options = {},
): Result {
  const { debounceMs = 3000 } = options;
  const [hasUnsavedLocal, setHasUnsavedLocal] = useState(false);
  const [restoreCandidate, setRestoreCandidate] = useState<string | null>(null);
  const initialValueRef = useRef(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect existing draft on mount
  useEffect(() => {
    if (!key) return;
    try {
      const saved = localStorage.getItem(key);
      if (saved && saved !== initialValueRef.current && saved.length > 0) {
        setRestoreCandidate(saved);
      }
    } catch { /* private mode, ignore */ }
  }, [key]);

  // Debounced write
  useEffect(() => {
    if (!key) return;
    if (value === initialValueRef.current) {
      setHasUnsavedLocal(false);
      return;
    }
    setHasUnsavedLocal(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, value);
      } catch { /* quota, ignore */ }
    }, debounceMs);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [key, value, debounceMs]);

  // Beforeunload warning
  useEffect(() => {
    if (!hasUnsavedLocal) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedLocal]);

  const clearLocalDraft = useCallback(() => {
    if (!key) return;
    try { localStorage.removeItem(key); } catch {}
    setHasUnsavedLocal(false);
    setRestoreCandidate(null);
  }, [key]);

  return { hasUnsavedLocal, restoreCandidate, clearLocalDraft };
}
```

### E2. Commit

```
feat(rte): E. useDraftAutoSave hook with localStorage + beforeunload
```

---

## Fáze F — `RichTextEditor` komponent

### F1. `src/shared/components/RichTextEditor/RichTextEditor.tsx`

```tsx
import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect } from 'react';
import { getExtensions } from './extensions';
import { BubbleMenu } from './BubbleMenu';
import { useDraftAutoSave } from './useDraftAutoSave';
import s from './RichTextEditor.module.css';

export interface RichTextEditorProps {
  value: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  autoSaveKey?: string;
  maxLength?: number;
  readOnly?: boolean;
  className?: string;
}

export function RichTextEditor(props: RichTextEditorProps) {
  const { value, onChange, placeholder, autoSaveKey, maxLength, readOnly, className } = props;

  const editor = useEditor({
    extensions: getExtensions({ placeholder }),
    content: value,
    editable: !readOnly,
    onUpdate({ editor }) {
      const html = editor.getHTML();
      if (maxLength && html.length > maxLength) {
        // Soft block — TipTap nemá hard cap, ale nezavoláme onChange
        return;
      }
      onChange?.(html);
    },
  });

  // Sync external value changes (e.g., load from BE)
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() === value) return;
    editor.commands.setContent(value, false);
  }, [editor, value]);

  const { hasUnsavedLocal, restoreCandidate, clearLocalDraft } = useDraftAutoSave(autoSaveKey, value);

  if (!editor) return null;

  return (
    <div className={`${s.wrapper} ${className ?? ''} ${readOnly ? s.readOnly : ''}`}>
      {!readOnly && <BubbleMenu editor={editor} />}
      <EditorContent editor={editor} className={s.content} />
      {/* Vystavujeme stav přes data atributy pro parent (auto-save indicator) */}
      <div
        data-has-unsaved={hasUnsavedLocal}
        data-restore-candidate={restoreCandidate ? 'true' : 'false'}
        style={{ display: 'none' }}
      />
    </div>
  );
}

// Re-export hook helpers pro parent (může je chtít přes useImperativeHandle)
export { useDraftAutoSave };
```

⚠️ **D-NEW-rte-imperative:** clearLocalDraft musí být dostupný pro parent (po úspěšném save). Refactor přes `forwardRef` + `useImperativeHandle` v iteraci 3.2c, kde to potřebujeme. Pro 3.2b stačí export hooku, parent ho zavolá sám.

### F2. `index.ts`

```ts
export { RichTextEditor } from './RichTextEditor';
export type { RichTextEditorProps } from './RichTextEditor';
export { useDraftAutoSave } from './useDraftAutoSave';
```

### F3. Commit

```
feat(rte): F. RichTextEditor component (editor + readOnly mode)
```

---

## Fáze G — Prose CSS

### G1. `RichTextEditor.module.css`

```css
.wrapper {
  position: relative;
}

.content {
  font-family: var(--prose-font-body);
  font-size: 19px;
  line-height: var(--prose-line-height);
  color: var(--text-strong);
}

.content :global(.ProseMirror) {
  outline: none;
  min-height: 200px;
}

.content :global(.ProseMirror p) {
  margin: 0 0 var(--prose-paragraph-spacing);
}

.content :global(.ProseMirror h2) {
  font-family: var(--prose-font-display);
  font-size: 32px;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin: 1.5em 0 0.5em;
  color: var(--text-strong);
}

.content :global(.ProseMirror h3) {
  font-family: var(--prose-font-display);
  font-size: 24px;
  font-weight: 500;
  margin: 1.2em 0 0.4em;
  color: var(--text-strong);
}

.content :global(.ProseMirror blockquote) {
  border-left: 3px solid var(--accent);
  padding-left: 1em;
  margin: 1.5em 0;
  font-style: italic;
  color: var(--text-muted);
}

.content :global(.ProseMirror ul) {
  padding-left: 1.5em;
  margin: 1em 0;
}

.content :global(.ProseMirror a) {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.content :global(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: var(--text-subtle);
  pointer-events: none;
  height: 0;
  font-style: italic;
}

/* Drop cap — opt-in přes parent class .withDropCap */
.readOnly.withDropCap :global(.ProseMirror > p:first-of-type::first-letter) {
  font-family: var(--prose-font-display);
  font-size: var(--prose-drop-cap-size);
  font-weight: 700;
  font-style: italic;
  float: left;
  line-height: var(--prose-drop-cap-line-height);
  padding-right: 0.1em;
  padding-top: 0.05em;
  color: var(--accent);
}

/* Max-width 65ch jen v readOnly (detail page) */
.readOnly .content :global(.ProseMirror) {
  max-width: var(--prose-max-width);
  margin: 0 auto;
}
```

### G2. Commit

```
feat(rte): G. prose CSS — typography, drop cap, max-width 65ch
```

---

## Fáze H — Testy

### H1. `RichTextEditor.spec.tsx` (+10 cases)

Helpers: `renderEditor({ value, autoSaveKey?, readOnly? })`.

- **C1.** Renderuje placeholder při prázdném value.
- **C2.** Klávesa B v selection → text obalen `<strong>`.
- **C3.** Klávesa I v selection → text obalen `<em>`.
- **C4.** Klik H2 v bubble menu → `<h2>` element.
- **C5.** Klik blockquote → `<blockquote>` element.
- **C6.** Klik bullet list → `<ul><li>`.
- **C7.** `autoSaveKey='test'` + change → po 3000ms localStorage má value.
- **C8.** Mount s `localStorage['test'] = '<p>different</p>'` + `value='<p>orig</p>'` → restoreCandidate non-null.
- **C9.** `clearLocalDraft()` → `localStorage['test']` undefined.
- **C10.** `readOnly` mode — bubble menu skryt, input nefunguje.

⚠️ **Test setup:** mock `localStorage` (vitest provides). TipTap render = `@testing-library/react`.

### H2. Commit

```
test(rte): H. +10 cases for RichTextEditor (bubble menu, auto-save, readOnly)
```

---

## Fáze I — Lint + build + commit + PR

### I1. `npm run lint`

### I2. `npx tsc --noEmit`

### I3. `npm run test:run`

Cíl: **+10 FE testů, žádný regression z 400+ existujících.**

### I4. `npm run build`

Verify bundle delta < +250KB gzip.

### I5. PR

Title: `feat(rte): 3.2b — shared TipTap editor + prose tokens`

Body:
- Spec link
- Fontsource bundle impact
- Reusable for 3.4 (discussions), 3.5 (mail), budoucí fáze
- Closes D-066

---

## Příprava na 3.2c

`<RichTextEditor>` exportován z `src/shared/components/RichTextEditor`. 3.2c ho importuje pro editor stránku (editable) i detail stránku (readOnly + withDropCap).
