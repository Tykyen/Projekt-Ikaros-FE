# Spec 4.3a — Zprávy: Reply + reakce

Rozšíření globálního chatu (Hospoda + Rozcestí) o **odpovědi na zprávu** a
**emoji reakce**. Přílohy řeší samostatný krok 4.3b.

## Kontext (co už existuje)

- BE `ChatMessage` interface (`chat/interfaces/chat-message.interface.ts`)
  **už má pole** `replyToId`, `replyToPreview`, `replyToSenderName`
  a `reactions: Record<string, string[]>`. `GlobalChatService` je ukládá
  jako prázdné — chybí handlery, které je naplní.
- FE typ `ChatMessage` (`chat/lib/types.ts`) má `reactions`, ale **chybí mu
  reply pole** → type drift, sjednotit (skill `type-sync`).
- Veřejná zpráva: REST `POST /global-chat/messages` → `CreateGlobalMessageDto`
  → WS echo `chat:message`.
- Whisper: WS `ikaros:whisper` → `sendWhisper` → `chat:message` jen `visibleTo`.
- Mazání: WS `chat:message:deleted`.
- FE výpis: `MessageList` → `MessageItem`; cache je `ChatMessage[]` v React
  Query (`chatQueryKeys(room).messages`), WS listenery ji mutují v `ChatRoom`.

## §1 — Reply (odpověď na zprávu)

### BE

- `CreateGlobalMessageDto` + `replyToId?: string` (`@IsOptional @IsString`).
- `GlobalChatService.sendMessage` — když `dto.replyToId`:
  - načíst cílovou zprávu (`messageRepo.findById`),
  - **validace**: existuje, stejný `channelId`, `!isDeleted`, `!isSystem`;
    jinak `replyToId` ignorovat (tichý fallback na běžnou zprávu — cíl mohl
    expirovat za 1 h TTL).
  - naplnit `replyToId`, `replyToPreview` (`content` oříznutý na 120 znaků),
    `replyToSenderName`.
- Whisper — `ikaros:whisper` payload + `replyToId?: string`, `sendWhisper`
  stejná logika. Reply na whisper smí jen účastník (cíl má `visibleTo`).
- Smazání zprávy (`deleteMessage`) **nemaže** zprávy, které na ni odpovídají —
  jejich `replyToPreview` zůstává (citace přežije smazání originálu; UI to
  označí, viz FE).

### FE

- Typ `ChatMessage` + `replyToId?`, `replyToPreview?`, `replyToSenderName?`.
- `SendMessagePayload` + `replyToId?`. `sendWhisper` payload taktéž.
- `ChatInput` — stav „odpovídám na zprávu X":
  - lišta nad polem: `↩ {senderName}: {úryvek}` + tlačítko „×" pro zrušení.
  - `replyTo` přichází jako prop z `ChatRoom` (lift state — kliknutí Reply je
    v `MessageItem`).
  - po odeslání se reply stav vyčistí.
