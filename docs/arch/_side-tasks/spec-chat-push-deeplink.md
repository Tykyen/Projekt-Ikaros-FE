# Spec: Push deep-link + poslední konverzace per server

Side-task k chatu (fáze 6). Dvě nezávislé, postupně implementované části.

## Kontext / problém

1. **Deep-link:** push bublina o nové chat zprávě po kliknutí otevře jen kořen
   appky, ne konverzaci, které se zpráva týká. Service worker přitom už umí
   otevřít `notification.data.url` ([public/sw.js](../../../public/sw.js)) a
   `PushPayload` má pole `url?` — BE ho pro chat jen neplní.
2. **Poslední konverzace cross-device:** poslední otevřená konverzace se drží
   jen v localStorage (per zařízení). Na jiném zařízení se začíná od prvního
   kanálu.

## A) Push deep-link do konverzace

- **BE** `chat.service.ts` (push fire-and-forget blok) — do `notifyUsers`
  payloadu přidat `url: "/svet/{world.slug}/chat?konverzace={channelId}"`.
  Vyžaduje dohledat `world.slug` podle `channel.worldId` (1 lookup).
- **FE service worker** — beze změny (otevírá `data.url`).
- **FE** `WorldChatRoom` — přečíst `?konverzace=` (`useSearchParams`); pokud je
  konverzace v dostupných kanálech, vybrat ji a query param z URL odstranit
  (`replace`, ať refresh nezůstane zaseklý na deep-linku).

## B) Poslední konverzace per server (cross-device)

- **BE** — `lastActiveChannelId` do chat prefs per membership; ukládá se přes
  existující `PATCH /worlds/{id}/chat/my-prefs`. Field-drift checklist:
  schema / DTO / service / toEntity mapper.
- **FE** — výběr konverzace ukládat do localStorage (okamžitě) i na server
  (debounced). Při otevření fallback řetězec viz níže.

## Rozhodnutí

- **B priorita: localStorage-first, server jako seed.** Na zavedeném zařízení
  vyhrává localStorage (žádné „skákání" konverzace po načtení serveru — viz
  dnešní fix scrollu/perzistence). Server hodnota se použije jen když je
  localStorage prázdné (nové/jiné zařízení). Není to real-time sync mezi dvěma
  současně aktivními zařízeními — záměrně, kvůli plynulosti.
- **Query param `?konverzace=`** (ne `?channelId=`) — konzistence s českým UI
  názvoslovím (konverzace = ChatChannel).

## Priorita výběru aktivní konverzace (sjednocení A+B)

`?konverzace=` (deep-link) → ruční výběr (`selectedId`) → localStorage →
server (`lastActiveChannelId`) → první kanál.

## Mimo scope

- Real-time sync poslední konverzace mezi aktivními zařízeními.
- Deep-link na konkrétní zprávu (jen na konverzaci).
