import { RefreshCw } from 'lucide-react';
import { Button } from '@/shared/ui';
import { useAppUpdate } from './useAppUpdate';
import s from './UpdateBanner.module.css';

/**
 * Spec 15.1-followup — horní banner „Je dostupná nová verze". Zobrazí se, když
 * `useAppUpdate` zjistí nasazený nový build; klik „Obnovit" natvrdo reloadne
 * (načte nový bundle). Prompt, ne auto-reload — viz spec (žádná smyčka / ztráta
 * rozepsané zprávy).
 */
export function UpdateBanner() {
  const { updateReady, reload } = useAppUpdate();
  if (!updateReady) return null;

  return (
    <div className={s.banner} role="status" aria-live="polite">
      <RefreshCw size={18} className={s.icon} aria-hidden />
      <span className={s.text}>Je dostupná nová verze aplikace.</span>
      <Button size="sm" onClick={reload} className={s.cta}>
        Obnovit
      </Button>
    </div>
  );
}
