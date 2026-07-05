import { Fragment, type ReactNode } from 'react';
import { parseEmotes } from './emotes';
import { linkifyText } from './linkify';

/**
 * 20.6 — render obsahu zprávy pro globální / admin chat (bez per-svět emotů a
 * mentions). Linkify běží PRVNÍ (klikací http(s) URL), emoji shortcody + ASCII
 * smajlíky (`parseEmotes`) se aplikují jen na ne-URL segmenty — takže URL se
 * `:shortcode:` uvnitř zůstane celistvá (dluh N2). Vrací ReactNode (text +
 * `<a>` + emoji).
 *
 * Světový chat má vlastní `renderChatContent` (navíc world emote `<img>` +
 * mentions), který linkify aplikuje stejným způsobem (jako první vrstvu).
 */
export function renderPlainChatContent(text: string): ReactNode {
  return linkifyText(text, 'lnk', (segment, key) => (
    <Fragment key={key}>{parseEmotes(segment)}</Fragment>
  ));
}
