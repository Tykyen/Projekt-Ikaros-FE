# Spec 4.2e — Zprávy v chatu nesou identitu postavy/účtu (avatar + jméno)

Uzavírá otevřenou otázku z **4.2d §8**:

> „týká se to jen seznamu přítomných, nebo i jmen u zpráv a hlášek v Rozcestí
> (autor = `characterName`)? Tento spec řeší zatím jen seznam přítomných."

Odpověď: i zprávy. Identita autora ve zprávě má mít **stejný základ jako panel
přítomných** — Rozcestí postavu, Hospoda účet.

## Problém (dnešní stav)

Zprávy globálního chatu zobrazují vždy `username` + iniciálu místo avataru:

- **BE** `global-chat.service` ukládá `senderName = user.username` (i v Rozcestí)
  a `senderAvatarUrl` **nevyplňuje vůbec** → `message.senderAvatarUrl` je prázdné.
- **FE** `ChatRoom` nepředává `MessageList` resolver avatarů (na rozdíl od
  světového `ChannelView`) → avatar zprávy stojí jen na prázdném `senderAvatarUrl`
  → fallback na iniciálu.

Postava se tak promítne jen do panelu přítomných (živá presence, `UserList` mode),
ne do zpráv. Schema `chat-message` i repo `toEntity` přitom `senderAvatarUrl` už
znají — jen se neplní.

## Cíl

| Místnost | Jméno zprávy | Avatar zprávy |
|---|---|---|
| **Hospoda** | `username` | avatar účtu (`avatarUrl`) |
| **Rozcestí I.–III.** | `characterName` → fallback `username` | `characterAvatarUrl` → fallback `avatarUrl` |

## §1 — BE: snapshot identity při odeslání

Identita se **zmrazí v okamžiku odeslání** (snapshot), ne render-time. Důvod:
roleplay — zpráva si natrvalo pamatuje, za kterou postavu byla napsána, i když
autor postavu/avatar později změní. (Opak světového chatu, kde je PJ persona
render-time záměrně.)

- Helper `resolveSenderIdentity(room, profile, username)` →
  `{ senderName, senderAvatarUrl }`:
  - `room === 'hospoda'`: `{ username, profile.avatarUrl }`
  - jinak (Rozcestí): `{ profile.characterName || username,
    profile.characterAvatarUrl || profile.avatarUrl }`
- `sendMessage` i `sendWhisper` — místo `senderName: username` dosadit výsledek
  helperu (`senderName` + `senderAvatarUrl`).
- Zdroj profilu: `usersService.findById(userId)` (autoritativní — klient
  neposílá, nemůže lhát o cizí postavě; stejně jako gateway při joinu 4.2d §8).
  → `GlobalChatService` injektuje `UsersService` (gateway ho v modulu už má).
- Systémové zprávy (`saveSystemMessage`) beze změny (`senderName: 'system'`).
- ⚠️ Cena: +1 DB lookup profilu na zprávu. Přijatelné pro chat; gateway už
  stejný lookup dělá při joinu.

## §2 — FE: resolver avatarů z presence (fallback pro živé)

Po BE deployi nové zprávy nesou `senderAvatarUrl` (snapshot) → MessageItem je
zobrazí bez FE pomoci. FE resolver je **fallback** pro zprávy **bez** snapshotu
(odeslané před deployem) od autorů, kteří jsou právě přítomní — konzistence se
světovým `ChannelView`.

- `ChatRoom` z `users` (presence) postaví `resolveAccountAvatar(senderId)`:
  - `room === 'hospoda'`: `u.avatarUrl`
  - jinak: `u.characterAvatarUrl ?? u.avatarUrl`
- Předá do `MessageList` (prop `resolveAccountAvatar` už existuje, forwarduje
  do `MessageItem`).
- Pořadí v `MessageItem` zůstává `message.senderAvatarUrl ?? resolveAccountAvatar`
  — **snapshot má přednost**, resolver nepřebíjí historii (neporušuje §1).

Jméno FE neřeší — staré zprávy v Rozcestí ukážou `username` do vypršení TTL.

## §3 — Bez backfillu

Staré zprávy se nemigrují. TTL zpráv je 1 h → do hodiny po BE deployi jsou
všechny zprávy nové se správným snapshotem. Migrační skript by neměl hodnotu.

## Rozsah a dopady

- BE: `global-chat.service` (`sendMessage`, `sendWhisper`, nový helper, inject
  `UsersService`), test služby. Po nasazení **restart BE**.
- FE: `ChatRoom` (resolver + předání). `MessageList`/`MessageItem`/schema beze
  změny.
- Žádná změna schématu, DTO ani WS kontraktu.

## Testy

- BE: `sendMessage` v Rozcestí uloží `senderName=characterName` +
  `senderAvatarUrl=characterAvatarUrl`; v Hospodě `username` + `avatarUrl`;
  fallback na účet když postava nevyplněná; `sendWhisper` totéž.
- FE: `ChatRoom` předá `resolveAccountAvatar` (Rozcestí preferuje
  `characterAvatarUrl`, Hospoda `avatarUrl`); snapshot `senderAvatarUrl` má
  přednost před resolverem.

## Stav

- [x] Schváleno
- [x] Implementováno (2026-06-18) — BE `global-chat.service` snapshot +
  `UsersService` inject (test 44/44), FE `ChatRoom` resolver + čistá funkce
  `roomAvatarFor` (test) + pojistka snapshot-přednost v `MessageItem.spec`.
  ⚠️ Po nasazení **restart BE** (jinak staré chování). Bez backfillu.
