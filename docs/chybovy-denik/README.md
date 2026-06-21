# Chybový deník — index

Záznam **vlastních chyb, omylů a slepých uliček** (`CH-xxx`) **i řešení a zhodnocení** (`✅ ŘEŠENÍ` — co nakonec zabralo a jestli to bylo dobře). Vede ho skill [`chybovy-denik`](../../.claude/skills/chybovy-denik/SKILL.md).

**Hlavní účel: NECYKLIT SE + vědět, co už jsem zkusil a jak to dopadlo.** Než zkusím další variaci nějaké opravy, projdu **tenhle index** (je krátký — jen řádky). Když tu vidím podobný už neúspěšný pokus, **nezkouším ho znovu** — změním přístup od základu, nebo se zeptám. Záznam `✅ ŘEŠENÍ` naopak ukazuje, co u dané oblasti zabralo (a proč), ať na to navazuju, ne to bořím.

> Pravidlo: tutéž chybu 2× = STOP. · **Příští ID: CH-016.**

## Jak je deník členěný

- Tento `README.md` = **index** (jeden řádek per chyba: ID · oblast · stručně · příznak cyklení). Drží se krátký — proto se dá vždy přečíst celý.
- **Detaily** jsou v souborech per oblast (`tisk.md`, `be.md`, `fe.md`, `proces.md`, …) — sem zapisuje skill plný záznam. Nové oblasti se zakládají dle potřeby.
- Když index narostl moc → archivovat vyřešené/staré řádky do `archiv.md` (ponechat poučení, zkrátit index).

## Index chyb

