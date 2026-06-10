import { useMemo, useRef, useState } from 'react';
import { Link2 } from 'lucide-react';
import { LinkPickerPopover } from '@/shared/ui/LinkPicker';
import type { PageDirectoryEntry } from '../../api/pages.types';
import { slugify } from '../lib/slugify';
import s from './PagePicker.module.css';

interface Props {
  /** Slug cílové stránky tohoto světa (prázdné = nevybráno). */
  value: string;
  /**
   * Volá se s `slug` a `title` zvolené stránky. `title` je název vybrané
   * stránky pro auto-label v rodiči — u „zatím neexistující" stránky se
   * předává surový dotaz uživatele.
   */
  onChange: (slug: string, title: string) => void;
  /** Adresář všech stránek světa pro autocomplete. */
  directory: PageDirectoryEntry[];
}

/**
 * 7.2 — Picker stránky tohoto světa jako kompaktní 🔗 tlačítko.
 *
 * 7.2n — UI i pozicování delegováno na sdílený `LinkPickerPopover` (Portal →
 * popover se nezaleze za sousední sekce, na rozdíl od původního absolutního).
 * Tady zůstává jen tlačítko + mapování výběru na `onChange` (value-based, menu
 * odkazuje jen na stránky → `allowUrl={false}`).
 */
export function PagePicker({ value, onChange, directory }: Props) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const selected = useMemo(
    () => directory.find((d) => d.slug === value),
    [directory, value],
  );

  const hasValue = value !== '';
  const isPending = hasValue && !selected;

  const btnTitle = selected
    ? `Odkazuje na: ${selected.title} (/${selected.slug})`
    : isPending
      ? `Odkazuje na: /${value} (stránka zatím neexistuje)`
      : 'Vybrat cílovou stránku';

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={`${s.linkBtn} ${hasValue ? s.linkBtnActive : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Odkaz na stránku"
        title={btnTitle}
      >
        <Link2 size={14} aria-hidden />
      </button>

      <LinkPickerPopover
        anchorRef={btnRef}
        open={open}
        onClose={() => setOpen(false)}
        onPick={(slug, title) => onChange(slug, title ?? '')}
        onRemove={() => onChange('', '')}
        directory={directory}
        makeSlug={slugify}
        currentHref={value || undefined}
      />
    </>
  );
}
