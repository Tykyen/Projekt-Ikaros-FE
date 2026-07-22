/**
 * Spec 26.6 — deklarativní hlášení empty-state: vlož do JSX prázdné větve
 * (řeší rules-of-hooks u komponent s early returns). Nic nerenderuje.
 */
import { useEffect } from 'react';
import { vypravecReportEmpty } from '../registry/emptyStates';

export function ReportEmpty({ klic, to }: { klic: string; to?: string }) {
  useEffect(() => {
    vypravecReportEmpty(klic, { to });
  }, [klic, to]);
  return null;
}
