import { atom } from 'jotai';

/**
 * 20.5 — počet nepřečtených zpráv admin chatu od poslední návštěvy
 * `/admin/chat` (badge na nav položce „Chat správy"). Client-side (efemérní):
 * tiká na WS `platform-chat:activity`, nuluje se při vstupu na /admin/chat.
 */
export const adminChatUnseenAtom = atom(0);