| ID | Oblast | Stručně | Příznak cyklení |
|----|--------|---------|-----------------|
| [CH-001](tisk.md#ch-001) | tisk | `visibility:hidden`+`absolute;inset:0` → ořez na 1 stránku | ladím inset/position, obsah se ořezává |
| [CH-002](tisk.md#ch-002) | tisk | klon do `<body>` měl obsah, ale celý neviditelný | „klon má obsah", ale tisk prázdný |
| [CH-003](tisk.md#ch-003) | tisk | řešil jsem barvu, ač skryté bylo úplně vše | ladím barvy, ale nevidím vůbec nic |
| [CH-004](tisk.md#ch-004) | proces/tisk | 3 varianty téže CSS izolace + deploy-test smyčka | 3. „fix tisku" za sebou, jiný CSS detail |
| [CH-005](tisk.md#ch-005) | tisk | `win.print()` dřív než načtení obrázků | text se tiskne, obrázky ne |
| [CH-006](tisk.md#ch-006) | tisk | reset na `afterprint` hlavního okna (tisk v jiném okně) | UI hlavní stránky zaseknuté v tisk. stavu |
| [CH-007](tisk.md#ch-007) | tisk | CSS appky v tisk. okně bez resetu SPA layoutu → prázdné listy | hodně stránek, většinou prázdných |
| [CH-008](tisk.md#ch-008) | tisk | `position:static !important` na `*` rozbil obrázky | oprava A vrátí regresi B |
| [CH-META](tisk.md#ch-meta) | tisk | klonování živého DOMu na tisk je principiálně křehké | dlouhá série dílčích „fixů" jedné featury |
| [✅ ŘEŠENÍ](tisk.md#-řešení--ch-meta-uzavřena-tisk--čistý-dokument-ne-klon-živé-appky--2026-06-20) | tisk | CH-META uzavřena: tisk = čistý dokument (zahodit CSS appky) + offline náhled (Playwright→PDF) | — (zabralo napoprvé) |
| [CH-009](tisk.md#ch-009) | tisk | collapsed sekce (výbava) se v tisku nevytiskla — obsah `{!collapsed && …}` není v DOM | v tisku chybí obsah viditelný po kliknutí; ladím CSS místo DOM |
| [✅ ŘEŠENÍ](tisk.md#-řešení--doladění-vzhledu-tisku-postavy-vlna-2--2026-06-20) | tisk | doladění vzhledu postavy: obrázky strop/portrét, záložky na nové strany, profil dl, aside skryt, qty | — |
| [✅ ŘEŠENÍ](tisk.md#-řešení-diagnóza--zvolený-směr--tisk-diary-sheetů-nejde-přes-css--2026-06-20) | tisk | tisk diary sheetů NEJDE přes CSS (hodnoty v inputech, stav v barvách) → nutný tiskový render v komponentě | ladím printDoc.css na deník, hodnoty/pips se netisknou |
| [CH-010](proces.md#ch-010) | proces | nezapisoval jsem řešení do deníku průběžně (i po nastavení pravidla) | uživatel se ptá „proč jsi nevyužil deník" |
| [✅ ŘEŠENÍ](tisk.md#-řešení--tisk-lokaceostatní-stránky-pořadí-obrázek--boxík--text--2026-06-20) | tisk | Lokace/Ostatní: pořadí obrázek → boxík (datová tabulka) → text v printMode; hero menší | — |
| [✅ ŘEŠENÍ](tisk.md#-řešení--tisk-bestiáře-mezery--kalendáře-akce--mřížka--2026-06-20) | tisk | bestiář mezery (print-stat) + kalendář akce (detail density + print-event) a mřížka (print-cal-grid) | — |
| [✅ ŘEŠENÍ](tisk.md#-řešení--tiskový-render-matrix-deníku-vzor-pro-ostatní-sheety--2026-06-20) | tisk | Matrix deník: oddělený statický `MatrixPrintView` v printMode (text místo inputů, pips ●●●○○); past = emoji v tisku | — |
| [✅ ŘEŠENÍ](tisk.md#-řešení--tiskový-režim-zbývajících-11-diary-sheetů-replikace-vzoru--2026-06-20) | tisk | 11 diary sheetů přes 4 paralelní agenty (PrintView dle vzoru); ověřeno build+133 testů; vizuál per-sheet čeká reálný test | — |
| [✅ ŘEŠENÍ](audit.md#-řešení--plný-audit-run-2026-06-20-1621-16-stylů--103-oblastí--6-oprav--2026-06-20) | audit | plný audit fan-out 103 oblastí + 6 bezpečných oprav; **verifikace nálezu čtením chytila false-positive** (banUser revokuje tokeny); agentní TL;DR = hypotéza, ne fakt | — |
| [CH-011](audit.md#ch-011--gate-v-service-volané-i-interně--403-regrese-chat-kanálů--2026-06-20) | audit/BE | gate v `getDirectory()` (volané i interně z chat.service) → 403 regrese chat kanálů; před guardem do service zgrepuj VŠECHNY konzumenty | bisekce git-stash+e2e, „nevolaná metoda" mýtus |
| [⚠️ POKUS](fe.md#️-pokus-nezabral--fix8-první-3d-animace-hodu-kostkou-na-taktické-mapě--2026-06-20) | fe | fix8 (ghost vždy první + fronta) **NEZABRAL** — timing race nebyl kořen; 1. 3D animace dál chybí, 2.+ jede | série kostky fix4/5/7 + ~13 commitů |
| [CH-012](fe.md#ch-012--předčasné--řešení--skrytý-ghost-nezahřívá-jako-reálný-hod--2026-06-20) | fe/proces | předčasné `✅ ŘEŠENÍ` (build≠ověření WebGL/timing); skrytý ghost nezahřívá jako reálný hod — nejspíš studený 1. `updateConfig` (skin), ne `roll()` | zkouším další variaci warmupu bez dat z konzole |
| [CH-013](fe.md#ch-013--hypotéza-studený-updateconfig-fix9-vyvrácena-daty-z-konzole--2026-06-20) | fe | hypotéza updateConfig (fix9) vyvrácena DATY: logy ukázaly, že `box.roll` reálného hodu se vůbec nespustil → kořen = render-race `nonce`×`active`; logy nasadit DŘÍV než hypotézové fixy | warmup variace, ale `box.roll` v logu chybí |
| [✅ ŘEŠENÍ](fe.md#-řešení--první-3d-animace-hodu-kostkou-fix10-hod-effekt-na-active--dedupe-nonce--2026-06-20) | fe | **VYŘEŠENO (fix10):** hod-effekt navázán i na `active` + dedupe nonce → 1. 3D animace naběhne; potvrzeno hráčem na live | — |
| [✅ ŘEŠENÍ](fe.md#-řešení--pwa-151-sw-offline-cache-bez-rozbití-dev-hmr-dev-guard-modeprod--2026-06-21) | fe | PWA 15.1: SW `fetch`/offline cache přidán bez rozbití dev HMR přes dev-guard `mode=prod` (klient předá režim query, SW gate-uje); vzor místo blacklistu Vite cest | — (zabralo napoprvé) |
| [✅ ŘEŠENÍ](role.md#-řešení--elevation-nahození-práv-admin-moc-uspaná-per-svět-nahoditelná-náhrada-r-20--2026-06-21) | role/BE+FE | Elevation: 1 helper `worldAdminBypass` nahradil ~45 world bran (náhrada R-20); povinný `RequestUser` místo optional = bez tichých děr; **vlastní grep sweep > subagent inventura** (minula 5 bran); FE drift byl širší (7 komponent), ne jen router | — (zabralo) |
| [✅ ŘEŠENÍ](fe.md#-řešení--152-krok-a-typ-mřížky-hexčtverecžádná-přes-gridadapter-strategy--2026-06-21) | fe | 15.2-A typ mřížky přes `GridAdapter` strategy (hex obal/square/none); integer `q/r` lattice = nula migrace; BE `config` volný → 0 BE změn; UI selektor=krok B | — (zabralo napoprvé) |
| [✅ ŘEŠENÍ](fe.md#-řešení--153-měřítko-stupnice--sdílené-pravítko-přes-ws-vzor-pingu--2026-06-21) | fe/BE | 15.3 měřítko (`MapScaleFrame`) + sdílené pravítko = reuse ephemeral WS vzoru pingu (emit→broadcast, 0 úložiště); BE klíčuje per-user authenticated userId (ne payload); all-roles vs spotlight PJ-only | — (zabralo) |
| [✅ ŘEŠENÍ](fe.md#-řešení--154-kreslení-anotace-na-mapě-perzistované-scenedrawings-vzor-effects--2026-06-21) | fe/BE | 15.4 kreslení/anotace = perzistované `scene.drawings`, **mirror effects** (schema+3 ops+apply/inverse+authorizer+repo+FE apply/layer) → infra zdarma; authorizer: hráč jen `allowPlayerDrawing` && vlastní | — (zabralo) |
| [CH-014](proces.md#ch-014--set-location-powershell-tiše-přesunul-i-bash-cwd--tsc--b-běžel-ve-špatném-repu-falešný-zelený--2026-06-21) | proces | `Set-Location` (PS) přepsal i Bash cwd → `tsc -b` běžel v backendu (falešný zelený), FE neověřené; před build/test ověř `pwd` | „build prošel, ale soubor nenalezen" |
| [CH-015](proces.md#ch-015--cyklení-na-vzhledu-ui-stupnice-mapy-protože-uživatel-testoval-prod-a-mé-změny-byly-lokálnínecommitnuté--2026-06-21) | proces | Cyklení na vzhledu UI: uživatel testuje PROD, mé změny lokální → feedback vždy na stale verzi → nelze zkonvergovat; vizuál nasaď před dalším feedbackem | ≥3 kola „oprav vzhled X" + screenshot produkce + necommitnuté |
| [✅ ŘEŠENÍ](fe.md#-řešení--154-e-world-map-defaults-dvouvrstvá-config--be-side-seed--2026-06-21) | fe/BE | 15.4-E world map defaults = dvouvrstvá config (worldSettings.mapDefaults → seed scény → override); **seed BE-side** (create DTO `HexConfigDto` whitelist by nová pole zahodil); inject IWorldSettingsRepository | — (zabralo) |
| [✅ ŘEŠENÍ](fe.md#-řešení--d-new-inv-wiki-tabulky-ve-vieweru--mrtvý-odkaz-informace-15.5-followup--2026-06-21) | fe | D-NEW-INV-WIKI: tabulky ve vieweru (`enableTable\|\|readOnly` + read CSS, 1 zásah = 8 layoutů) + mrtvý odkaz Informace (`buildWorldNav` filtr dle `usePagesDirectory`); pasti chycené předem = `placeholderData:[]` flicker + `pravidla`=dedikovaná route (matrix Rulebook) | — (zabralo napoprvé) |
| [✅ ŘEŠENÍ](fe.md#-řešení--156-a-stateplaceholder-emptyerror-stavy--webp-pipeline--2026-06-21) | fe | 15.6-A sdílená `StatePlaceholder` (empty+error) + 4 error stránky + 5 hero empty; 3 velikosti→ilustrace jen hero=11 obrázků ne 100; `.jfif`=JPEG→WebP `sharp` 93%, CSS mask místo transparent; broad text change→oprav `*.spec`; OTEVŘENO auth 401/session | — (zabralo) |
| [✅ ŘEŠENÍ](fe.md#-řešení--auth-401-přihlas-se-stav--session-ttlsliding-3-dny--2026-06-21) | fe/BE | auth #1 401 stav (anonym→přihlas se, leak-safe na FE ne BE; `WorldNotFound`→`ErrorState` opravil i nečitelný text) + #2 session: sliding UŽ existuje, TTL access+refresh sjednoceno na 3 d; kořen „odhlašuje po dnech"=refresh v prod nejede (cross-site cookie=deploy). BE typecheck=`npm run typecheck` ne `tsc -p tsconfig.json` (e2e bez jest types). **BE restart+prod env** | — (zabralo, kořen #2=deploy) |
| [✅ ŘEŠENÍ](fe.md#-řešení--156-dokončení-sub-kroky-bc-přes-paralelní-agenty--2026-06-21) | fe | 15.6 B+C ~80 empty/error míst přes 4 paralelní agenty (1=skupina, bez konfliktů) + centrální ověření; mapa NEpřepsána (overlay≠flow, jen ilustrace); **vlastní chyba: background běh s `Select-Object -Last` = neviditelný průběh (buffering)** → na pozadí nepoužívat; 4 test drifty pochyceny centrálně | — (zabralo) |
