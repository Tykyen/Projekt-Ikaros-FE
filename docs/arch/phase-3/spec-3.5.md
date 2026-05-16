# Spec 3.5 — Soukromá pošta (`/ikaros/posta`)

**Status:** ✅ Hotovo 2026-05-15
**Rozsah:** FE (nová stránka + feature komponenty) **+ BE** (threading + úklid legacy + D-057 privacy) — velké
**Repo:** `Projekt-ikaros-FE` + `Projekt-ikaros` (BE). Commity přímo do `main` v obou repech (konvence 3.x kroků — bez feature větví).
**Velikost:** odhad FE ~12–15 souborů / ~1100–1300 ř., BE ~12–15 souborů / ~450 ř.
**Autor:** PJ + Claude
**Datum:** 2026-05-15
**Souvisí:** [spec-3.6.md](spec-3.6.md) (vzor nové `/ikaros` stránky), roadmap 1.4 hranice „Pošta vs. Zpracovat".

> **Změna scope 2026-05-15** (po schválení): autor rozhodl opravit v rámci 3.5 i tři dluhy — viz §4.11–§4.13. Spec aktualizován, D-057 přesunut z Out of scope do scope.

---

## 1. Cíl

Implementovat FE stránku **Soukromá pošta** na `/ikaros/posta` — osobní, platformově globální zprávy mezi uživateli. Inbox / Odeslané, detail zprávy jako vlákno konverzace, nová zpráva s výběrem příjemce, odpověď a smazání. BE pošta je z velké části hotová (`ikaros-messages` modul); chybí jí jen **threading** (řetězení zpráv do konverzace), který se doplní v rámci tohoto kroku.

---

## 2. Kontext / motivace

