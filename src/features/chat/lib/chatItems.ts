import type { ChatItem, ChatMessage } from './types';

const itemTime = (i: ChatItem): number =>
  new Date(i.kind === 'message' ? i.message.createdAt : i.at).getTime();

/**
 * Zprávy z cache → časově seřazený výpis chatu. Systémová zpráva (`isSystem`,
 * příchod/odchod) se zařadí jako system line, ostatní jako běžná zpráva
 * (4.2d §5).
 */
export function toChatItems(messages: ChatMessage[]): ChatItem[] {
  return messages
    .map<ChatItem>((m) =>
      m.isSystem
        ? { kind: 'system', id: m.id, text: m.content ?? '', at: m.createdAt }
        : { kind: 'message', message: m },
    )
    .sort((a, b) => itemTime(a) - itemTime(b));
}
