# Spec 26.6 — Telemetrie + obsah Tier 0 + e2e (D10–D11, závěr MVP-A)

Stav: implementováno 2026-07-22 · Zdroje: [04-architektura.md](../../vypravec/04-architektura.md) §5.6, [06-obsah-a-udrzba.md](../../vypravec/06-obsah-a-udrzba.md) §5 · Navazuje: spec-26.3 (persistence), spec-26.4 (journey engine), spec-26.5 (chybová mapa/bubliny — číslo sdílí D9 commit)

## Co stojí

| Část | Kde |
|---|---|
| BE telemetrie: `POST /vypravec/telemetry` (batch ≤50, whitelist 10 eventů, TTL 90 d, index event+createdAt) | `backend/src/modules/user-onboarding/vypravec-telemetry.controller.ts` + schema |
| Self-delete cleanup vč. telemetrie (GDPR) | `user-onboarding.service.ts` `onUserDeleted` |
| Funnel skript `npm run vypravec:funnel` (trychtýř per persona, D2/D7 z updatedAt — NE FE eventy, obsahové díry top 20) | `backend/scripts/vypravec-funnel.mjs` |
| FE telemetrie klient (batch 5 s, fire-and-forget, keepalive flush, jen přihlášení) | `src/shared/vypravec/state/telemetry.ts` |
| **21 hlubokých Tier 0 topiků** (kanonický číselník 06 §5.1b, hlas per scope) | `registry/topics.ts` |
| Panel blok B „K věci" (max 4 karty per routa+publikum) + TopicView s feedback patičkou | `ui/VypravecPanel.tsx` |
| Empty-states 3× (moje-postava, prázdná wiki, Žadatel) | `registry/emptyStates.ts` + `ui/ReportEmpty.tsx` |
| Probe fixace světa (D-078 zúžení) | `engine/journeyEngine.ts` `probeResync` |
| GDPR řádek v /soukromi | `PrivacyPage.tsx` |
| e2e persona flow + mock onboarding/telemetrie | `e2e/persona.spec.ts`, `e2e/mock-api.ts` |
| Unit regrese persona dialogu (login po mountu) | `ui/__tests__/personaDialog.spec.tsx` |
| CI validace topiků (unikátní ID, mrtvé routy/akce, verifiedAt formát) | `registry/__tests__/registrValidace.spec.ts` |

## Klíčová rozhodnutí a nálezy

1. **CH-132:** init věšet na identitu (`userId` v deps), ne na mount — login přes modal layout neremountuje; `requestIdleCallback` vždy s `{timeout}` (starvation při WS reconnect smyčce).
2. Topiky = typované bloky (`odstavce[]`, `kroky[]`), ŽÁDNÝ markdown parser v bundlu.
3. Chat/TM topiky se nabízejí i na dashboardu světa — na kolizních plochách je FAB skrytý.
4. Vita busta Ishidy v hlavičce persona dialogu (assety všech tří postav dodány a zpracovány).

## Vědomé mezery (v2 / stretch)

Fulltext „Zeptat se" (S2) · changelog „Co je nového" (S3) · push texty (S4) · cesta 26.2 checklist (S1) · wrap in-situ „?" helpů (MVP-B) · návody 26.5 · Měďák TM průvodce · zbytek D-078 (NPC probe).
