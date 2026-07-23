# Technické dluhy

> Soubor obsahuje **pouze otevřené a odložené** dluhy.
> Historie uzavřených dluhů dohledatelná v git logu (`git log --all -- docs/dluhy.md`).
> Stav k **2026-07-19**. Vyřešené se **mažou**
>
> ⚠️ **Než něco z tohoto souboru začneš řešit, ověř to proti HEAD.** Zdroj pravdy je kód, ne report.
>
> 🔄 **2026-07-19 — všechny tehdy otevřené dluhy překlopeny do [`roadmap3.md`](roadmap3.md)** (po ověření 15/15 proti HEAD):
> D-DB-BACKUP-CRON → karta 23.1 · D-DIARY-HP-DELTA+D-073 → 29.1 · D-HP-MAP-SYSTEMS → 29.2 · D-DICE-SERVER-RNG → 29.3 · D-MEILI-CZ → 29.4 · D-PERF-BE → 29.5 · D-NEW-UM10+D-19.2-BYTES → 29.6 · D-NEW-UM02 → 29.7 · D-NEW-color-tokens → 29.8 · D-19.1-RETENCE → 28.2+29.9 · D-NEW-PC21 → 29.10 · D-NEW-chat-presence-scale → 30.2 · D-RT-SCALE → 30.1 · D-063 (+content-erasure) → 31.1.
> Původní plné texty: git log tohoto souboru (commit před 2026-07-19).
>
> **Nové dluhy se dál zapisují sem** (skill `dluh`); při revizi roadmapy se překlápí do příslušné fáze roadmap3.

---

## Otevřené

### D-079 — Vypravěč: restart zrušené cesty a výběr světa při startu
**Kde:** journeyEngine (startCesty/FWW contextWorldId) · **Od:** 2026-07-23 (hloubková revize, engine nález 4+5)
**Dopad:** restart zrušené cesty zdědí staré kroky i fixovaný svět (BE $min/FWW nejde vzít zpět) — cesta začne „rozehraná"; PJ s více světy nemá při startu výběr světa (D-078 probe fixne PRVNÍ navštívený vlastní svět). MVP zmírnění: „Začít" u zrušené cesty startuje se starým progresem (přiznaně).
**Návrh:** generace progresu (klíč `jId~n` na BE) + dialog výběru světa při startu cesty, má-li uživatel vlastní světy.

### D-078 — Vypravěč: probe `hasOwnWorld` a `pagesAboveSeed` neimplementovány (kroky cesty spoléhají na event)
**Kde:** `src/shared/vypravec/engine/journeyEngine.ts` (probeResync umí jen `gateOpened`) · **Od:** 2026-07-22 (spec-26.4 odchylka 2)
**Dopad:** pravidlo „probe = zdroj pravdy, event = trigger" platí jen pro krok 4; kroky 1 a 3 se při ušlém eventu (zavřený tab před flushí, druhé zařízení) neodškrtnou zpětně — checklist může „lhát", dokud uživatel akci nezopakuje.
**Stav 2026-07-22 (zúženo):** krok 1 UZAVŘEN — probeResync fixuje contextWorldId + odškrtává „Založ svět", když PJ navštíví svůj svět bez fixace (isPJ z WorldContext). **Zbývá:** krok 3 (První NPC) — probe z pages directory cache; a výběr světa při VÍCE vlastních světech bez návštěvy. Test probe fixace v journeyEngine.spec.

---

## Odložené (čeká na trigger)

*(žádné — trigger-based položky žijí jako karty ⏳ ve fázích 29–30 roadmap3)*
