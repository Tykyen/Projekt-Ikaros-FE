// 13.5 — 6 tabů nápovědy (onboarding pro nového hráče).
export const HELP_TABS = ['start', 'platforma', 'svet', 'role', 'ucet', 'faq'] as const;
export type HelpTab = (typeof HELP_TABS)[number];

export const TAB_LABELS: Record<HelpTab, string> = {
  start: 'Začni tady',
  platforma: 'Platforma',
  svet: 'Svět',
  role: 'Role & oprávnění',
  ucet: 'Účet & profil',
  faq: 'FAQ',
};

export const DEFAULT_TAB: HelpTab = 'start';

export function parseTab(raw: string | null | undefined): HelpTab {
  if (!raw) return DEFAULT_TAB;
  return (HELP_TABS as readonly string[]).includes(raw)
    ? (raw as HelpTab)
    : DEFAULT_TAB;
}
