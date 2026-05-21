/**
 * Krok 8.1b — Per-svět šablony tabulky stránky.
 *
 * Mirror BE entity `WorldPageTemplate`. Editor stránek je zobrazuje jako
 * horizontální stripe karet pod Identity panelem; PJ je spravuje v
 * `Nastavení světa → Šablony`.
 */
export interface WorldPageTemplate {
  id: string;
  worldId: string;
  /** Slug, unique per svět. */
  key: string;
  label: string;
  headers: string[];
  defaultTitle?: string;
  /** Lucide-react ikona (jednoduchý slug). Viz `WORLD_PAGE_TEMPLATE_ICONS`. */
  icon?: WorldPageTemplateIcon;
  order: number;
  createdAt: string;
  updatedAt: string;
}

/** Whitelist Lucide ikon — musí odpovídat BE `WORLD_PAGE_TEMPLATE_ICONS`. */
export const WORLD_PAGE_TEMPLATE_ICONS = [
  'FileText',
  'MapPin',
  'Users',
  'Sword',
  'Coins',
  'BookOpen',
  'Globe',
  'Building2',
  'Crown',
  'Network',
] as const;

export type WorldPageTemplateIcon = (typeof WORLD_PAGE_TEMPLATE_ICONS)[number];

export interface CreateWorldPageTemplateInput {
  key: string;
  label: string;
  headers: string[];
  defaultTitle?: string;
  icon?: WorldPageTemplateIcon;
  order?: number;
}

export type UpdateWorldPageTemplateInput =
  Partial<CreateWorldPageTemplateInput>;

export const worldPageTemplatesQueryKey = {
  all: (worldId: string) => ['worldPageTemplates', worldId] as const,
};
