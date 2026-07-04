/**
 * 16.5 — knihovna vzhledu vlaječek. Ikona + barva volí PJ (estetika / vlastní
 * systém); roli (page/map/none) nese rohový odznáček, ne barva. ~30 tématických
 * ikon v kategoriích (scroll+filtr v editoru). Barvy = data-paleta (ALLOW pro
 * lint:colors, jako skiny kostek) — 6 odstínů, které fungují nad tmavým i
 * světlým podkladem mapy.
 */
import {
  MapPin,
  Flag,
  Building2,
  Landmark,
  Castle,
  Home,
  Tent,
  Warehouse,
  Church,
  Store,
  Anchor,
  Ship,
  TreePine,
  Trees,
  Mountain,
  MountainSnow,
  Waves,
  Droplets,
  Sprout,
  Flower2,
  Skull,
  Swords,
  Flame,
  Star,
  Eye,
  Lock,
  Zap,
  ShieldAlert,
  Crosshair,
  Gem,
  Coins,
  BookOpen,
  Key,
  Crown,
  Scroll,
  Compass,
  type LucideIcon,
} from 'lucide-react';

export interface PinIconDef {
  key: string;
  label: string;
  Icon: LucideIcon;
}

export interface PinIconCategory {
  label: string;
  icons: PinIconDef[];
}

export const PIN_ICON_CATEGORIES: PinIconCategory[] = [
  {
    label: 'Osídlení',
    icons: [
      { key: 'marker', label: 'Značka', Icon: MapPin },
      { key: 'flag', label: 'Vlajka', Icon: Flag },
      { key: 'city', label: 'Město', Icon: Building2 },
      { key: 'landmark', label: 'Památka', Icon: Landmark },
      { key: 'castle', label: 'Hrad', Icon: Castle },
      { key: 'home', label: 'Dům', Icon: Home },
      { key: 'tent', label: 'Tábor', Icon: Tent },
      { key: 'warehouse', label: 'Sklad', Icon: Warehouse },
      { key: 'church', label: 'Chrám', Icon: Church },
      { key: 'store', label: 'Obchod', Icon: Store },
      { key: 'anchor', label: 'Přístav', Icon: Anchor },
      { key: 'ship', label: 'Loď', Icon: Ship },
    ],
  },
  {
    label: 'Příroda',
    icons: [
      { key: 'tree', label: 'Strom', Icon: TreePine },
      { key: 'forest', label: 'Les', Icon: Trees },
      { key: 'mountain', label: 'Hora', Icon: Mountain },
      { key: 'peak', label: 'Vrchol', Icon: MountainSnow },
      { key: 'water', label: 'Voda', Icon: Waves },
      { key: 'spring', label: 'Pramen', Icon: Droplets },
      { key: 'sprout', label: 'Pole', Icon: Sprout },
      { key: 'flower', label: 'Louka', Icon: Flower2 },
    ],
  },
  {
    label: 'Nebezpečí a příběh',
    icons: [
      { key: 'skull', label: 'Nebezpečí', Icon: Skull },
      { key: 'battle', label: 'Bitva', Icon: Swords },
      { key: 'fire', label: 'Oheň', Icon: Flame },
      { key: 'quest', label: 'Úkol', Icon: Star },
      { key: 'watch', label: 'Hlídka', Icon: Eye },
      { key: 'locked', label: 'Zamčeno', Icon: Lock },
      { key: 'storm', label: 'Bouře', Icon: Zap },
      { key: 'ward', label: 'Stráž', Icon: ShieldAlert },
      { key: 'target', label: 'Cíl', Icon: Crosshair },
    ],
  },
  {
    label: 'Předměty',
    icons: [
      { key: 'gem', label: 'Poklad', Icon: Gem },
      { key: 'coins', label: 'Zlato', Icon: Coins },
      { key: 'book', label: 'Kniha', Icon: BookOpen },
      { key: 'key', label: 'Klíč', Icon: Key },
      { key: 'crown', label: 'Koruna', Icon: Crown },
      { key: 'scroll', label: 'Svitek', Icon: Scroll },
      { key: 'compass', label: 'Kompas', Icon: Compass },
    ],
  },
];

/** Ploché vyhledání ikony dle klíče (fallback = marker). */
export const PIN_ICONS: Record<string, LucideIcon> = Object.fromEntries(
  PIN_ICON_CATEGORIES.flatMap((c) => c.icons).map((i) => [i.key, i.Icon]),
);

export const DEFAULT_PIN_ICON = 'marker';

export function pinIcon(key: string | undefined): LucideIcon {
  return (key && PIN_ICONS[key]) || PIN_ICONS[DEFAULT_PIN_ICON];
}

export interface PinColorDef {
  key: string;
  value: string;
  label: string;
}

/** Paleta barev vlaječek (data — ALLOW pro lint:colors). */
export const PIN_COLORS: PinColorDef[] = [
  { key: 'cyan', value: '#22d3ee', label: 'Azurová' },
  { key: 'magenta', value: '#e05fd8', label: 'Purpurová' },
  { key: 'violet', value: '#a855f7', label: 'Fialová' },
  { key: 'green', value: '#34d399', label: 'Zelená' },
  { key: 'amber', value: '#f5b942', label: 'Jantarová' },
  { key: 'red', value: '#f4547a', label: 'Červená' },
];

export const PIN_COLOR_MAP: Record<string, string> = Object.fromEntries(
  PIN_COLORS.map((c) => [c.key, c.value]),
);

export const DEFAULT_PIN_COLOR = 'cyan';

export function pinColor(key: string | undefined): string {
  return (key && PIN_COLOR_MAP[key]) || PIN_COLOR_MAP[DEFAULT_PIN_COLOR];
}

/** Barva „mrtvého cíle" (smazaná/nedostupná scéna/stránka). */
export const DEAD_PIN_COLOR = '#8b8ba3';
