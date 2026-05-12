export const HELP_TABS = ['start', 'stranky', 'ucet', 'role', 'faq'] as const;
export type HelpTab = (typeof HELP_TABS)[number];

export const TAB_LABELS: Record<HelpTab, string> = {
  start: 'Začni tady',
  stranky: 'Stránky',
  ucet: 'Účet & profil',
  role: 'Role & oprávnění',
  faq: 'FAQ',
};

export const DEFAULT_TAB: HelpTab = 'start';

export function parseTab(raw: string | null | undefined): HelpTab {
  if (!raw) return DEFAULT_TAB;
  return (HELP_TABS as readonly string[]).includes(raw)
    ? (raw as HelpTab)
    : DEFAULT_TAB;
}
