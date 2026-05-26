import s from './UnknownCurrencyChip.module.css';

interface UnknownCurrencyChipProps {
  code: string;
}

/**
 * Spec 8.x-prep §4.1 — chip pro účty s `currency` ne ve `world_currencies`.
 * Konzument vyrobí pomocí check `!items.find(i => i.code === code)`.
 */
export function UnknownCurrencyChip({ code }: UnknownCurrencyChipProps) {
  return (
    <span
      className={s.chip}
      title={`Měna '${code}' není ve světě — kontaktuj PJ.`}
      aria-label={`Neznámá měna ${code}`}
    >
      ⚠ {code}
    </span>
  );
}
