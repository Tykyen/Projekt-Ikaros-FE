import { useRef } from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/shared/ui';
import { usePrint } from './printMode';

interface Props {
  /** Popisek (default „Tisk / PDF"). */
  label?: string;
  /** Tooltip / a11y popis, co se tiskne. */
  title?: string;
  className?: string;
}

/**
 * 14.7a — Tlačítko „Tisk / PDF". Tiskne nejbližší předek označený
 * `data-print-scope` (přes `closest`) — žádné ref-plumbing. Dialog prohlížeče
 * nabídne tisk i „Uložit jako PDF". Samo se při tisku nevykreslí (`.print-hide`).
 */
export function PrintButton({ label = 'Tisk / PDF', title, className }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const { triggerPrint } = usePrint();

  return (
    <Button
      ref={ref}
      type="button"
      variant="ghost"
      size="sm"
      className={['print-hide', className].filter(Boolean).join(' ')}
      title={title ?? 'Vytisknout nebo uložit jako PDF'}
      onClick={() => {
        const scope = ref.current?.closest('[data-print-scope]');
        triggerPrint(scope instanceof HTMLElement ? scope : null);
      }}
    >
      <Printer size={16} aria-hidden />
      {label}
    </Button>
  );
}
