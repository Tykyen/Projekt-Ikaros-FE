import { z } from 'zod';

const LUNAR_PHASES = [
  'new',
  'waxing-crescent',
  'first-quarter',
  'waxing-gibbous',
  'full',
  'waning-gibbous',
  'last-quarter',
  'waning-crescent',
] as const;

const PAGE_SLUG_REGEX = /^[a-z0-9-]+$/;

/**
 * 9.3 — zod schema pro TimelineEventModal.
 *
 * Year je integer bez min/max — záporné (BC) povolené. Month/day validace
 * dynamicky proti aktivnímu calendar configu → done v modalu via `.refine()`.
 */
export const timelineEventSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Zadej název události.')
    .max(200, 'Maximálně 200 znaků.'),
  year: z
    .number({ message: 'Zadej rok jako celé číslo.' })
    .int('Rok musí být celé číslo.'),
  month: z
    .number({ message: 'Vyber měsíc.' })
    .int()
    .min(1, 'Vyber měsíc.'),
  day: z
    .number({ message: 'Zadej den.' })
    .int()
    .min(1, 'Den musí být alespoň 1.'),
  hour: z
    .number()
    .int()
    .min(0)
    .max(23)
    .nullable()
    .optional(),
  text: z
    .string()
    .trim()
    .min(1, 'Zadej obsah události.')
    .max(50000, 'Maximálně 50 000 znaků.'),
  imageUrl: z.string().nullable().optional(),
  imageFocalX: z.number().min(0).max(100).nullable().optional(),
  imageFocalY: z.number().min(0).max(100).nullable().optional(),
  link: z
    .string()
    .trim()
    .url('Odkaz musí být platná URL (https://…).')
    .nullable()
    .optional()
    .or(z.literal('')),
  pageSlug: z
    .string()
    .trim()
    .regex(PAGE_SLUG_REGEX, 'Slug stránky obsahuje neplatné znaky.')
    .max(200)
    .nullable()
    .optional()
    .or(z.literal('')),
  // 27.1b — vazba na herní událost (zlatá cesta ④). null = žádná.
  sourceGameEventId: z.string().max(64).nullable().optional(),
  celestialOverrides: z.array(
    z.object({
      bodyId: z.string(),
      phase: z.enum(LUNAR_PHASES),
    }),
  ),
});

export type TimelineEventFormValues = z.infer<typeof timelineEventSchema>;
