/**
 * Spec 26.6 (D11) — moment 3a (03 §4): empty-state → bublina s vysvětlením
 * a JEDNÍM krokem dál. Tier 0 = 3 místa (06 §5.1d); plošně v2.
 * Komponenta zavolá `vypravecReportEmpty(klic, {to})` když prázdný stav
 * skutečně vidí uživatel (ne při loading). Dismiss per klíč — nikdy víc.
 */
import { bublinaStore } from '../ui/bublinaStore';

const EMPTY_STATES: Record<string, { text: string; ctaLabel?: string }> = {
  // Joe — hráč bez postavy (top zákys „postavu zakládá PJ")
  'moje-postava': {
    text: 'Postavu ti tady zakládá tvůj PJ — napiš mu. Až bude na světě, najdeš ji tady.',
    ctaLabel: 'Otevřít chat světa',
  },
  // Joe — prázdné wiki stránky světa
  'stranky-prazdne': {
    text: 'Wiki tvého světa je zatím prázdná. První stránka je nejtěžší — začni klidně jednou lokací nebo pravidly.',
    ctaLabel: 'Založit stránku',
  },
  // Joe — Žadatel čeká na schválení (replika 3, zkrácená pro bublinu)
  'zadatel-ceka': {
    text: 'Tvá žádost leží u PJ. Dokud ji neschválí, brána zůstává zavřená — čekání není chyba.',
  },
};

export function vypravecReportEmpty(
  klic: keyof typeof EMPTY_STATES & string,
  opts: { to?: string } = {},
): void {
  const def = EMPTY_STATES[klic];
  if (!def) return;
  bublinaStore.show({
    dismissKey: `empty:${klic}`,
    text: def.text,
    ...(def.ctaLabel && opts.to
      ? { akce: { label: def.ctaLabel, to: opts.to } }
      : {}),
  });
}
