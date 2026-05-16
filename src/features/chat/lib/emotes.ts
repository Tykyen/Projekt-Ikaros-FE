/**
 * Textové emotes globálního chatu — `:shortcode:` → emoji.
 * Statický klientský set (BE žádný globální emote zdroj nemá).
 * Laděno k hospodě: pivo, kostky, oheň, krčmářské motivy.
 */

export const EMOTES: Record<string, string> = {
  beer: '🍺',
  cheers: '🥂',
  wine: '🍷',
  dice: '🎲',
  fire: '🔥',
  heart: '❤️',
  skull: '💀',
  star: '⭐',
  crown: '👑',
  sword: '⚔️',
  shield: '🛡️',
  magic: '✨',
  ghost: '👻',
  moon: '🌙',
  sun: '☀️',
  coffee: '☕',
  music: '🎵',
  laugh: '😂',
  smile: '😄',
  wink: '😉',
  cry: '😢',
  angry: '😠',
  think: '🤔',
  cool: '😎',
  wave: '👋',
  thumbsup: '👍',
  thumbsdown: '👎',
  clap: '👏',
  eyes: '👀',
  ok: '👌',
};

const EMOTE_RE = /:([a-z0-9_]+):/gi;

/**
 * Nahradí známé `:shortcode:` v textu odpovídajícím emoji.
 * Neznámé shortcody zůstanou beze změny.
 */
export function parseEmotes(text: string): string {
  return text.replace(EMOTE_RE, (match, code: string) => {
    return EMOTES[code.toLowerCase()] ?? match;
  });
}
