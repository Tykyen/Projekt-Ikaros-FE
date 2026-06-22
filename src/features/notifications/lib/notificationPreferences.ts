import type { NotificationPreferences } from '@/shared/types';

/**
 * 15.9 — FE kopie kategorií a defaultů notifikací (dual-source vůči BE
 * `common/notifications/notification-preferences.ts` — měň obě).
 * `undefined` pole = default z kódu (ne zamrazené v DB).
 */
export type NotificationCategory =
  | 'worldChat'
  | 'worldEvent'
  | 'ownDiscussion'
  | 'ownContent'
  | 'worldNews'
  | 'ikarosNews'
  | 'hospoda';

export const NOTIFICATION_CATEGORY_DEFAULTS: Record<
  NotificationCategory,
  boolean
> = {
  worldChat: true,
  worldEvent: true,
  ownDiscussion: true,
  ownContent: true,
  worldNews: true,
  ikarosNews: true,
  hospoda: false,
};

export const PUSH_ENABLED_DEFAULT = true;

/** Resolved hodnota klíče (default-fill) pro stav přepínače v UI. */
export function resolvePref(
  prefs: NotificationPreferences | undefined,
  key: keyof NotificationPreferences,
): boolean {
  if (key === 'pushEnabled') return prefs?.pushEnabled ?? PUSH_ENABLED_DEFAULT;
  const v = prefs?.[key];
  return v === undefined ? NOTIFICATION_CATEGORY_DEFAULTS[key] : v;
}

export interface NotificationCategoryMeta {
  key: NotificationCategory;
  title: string;
  desc: string;
}

export interface NotificationGroupMeta {
  title: string;
  items: NotificationCategoryMeta[];
}

/** Skupiny a popisy pro sekci v profilu (amatérsky srozumitelné). */
export const NOTIFICATION_GROUPS: NotificationGroupMeta[] = [
  {
    title: 'Můj svět',
    items: [
      {
        key: 'worldChat',
        title: 'Chat ve světě',
        desc: 'Nová zpráva v chatu světa, jehož jsi členem.',
      },
      {
        key: 'worldEvent',
        title: 'Akce ve světě',
        desc: 'Nová hra (akce) ve světě + připomínka 24 hodin a 1 hodinu před začátkem.',
      },
    ],
  },
  {
    title: 'Můj obsah',
    items: [
      {
        key: 'ownDiscussion',
        title: 'Vlastní diskuse',
        desc: 'Nový příspěvek v diskusi, kterou jsi založil/a.',
      },
      {
        key: 'ownContent',
        title: 'Vlastní článek a galerie',
        desc: 'Schválení, zamítnutí nebo nové hodnocení tvého článku či obrázku v galerii.',
      },
    ],
  },
  {
    title: 'Novinky',
    items: [
      {
        key: 'worldNews',
        title: 'Novinky světa',
        desc: 'Nová novinka ve světě, jehož jsi členem.',
      },
      {
        key: 'ikarosNews',
        title: 'Novinky Ikarosu',
        desc: 'Nová oznámení a novinky celé platformy Ikaros.',
      },
    ],
  },
  {
    title: 'Komunita',
    items: [
      {
        key: 'hospoda',
        title: 'Hospoda',
        desc: 'Nová zpráva v Interdimenzionální hospodě (globální chat). Standardně vypnuto, aby tě každá zpráva nerušila.',
      },
    ],
  },
];
