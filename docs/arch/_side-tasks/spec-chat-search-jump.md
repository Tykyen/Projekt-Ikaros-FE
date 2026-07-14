# Spec: Hledání v chatu — skok přímo na nalezenou zprávu

**Stav:** ✅ IMPLEMENTOVÁNO (2026-07-14) · FE-only · testy zelené (hunt smyčka 6, modal klik, MessageList skok), build+lint čisté; čeká živé ověření uživatelem
**Souvisí:** krok 6.6 (hledání), 13.2a (deep-link `?zprava=` z feedu), SC-33 (donačítání starší historie)

## Problém

Klik na výsledek v „Hledání ve zprávách" (`ChatSearchModal`) jen přepne konverzaci
(`onSelectResult(channelId)`) — `messageId` výsledku se zahodí. Mechanismus skoku
(`MessageList.jumpToMessageId` → scroll `block:center` + highlight) existuje,
ale je no-op, když zpráva není v načteném okně (seed = posledních 50) — což je
u výsledků hledání typický případ.

## Řešení

### A) Propojení search → jump

- `ChatSearchModal.onSelectResult(channelId, messageId)` — předává i ID zprávy.
- `WorldChatRoom`: klik na výsledek = `selectChannel(channelId)` + nastavení
  `jumpToMessageId` (stejný stav jako deep-link `?zprava=`). Podmínka předání
  do `ChannelView` se rozváže z vazby čistě na `lastDeepLink` — drží se pár
  `{channelId, messageId}` a jump se předá, když `active.id === pár.channelId`
  (funguje pro deep-link i hledání).

### B) Dohledání zprávy v historii

- Nový hook `useJumpToMessage` (rozšíření v `useWorldChat.ts` vedle
  `useLoadOlderMessages`): když `jumpToMessageId` není v messages cache,
  sekvenčně donačítá starší dávky kurzorem `?before=<nejstarší>` s
  `limit=100` (BE strop) a prependuje přes `prependOlderMessages`.
- Konec smyčky: cíl nalezen → stop (scroll zařídí stávající effect v
  `MessageList`, závislý na `items`) · začátek historie (dávka < limit) ·
  pojistka **max 30 dávek** (~3000 zpráv).
- Nenalezeno (strop/začátek) → nenápadná hláška „Zpráva je příliš hluboko
  v historii" (stav v `ChannelView`, zmizí po pár sekundách / při akci).
- Scroll během donačítání drží kotvu (SC-33 `pendingAnchorRef` už funguje).
- Sdílí stav s `useLoadOlderMessages` (`reachedStart`), aby tlačítko
  „Zobrazit starší" po skoku vědělo, kde je.

## Mimo scope

- Virtualizace `MessageList` (po hlubokém skoku je v DOM hodně zpráv) —
  známý limit, řeší se až při reálném problému.
- BE `around` endpoint (okno kolem zprávy) — nezvoleno: rozbilo by invariant
  „cache = souvislý blok končící nejnovější zprávou" (WS append, unread).
- Klik z notifikačního feedu — zlepší se zdarma (stejná trubka), žádná
  samostatná práce.

## Dotčené soubory

- `src/features/world/chat/components/ChatSearchModal.tsx` — signatura callbacku
- `src/features/world/chat/components/WorldChatRoom.tsx` — jump pár, předání
- `src/features/world/chat/components/ChannelView.tsx` — hook + hláška
- `src/features/world/chat/api/useWorldChat.ts` — `useJumpToMessage`
- testy: `ChatSearchModal.spec.tsx`, `useWorldChat` (smyčka dohledání)
