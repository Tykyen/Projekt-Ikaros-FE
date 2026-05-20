/**
 * Krok 6.2i — `@username` mention parsing pro composer.
 *
 * Regex zrcadleno BE (`chat.service.ts` MENTION_REGEX) — username musí
 * začínat slovním znakem a může pokračovat alfanumerickými, `.` nebo `-`,
 * max 32 znaků celkem.
 *
 * Důležité: regex matchuje na boundary (`^` nebo whitespace) → nezachytí
 * `email@example.com`. Render mentions má `renderChatContent.tsx`
 * (vrací ReactNode, proto v .tsx). Tady jen extract pro composer detekci.
 */

export const MENTION_REGEX = /(?:^|\s)@(\w[\w.-]{0,31})/g;

export function extractMentionUsernames(text: string): string[] {
  return Array.from(
    new Set([...text.matchAll(MENTION_REGEX)].map((m) => m[1])),
  );
}
