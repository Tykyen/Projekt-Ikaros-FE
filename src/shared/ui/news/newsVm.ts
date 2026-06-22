import type { ReactNode } from 'react';
import type { ImageFit } from '@/shared/lib/imageStyle';

/** Vizuální tón novinky — řídí barvu a ikonu štítku i fallback ikonu karty. */
export type NewsTone = 'info' | 'warning' | 'system';

export interface NewsCardImage {
  url: string;
  focalX?: number | null;
  focalY?: number | null;
  zoom?: number | null;
  fit?: ImageFit | null;
}

/**
 * Sjednocený view-model novinky pro sdílenou preview-kartu + detail-modal.
 * Globální (`IkarosNews`) i světové (`WorldNewsItem`) novinky se mapují na
 * tenhle tvar přes per-doménové adaptéry — karta/modal jsou pak čistě
 * prezentační a nemusí znát rozdíly mezi doménami.
 */
export interface NewsCardVM {
  id: string;
  title: string;
  /** Plný HTML obsah — modal ho renderuje, karta z něj dělá úryvek. */
  contentHtml: string;
  tone: NewsTone;
  /** Doménový text štítku ("Upozornění" / "Důležité" / "Systém" …). */
  typeLabel: string;
  image?: NewsCardImage | null;
  /** Krátké datum na kartě (relativní / fantasy). */
  dateChipLabel: string;
  /** Tooltip k datu na kartě (např. reálné datum pod fantasy). */
  dateChipTitle?: string;
  /** Plné datum v detail-modalu. */
  fullDateLabel: string;
  /** Doménový „patička" detailu — autor (globální) / odkaz (svět). */
  footer?: ReactNode;
  archived?: boolean;
}

/** HTML → plain text (úryvek na kartě). Sdíleno místo dvojího regexu v kartách. */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
