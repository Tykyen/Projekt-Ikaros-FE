/**
 * Krok 6.2h — klientský nonce pro idempotentní retry zprávy.
 *
 * BE drží sparse unique index `(channelId, clientNonce)` v `chatmessages` →
 * dva sendy se stejným nonce nikdy nevytvoří dvě zprávy. FE generuje UUID v4
 * při optimistic insertu a posílá stejný nonce při všech retry pokusech.
 */

export function clientNonce(): string {
  // `crypto.randomUUID` je dostupné v moderních prohlížečích (Chrome 92+,
  // Safari 15.4+, Firefox 95+) i v jsdom 22+. Test env ho má.
  return crypto.randomUUID();
}
