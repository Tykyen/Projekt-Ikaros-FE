import { z } from 'zod';
import type { WorldCurrencyItem } from './types';

/**
 * Spec 11.4 §4.4 — zod schema pro CurrencyFormModal.
 *
 * Constraints:
 *   - code: 1–8 znaků, A-Z 0-9, **unique v rámci světa** (uniqueness check
 *     vyžaduje `existingItems` + volitelný `excludeCode` pro self-edit mód)
 *   - name: required, max 40
 *   - symbol: optional, max 8
 *   - rate: > 0, BE povoluje >= 0.0001; FE drží 0.0001 jako minimum
 *
 * `factory(existingItems, excludeCode?)` vrací schema s dynamickou unique-code
 * kontrolou. Defaultní schema (`currencyItemBaseSchema`) nehlídá uniqueness.
 */

const CODE_REGEX = /^[A-Z0-9]{1,8}$/;
const RATE_MIN = 0.0001;
const RATE_MAX = 1_000_000;

export const currencyItemBaseSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => v.length >= 1, 'Kód je povinný.')
    .refine((v) => CODE_REGEX.test(v), 'Kód: 1–8 znaků, jen A-Z a 0-9.'),
  name: z
    .string()
    .trim()
    .min(1, 'Název je povinný.')
    .max(40, 'Maximálně 40 znaků.'),
  // Symbol je required string aby zod input/output type matchnul (RHF resolver).
  // Default '' přidáme přes defaultValues v RHF.
  symbol: z.string().trim().max(8, 'Symbol max 8 znaků.'),
  rate: z
    .number({ message: 'Kurz musí být číslo.' })
    .min(RATE_MIN, `Kurz musí být alespoň ${RATE_MIN}.`)
    .max(RATE_MAX, `Kurz max ${RATE_MAX}.`),
});

export type CurrencyItemFormValues = z.infer<typeof currencyItemBaseSchema>;

export function createCurrencyItemSchema(
  existingItems: WorldCurrencyItem[],
  excludeCode?: string,
) {
  const taken = new Set(
    existingItems
      .map((i) => i.code.toUpperCase())
      .filter((c) => c !== excludeCode?.toUpperCase()),
  );
  return currencyItemBaseSchema.superRefine((vals, ctx) => {
    if (taken.has(vals.code.toUpperCase())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Měna '${vals.code}' už existuje.`,
        path: ['code'],
      });
    }
  });
}
