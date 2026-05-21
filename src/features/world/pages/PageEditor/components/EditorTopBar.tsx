import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { useWorldContext } from '@/features/world/context/WorldContext';
import s from './EditorTopBar.module.css';

interface Props {
  isEdit: boolean;
  title: string;
  /** True pokud user editoval cokoliv ale ještě neuložil. */
  hasUnsaved: boolean;
  /** Poslední ISO timestamp BE save (pro „Uloženo · 14:32" indikátor). */
  lastSavedAt: number | null;
  /** 7.2j — toggle live preview (jen desktop). */
  previewEnabled: boolean;
  onTogglePreview: () => void;
}

/**
 * 7.2 — Hlavička editoru: zpět + breadcrumbs + save status + preview toggle.
 */
export function EditorTopBar({
  isEdit,
  title,
  hasUnsaved,
  lastSavedAt,
  previewEnabled,
  onTogglePreview,
}: Props) {
  const { worldSlug, world } = useWorldContext();

  return (
    <header className={s.bar}>
      <Link to={`/svet/${worldSlug}/stranky`} className={s.back}>
        <ArrowLeft size={14} aria-hidden /> Zpět na stránky
      </Link>

      <nav className={s.breadcrumbs} aria-label="Drobečková navigace">
        <Link to={`/svet/${worldSlug}`} className={s.crumb}>
          {world?.name ?? 'Svět'}
        </Link>
        <ChevronRight size={12} aria-hidden className={s.crumbSep} />
        <Link to={`/svet/${worldSlug}/stranky`} className={s.crumb}>
          Stránky
        </Link>
        <ChevronRight size={12} aria-hidden className={s.crumbSep} />
        <span className={s.crumbCurrent}>
          {isEdit ? title || '(beze jména)' : 'Nová stránka'}
        </span>
      </nav>

      <div className={s.actions}>
        <SaveStatus hasUnsaved={hasUnsaved} lastSavedAt={lastSavedAt} />
        <button
          type="button"
          className={`${s.previewBtn} ${previewEnabled ? s.previewActive : ''}`}
          onClick={onTogglePreview}
          aria-label={previewEnabled ? 'Skrýt náhled' : 'Zobrazit náhled'}
          title={
            previewEnabled
              ? 'Skrýt živý náhled'
              : 'Zobrazit živý náhled (jen desktop)'
          }
        >
          {previewEnabled ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
          <span className={s.previewLabel}>Náhled</span>
        </button>
      </div>
    </header>
  );
}

function SaveStatus({
  hasUnsaved,
  lastSavedAt,
}: {
  hasUnsaved: boolean;
  lastSavedAt: number | null;
}) {
  if (hasUnsaved) {
    return <span className={s.statusDirty}>✎ Neuloženo</span>;
  }
  if (!lastSavedAt) return null;
  const time = new Date(lastSavedAt).toLocaleTimeString('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return <span className={s.statusClean}>✓ Uloženo · {time}</span>;
}
