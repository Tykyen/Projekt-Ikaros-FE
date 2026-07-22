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

### D-078 — Vypravěč: probe `hasOwnWorld` a `pagesAboveSeed` neimplementovány (kroky cesty spoléhají na event)
**Kde:** `src/shared/vypravec/engine/journeyEngine.ts` (probeResync umí jen `gateOpened`) · **Od:** 2026-07-22 (spec-26.4 odchylka 2)
**Dopad:** pravidlo „probe = zdroj pravdy, event = trigger" platí jen pro krok 4; kroky 1 a 3 se při ušlém eventu (zavřený tab před flushí, druhé zařízení) neodškrtnou zpětně — checklist může „lhát", dokud uživatel akci nezopakuje.
**Stav 2026-07-22 (zúženo):** krok 1 UZAVŘEN — probeResync fixuje contextWorldId + odškrtává „Založ svět", když PJ navštíví svůj svět bez fixace (isPJ z WorldContext). **Zbývá:** krok 3 (První NPC) — probe z pages directory cache; a výběr světa při VÍCE vlastních světech bez návštěvy. Test probe fixace v journeyEngine.spec.

---

## Odložené (čeká na trigger)

*(žádné — trigger-based položky žijí jako karty ⏳ ve fázích 29–30 roadmap3)*