- Route `/ikaros/posta` existuje ([router.tsx:158](../../../src/app/router.tsx#L158)), ale `MailPage` je 1řádkový stub.
- Header už má tlačítko „Pošta" s badge nepřečtených ([IkarosLayout.tsx:367](../../../src/app/layout/IkarosLayout/IkarosLayout.tsx#L367)) — odkaz dnes vede na prázdnou stránku.
- BE modul `ikaros-messages` je kompletní: inbox / sent / unread-count / detail / send / delete. Krok 3.5 je proto **primárně FE UI práce** + drobné BE rozšíření o threading.
- Roadmap 3.5 slibuje „RSVP eventů (konverzace s odpovědí — zůstává v poště)" — viz §4.5, interpretace.
- Bez pošty nemá platforma žádný 1:1 komunikační kanál mimo veřejný chat; přátelství (1.8) i pozvánky postrádají navazující konverzaci.

---

## 3. Audit současného stavu

### 3.1 Backend — `ikaros-messages` (hotovo)

| Endpoint | Popis |
|---|---|
| `GET /ikaros-messages/inbox?limit=&before=` | Doručené, cursor pagination, bez smazaných |
| `GET /ikaros-messages/sent?limit=&before=` | Odeslané, cursor pagination |
| `GET /ikaros-messages/unread-count` | `{ unreadCount, pendingRequestCount }` |
| `GET /ikaros-messages/:id` | Detail — **auto-označí jako přečtené** |
| `POST /ikaros-messages` | Odeslání (`subject`, `body`, `recipientId`, `recipientName`) |
| `DELETE /ikaros-messages/:id` | Soft-delete per strana (`deletedBySender` / `deletedByRecipient`) |
| `POST /ikaros-messages/:id/resolve` | **Legacy** — řešení `world_join_request` |

Schema [`ikaros-message.schema.ts`](../../../../Projekt-ikaros/backend/src/modules/ikaros-messages/schemas/ikaros-message.schema.ts): `senderId/Name`, `recipientId/Name`, `subject` (≤200), `body` (≤5000), `sentAtUtc`, `isRead`, `deletedBySender/Recipient`, `actionType` (`'' | 'world_join_request'`), `actionWorldId/UserId`, `actionResolved`. **Žádné pole pro vlákno.**

BE při `create` emituje socket event `ikaros:new-message`.

### 3.2 Frontend (chybí)

- [MailPage.tsx](../../../src/features/ikaros/pages/MailPage.tsx) — stub (`[stub] Soukromá pošta`).
- [useMessages.ts](../../../src/features/chat/api/useMessages.ts) — existuje **jen** `useUnreadCount()` (špatně umístěný v `chat/api/`, ne v `ikaros/api/` — viz §8 dluh). Poslouchá socket `ikaros:new-message`, fallback polling 60 s. Header ho už používá.
- `GET /users?q=&page=&limit=` ([users.controller.ts:53](../../../../Projekt-ikaros/backend/src/modules/users/users.controller.ts#L53)) — paginovaný search uživatelů, použitelný pro výběr příjemce.
- FE typ `IkarosMessage` neexistuje — doplní se v `shared/types`.

### 3.3 Dvě paralelní cesty pro „žádost o vstup do světa" (nesrovnalost)

`IkarosMessage.actionType='world_join_request'` + `/resolve` je **legacy parity** se starým systémem. Aktuální FE používá výhradně modul `pending-actions` + `WorldAccessRequestRenderer` v tabu „Zpracovat". Header badge `pendingRequestCount` počítá staré IkarosMessage žádosti — v praxi nejspíš vždy 0. **Krok 3.5 se action zpráv nedotýká** (viz §4.6, §5).

---

## 4. Návrh řešení

### 4.1 BE — threading (řetězení zpráv do konverzace)

Aby „Odpovědět" tvořila konverzaci, `IkarosMessage` dostane dvě pole:

| Pole | Typ | Význam |
|---|---|---|
| `conversationId` | `string` | ID kořenové zprávy vlákna. Samostatná zpráva má `conversationId = vlastní _id`. |
| `replyToId` | `string` (optional) | Přímý rodič (zpráva, na kterou se odpovídá). Prázdné u kořene. |

**Logika `create`:**
- Bez `replyToId` → po vložení se `conversationId` nastaví na vlastní `_id` (kořen).
- S `replyToId` → service načte rodiče, převezme jeho `conversationId`, ověří že požadující je účastník vlákna (sender/recipient rodiče). Příjemce odpovědi = druhá strana rodiče (FE ho stejně posílá, BE validuje).

**Nový endpoint:** `GET /ikaros-messages/conversation/:conversationId` → všechny zprávy vlákna (vzestupně dle `sentAtUtc`), filtrované na „nesmazané pro aktuálního uživatele". 403 pokud uživatel není účastník.

**Migrace:** idempotentní skript `scripts/migrate-message-threads/` — všem existujícím zprávám doplní `conversationId = _id`.

`CreateIkarosMessageDto` rozšířen o `replyToId?: string` (MongoId validace).

Index: `IkarosMessageSchema.index({ conversationId: 1, sentAtUtc: 1 })`.

⚠️ **Mimo scope BE:** žádný RSVP `actionType`, žádný zásah do `world_join_request` / `resolve`.

### 4.2 FE — layout: master-detail

Desktop > 1024 px: dvousloupcový panel — vlevo seznam (taby Doručené / Odeslané + položky), vpravo detail vybrané zprávy / vlákna. Bez route per zpráva (jediný `/ikaros/posta`).

Mobil ≤ 768 px: drill-down — defaultně seznam přes celou šířku; po kliknutí se detail vysune přes celou obrazovku s tlačítkem „‹ Zpět". Tablet 769–1024 px: jako mobil (drill-down) — split je na šířku tabletu těsný.

```
DESKTOP                              MOBIL
┌────────────┬──────────────────┐    seznam (full) ──klik──► detail (full, ‹ Zpět)
│ Doručené▸  │  Předmět         │
│ Odeslané   │  Od: Pavel · čas │
│ ─────────  │  ──────────────  │
│ ●Pavel  ⏱  │  tělo zprávy     │
│  Jana      │  ┌─ vlákno ─┐    │
│  Tomáš     │  │ …odpovědi│    │
│ [+ Nová]   │  [Odpovědět]     │
└────────────┴──────────────────┘
```

### 4.3 FE — seznam (inbox / sent)

- Dva taby `Doručené` / `Odeslané`, URL state `?slozka=dorucene|odeslane` (default `dorucene`).
- Položka: avatar/iniciála protistrany, jméno (sender u inbox, recipient u sent), předmět, relativní čas, tučně pokud nepřečteno (jen inbox).
- Cursor pagination — tlačítko „Načíst starší" volá `before` poslední položky (BE už podporuje).
- Prázdný stav: „Žádné zprávy."
- Real-time: socket `ikaros:new-message` invaliduje inbox + unread-count query.

### 4.4 FE — detail / vlákno

- Otevření položky → `GET /ikaros-messages/:id` (označí přečtené) → invaliduje unread-count (badge klesne).
- Detail načte `GET /ikaros-messages/conversation/:conversationId` a vykreslí celé vlákno (bubliny: vlastní vs. protistrana, jako jednoduchý chat-thread, vzestupně).
- Akce v detailu: `Odpovědět` (inline formulář / modal s předvyplněným příjemcem a předmětem `Re: …`), `Smazat` (soft-delete s `ConfirmDialog`).
- Po smazání: položka zmizí ze seznamu, detail se vyprázdní.

### 4.5 FE — nová zpráva + „RSVP eventů"

- Tlačítko „Nová zpráva" → `ComposeModal` (vzor [IkarosEventModal](../../../src/features/ikaros/components/IkarosEventModal.tsx), React Hook Form + Zod).
- Pole: **Příjemce** (autocomplete `RecipientPicker` nad `GET /users?q=`, debounce ~300 ms, vybere se `{ id, username }`), **Předmět** (≤200), **Text** (≤5000).
- „Odpovědět" znovupoužívá stejný formulář s předvyplněným a zamčeným příjemcem + `replyToId`.

**„RSVP eventů — konverzace s odpovědí zůstává v poště"** (roadmap 3.5): interpretace dle rozhodnutí autora — pošta **neobsahuje žádnou event-specific logiku**. RSVP-jako-konverzace = běžná zpráva o akci + odpověď přes threading (§4.1). Samotné potvrzení účasti (RSVP toggle) zůstává na `/ikaros/akce` (`POST /ikaros-events/:id/confirm`), kde funguje. Threading tím položku roadmapy splňuje bez nového `actionType`.

### 4.6 FE — action zprávy v poště

Inbox vrací i případné `actionType='world_join_request'` zprávy. Pošta 3.5 je vykreslí jako **běžné read-only zprávy** (předmět + tělo) — **žádná accept/reject tlačítka, žádné volání `/resolve`**. Žádosti o vstup do světa řeší výhradně tab „Zpracovat". Pošta = jen osobní konverzace.

### 4.7 FE — header badge

Badge nepřečtených v headeru **už funguje** (`useUnreadCount` + `totalUnread`). 3.5 ho nemění, jen zajistí, že se po otevření zprávy / smazání invaliduje (`['messages','unread-count']`). Roadmap položka „Počítadlo nepřečtených v headeru" je tím de facto splněna; 3.5 ji jen ověří.

### 4.8 Soubory

**BE (`Projekt-ikaros`):**
```
backend/src/modules/ikaros-messages/
├── schemas/ikaros-message.schema.ts        # + conversationId, replyToId, index
├── interfaces/ikaros-message.interface.ts  # + pole
├── dto/create-ikaros-message.dto.ts        # + replyToId?
├── ikaros-messages.service.ts              # threading v create + getConversation
├── ikaros-messages.controller.ts           # + GET conversation/:id
├── repositories/ikaros-messages.repository.ts  # + findConversation
└── ikaros-messages.service.spec.ts         # + testy threadingu
backend/scripts/migrate-message-threads/    # backfill conversationId
```

**FE (`Projekt-ikaros-FE`):**
```
src/features/ikaros/
├── pages/MailPage/
│   ├── MailPage.tsx              # layout, tab + detail state, ?slozka=
│   ├── MailPage.module.css
│   ├── MailList.tsx              # seznam + taby + paginace
│   ├── MailListItem.tsx
│   ├── MailDetail.tsx            # vlákno + akce
│   └── ComposeModal.tsx          # nová zpráva / odpověď
├── components/RecipientPicker.tsx  # autocomplete nad /users?q=
└── api/useMail.ts                # hooky: inbox, sent, detail, conversation, send, delete
```
- `src/features/ikaros/pages/MailPage.tsx` (starý stub) se smaže — nahrazen složkou.
- `shared/types/index.ts` — `IkarosMessage`, `IkarosMessageListItem`, `IkarosConversation`.

### 4.9 Vizuální / theme integrace

- **Žádné nové theme tokeny** — reuse `--text` / `--text-strong` / `--text-muted` / `--surface-2` / `--surface-3` / `--accent` / `--border`.
- Master-detail = jednoduchý split, taby ve vizuálu `UsersPage` (1.4).
- Bublina vlákna: vlastní zpráva `--accent` lem / zarovnání vpravo, protistrana `--surface-2` / vlevo.
- Bez `CornerOrnament`.
- **Po schválení specu:** `frontend-design` audit (návrh master-detail + bublin vlákna napříč 21 motivy) před `plan-3.5.md`.

### 4.10 Mobil

- Drill-down (§4.2). Detail má sticky horní lištu s „‹ Zpět".
- Seznam: položky full-width, touch target ≥ 44 px.
- `ComposeModal`: fullscreen na ≤ 768 px.

### 4.11 Dluh A — přesun `useUnreadCount`

`useUnreadCount` žije v `src/features/chat/api/useMessages.ts`, ač jde o poštu (`ikaros-messages`), ne chat. Přesunout do `src/features/ikaros/api/useMail.ts` (kde vznikají i ostatní pošta-hooky). Header import (`IkarosLayout.tsx`) se přesměruje. `chat/api/useMessages.ts` se smaže, pokud nic jiného neobsahuje. Čistě přesun — žádná změna chování.

### 4.12 Dluh B — úklid legacy `world_join_request` / `resolve`

`IkarosMessage` nese `actionType`/`actionWorldId`/`actionUserId`/`actionResolved` + endpoint `POST /:id/resolve` + event handler `handleJoinRequest` (`world.join.requested`) + `countPendingRequests`. Je to **parity-relikt** ze starého systému, plně nahrazený modulem `pending-actions` + `WorldAccessRequestRenderer`.

**Postup (s ověřením):**
1. Ověřit, že `world.join.requested` event je dnes konzumován i modulem `worlds`/`pending-actions` (world-access-request provider) — pokud ano, `handleJoinRequest` v `ikaros-messages` je čistá duplicita a lze ho odstranit.
2. Odstranit z `IkarosMessage`: pole `actionType`/`actionWorldId`/`actionUserId`/`actionResolved`, endpoint `resolve`, DTO `ResolveIkarosMessageDto`, service `resolve`/`handleJoinRequest`, repository `countPendingRequests`/`resolveIfPending`.
3. `getUnreadCount` vrací nově jen `{ unreadCount }` (bez `pendingRequestCount`).
4. FE `UnreadCountResponse` ztrácí `pendingRequestCount`; header badge = jen `unreadCount`.
5. Indexy schématu zjednodušit (vypadne `actionType` z compound indexu).
6. Migrace — orphan pole ve starých Mongo dokumentech jsou neškodná (schema-less), nemažeme.

⚠️ Pokud ověření v kroku 1 ukáže, že `ikaros-messages` je **jediný** konzument `world.join.requested` → úklid se zastaví, prokomunikuje s autorem (odstranění by rozbilo world-join). Spec předpokládá duplicitu na základě §3.3.

### 4.13 D-057 — friend-only privacy

Nové pole `User.profileVisibility: 'public' | 'friends'` (default `'public'`).

**BE enforcement:**
- Profil (`GET /users/profile/v14/:id`, `GET /users/:id`) — pokud cíl má `'friends'` a requester není friend, není to on sám a není Admin/Superadmin → 403 `PROFILE_FRIENDS_ONLY`.
- Pošta (`POST /ikaros-messages`) — pokud příjemce má `'friends'` a odesílatel není friend ani Admin/Superadmin → 403 `RECIPIENT_FRIENDS_ONLY`. Odpověď ve vlákně (`replyToId`) je výjimka — na konverzaci, kterou příjemce sám zahájil, lze odpovědět vždy.
- `PUT /users/:id/...` (profil update) přijme `profileVisibility`.

**FE:**
- Přepínač „Kdo mě vidí / může mi psát" v profilu (sekce Bezpečnost / nová mini-sekce Soukromí) — `public` / `friends`.
- `ComposeModal` ošetří 403 `RECIPIENT_FRIENDS_ONLY` — chybová hláška „Tento uživatel přijímá zprávy jen od přátel."
- Profil 403 `PROFILE_FRIENDS_ONLY` — friendly stav „Tento profil je viditelný jen přátelům."

---

## 5. Out of scope

- **Action zprávy / `world_join_request` v poště** — render jako plain text, žádné accept/reject (§4.6). Resolve řeší „Zpracovat".
- **Nový RSVP `actionType`** ani event integrace do pošty — RSVP zůstává na `/ikaros/akce` (§4.5).
- **Per-world pošta** — pošta je platformově globální.
- **Přílohy, formátování těla, emoji picker** — prostý text.
- **Mazání celé konverzace najednou** — maže se po jednotlivých zprávách (BE soft-delete je per zpráva).
- **Blokace uživatelů** (D-055) — friend-only privacy je nově ve scope (§4.13), ale tvrdá blokace konkrétního uživatele zůstává mimo.
- **Notifikace e-mailem o nové zprávě.**
- **Granular privacy** (zvlášť „kdo vidí profil" vs „kdo mi píše") — D-057 zavádí jediný společný přepínač `profileVisibility`; rozdělení na dvě úrovně později.

---

## 6. Acceptance kritéria

1. ✅ `/ikaros/posta` zobrazuje master-detail: taby Doručené / Odeslané + detail.
2. ✅ Tab se promítá do URL `?slozka=dorucene|odeslane`, back/forward funguje.
3. ✅ Seznam zobrazuje zprávy s protistranou, předmětem, časem; nepřečtené v inboxu tučně.
4. ✅ Otevření zprávy → detail zobrazí celé vlákno; zpráva se označí přečtenou a header badge klesne.
5. ✅ „Nová zpráva" — výběr příjemce přes autocomplete nad `/users?q=`, odeslání vytvoří kořen vlákna.
6. ✅ „Odpovědět" vytvoří zprávu se správným `replyToId` / `conversationId`, objeví se ve vlákně.
7. ✅ „Smazat" (s potvrzením) zprávu soft-smaže a odstraní ze seznamu.
8. ✅ BE: `GET /ikaros-messages/conversation/:id` vrací vlákno vzestupně, 403 pro cizí účastníky.
9. ✅ Migrace doplní `conversationId` všem starým zprávám (idempotentní, dry-run).
10. ✅ Action zprávy se vykreslí jako plain text bez akčních tlačítek.
11. ✅ Mobil ≤ 768 px: drill-down funguje, detail má „‹ Zpět".
12. ✅ Žádné hardcoded barvy (`lint:colors` projde); žádný z 21 motivů nerozbije layout.
13. ✅ BE `npm test`, FE `lint` / `test:run` / `build` / `tsc` projdou.
14. ✅ (Dluh A) `useUnreadCount` žije v `ikaros/api/`, header funguje, `chat/api/useMessages.ts` smazán.
15. ✅ (Dluh B) `IkarosMessage` nemá action pole ani `/resolve`; `unread-count` vrací jen `{ unreadCount }`; world-join flow přes `pending-actions` funguje dál.
16. ✅ (D-057) Uživatel s `profileVisibility: 'friends'` — nepřítel dostane 403 na profil i na odeslání zprávy; přítel/Admin/já projdu; odpověď ve vlákně projde vždy.
17. ✅ (D-057) Profil má funkční přepínač soukromí; pošta i profil ošetří 403 čitelnou hláškou.

---

## 7. Test plán

**BE automated:**
- `ikaros-messages.service.spec.ts` — `create` kořen (`conversationId = _id`), `create` s `replyToId` (převzetí `conversationId`, validace účastníka), `getConversation` (řazení, 403 cizí, filtr smazaných).
- Migrace — dry-run + idempotence.

**FE automated:**
- `MailPage.spec.tsx` — render tabů, switch → URL `?slozka=`, prázdný stav.
- `MailDetail` — render vlákna, „Odpovědět" / „Smazat" akce.
- `RecipientPicker` — debounce search, výběr.
- `useMail` hooky — invalidace inbox + unread po send/delete.
- `lint`, `lint:colors`, `test:run`, `build`.

**Manuální smoke:**
- Pošli zprávu uživateli → objeví se v jeho inboxu (real-time přes socket) i ve vlastních Odeslaných.
- Otevři nepřečtenou → badge v headeru klesne.
- Odpověz → vlákno má dvě bubliny.
- Smaž zprávu → zmizí mně, druhé straně zůstane.
- Mobil 360 px → drill-down + Zpět.
- Projít 21 motivů → layout drží (frontend-design audit).

---

## 8. Riziko & rollback

| Riziko | Pravděp. | Mitigace |
|---|---|---|
| Migrace `conversationId` na produkčních datech selže / není idempotentní | Střední | Dry-run režim, upsert per `_id`, test na kopii. Bez migrace vlákna fungují i tak (fallback `conversationId = _id` v service při čtení). |
| Úklid legacy world-join (§4.12) rozbije world-join flow | Nízká | Krok 1 §4.12 — ověřit duplicitu konzumace `world.join.requested` před mazáním; při pochybě zastavit a prokomunikovat. |
| D-057 enforcement zablokuje legitimní odpovědi | Nízká | Odpověď ve vlákně (`replyToId`) je z friend-only checku vyňata — na konverzaci, kterou příjemce sám zahájil, lze odpovědět vždy. |
| Master-detail na tabletu těsný | Střední | Tablet jede drill-down režim (≤ 1024 px), ne split. |
| Psát lze komukoliv (spam) | Střední | Akceptováno pro 3.5; per-pair restrikce / blokace = D-055/D-057, pozdější fáze. |

**Rollback:** FE — vrátit `MailPage` na stub, smazat složku `MailPage/`. BE — pole `conversationId`/`replyToId` jsou aditivní a nepovinná, lze ponechat (neškodí); endpoint `conversation` odstranit. Bezpečný rollback.

---

## 9. Otázky k autorovi

Autor předem rozhodl (brainstorming 2026-05-15):

- ✅ **Pošta = jen osobní zprávy, platformově globální** — žádný per-world scope.
- ✅ **Action zprávy descope** — pošta = čistá konverzace, `world_join_request` jen plain text bez akcí.
- ✅ **RSVP = běžná zpráva + odpověď** — BE rozšíření = threading (`conversationId`/`replyToId`), žádný RSVP `actionType`.
- ✅ **Layout master-detail** — desktop split, mobil/tablet drill-down.
- ✅ **Příjemce = search všech uživatelů** přes `GET /users?q=` + „Odpovědět" předvyplní.
- ✅ **Scope rozšířen o 3 dluhy** (rozhodnuto 2026-05-15): dluh A (přesun `useUnreadCount`), dluh B (úklid legacy `world_join_request`), D-057 (friend-only privacy) — viz §4.11–§4.13.

---

**Po schválení specu navazuje:**
1. `frontend-design` audit (master-detail + bubliny vlákna v rámci 21 motivů).
2. `plan-3.5.md` — přesné CLI / file diffs / pořadí (BE threading → migrace → FE hooky → FE UI).
3. Implementace.
