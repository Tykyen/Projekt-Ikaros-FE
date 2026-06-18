# Spec 13.2a-deeplink — Klik na položku „Chaty" → otevři konverzaci a skoč na zprávu

Dodatek k [spec-13.2.md](spec-13.2.md) §3a/§7 (Souhrn chatů). Položky feedu „Chaty"
v notifikačním centru jsou dnes **needitovatelné** — klik nikam nevede. Cíl:
**klik → otevři daný svět + konverzaci a doscrolluj/zvýrazni danou zprávu.**

## Problém

`ChatFeedTab` renderuje položky jen jako `<li>` bez akce. Uživatel vidí zprávu,
ale nedostane se k ní. Veškerá infrastruktura už existuje, jen není propojená:

- **Deep-link na konverzaci** funguje: `WorldChatRoom` čte `?konverzace={channelId}`
  → vybere konverzaci (dnes z push notifikace).
- **Scroll + zvýraznění zprávy** funguje: `MessageList.handleJump` (scroll-into-view
  + krátký highlight) — dnes pro skok z citace odpovědi.

Chybí: (1) feed nese `worldId`, ale **ne `worldSlug`** (routa světa jede přes slug);
(2) položka feedu není klikatelná; (3) deep-link umí jen konverzaci, ne konkrétní
**zprávu**.

## Cíl

Klik na položku „Chaty" → naviguj na
`/svet/{worldSlug}/chat?konverzace={channelId}&zprava={messageId}` a zavři centrum.
Cílová konverzace se otevře a zpráva se doscrolluje + krátce zvýrazní.

## §1 — BE: feed item nese `worldSlug`

- `ChatFeedItem` (`chat-message.interface.ts`) + `enrichFeed` (`chat.service.ts`)
  rozšířit o **`worldSlug`**. Slug je už dostupný — `worldsService.findById(wid)`
  v enrichi vrací i `slug` (stejný objekt, z něhož se bere `worldName`); přidat
  druhou mapu `worldSlugs` a do výsledku `worldSlug`.
- ⚠️ Žádná změna `chat-message.repository` whitelistu — enrich-vrstva (jako
  `worldName`/`channelName`), ne message mapper.

## §2 — FE: klikatelná položka feedu

- `ChatFeedItem` typ (`notifications/types.ts`) + `worldSlug: string`.
- `ChatFeedTab` — položka = `<button>` (řádek je interaktivní), `onClick`:
  - `navigate('/svet/' + worldSlug + '/chat?konverzace=' + channelId + '&zprava=' + id)`,
  - zavři centrum (`centerOpenAtom = false`).
  - Bez `worldSlug` (prázdný) → položka neklikatelná (defenzivně, žádný rozbitý odkaz).

## §3 — FE: deep-link na zprávu (`?zprava=`)

- `WorldChatRoom` — vedle `?konverzace=` číst **`?zprava={messageId}`**. Předat
  do `ChannelView` jako `jumpToMessageId`. Po vybrání konverzace param `zprava`
  z URL uklidit (stejný `setSearchParams` cleanup jako `konverzace`), ať se skok
  neopakuje při dalším renderu / sdílení URL.
- `ChannelView` → prop `jumpToMessageId` → `MessageList`.
- `MessageList` — nový prop `jumpToMessageId?: string`. Po načtení `items`
  (zpráva je v DOM přes `registerRef`) zavolat existující `handleJump(id)`
  (scroll + highlight). Reuse, žádná nová scroll logika. Effect závislý na
  `[jumpToMessageId, items]`, jednorázový per id (ref-guard, ať se highlight
  neopakuje při každém novém příspěvku).

## §4 — Hranice (vědomě)

- **Zpráva mimo načtené okno** (starší než iniciální limit historie, ~50) není
  v DOM → `handleJump` nic neudělá (jako dnes u skoku z citace). Konverzace se
  přesto otevře (na nejnovějších). Plné „načti kontext kolem zprávy" (BE endpoint
  + virtualizace) je **mimo rozsah** — feed zobrazuje nedávné zprávy, které jsou
  typicky v okně.
- Týká se **jen world chatu** (feed agreguje světy). Globální Hospoda/Rozcestí
  ve feedu nejsou.

## §5 — Bezpečnost

- Navigace jen mění URL; přístup ke konverzaci řeší **existující** world-chat
  brány (členství + channel visibility). Deep-link na nedostupnou konverzaci nic
  neodhalí — `activeChannelId` validuje ID proti načteným kanálům requestera.
- `worldSlug` ve feedu nepřidává žádný leak — feed už vrací jen přístupné světy.

## Rozsah / dopady

- BE: `chat.service.ts` (enrich + `worldSlug`), `chat-message.interface.ts`
  (`ChatFeedItem.worldSlug`), test feedu. Po nasazení **restart BE**.
- FE: `notifications/types.ts`, `ChatFeedTab.tsx`, `WorldChatRoom.tsx`,
  `ChannelView.tsx`, `MessageList.tsx` (+ test).
- Žádná změna WS kontraktu ani DB schématu.

## Testy

- BE: `enrichFeed` vrací `worldSlug` (i prázdný při chybě světa).
- FE: `MessageList` zavolá scroll/highlight pro `jumpToMessageId` po načtení;
  `ChatFeedTab` sestaví správnou URL a zavře centrum; bez `worldSlug` neklikatelné.

## Stav

- [x] Schváleno
- [x] Implementováno (2026-06-18) — BE `worldSlug` ve feedu (test), FE klikatelný
  `ChatFeedTab` → `?konverzace=&zprava=`, `WorldChatRoom`/`ChannelView`/`MessageList`
  jump (reuse `handleJump`, test 3/3). ⚠️ Restart BE. Hranice §4 (zpráva mimo
  načtené okno) ponechána.
