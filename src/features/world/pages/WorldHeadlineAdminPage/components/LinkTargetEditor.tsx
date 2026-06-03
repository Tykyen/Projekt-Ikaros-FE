import { useState } from 'react';
import clsx from 'clsx';
import { PagePicker } from '@/features/world/components/PagePicker/PagePicker';
import s from './LinkTargetEditor.module.css';

interface Props {
  worldId: string;
  worldSlug: string;
  /** Aktuální cesta odkazu (`to`). */
  value: string;
  onChange: (to: string) => void;
}

const pagePrefix = (slug: string) => `/svet/${slug}/`;

/** Z `to` vytáhne page slug, pokud cesta míří na stránku tohoto světa. */
function pageSlugFromTo(to: string, worldSlug: string): string | null {
  const prefix = pagePrefix(worldSlug);
  if (!to.startsWith(prefix)) return null;
  const rest = to.slice(prefix.length);
  // Jen přímé stránky (catch-all `:slug`), ne víceúrovňové admin cesty.
  return rest && !rest.includes('/') ? rest : null;
}

/**
 * 12.2 — výběr cíle odkazu: stránka světa (PagePicker) NEBO libovolná
 * URL/cesta. Mód „URL" pokrývá externí odkazy i interní cesty mimo stránky.
 */
export function LinkTargetEditor({
  worldId,
  worldSlug,
  value,
  onChange,
}: Props) {
  const pageSlug = pageSlugFromTo(value, worldSlug);
  // Default mód: URL jen pokud value existuje a není to stránka světa.
  const [mode, setMode] = useState<'page' | 'url'>(
    value && pageSlug === null ? 'url' : 'page',
  );

  return (
    <div className={s.wrap}>
      <div className={s.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'page'}
          className={clsx(s.tab, mode === 'page' && s.tabActive)}
          onClick={() => setMode('page')}
        >
          Stránka
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'url'}
          className={clsx(s.tab, mode === 'url' && s.tabActive)}
          onClick={() => setMode('url')}
        >
          URL / cesta
        </button>
      </div>

      {mode === 'page' ? (
        <PagePicker
          worldId={worldId}
          value={pageSlug}
          onChange={(slug) =>
            onChange(slug ? `${pagePrefix(worldSlug)}${slug}` : '')
          }
        />
      ) : (
        <input
          type="text"
          className={s.urlInput}
          value={value}
          placeholder="https://… nebo /svet/…"
          onChange={(e) => onChange(e.target.value)}
          aria-label="URL nebo cesta odkazu"
        />
      )}
    </div>
  );
}
