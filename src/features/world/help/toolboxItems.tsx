import type { ReactNode } from 'react';
import {
  UserRound,
  MessageSquare,
  Swords,
  Network,
  CalendarDays,
  Coins,
  FileText,
  Skull,
  ScrollText,
  CloudSun,
  NotebookPen,
  Settings,
  PanelTop,
  ClipboardList,
} from 'lucide-react';
import type { HelpAccent } from '@/shared/ui/help';

// Kdo položku vidí. PJ (PomocnyPJ+) vidí vše; hráč jen položky s 'hrac'.
export type HelpAudience = 'pj' | 'hrac';

export type ToolboxItem = {
  key: string;
  title: string;
  desc: string; // 1 věta „co umí / k čemu je"
  icon: ReactNode;
  /** Segment cesty ve světě (`/svet/<slug>/<to>`). */
  to?: string;
  accent: HelpAccent;
  audience: HelpAudience[];
};

// Kurátorovaný přehled nejdůležitějších nástrojů světa (ne úplný výčet —
// ten je v plné nápovědě /ikaros/napoveda?sekce=svet).
export const TOOLBOX_ITEMS: ToolboxItem[] = [
  // ── Sdílené (hráč i PJ) ───────────────────────────────────────────────
  {
    key: 'postava',
    title: 'Moje postava',
    desc: 'Tvůj deník, finance, výbava, kalendář a poznámky.',
    icon: <UserRound size={22} />,
    to: 'moje-postava',
    accent: 'player',
    audience: ['hrac', 'pj'],
  },
  {
    key: 'chat',
    title: 'Chat světa',
    desc: 'Kanály a konverzace, hod kostkou, reakce a šepot.',
    icon: <MessageSquare size={22} />,
    to: 'chat',
    accent: 'info',
    audience: ['hrac', 'pj'],
  },
  {
    key: 'takticka-mapa',
    title: 'Taktická mapa',
    desc: 'Boj a scény na hex gridu — pohyb, kostky, ping.',
    icon: <Swords size={22} />,
    to: 'takticka-mapa',
    accent: 'pj',
    audience: ['hrac', 'pj'],
  },
  {
    key: 'stranky',
    title: 'Wiki stránky',
    desc: 'Encyklopedie světa — lokace, lore, postavy.',
    icon: <FileText size={22} />,
    to: 'stranky',
    accent: 'corrector',
    audience: ['hrac', 'pj'],
  },
  {
    key: 'pavucina',
    title: 'Pavučina',
    desc: 'Vztahový graf kampaně — kdo koho, frakce, linky.',
    icon: <Network size={22} />,
    to: 'pavucina',
    accent: 'pj',
    audience: ['hrac', 'pj'],
  },
  {
    key: 'kalendar',
    title: 'Kalendář',
    desc: 'Akce světa, postav i lokací v jedné mřížce.',
    icon: <CalendarDays size={22} />,
    to: 'kalendar',
    accent: 'warning',
    audience: ['hrac', 'pj'],
  },
  {
    key: 'obchod',
    title: 'Obchod',
    desc: 'Nákup zboží své postavě v měnách světa.',
    icon: <Coins size={22} />,
    to: 'obchod',
    accent: 'success',
    audience: ['hrac', 'pj'],
  },
  {
    key: 'bestiar',
    title: 'Bestiář',
    desc: 'Knihovna statbloků nepřátel a tvorů.',
    icon: <Skull size={22} />,
    to: 'bestiar',
    accent: 'pj',
    audience: ['hrac', 'pj'],
  },

  // ── Jen PJ (PomocnyPJ+) ───────────────────────────────────────────────
  {
    key: 'scenare',
    title: 'Storyboard',
    desc: 'Příprava příběhu ve stromu scén — spustitelná na mapu.',
    icon: <ScrollText size={22} />,
    to: 'scenare',
    accent: 'pjasst',
    audience: ['pj'],
  },
  {
    key: 'pocasi',
    title: 'Generátor počasí',
    desc: 'Počasí pro regiony světa, vysílání na mapu.',
    icon: <CloudSun size={22} />,
    to: 'pocasi',
    accent: 'pjasst',
    audience: ['pj'],
  },
  {
    key: 'denik-pj',
    title: 'Deník PJ',
    desc: 'Tvůj soukromý poznámkový blok pro celý svět.',
    icon: <NotebookPen size={22} />,
    to: 'denik-pj',
    accent: 'pjasst',
    audience: ['pj'],
  },
  {
    key: 'nastaveni',
    title: 'Nastavení světa',
    desc: 'Členové, role, vzhled, systém, AKJ úrovně.',
    icon: <Settings size={22} />,
    to: 'nastaveni',
    accent: 'pjasst',
    audience: ['pj'],
  },
  {
    key: 'headline',
    title: 'Hlavní lišta',
    desc: 'Skryj moduly, postav vlastní navigaci a oznámení.',
    icon: <PanelTop size={22} />,
    to: 'admin/headline',
    accent: 'pjasst',
    audience: ['pj'],
  },
  {
    key: 'sprava-stranek',
    title: 'Správa stránek',
    desc: 'Tabulková správa všech wiki stránek světa.',
    icon: <ClipboardList size={22} />,
    to: 'admin/stranky',
    accent: 'pjasst',
    audience: ['pj'],
  },
];

/** Vyber položky pro danou roli: PJ vidí vše, hráč jen 'hrac'. */
export function toolboxItemsFor(isPJ: boolean): ToolboxItem[] {
  if (isPJ) return TOOLBOX_ITEMS;
  return TOOLBOX_ITEMS.filter((it) => it.audience.includes('hrac'));
}
