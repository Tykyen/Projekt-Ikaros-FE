# Spec 6.1-followup — Načtení starších zpráv (world chat)

**Rozsah:** FE only (BE cursor paginace už hotová — SC-33)
**Repo:** `Projekt-ikaros-FE`
**Velikost:** ~4 soubory / ~90 ř. + testy
**Autor:** PJ + Claude
**Datum:** 2026-07-09

## Problém

Světový chat načte při otevření konverzace jen **posledních 50 zpráv**
(`HISTORY_LIMIT = 50`, [useWorldChat.ts:16](../../../src/features/world/chat/api/useWorldChat.ts#L16))
a dál už jen živě přes WebSocket. **Starší zprávy nejsou dostupné** — chybí
UI pro donačtení. Data ale existují na serveru (žádná ztráta), jen se nefetchují.

Spec 6.1 endpoint `?before=&limit=` [specifikoval](spec-6.1.md#L86), BE ho
[plně implementuje](../../../../Projekt-ikaros/backend/src/modules/chat/chat.controller.ts)
(controller + service + repo, cap 100), ale FE `before` nikdy nepoužil →
bug-plan **SC-33** zůstal ⬜.

## Cíl

Tlačítko **„⬆ Zobrazit starší zprávy"** nad výpisem. Klik donačte předchozí
dávku (50) přes `before=<id nejstarší načtené>`, **předsadí** ji na začátek a
**zachová scroll pozici** (view neposkočí). Když BE vrátí < 50 → jsme na
začátku historie → tlačítko zmizí.

## Rozhodnutí (a proč)

1. **Plochá cache, žádný `useInfiniteQuery`.** Celá messages cache je plché
   `ChatMessage[]`; WS příchozí zprávy, optimistic send, edit, delete, reakce
   (~7 míst) na něj sahají. Přechod na stránkovaná data `{pages}` by je všechny
   nutil přepsat → velké riziko regrese živého chatu. Místo toho starší dávku
   jen **prepend**neme do stávajícího pole. Živý provoz beze změny.
2. **Manuální fetch, ne query.** Nový hook `useLoadOlderMessages(worldId, channelId)`
   volá `api.get(..., { before, limit })` a `qc.setQueryData` prepend. Vlastní
   `isLoadingOlder` + `reachedStart` stav (reset při změně konverzace).
3. **Dedup + čistá fce.** `prependOlderMessages(current, older)` = concat s
   odfiltrováním ID už přítomných (obrana proti překryvu / WS/optimistic).
   Čistá funkce → unit test (vzor `applyUnreadEvent`).
4. **Zachování scrollu = „vzdálenost ode dna".** Před fetchem zapamatuj
   `scrollHeight - scrollTop`; po prependu (useLayoutEffect na `items`) nastav
   `scrollTop = scrollHeight - uloženáVzdálenost`. Kotví aktuální pohled.
   Nekoliduje s auto-scrollem (poslední zpráva se prependem nemění → efekt
   „přibyla nová" se netriggerne).
5. **Sdílená komponenta, opt-in props.** `MessageList` používá i global/putyka
   chat a admin chat → nové props (`onLoadOlder`, `hasMoreOlder`, `loadingOlder`)
   **volitelné, default off**. Tamti konzumenti beze změny.

## Kontrakt BE (existující, neměníme)

`GET worlds/:worldId/chat/channels/:channelId/messages?before=<msgId>&limit=50`
→ až `limit` zpráv **starších** než `before` (`_id < before`), **chronologicky
vzestupně** (oldest→newest). Bez `before` → posledních `limit`. `< limit`
vrácených = žádné starší už nejsou.

## Chování / stavy

- **Viditelnost tlačítka:** `!reachedStart && loadedCount >= HISTORY_LIMIT`.
  (Iniciální načtení < 50 → nikdy starší → skryto.)
- **Klik:** disable + text „Načítám starší…"; po dokončení prepend + kotva scrollu.
- **BE vrátí < 50:** `reachedStart = true` → tlačítko zmizí.
- **Chyba fetche:** tlačítko znovu aktivní (retry), žádná destrukce, nic se nemaže.
- **Přepnutí konverzace:** `reachedStart` reset na false.
- **Bonus:** po donačtení jsou starší zprávy v `itemRefs` → skoky z citace na
  starší originál začnou fungovat (dnes no-op mimo okno 50).

## Dotčené soubory

| Soubor | Změna |
|---|---|
| [useWorldChat.ts](../../../src/features/world/chat/api/useWorldChat.ts) | + `useLoadOlderMessages` hook, + čistá `prependOlderMessages` |
| [ChannelView.tsx](../../../src/features/world/chat/components/ChannelView.tsx) | zapojit hook, předat props do `MessageList` |
| [MessageList.tsx](../../../src/features/chat/components/MessageList.tsx) | + 3 opt. props, tlačítko nad `items`, useLayoutEffect kotva scrollu |
| [MessageList.module.css](../../../src/features/chat/components/MessageList.module.css) | styl pill tlačítka (tematické tokeny) |

## Responsive

Tlačítko centrované, touch target ≥ 44 px, plná šířka na mobilu. Po impl → `mobil-desktop`.

## Po implementaci

- `funkce` (změna chování world chatu) + `napoveda` (hráč: jak zobrazit starší).
- Zaškrtnout **SC-33** v `docs/bug-plan/07-svet-chat.md`.
- `mobil-desktop`.

## Mimo rozsah

- Global/putyka chat a admin chat (jen zpřístupníme props, nezapojíme).
- Nekonečný scroll / auto-load při dojetí nahoru (jen tlačítko; může přijít později).
- Skok na výsledek hledání mimo okno (samostatná featura).
