import { z } from 'zod';

export const createNewsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Nadpis je povinný')
    .max(300, 'Nadpis může mít max 300 znaků'),
  content: z
    .string()
    .trim()
    .min(1, 'Obsah je povinný')
    .max(10000, 'Obsah může mít max 10000 znaků'),
  /** Spec 3.1b — typ novinky. Volitelné ve formuláři; submit fallbackuje na `'info'`. */
  type: z.enum(['info', 'warning', 'system']).optional(),
  /** Spec 3.1b — URL obrázku z `POST /upload/image`. Prázdné = bez obrázku. */
  imageUrl: z.string().max(2048).optional(),
});

export type CreateNewsFormValues = z.infer<typeof createNewsSchema>;
