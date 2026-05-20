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
 * ASCII smajlíky (Discord/Messenger styl) — vkládají se přímo do textu bez
 * obklopení dvojtečkami. Boundary check zajistí, že `:D` v `:Daniel` se NE-
 * konvertuje (před tokenem musí být whitespace nebo začátek řetězce, za ním
 * whitespace, konec nebo interpunkce).
 */
export const ASCII_EMOTES: Record<string, string> = {
  ':)': '🙂',
  ':-)': '🙂',
  ':(': '🙁',
  ':-(': '🙁',
  ":'(": '😢',
  ":'-(": '😢',
  ':D': '😄',
  ':-D': '😄',
  'XD': '😂',
  'xD': '😂',
  ':P': '😛',
  ':p': '😛',
  ':-P': '😛',
  ';)': '😉',
  ';-)': '😉',
  ';P': '😜',
  ';p': '😜',
  ':O': '😮',
  ':o': '😮',
  ':-O': '😮',
  ':*': '😘',
  ':-*': '😘',
  '<3': '❤️',
  '</3': '💔',
  ':3': '😺',
  ':|': '😐',
  ':-|': '😐',
  ':/': '😕',
  ':-/': '😕',
  'B)': '😎',
  'B-)': '😎',
  '8)': '😎',
  ':@': '😡',
  'o.O': '😳',
  'o_O': '😳',
  ':$': '😳',
  '^^': '😊',
  '^_^': '😊',
  '>:(': '😠',
  '>:)': '😈',
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Tokens řazené od nejdelších (aby `:-D` matchnul před `:D`).
const ASCII_TOKENS = Object.keys(ASCII_EMOTES).sort(
  (a, b) => b.length - a.length,
);

// Boundary: před tokenem začátek nebo whitespace; za ním konec, whitespace
// nebo interpunkce. Bez (?<=) lookbehind používáme capture group `before`.
const ASCII_RE = new RegExp(
  `(^|\\s)(${ASCII_TOKENS.map(escapeRegex).join('|')})(?=\\s|$|[.,!?;:])`,
  'g',
);

/** Nahradí ASCII smajlíky odpovídajícím Unicode emoji. */
function applyAsciiEmotes(text: string): string {
  return text.replace(ASCII_RE, (_full, before: string, token: string) => {
    return `${before}${ASCII_EMOTES[token] ?? token}`;
  });
}

/**
 * Nahradí známé `:shortcode:` v textu odpovídajícím emoji + ASCII smajlíky
 * (`:)`, `:D`, `<3`, …). Neznámé shortcody zůstanou beze změny.
 */
export function parseEmotes(text: string): string {
  const withAscii = applyAsciiEmotes(text);
  return withAscii.replace(EMOTE_RE, (match, code: string) => {
    return EMOTES[code.toLowerCase()] ?? match;
  });
}
