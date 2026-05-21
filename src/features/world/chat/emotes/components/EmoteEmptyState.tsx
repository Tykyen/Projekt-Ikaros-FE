import { Plus } from 'lucide-react';
import s from './EmoteEmptyState.module.css';

interface EmoteEmptyStateProps {
  variant: 'world' | 'global';
  onUpload: () => void;
}

/** Krok 6.4c/d — prázdný stav admin gridu (vitrína bez artefaktů). */
export function EmoteEmptyState({ variant, onUpload }: EmoteEmptyStateProps) {
  const isWorld = variant === 'world';
  return (
    <div className={s.empty}>
      <div className={s.sigil} aria-hidden="true">
        <span className={s.diamond}>◇</span>
      </div>
      <p className={s.title}>
        {isWorld
          ? 'Vitrína tohoto světa je zatím prázdná.'
          : 'Platforma nemá žádné globální emoty.'}
      </p>
      <p className={s.hint}>
        {isWorld
          ? 'Začni s prvním — třeba maskot nebo logo vaší komunity.'
          : 'Globální emoty jsou dostupné napříč všemi světy Ikarosu. Přidávej s rozvahou.'}
      </p>
      <button type="button" className={s.cta} onClick={onUpload}>
        <Plus size={14} />
        Nahrát první emote
      </button>
    </div>
  );
}
