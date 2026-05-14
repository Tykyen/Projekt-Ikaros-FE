import { z } from 'zod';

export const createIkarosEventSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Název akce je povinný')
    .max(200, 'Název může mít max 200 znaků'),
  date: z
    .string()
    .min(1, 'Datum a čas jsou povinné')
    .regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/,
      'Neplatný formát data (ISO 8601)',
    ),
  description: z
    .string()
    .trim()
    .max(5000, 'Popis může mít max 5000 znaků')
    .optional()
    .or(z.literal('')),
  confirmable: z.boolean(),
});

export type CreateIkarosEventFormValues = z.infer<
  typeof createIkarosEventSchema
>;
