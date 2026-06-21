import { EmptyState } from '@/shared/ui';

interface EmoteEmptyStateProps {
  variant: 'world' | 'global';
  onUpload: () => void;
}

/**
 * Krok 6.4c/d — prázdný stav admin gridu (vitrína bez artefaktů).
 * 15.6 — vnitřek sjednocen na sdílený `<EmptyState>`; props/CTA zachovány.
 */
export function EmoteEmptyState({ variant, onUpload }: EmoteEmptyStateProps) {
  const isWorld = variant === 'world';
  return (
    <EmptyState
      size="panel"
      illustration="messages"
      title={
        isWorld
          ? 'Vitrína tohoto světa je zatím prázdná.'
          : 'Platforma nemá žádné globální emoty.'
      }
      description={
        isWorld
          ? 'Začni s prvním — třeba maskot nebo logo vaší komunity.'
          : 'Globální emoty jsou dostupné napříč všemi světy Ikarosu. Přidávej s rozvahou.'
      }
      action={{ label: 'Nahrát první emote', onClick: onUpload }}
    />
  );
}
