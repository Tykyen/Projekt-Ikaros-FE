import type { LucideIcon } from 'lucide-react';
import {
  MessageSquare,
  BookOpen,
  Image as ImageIcon,
  Skull,
  Leaf,
  FlaskConical,
  Sparkles,
  Swords,
  Puzzle,
  ReceiptText,
  Dices,
  MapPinned,
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
  // Komunitní knihovny (16.2b-2 + 21.5a–e) — všechny aktivní.
  {
    key: 'bestiar',
    label: 'Bestiář',
    description: 'Sdílený katalog nestvůr a jejich statů.',
    to: '/ikaros/bestiar',
    icon: Skull,
    active: true,
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
    active: true,
  },
  {
    key: 'kouzla',
    label: 'Kouzla',
    description: 'Magické formule a jejich efekty.',
    to: '/ikaros/kouzla',
    icon: Sparkles,
    active: true,
  },
  // 21.5e — realizace „items" z roadmap 21.1 (nová knihovna).
  {
    key: 'predmety',
    label: 'Předměty',
    description: 'Zbraně, zbroje a vybavení pro tvůj systém.',
    to: '/ikaros/predmety',
    icon: Swords,
    active: true,
  },
  {
    key: 'hadanky',
    label: 'Hádanky',
    description: 'Hlavolamy a hádanky pro hráče.',
    to: '/ikaros/hadanky',
    icon: Puzzle,
    active: true,
  },
  // 21.5f — komunitní ceníky (kolekce položek s cenou, vklad do obchodu).
  {
    key: 'ceniky',
    label: 'Ceníky',
    description: 'Hotové ceníky zboží a služeb do obchodu světa.',
    to: '/ikaros/ceniky',
    icon: ReceiptText,
    active: true,
  },
  // 21.2a — generátory jmen a potomků (jmenné sady plní komunita).
  {
    key: 'generatory',
    label: 'Generátory',
    description: 'Jména podle národů a rodiny s reálnou demografií.',
    to: '/ikaros/generatory',
    icon: Dices,
    active: true,
  },
  // 22.5 — sdílené scény taktických map (publikuj šablonu → naklonuj do světa).
  {
    key: 'sceny',
    label: 'Scény',
    description: 'Hotové bojové scény k naklonování na taktickou mapu.',
    to: '/ikaros/sceny',
    icon: MapPinned,
    active: true,
    pendingType: PendingActionType.CommunitySceneTemplatePendingReview,
  },
];
