import { Fragment, type ReactNode } from 'react';
import { EMOTES, parseEmotes } from '@/features/chat/lib/emotes';
import { linkifyText } from '@/features/chat/lib/linkify';
import { EmoteImage } from '../components/EmoteImage';
import { MENTION_REGEX } from './parseMentions';

/**
 * Krok 6.2g + 6.2i — jednotný render obsahu zprávy ve světovém chatu.
 *
 * Krok 1: nahradí statické `:shortcode:` z `EMOTES` (fáze 4 sada) odpovídajícím
 *         emoji ve stringu.
 * Krok 2: rozdělí text na střídání plain + custom emote `<img>` (per-svět
 *         emotes z `worldEmotes` mapy; 6.4 ji naplní reálnou sadou).
 * Krok 3: na každém plain segmentu vyznačí `@username` mentions přes span.
 *
 * `mentionLookup` je optional — pokud `undefined`, mention regex se přeskakuje
 * (used v náhledech, kde mentions nedávají smysl).
 */

export interface WorldEmoteSet {
  /** shortcode (bez dvojtečky) → URL obrázku */
  byShortcode: Map<string, string>;
}

export interface MentionLookup {
  byUsername: Map<string, { id: string; username: string }>;
  mentionedUserIds: Set<string>;
  currentUserId: string;
}

export interface RenderChatContentOpts {
  worldEmotes?: WorldEmoteSet;
  mentions?: MentionLookup;
  mentionClass: string;
  mentionSelfClass: string;
  emoteClass: string;
}

const SHORTCODE_RE = /:([a-z0-9_]+):/gi;

/**
 * Inline replace `:shortcode:` + ASCII smajlíky (`:D`, `:)`, `<3` …) —
 * reuse jednotné logiky z `parseEmotes` (fáze 4), ať se chování chatu
 * neliší mezi globálním a světovým renderem.
 */
function applyStaticEmotes(text: string): string {
  return parseEmotes(text);
}

// Voids unused-import warning ve světech, kde shortcode resolve řeší
// `parseEmotes`. Mapa zůstává exportovaná pro testy a budoucí přímé použití.
void EMOTES;
void SHORTCODE_RE;

/** Rozdělí text na fragmenty (plain) + world emote `<img>`. */
function splitByWorldEmotes(
  text: string,
  set: WorldEmoteSet | undefined,
  emoteClass: string,
): Array<{ kind: 'text'; value: string } | { kind: 'emote'; node: ReactNode }> {
  if (!set || set.byShortcode.size === 0) {
    return [{ kind: 'text', value: text }];
  }
  const parts: Array<
    { kind: 'text'; value: string } | { kind: 'emote'; node: ReactNode }
  > = [];
  let cursor = 0;
  let keyCounter = 0;
  SHORTCODE_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = SHORTCODE_RE.exec(text)) !== null) {
    const url = set.byShortcode.get(match[1].toLowerCase());
    if (!url) continue;
    if (cursor < match.index) {
      parts.push({ kind: 'text', value: text.slice(cursor, match.index) });
    }
    parts.push({
      kind: 'emote',
      node: (
        <EmoteImage
          key={`we-${keyCounter++}`}
          src={url}
          alt={`:${match[1]}:`}
          className={emoteClass}
        />
      ),
    });
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) {
    parts.push({ kind: 'text', value: text.slice(cursor) });
  }
  return parts;
}

/** Rozdělí plain text na střídání text + mention span (6.2i). */
function splitByMentions(
  text: string,
  lookup: MentionLookup | undefined,
  mentionClass: string,
  mentionSelfClass: string,
  baseKey: string,
): ReactNode[] {
  if (!lookup) return [<Fragment key={baseKey}>{text}</Fragment>];
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let keyCounter = 0;
  MENTION_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = MENTION_REGEX.exec(text)) !== null) {
    const username = match[1];
    const matched = match[0];
    const atOffset = matched.startsWith('@')
      ? match.index
      : match.index + (matched.length - username.length - 1);
    if (cursor < atOffset) {
      nodes.push(
        <Fragment key={`${baseKey}-t-${keyCounter++}`}>
          {text.slice(cursor, atOffset)}
        </Fragment>,
      );
    }
    const fullToken = `@${username}`;
    const user = lookup.byUsername.get(username.toLowerCase());
    if (user && lookup.mentionedUserIds.has(user.id)) {
      const isSelf = user.id === lookup.currentUserId;
      nodes.push(
        <span
          key={`${baseKey}-m-${keyCounter++}`}
          className={
            isSelf ? `${mentionClass} ${mentionSelfClass}` : mentionClass
          }
        >
          {fullToken}
        </span>,
      );
    } else {
      nodes.push(
        <Fragment key={`${baseKey}-u-${keyCounter++}`}>{fullToken}</Fragment>,
      );
    }
    cursor = atOffset + fullToken.length;
  }
  if (cursor < text.length) {
    nodes.push(
      <Fragment key={`${baseKey}-t-${keyCounter}`}>
        {text.slice(cursor)}
      </Fragment>,
    );
  }
  return nodes;
}

/**
 * Emote (static + world `<img>`) + mention render pro JEDEN ne-URL segment.
 * Volá se z `renderChatContent` přes `linkifyText` na částech mimo URL.
 */
function renderRich(
  text: string,
  opts: RenderChatContentOpts,
  baseKey: string,
): ReactNode {
  const withStatic = applyStaticEmotes(text);
  const parts = splitByWorldEmotes(withStatic, opts.worldEmotes, opts.emoteClass);
  const out: ReactNode[] = [];
  parts.forEach((p, i) => {
    if (p.kind === 'emote') {
      out.push(p.node);
    } else {
      out.push(
        ...splitByMentions(
          p.value,
          opts.mentions,
          opts.mentionClass,
          opts.mentionSelfClass,
          `${baseKey}-s${i}`,
        ),
      );
    }
  });
  return <Fragment key={baseKey}>{out}</Fragment>;
}

/**
 * Hlavní render — string → ReactNode. Linkify PRVNÍ (http(s) URL zůstane
 * celistvá), emote + mention běží jen na ne-URL segmentech (`renderRich`).
 */
export function renderChatContent(
  text: string,
  opts: RenderChatContentOpts,
): ReactNode {
  return linkifyText(text, 'w', (segment, key) =>
    renderRich(segment, opts, key),
  );
}
