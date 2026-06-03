import type { ChatMessage } from '@/features/chat/lib/types';

/**
 * Spec 13.2a — položka „Souhrn chatů": zpráva z libovolného mého světa
 * obohacená o název světa a kanálu (BE `ChatFeedItem`). Server vrací jen
 * kanály, kam mám přístup → žádný cross-world leak.
 */
export interface ChatFeedItem extends ChatMessage {
  worldName: string;
  channelName: string;
}
