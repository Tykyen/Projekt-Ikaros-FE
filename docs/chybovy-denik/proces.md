# Chybový deník — proces

Procesní chyby (workflow, návyky, dodržování pravidel). Index v [README](README.md).

---

### CH-010 — Nezapisoval jsem řešení do deníku průběžně (i po nastavení pravidla) · 2026-06-20
**Kontext:** Po rozšíření pravidla „deník nahazuj i po řešení/přepracování" (base.md + skill) jsem dál opravoval tisk (obrázky, page-break, profil, aside, qty) a diagnostikoval Matrix — a NIC z toho nezapsal. Upozornil mě uživatel: „proč jsi nevyužil deník".
**Co jsem udělal špatně:** Bral jsem deník jako vyžádanou akci, ne jako návyk po každé opravě. Pravidlo jsem sám nastavil a vzápětí nedodržel.
**Proč to je problém:** Přesně tyhle postupy (co jsem řešil a jak) mají v deníku být — kvůli tomu ho uživatel chce: sebereflexe, kontinuita, „vědět, co jsem udělal a zhodnotit". Bez nich deník nesplní účel.
**Poučení:** Po každé netriviální opravě/řešení deník nahodit HNED, ne na vyžádání. Disciplína nestačí → doplněna hook-připomínka (hlídka) `.claude/hooks/`.
**Příznak cyklení:** Uživatel se ptá „proč jsi nevyužil deník / kde máš poznámky".

---

### CH-014 — `Set-Location` (PowerShell) tiše přesunul i Bash cwd → `tsc -b` běžel ve špatném repu (falešný zelený) · 2026-06-21
**Kontext:** Při 15.4 (D) jsem pro BE jest pustil PowerShell `Set-Location …\backend; npx jest`. Sdílený pracovní adresář se tím přepnul na backend **i pro Bash tool**. Následný `npx tsc -b` (mířený na FE) tak proběhl v backendu → backend build → `EXIT 0`. FE změny D zůstaly **neověřené**, ač jsem hlásil „tsc zelený".
**Co jsem udělal špatně:** Předpokládal jsem, že Bash a PowerShell mají oddělený cwd. Nemají — `Set-Location`/`cd` v jednom přepíše druhý. Po něm jsem nezkontroloval `pwd`.
**Jak odhaleno:** Glob/eslint hlásily „MapDrawingLayer.tsx neexistuje", ač Write i `tsc` prošly → **rozpor „build prošel, ale soubor není"** = červená vlajka. `pwd` ukázal `…/backend`.
**Poučení:** Pro cross-repo příkazy NE `Set-Location` na přepnutí — použij `npm --prefix <dir> run <script>` (cwd-agnostic) nebo PowerShell `Push-Location`/`-WorkingDirectory`. Po jakémkoli `Set-Location` ověř `pwd` před build/test. **Verifikace „exit 0" nestačí — musí běžet ve správném repu.** Rozpor mezi nástroji (tsc OK × Glob nenajde) ber jako signál cwd/prostředí, ne „záhada".
**Příznak cyklení:** „Build prošel, ale soubor nenalezen" / eslint nenajde čerstvě zapsaný soubor.

---

### CH-015 — Cyklení na vzhledu UI (stupnice mapy), protože uživatel testoval PROD a mé změny byly lokální/necommitnuté · 2026-06-21
**Kontext:** 15.3 stupnice mapy `MapScaleFrame` prošla ~5 iteracemi vzhledu (L-tvar → plný rám → pravítko po jednotkách → vyplněná lišta → průhlednost). Uživatel po každé poslal feedback ze **screenshotu produkce** (`www.projekt-ikaros.com`), jenže ten běžel na jeho **posledním FE commitu** — moje úpravy byly lokální, necommitnuté → uživatel reagoval pořád na PŘEDCHOZÍ (nebo úplně starou) verzi. „Zase špatně" často znamenalo „nevidím to, cos udělal", ne „udělals to špatně".
**Co jsem udělal špatně:** Iteroval jsem vizuál dál a dál, aniž jsem **vynutil nasazení** mezi koly. Feedback loop byl rozbitý (porovnává se proti stale stavu), takže konvergence nebyla možná, jen pseudo-cyklení. Flagoval jsem deploy-gap, ale pozdě/málo důrazně a nezastavil jsem se.
**Poučení:** **Vizuální feedback na produkci vyžaduje deploy.** Když uživatel testuje prod a mé změny jsou lokální → než si vyžádám další vizuální feedback, MUSÍ být předchozí verze nasazená (commit+push+deploy), jinak se točíme nadarmo. Buď řešit deploy mezi koly, nebo vizuální změnu nasbírat a nasadit jednorázově. Deploy-gap hlásit HNED a důrazně, ideálně blokovat další iteraci, dokud se nevyřeší.
**Příznak cyklení:** ≥3 kola „oprav vzhled X" na téže komponentě + feedback ze screenshotu produkce + mé změny stále necommitnuté.

---
