/**
 * Curated sada 24 lucide ikon pro `ChatGroup.iconKey` (krok 6.5c).
 *
 * Klíče jsou **stable string identifikátory**, ne komponentová jména — když
 * lucide v budoucnu přejmenuje, mapování upravíme tady, zatímco data
 * v DB (`iconKey: 'crown'`) zůstanou platná.
 *
 * Render priority v `ChannelGroup.tsx`: `imageUrl > iconKey > spine`.
 */
import type { JSX } from 'react';
import {
  MessageCircle,
  Megaphone,
  Mail,
  Phone,
  Users,
  AtSign,
  BookOpen,
  Scroll,
  Feather,
  Crown,
  Swords,
  Shield,
  Skull,
  Ghost,
  Star,
  Moon,
  Sun,
  Flame,
  Pin,
  Flag,
  Bookmark,
  Tag,
  Folder,
  Archive,
  type LucideIcon,
} from 'lucide-react';

/** Mapa `iconKey` → lucide komponenta. Klíče jsou stable identifikátory. */
export const GROUP_ICONS: Record<string, LucideIcon> = {
  // Komunikace
  chat: MessageCircle,
  megaphone: Megaphone,
  mail: Mail,
  phone: Phone,
  users: Users,
  'at-sign': AtSign,
  // Příběh
  book: BookOpen,
  scroll: Scroll,
  feather: Feather,
  crown: Crown,
  swords: Swords,
  shield: Shield,
  // Žánr
  skull: Skull,
  ghost: Ghost,
  star: Star,
  moon: Moon,
  sun: Sun,
  flame: Flame,
  // Organizace
  pin: Pin,
  flag: Flag,
  bookmark: Bookmark,
  tag: Tag,
  folder: Folder,
  archive: Archive,
};

/** Kategorie pro picker — vizuálně grupují ikony do 4 řad (audit §3). */
export const GROUP_ICON_CATEGORIES: { label: string; keys: string[] }[] = [
  {
    label: 'Komunikace',
    keys: ['chat', 'megaphone', 'mail', 'phone', 'users', 'at-sign'],
  },
  {
    label: 'Příběh',
    keys: ['book', 'scroll', 'feather', 'crown', 'swords', 'shield'],
  },
  { label: 'Žánr', keys: ['skull', 'ghost', 'star', 'moon', 'sun', 'flame'] },
  {
    label: 'Organizace',
    keys: ['pin', 'flag', 'bookmark', 'tag', 'folder', 'archive'],
  },
];

/** Plochý seznam všech 24 klíčů v pořadí kategorií — pro picker grid. */
export const GROUP_ICON_KEYS: string[] = GROUP_ICON_CATEGORIES.flatMap(
  (cat) => cat.keys,
);

/**
 * Renderuje lucide ikonu dle `iconKey`. `null` pro `undefined` / unknown.
 * Velikost 14 px je default sidebar hlavičky kanálu.
 */
export function GroupIcon({
  iconKey,
  size = 14,
}: {
  iconKey?: string;
  size?: number;
}): JSX.Element | null {
  const Icon = iconKey ? GROUP_ICONS[iconKey] : null;
  return Icon ? <Icon size={size} /> : null;
}
