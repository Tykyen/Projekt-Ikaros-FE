import { describe, it, expect } from 'vitest';
import {
  NOTIFICATION_CATEGORY_DEFAULTS,
  NOTIFICATION_GROUPS,
  resolvePref,
  type NotificationCategory,
} from './notificationPreferences';

/**
 * Zrcadlo BE `common/notifications/notification-preferences.ts` (dual-source).
 * Hlídá: každá kategorie má default I položku v UI skupinách (a naopak),
 * a klíčové defaulty (posta/adminChat ZAP, hospoda VYP) sedí s BE.
 */
describe('notificationPreferences — zrcadlo kategorií', () => {
  const defaultKeys = Object.keys(
    NOTIFICATION_CATEGORY_DEFAULTS,
  ) as NotificationCategory[];
  const groupKeys = NOTIFICATION_GROUPS.flatMap((g) =>
    g.items.map((i) => i.key),
  );

  it('každá kategorie z defaultů má právě jednu položku v UI skupinách', () => {
    expect([...groupKeys].sort()).toEqual([...defaultKeys].sort());
  });

  it('žádná kategorie není v UI skupinách duplicitně', () => {
    expect(new Set(groupKeys).size).toBe(groupKeys.length);
  });

  it('posta má default ZAP a toggle „Pošta" v UI', () => {
    expect(NOTIFICATION_CATEGORY_DEFAULTS.posta).toBe(true);
    const item = NOTIFICATION_GROUPS.flatMap((g) => g.items).find(
      (i) => i.key === 'posta',
    );
    expect(item?.title).toBe('Pošta');
  });

  it('adminChat má default ZAP a toggle v UI', () => {
    expect(NOTIFICATION_CATEGORY_DEFAULTS.adminChat).toBe(true);
    expect(groupKeys).toContain('adminChat');
  });

  it('hospoda je jediná default VYP (opt-in)', () => {
    const off = defaultKeys.filter((k) => !NOTIFICATION_CATEGORY_DEFAULTS[k]);
    expect(off).toEqual(['hospoda']);
  });
});

describe('resolvePref', () => {
  it('undefined pole → default kategorie (posta ZAP)', () => {
    expect(resolvePref(undefined, 'posta')).toBe(true);
    expect(resolvePref({}, 'posta')).toBe(true);
  });

  it('explicitní hodnota přebíjí default', () => {
    expect(resolvePref({ posta: false }, 'posta')).toBe(false);
    expect(resolvePref({ hospoda: true }, 'hospoda')).toBe(true);
  });

  it('pushEnabled má vlastní default (ZAP)', () => {
    expect(resolvePref(undefined, 'pushEnabled')).toBe(true);
    expect(resolvePref({ pushEnabled: false }, 'pushEnabled')).toBe(false);
  });
});
