# Spec 26.4 — Journey engine + cesta 26.1 + persona dialog (D7–D8)

Stav: implementováno 2026-07-22 (souhlas vlastníka „tak to dotáhni") · Zdroje: [05-retence-a-cesty.md](../../vypravec/05-retence-a-cesty.md) §2–3, [03-interakcni-model.md](../../vypravec/03-interakcni-model.md) §8.3, [04-architektura.md](../../vypravec/04-architektura.md) §4 · Navazuje: spec-26.3 (persistence)

## Co stojí

| Část | Soubor |
|---|---|
| Event bus (buffer 50, payload `{worldId?, worldSlug?, channelKind?, pageType?}`) | `src/shared/vypravec/engine/events.ts` |
| Definice cesty 26.1 PJ Start (5 kroků, repliky z 05 doslovně) | `src/shared/vypravec/registry/journeys/pjStart.ts` |
| Engine: fixace contextWorldId · event match · visit scoped · probe gateOpened · pauza/obnova/přeskočit/zrušit | `src/shared/vypravec/engine/journeyEngine.ts` |
| Lišta kroku + sbalený proužek 32 px + badge „cesta pokračuje v jiném světě" | `src/shared/vypravec/ui/JourneyBar.tsx` |
| Persona dialog 26.4 (obsah panelu, jediné auto-otevření; volba → cesta/navigace) | `VypravecPanel.tsx` + `VypravecRoot.tsx` |
| Emity (6): create world · create page (ne pending) · world chat po potvrzeném POST · globální chat · invite · join/access-request | `useCreateWorld` · `useCreatePage` · `useOptimisticSend` · `useGlobalChat` · `useWorldInvites` · `useWorldJoin` |

Klíčová pravidla: event = trigger, stav = pravda (odškrtnutí idempotentní, `$min` na BE) · `message.sent` bez `worldId`+`channelKind:'world'` krok světa nesplní (povinný test) · na kolizních plochách proužek, nikdy zmizení · persona dialog: zavření bez volby = dismiss navždy.

## Odchylky od podkladů (vědomé)

1. **`pageType` match = `'NPC'`** (české display hodnoty `Page.type` z `pages.types.ts`) — podklad psal `'npc'`; realita kódu vyhrává.
2. **Probe `hasOwnWorld` a `pagesAboveSeed` neimplementovány** — kroky 1 a 3 spoléhají na event (+ probe jen u gateOpened). Zapsáno jako dluh D-078 v `docs/dluhy.md`; dopsat při D9–D11 (čtení `worlds.mine` / pages count z query cache).
3. **Rozcestníky hráč/tvůrce** = navigace na `/ikaros/vesmiry` resp. `/ikaros/vytvorit-svet` (plné cesty 26.2/26.3 = v2 dle plánu).
4. Bublina „Pokračujeme u kroku 4?" při dalším loginu (05 §2) — odloženo do D9 (bubliny/momenty ještě nejsou).

## Testy

`engine/__tests__/journeyEngine.spec.ts` — 8 testů: fixace + slug, **Putyka/cizí svět nesplní krok 5**, NPC typ match, visit scoped, gateOpened probe i invite alternativa, pauza blokuje, dokončení → lišta zmizí. Celkem vypravec: 36 testů.
