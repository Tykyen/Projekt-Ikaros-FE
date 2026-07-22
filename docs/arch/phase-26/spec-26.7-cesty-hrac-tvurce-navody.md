# Spec 26.7 — Cesty 26.2 + 26.3 naplno + návody 26.5 (uzavření fáze 26)

Stav: implementováno 2026-07-22 (souhlas vlastníka „26.2, 26.3 a 26.5 bych chtěl mít dotaženo") · Zdroj: [05-retence-a-cesty.md](../../vypravec/05-retence-a-cesty.md) §4–5, [06-obsah-a-udrzba.md](../../vypravec/06-obsah-a-udrzba.md) §5.2 · Navazuje: spec-26.4 (engine), spec-26.6 (obsah Tier 0)

## Co stojí

| Část | Kde |
|---|---|
| Cesta 26.2 `hrac-start` (2 kroky + čekací stav — dle 05 §4 doslovně) | `registry/journeys/hracStart.ts` |
| Cesta 26.3 `wb-start` (4 kroky: ateliér → stránka → Pavučina → výkladní skříň) | `registry/journeys/wbStart.ts` |
| Engine: `altEvents` (žádost ∨ Putyka/Camp) · visit `alt` (vesmiry ∨ nábory) · fixace dle `worldBinding` ('joins' → join.requested) · probe `publicShowcaseOn` · oslavy dokončení cest | `engine/journeyEngine.ts` |
| Čekací stav hráče (`zkontrolujCekaniHrace`): „hotovo z tvé strany" oslava · probe postavy → bublina s CTA Moje postava · timeout 7 dní → tip na nábory (1×) — derivováno ze stavu, ŽÁDNÝ „progress 2/3 navždy" | `engine/journeyEngine.ts` |
| 10 návodů 26.5 (šablona NÁVOD: 3–7 kroků, imperativ, deep-link, done-signál) | `registry/navody.ts` |
| 3 nové topiky pro kroky tvůrce (wikilinky, Pavučina, výkladní skříň) — Tier 0 nyní 24 | `registry/topics.ts` |
| Panel: menu **Cesty** (start/pauza/obnova/zrušení, progres) + **Návody** (seznam 10) | `ui/VypravecPanel.tsx` |
| Emit `subject.created` (Pavučina) | `features/world/campaign/api.ts` |
| Persona volba startuje příslušnou cestu (hrac → hrac-start + vesmiry; worldbuilder → wb-start + vytvořit-svět) | `ui/VypravecRoot.tsx` |
| WorldInfo rozšířeno: `publicShowcase`, `hasCharacter` | `engine/resolveHeader.ts` + WorldLayout mount |

## Odchylky od podkladů (vědomé)

1. **wb.pavucina** jede přes event `subject.created` místo probe `hasPavucinaSubject` — pavučinová data FE mimo Pavučinu nemá; probe = v2 (zůstává v D-078 rodině).
2. **wb.prvni-stranka** bez probe `pagesAboveSeed` (D-078 zbytek).
3. Návody `navod.kalendar-cas` mají audience PomocnýPJ+ (kalendář světa je role-gated).

## Testy

+9 engine testů (30 celkem): alt routy, **Putyka SPLNÍ krok hráče 2** (opak povinného testu PJ cesty — obojí platí zároveň), fixace z join.requested, oslava dokončení, čekací stav + timeout + dismiss, wb fixace/scope/showcase probe. Validace: návody 3–7 kroků + mrtvé akce, topicId kroků → existující topiky. Celkem vypravec 60 testů; e2e 2/2.
