# Spec 15.1-followup — Detekce nové verze (PWA se sama neaktualizuje)

**Rozsah:** FE only
**Repo:** `Projekt-ikaros-FE`
**Velikost:** ~3 soubory / ~90 ř. + test
**Autor:** PJ + Claude
**Datum:** 2026-07-10

## Problém

Nasazený nový build se u **běžící appky** (typicky nainstalovaná PWA) projeví
až **dlouho po deployi** — testeři/hráči běží starý bundle a nevidí nové featury.

**Kořen (ověřeno):**
1. [main.tsx:64-74](../../../src/app/main.tsx#L64) SW jen `register(swUrl)` — **žádná
   update logika** (žádný `updatefound`, žádná kontrola verze, žádná výzva k obnovení).
2. Deploy mění **JS bundly** (nové content-hashe), ale **ne `sw.js`** → prohlížeč
   `sw.js` porovná byte-po-bytu → identický → **žádný SW update se nespustí**.
3. `index.html` je `no-cache, must-revalidate` (ověřeno v prod hlavičkách), ale to se
   projeví **jen při skutečné navigaci**. Probuzená PWA z pozadí **nenaviguje** →
   běží stará verze držená v paměti. Android ji drží frozen; „zavřít+otevřít" ji
   často obnoví z paměti, reinstal ikony nemaže origin storage → update trvá, než
   dojde k opravdové studené navigaci.

## Cíl

Když je nasazený nový build, běžící appka to **sama pozná** a nabídne
**„Obnovit"**. Prompt, ne auto-reload.

## Rozhodnutí (a proč)

1. **Otisk buildu = `src` vstupního module scriptu `index-<hash>.js`.** Vite mění
   hash při JAKÉkoli změně kódu (mění se i import-mapa ve vstupním chunku), takže
   změna = nový deploy. Nepotřebuje build-time injekci verze ani nový endpoint.
2. **Baseline z DOMu, ne z prvního fetche.** Běžící verzi čteme z `<script
   type="module" src="/assets/index-…">` v `document`. Kdybychom baseline vzali z
   prvního fetche `/`, minuli bychom případ „appka naběhla už zastaralá" (běží starý
   kód, ale server má nový index) — přesně ten, který řešíme.
3. **Porovnávat JEN vstupní script, ne všechny assety.** Lazy chunky se za běhu
   donačítají a v DOMu přibývají → porovnání celého seznamu by dávalo falešné
   poplachy. Vstupní `index-<hash>.js` je jediný a stabilní.
4. **Kontrola na `visibilitychange`→visible + interval 5 min.** Resume PWA = hlavní
   spouštěč; interval kryje dlouho otevřené okno. `fetch('/', {cache:'no-store'})` →
   obejde HTTP cache; SW ho nechává projít (není `navigate` ani `/assets/`).
5. **Prompt, ne auto-reload.** Auto-reload hrozí ztrátou rozepsané zprávy a reload
   smyčkou. Uživatel klikne „Obnovit" → `location.reload()` → nový bundle → baseline
   == server → banner zmizí. Žádná smyčka.
6. **Banner nahoře.** InstallBanner je dole, sonner Toaster vpravo dole → nahoře se
   nepřekrývají.

## Dotčené soubory

| Soubor | Změna |
|---|---|
| `src/features/pwa/useAppUpdate.ts` (nový) | hook + čisté `parseEntryScript(html)` |
| `src/features/pwa/UpdateBanner.tsx` (nový) | horní banner „Nová verze — Obnovit" |
| `src/features/pwa/UpdateBanner.module.css` (nový) | styl (tokeny, mobil ≥44px) |
| `src/features/pwa/index.ts` | + export `UpdateBanner` |
| `src/app/main.tsx` | mount `<UpdateBanner />` |

## Hranice / co neumí

- **Nezrychlí** samotné stažení nového bundlu — jen ho **detekuje a nabídne reload**.
- Dev bez `/assets/` → hook no-op (baseline null). Netýká se HMR.
- Neřeší BE výpadek (to `MaintenanceOverlay`).

## Po implementaci

- `mobil-desktop` (banner), ověření na živém webu (fb: testuje se na živém).
- `funkce` (nová platformní schopnost) — kap. 07 nebo průřezově.
- Ověření chování reálně až po **dvou** deployích (starý build musí uvidět nový).
