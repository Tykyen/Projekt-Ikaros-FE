import { atom } from 'jotai';

/** Spec 13.2 — záložky notifikačního centra. 13.2a používá jen `chats`. */
export type NotificationTab = 'chats' | 'events' | 'todo';

/** Drawer otevřený? */
export const centerOpenAtom = atom(false);

/** Aktivní záložka. */
export const centerTabAtom = atom<NotificationTab>('chats');

/**
 * Počet nových chat zpráv od posledního otevření centra (badge u zvonku).
 * Client-side: tiká na `chat:feed:bump`, nuluje se při otevření draweru.
 */
export const chatFeedUnseenAtom = atom(0);
