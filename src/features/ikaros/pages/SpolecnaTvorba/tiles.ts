import type { LucideIcon } from 'lucide-react';
import {
  MessageSquare,
  BookOpen,
  Image as ImageIcon,
  Skull,
  Leaf,
  FlaskConical,
  Sparkles,
  Puzzle,
} from 'lucide-react';
import { PendingActionType } from '@/shared/types';

/**
 * 21.5 — data-driven definice dlaždic rozcestníku „Společná tvorba".
 *
 * `active: false` = stub „Připravujeme" (proklik na `ComingSoonPage`). Až se
 * knihovna postaví (21.5a–d), stačí přepnout `active: true` a route ukázat na
 * reálnou stránku místo `ComingSoonPage` — hub sám se needituje.
 */
export interface TvorbaTile {
  /** URL segment i `data-tile-key` (test/analytics). */
  key: string;
  label: string;
  /** Jednovětý popis pod názvem. */
  description: string;
  to: string;
  icon: LucideIcon;
  active: boolean;
  /** Moderace: badge s počtem příspěvků čekajících na schválení (jen aktivní). */
  pendingType?: PendingActionType;
}

export const TVORBA_TILES: TvorbaTile[] = [
  // Existující sekce — aktivní, proklik na jejich routy.
  {
    key: 'diskuze',
    label: 'Diskuze',
    description: 'Veřejná debata s komunitou.',
    to: '/ikaros/diskuze',
    icon: MessageSquare,
    active: true,
    pendingType: PendingActionType.DiscussionPendingReview,
  },
  {
    key: 'clanky',
    label: 'Články',
    description: 'Návody, příběhy a zamyšlení.',
    to: '/ikaros/clanky',
    icon: BookOpen,
    active: true,
    pendingType: PendingActionType.ArticlePendingReview,
  },
  {
    key: 'galerie',
    label: 'Galerie',
    description: 'Obrázky, mapy a artworky.',
    to: '/ikaros/galerie',
    icon: ImageIcon,
    active: true,
    pendingType: PendingActionType.GalleryPendingReview,
  },
  // Nové komunitní knihovny — zatím stuby (21.5a–d).
  {
    key: 'bestiar',
    label: 'Bestiář',
    description: 'Sdílený katalog nestvůr a jejich statů.',
    to: '/ikaros/bestiar',
    icon: Skull,
    active: false,
  },
  {
    key: 'herbar',
    label: 'Herbář',
    description: 'Rostliny a byliny s jejich účinky.',
    to: '/ikaros/herbar',
    icon: Leaf,
    active: true,
  },
  {
    key: 'lektvary',
    label: 'Lektvary',
    description: 'Alchymistické recepty a lektvary.',
    to: '/ikaros/lektvary',
    icon: FlaskConical,
    active: false,
  },
  {
    key: 'kouzla',
    label: 'Kouzla',
    description: 'Magické formule a jejich efekty.',
    to: '/ikaros/kouzla',
    icon: Sparkles,
    active: true,
  },
  {
    key: 'hadanky',
    label: 'Hádanky',
    description: 'Hlavolamy a hádanky pro hráče.',
    to: '/ikaros/hadanky',
    icon: Puzzle,
    active: false,
  },
];
