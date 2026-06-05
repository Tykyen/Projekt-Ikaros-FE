import { z } from 'zod';

/**
 * 9.1-I — schema pro vytvoření / editaci herní akce světa.
 *
 * `targetGroup` může být `null` (akce pro všechny) nebo `string` (název skupiny).
 * `groupOnly: true` vyžaduje, aby `targetGroup` nebyl null (BE i FE validace).
 */
export const createGameEventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Název je povinný')
      .max(200, 'Maximálně 200 znaků'),
    date: z
      .string()
      .min(1, 'Datum je povinné')
      .regex(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/,
        'Datum musí být ve formátu YYYY-MM-DDTHH:mm',
      ),
    description: z
      .string()
      .max(5000, 'Maximálně 5000 znaků')
      .optional()
      .or(z.literal('')),
    targetGroup: z
      .string()
      .max(64, 'Maximálně 64 znaků')
      .nullable()
      .optional(),
    groupOnly: z.boolean().default(false),
    confirmable: z.boolean().default(true),
  })
  .refine(
    (v) =>
      !v.groupOnly ||
      (v.targetGroup !== null &&
        v.targetGroup !== undefined &&
        v.targetGroup !== ''),
    {
      message: 'Skupinová akce vyžaduje výběr skupiny.',
      path: ['targetGroup'],
    },
  );

export type CreateGameEventFormValues = z.input<typeof createGameEventSchema>;
