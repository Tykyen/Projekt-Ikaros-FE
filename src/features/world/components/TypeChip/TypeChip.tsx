import type { WorldNewsType } from '@/shared/types';
import { NewsTypeChip, type NewsTone } from '@/shared/ui';

interface Props {
  type: WorldNewsType;
  size?: 'sm' | 'md';
}

const TYPE_LABEL: Record<WorldNewsType, string> = {
  info: 'Informace',
  alert: 'Důležité',
  system: 'Systém',
};

const TYPE_TONE: Record<WorldNewsType, NewsTone> = {
  info: 'info',
  alert: 'warning',
  system: 'system',
};

/**
 * 9.5 — barevný štítek typu novinky světa. Po sjednocení (2026-06-22) tenký
 * adaptér nad sdíleným `NewsTypeChip` (mapuje `WorldNewsType` → tón + popisek).
 */
export function TypeChip({ type, size = 'md' }: Props) {
  return <NewsTypeChip tone={TYPE_TONE[type]} label={TYPE_LABEL[type]} size={size} />;
}
