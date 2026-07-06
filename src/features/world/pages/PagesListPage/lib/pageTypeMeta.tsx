import {
  MapPin,
  Newspaper,
  List,
  Images,
  Maximize2,
  Network,
  Monitor,
  FileText,
  User,
  Skull,
  type LucideIcon,
} from 'lucide-react';
import type { PageType } from '../../api/pages.types';

/** 7.3 — ikona pro každý typ wiki stránky (index + admin přehled). */
export const PAGE_TYPE_ICON: Record<PageType, LucideIcon> = {
  Lokace: MapPin,
  Noviny: Newspaper,
  Seznam: List,
  Galerie: Images,
  Zoom: Maximize2,
  Rodokmen: Network,
  Obrazovka: Monitor,
  Ostatní: FileText,
  // 9.1 — sjednocení Character → Page přidalo 2 nové typy.
  'Postava hráče': User,
  NPC: Skull,
};

export function pageTypeIcon(type: PageType): LucideIcon {
  return PAGE_TYPE_ICON[type] ?? FileText;
}
