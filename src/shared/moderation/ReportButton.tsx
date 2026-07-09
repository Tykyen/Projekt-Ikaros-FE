import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { Flag } from 'lucide-react';
import { currentUserAtom } from '@/shared/store/authStore';
import { ReportModal, type ReportTargetProps } from './ReportModal';
import s from './ReportButton.module.css';

interface Props extends ReportTargetProps {
  /** `icon` = jen vlajka (kompaktní), `text` = vlajka + „Nahlásit". */
  variant?: 'icon' | 'text';
  className?: string;
}

/**
 * Spec 20B (Fáze B2) — malé tlačítko „Nahlásit" (vlajka) osazované na veřejné
 * plochy. Skryté pro nepřihlášené (report vyžaduje účet) i pro vlastní obsah
 * (`targetAuthorId === currentUser.id`). Klik otevře `ReportModal`.
 */
export function ReportButton({ variant = 'text', className, ...target }: Props) {
  const user = useAtomValue(currentUserAtom);
  const [open, setOpen] = useState(false);

  // Report smí jen přihlášený člen; vlastní obsah nelze nahlásit.
  if (!user) return null;
  if (target.targetAuthorId && target.targetAuthorId === user.id) return null;

  return (
    <>
      <button
        type="button"
        className={`${s.btn} ${variant === 'icon' ? s.icon : ''} ${className ?? ''}`}
        onClick={() => setOpen(true)}
        aria-label="Nahlásit obsah"
        title="Nahlásit obsah"
      >
        <Flag size={variant === 'icon' ? 16 : 14} aria-hidden />
        {variant === 'text' && <span>Nahlásit</span>}
      </button>
      {/* Montujeme až při otevření — stav formuláře startuje čistý pokaždé. */}
      {open && (
        <ReportModal open onClose={() => setOpen(false)} {...target} />
      )}
    </>
  );
}
