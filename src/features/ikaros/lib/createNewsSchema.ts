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
});

export type CreateNewsFormValues = z.infer<typeof createNewsSchema>;