- `MessageItem` — hover akce: tlačítko **Odpovědět** (ikona `Reply`).
- `MessageItem` — pokud má zpráva `replyToId`: nad obsahem citační blok
  (`↩ {replyToSenderName}` + `replyToPreview`). Klik na citaci → scroll
  k originálu, pokud je ve výpisu (krátké zvýraznění); jinak blok needitovatelný
  („zpráva už není dostupná" se nezobrazuje zvlášť — `replyToPreview` stačí).
- Scroll k originálu: `MessageList` drží `Map<messageId, HTMLElement>` přes
  ref callback; `MessageItem` dostane `onJumpToMessage(id)`.

## §2 — Emoji reakce

### Datový model

`reactions: Record<emoji, userId[]>` — klíč = emoji znak, hodnota = pole
userId, kteří reagovali. Toggle: userId v poli → odebrat, jinak přidat;
prázdné pole emoji se z objektu smaže.

### BE

- Nový WS handler `@SubscribeMessage('chat:reaction:toggle')`,
  payload `{ room: string, messageId: string, emoji: string }`.
  - `emoji` validovat (neprázdný string, max ~16 znaků — pokrytí pro
    složené emoji se ZWJ; není to vstup textu).
  - `GlobalChatService.toggleReaction(room, messageId, userId, emoji)`:
    - načíst zprávu, ověřit `channelId` + `!isDeleted` + `!isSystem`,
    - u whisperu ověřit, že `userId` je ve `visibleTo` (reagovat smí jen kdo
      zprávu vidí),
    - zmutovat `reactions`, uložit (`messageRepo.update`).
- Nový WS event `chat:message:reaction`, payload
  `{ messageId, channelId, reactions }`.
  - veřejná zpráva → `server.to('chat:'+channelId)`,
  - whisper → jen `server.to('user:'+id)` pro každé `visibleTo`.

### FE

- Hook `useToggleReaction(room)` — `getSocket().emit('chat:reaction:toggle', …)`.
  Žádný REST; reakce je efemérní jako zpráva (TTL 1 h).
- `ChatRoom` — WS listener `chat:message:reaction` → v cache
  `chatQueryKeys(room).messages` nahradit `reactions` u dané zprávy.
- `MessageItem`:
  - pod obsahem řádek **reaction chips** — `{emoji} {count}`; chip, na kterém
    je můj `userId`, je zvýrazněný. Klik na chip = toggle stejné emoji.
  - hover akce: tlačítko **Přidat reakci** (ikona `SmilePlus`) → otevře
    emoji picker (popover ukotvený ke zprávě). Výběr = toggle.
- Smazaná zpráva: reakce ani tlačítka se nevykreslují (řádek „Zpráva byla
  smazána" beze změny). Systémová zpráva: bez reakcí.

### Emoji picker — knihovna (rozhodnutí k odsouhlasení)

Projekt nemá žádnou emoji knihovnu. Návrh: **`frimousse`** — headless emoji
picker, bez vlastních stylů → plná kontrola nad vzhledem, sladí se s theme
systémem platformy, malá závislost. Alternativa `emoji-picker-react`
(hotový vzhled, vlastní theming, větší). **Volba je součástí schválení specu.**

## §3 — Whisper

Reply i reakce fungují u whisperů (rozhodnutí z brainstormingu). `visibleTo`
omezuje viditelnost reakce; BE i broadcast to respektují (viz §1, §2).

## Mimo scope

- Přílohy → krok 4.3b.
- Reakce na systémové hlášky příchodu/odchodu.
- Notifikace o reakci / reply (push). Chat je real-time, TTL 1 h — netřeba.
- Vlákna (threads) — reply je jen citace, ne strom konverzace.

## Responsive

- `ChatInput` reply lišta: na mobilu úryvek zkrátit (ellipsis), tlačítko „×"
  vždy dosažitelné palcem.
- Emoji picker: na mobilu jako spodní sheet / plná šířka, ne úzký popover.
- Hover akce zprávy: na dotykových zařízeních není hover — akce zpřístupnit
  tapem na zprávu (toggle akční lišty).
- Po implementaci ověřit skillem `mobil-desktop`.

## Testy

- BE: `sendMessage` s validním/nevalidním `replyToId` (cizí kanál, smazaná,
  systémová, neexistující) → naplnění resp. fallback; `toggleReaction`
  přidá/odebere/vyčistí emoji; whisper reakce odmítne ne-účastníka;
  `chat:message:reaction` broadcast scope (veřejná vs. whisper).
- FE: typy sjednoceny; `ChatInput` reply lišta + zrušení; `MessageItem`
  citace + reaction chips (zvýraznění mého userId); `ChatRoom` cache update
  po `chat:message:reaction`; scroll-to-original.

## Stav

- [x] Schváleno (2026-05-17) — emoji picker `frimousse`, reply preview 120 znaků
- [x] Implementováno (2026-05-17)
