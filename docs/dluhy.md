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

### D-080 — Vypravěč: dvojí údržba nápovědy + odložené kusy (dřívější D-048)
**Kde:** HelpPage sekce/WorldToolboxPanel/AnonStartPanel (JSX mimo registr) · busty bublin (assety ladem, čeká frontend-design) · deaktivovaná scéna TM bez UI reaktivace (jen undo) · probe žádostí o vstup (checklist žadatele může lhát při eventu před startem cesty) · tm-vycvik lišta na platformě bez CTA · mobil: možný překryv bubliny a zalomené lišty cesty (živě ověřit) · **Od:** 2026-07-23 (finální audit)
**Dopad:** obsah nápovědy se udržuje na 2 místech; drobné mrtvé konce v okrajových tocích.
**Návrh:** registry-render HelpPage sekcí (M–L); frontend-design pass bust; „Aktivovat" na neaktivní scéně v orchestraci; probe z cache my-access-requests; CTA fallback výběru světa; bottom-stack proměnná pro bublinu.
*(SKILL napoveda a PR šablona odkazují D-080 = tento záznam.)*

---

## Odložené (čeká na trigger)

*(žádné — trigger-based položky žijí jako karty ⏳ ve fázích 29–30 roadmap3)*
