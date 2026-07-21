# 07 · Migrace 5 zdrojů nápovědy do registru Vypravěče

Stav: podklad · 2026-07-20 · Vazby: roadmap3 fáze 25.2 (Vypravěč MVP), 26.5 (návody = cílový formát topiků), 28.2 (vyhodnocení bety — telemetrie děr řídí pořadí rozřezu)
Sousední podklady: [04-architektura.md](04-architektura.md) (registr, `HelpTopic`, CI) · [05-retence-a-cesty.md](05-retence-a-cesty.md) (cesty, empty-state momenty) · [06-obsah-a-udrzba.md](06-obsah-a-udrzba.md) (výrobní linka, šablony) · [08-skill-vypravec.md](08-skill-vypravec.md) (dvojí údržba po dobu migrace)

Všechny cesty/řádky ověřeny proti kódu k 2026-07-20.

---

## 1. Princip

Dnes existuje **5 nezávislých zdrojů nápovědy**; Vypravěč je postupně pohlcuje, aby nevznikl šestý zdroj driftu. Závazná pravidla:

1. **Nikdy big-bang.** Zejména `HelpPage/sections/*.tsx` (~167 kB JSX) se řeže po kapitolách, až po betě. Žádný zdroj se nemaže, dokud neprojde paritní checklist (§8).
2. **Od dne 1 nové help texty vznikají VÝHRADNĚ v registru** (PR konvence); existující zdroje se do migrace udržují dvojmo přes skill `napoveda` ([08-skill-vypravec.md](08-skill-vypravec.md)).
3. **Oprava kritiky (závazná):** v MVP-A je in-situ „?" **přiznaný legacy vstup** — renderuje starý obsah; parita „tytéž topiky" platí až od MVP-B. Aby kolizní plochy (chat, TM) nebyly na mobilu slepé místo (Shift+V tam neexistuje), doplní se v MVP-A levný vstup **položka „Vypravěč" v mobilním drawer menu**.
4. **Oprava kritiky (závazná):** deep-linky s `&topik=` se do registru NEpíší, dokud kontrakt není schválen a implementován (MVP-B). V MVP-A všechny odkazy na plnou nápovědu jen holé `/ikaros/napoveda`, případně `?sekce=X` (ta už funguje). Schválení kontraktu (rozhodnutí 6 syntézy) **před D8**, aby se odkazy nepsaly dvakrát.

## 2. Přehled zdrojů

| # | Zdroj | Soubory (ověřeno) | Rozsah | Kdy | Bolest |
|---|---|---|---|---|---|
| 1 | Data-driven kusy HelpPage | `helpers.ts` · `media.ts` · `toolboxItems.tsx` · pole ve `FaqSection.tsx`/`RolesSection.tsx` | ~6 datových struktur | MVP-B | žádná |
| 2 | AnonStartPanel „Začni tady" | `IkarosLayout.tsx` (fce ř. ~627) | 3 kroky | MVP-B | žádná |
| 3 | In-situ „?" (4 komponenty) | `ChatHelp` · `TacticalMapHelp` · `EfektyKresleniHelp` · `OrchestraceHelp` | ~20 kB | MVP-B | střední (mapping rolí) |
| 4 | Empty-state CTA | 5 klíčových míst (§6) | per obrazovka | MVP-A 3 → MVP-B 5 → v2 plošně | malá |
| 5 | HelpPage `sections/*.tsx` | 6 souborů, ~167 kB JSX | ~30 akordeonů, ~96 sub-akordeonů, 39 FAQ | v2–v3, po kapitolách | velká |

---

## 3. Zdroj 1 — data-driven kusy HelpPage (MVP-B, bolest žádná)

Co přesně dnes existuje a kam v registru patří:

| Struktura | Soubor | Obsah dnes | Cíl v registru |
|---|---|---|---|
| `HELP_TABS` + `TAB_LABELS` + `parseTab` | `src/features/ikaros/pages/HelpPage/helpers.ts` | 6 tabů: start·platforma·svet·role·ucet·faq; fallback `start` | enum `sekce` deep-link kontraktu (§7); názvy sekcí sdílet s `RouteHeader` |
| `HELP_MEDIA` | `src/features/ikaros/pages/HelpPage/media.ts` | 10 klíčů `HelpMediaEntry {src?, alt, caption}`; **všech 10 má `src: undefined`** (placeholder sloty, screenshoty nedodány) | beze změny — `HelpTopic.media?: HelpMediaKey[]` ho referencuje přímo (reuse, nestěhovat) |
| `TOOLBOX_ITEMS` + `toolboxItemsFor(isPJ)` | `src/features/world/help/toolboxItems.tsx` | 14 dlaždic: 8 sdílených (postava, chat, TM, stránky, pavučina, kalendář, obchod, bestiář) + 6 PJ-only (storyboard, počasí, deník PJ, nastavení, headline, správa stránek); typ `{key,title,desc,icon,to,accent,audience}`; `HelpAudience 'pj'|'hrac'`, PJ = `userRole >= PomocnyPJ` | 1:1 zdroj **kontextových karet / homeTopics** pro scope svět; `desc` = blurb, `to` = navigate akce; `WorldToolboxPanel` (dashboard „Co máš po ruce") se stane rendererem registru |
| `FAQ` pole | `src/features/ikaros/pages/HelpPage/sections/FaqSection.tsx` | **39 položek** `{cat,q,a:ReactNode}` ve 4 kategoriích (ucet·komunita·svet·obecne); `a` je JSX s `<Link>` | topiky `kind:'blocks'`/`'md'`; JSX → md konverze AI + voice pass; `<Link to>` → `links`/`navigate:`; kategorie → tags |
| `GLOBAL_CARDS`(6) + `WORLD_CARDS`(5) + matice `GLOBAL_ROWS`(8×5) / `WORLD_ROWS`(7×5) | `src/features/ikaros/pages/HelpPage/sections/RolesSection.tsx` | karty rolí + `PermissionTable` data; navíc JSX bloky: admin elevace („nahození práv"), hierarchie adminů, taby Nastavení dle role, Žadatel odstavec | jádro Tier-0 topiku **role vysvětlovač**; matice zůstávají data (render `PermissionTable`), JSX bloky = samostatné topiky (elevace, taby-nastaveni, zadatel) |
| `SECTIONS` mapa | `HelpPage.tsx` | `Record<HelpTab, ComponentType>` | beze změny do v2 (HelpPage = „Ishidova knihovna") |

Pozn.: generické bloky (`HelpAccordion`, `TermGrid`, `StepList`, `CalloutBox`, `InfoCard`…) už jsou povýšené v `@/shared/ui/help` (fáze 13.6) — topiky `kind:'blocks'` je renderují beze změny. `PermissionTable`, `ScreenshotSlot`, `IllustrationSlot` zůstávají v `HelpPage/components/` (vázané na media.ts / matici).

**Postup:** přetypovat/registrovat, povrchy (HelpPage FAQ, WorldToolboxPanel) přepnout na render z registru. Data se nemění → nulové riziko regrese obsahu; CI mrtvých odkazů chytí `to` cesty.

---

## 4. Zdroj 2 — AnonStartPanel „Začni tady" (MVP-B, bolest žádná)

**Kde:** `src/app/layout/IkarosLayout/IkarosLayout.tsx`, fce `AnonStartPanel` (ř. ~627–666); renderuje se 2× — desktop pravý panel (ř. ~1012, `isAuthenticated ? <RightPanel/> : <AnonStartPanel/>`) a mobilní drawer (ř. ~1028); aria-label toggleru ř. ~936.

**Co je uvnitř:** timeline 3 kroků — 1. „Zaregistruj se" (jediný klikací: `registerModalOpenAtom`), 2. „Vytvoř svůj svět" (statický text), 3. „Pozvi přátele" (statický text).

**Co se stane:** nahradí rozcestník Vypravěče pro anonyma — kroky konečně klikací (krok 1 → register modal; kroky 2–3 → `navigate:` akce s vysvětlením, že vyžadují účet). Data = anon rozcestník v registru (journey-lite bez persistence na BE; progres jen localStorage dle rozhodnutí 12). Scope anonyma (na kterých plochách FAB, které momenty) definuje [05-retence-a-cesty.md](05-retence-a-cesty.md) — panel v layoutu se odstraní až po ověření, že anonym FAB reálně vidí na veřejných routách; do té doby `AnonStartPanel` zůstává jako render-slot registru (žádné vlastní texty).

---

## 5. Zdroj 3 — in-situ „?" (MVP-B, bolest střední: mapping rolí)

### 5.1 Inventura (vše ověřeno v kódu)

Sdílená infrastruktura: `WorldHelpButton` (ikonové „?") + `WorldHelpModal` (modal, patička vždy odkaz `/ikaros/napoveda?sekce=svet`, nová záložka) v `src/features/world/help/`.

| Komponenta | Soubor | Kdo renderuje (trigger) | Role prop | Odvození role v místě užití | Obsah dnes |
|---|---|---|---|---|---|
| `ChatHelp` | `src/features/world/help/content/ChatHelp.tsx` | `ChannelView.tsx` ř. ~499 (tlačítko) + ~580–587 (modal) | `audience: 'pj'\|'hrac'` | `isManager = world.elevated \|\| userRole ≥ PomocnyPJ` (`WorldChatRoom.tsx` ř. 68–70), do `ChannelView` předáváno jako prop `canManage` | TermGrid 12 pojmů psaní/zpráv; ne-PJ navíc „Můj deník a hody" (3); PJ navíc správa kanálů/moderace (5) + callout kanál Postavy |
| `TacticalMapHelp` | `src/features/world/help/content/TacticalMapHelp.tsx` | `TacticalMapView.tsx` ř. ~2475–2482; tlačítko v `InitiativeBar.tsx` ř. ~202 (`onHelp`) | `audience` | `isPJ = ownerId===me \|\| elevated \|\| userRole ≥ PomocnyPJ` (`TacticalMapView.tsx` ř. 566–569) | základní ovládání 7 pojmů; PJ navíc 8 nástrojů + callout paralelní scény |
| `EfektyKresleniHelp` | `src/features/world/tactical-map/components/effects/EfektyKresleniHelp.tsx` | `TacticalMapView.tsx` ř. ~2485–2492 | `audience` | tentýž `isPJ` | PJ: efekty 6 nástrojů + kreslení; hráč: jen kreslení anotací (5) + callout proč nevidí efekty |
| `OrchestraceHelp` | `src/features/world/tactical-map/components/pj-panel/OrchestraceHelp.tsx` | `MapPjPanel.tsx` ř. ~583–590 (panel vidí jen PomocnyPJ+) | `canManageScenes: boolean` | `isPjStrict = ownerId===me \|\| elevated \|\| userRole ≥ PJ` (`MapPjPanel.tsx` ř. 146–149) | slovníček 6 · StepList 8 kroků „od prázdné mapy k boji" · 3 sub-akordeony tlačítek · callout; při `false` suffix „ — jen plný PJ (ne Pomocný PJ)" u 5 akcí |

### 5.2 Co se stane

Registrace jako topiky `body: { kind:'component', load, searchText }` — **bez přepisu obsahu** (lazy import, `searchText` povinný ručně, vynucený typem). `WorldHelpModal` zůstává jako **alias povrch** nad týmž topikem (stejný obsah v „?" i v panelu Vypravěče). Wrapper překládá `VypravecAudience` → dnešní props.

### 5.3 Mapping `audience`/`canManageScenes` → `VypravecAudience` (povinný test)

Dnešní dvojí role-logika sjednocená do jedné tabulky (zdroj pravdy pro wrapper i test):

| `VypravecAudience` | ChatHelp / TacticalMapHelp / EfektyKresleniHelp | OrchestraceHelp |
|---|---|---|
| `ctenar` | `'hrac'` | nerenderuje se (panel PomocnyPJ+) |
| `hrac` | `'hrac'` | nerenderuje se |
| `korektor` | `'hrac'` | nerenderuje se |
| `pomocnyPJ` | `'pj'` | `canManageScenes: false` (suffixy „jen plný PJ" MUSÍ zůstat) |
| `pj` | `'pj'` | `canManageScenes: true` |
| `admin` (elevovaný ve světě) | `'pj'` | `canManageScenes: true` |
| `admin` (neelevovaný) | dle jeho world role | dle jeho world role |

Pasti, které mapping test kryje (MVP-B, hard-fail):

- **PomocnýPJ nesmí tiše ztratit/získat obsah:** u tří komponent je ve větvi `'pj'`, u Orchestrace ve větvi `false` — chybné sjednocení na „pj = PJ(5)" by mu vzalo chat/TM PJ sekce; sjednocení na „pj = PomocnyPJ+" by mu v Orchestraci smazalo poznámky „jen plný PJ".
- **Korektor** (3) je dnes všude `'hrac'` — nesmí mapou získat PJ obsah.
- **Owner-bypass a elevace:** `isPJ` na TM zahrnuje `world.ownerId === me` (N-16) a `world.elevated`; audience se MUSÍ derivovat z `WorldContext` (world role + elevace), nikdy z globální role — neelevovaný admin je běžný člen.

Test = matice 7 řádků × 4 komponenty: render s daným `VypravecAudience`, assert přítomnost/nepřítomnost markerových textů větví (např. „Pro Pána jeskyně", „jen plný PJ"). Spouští se v `npm run test:run`.

---

## 6. Zdroj 4 — empty-state CTA (MVP-A 3 místa → MVP-B 5 → v2 plošně)

Kontrakt: komponenta volá `vypravec.reportEmpty(key)` — **jen hlásí klíč**, replika + max 1 CTA žijí v registru (typ TIP, viz [06-obsah-a-udrzba.md](06-obsah-a-udrzba.md)). Zavření se persistuje (dismissed), nikdy se neopakuje.

Klíčová místa nalezená v kódu (5; MVP-A = první tři):

| Klíč | Místo (ověřeno) | Dnešní stav | Replika/CTA z registru |
|---|---|---|---|
| `moje-postava.bez-postavy` | `src/features/world/pages/MyCharacterPage.tsx` ř. ~59 „Zatím nemáš postavu" | text + odkaz na adresář; větev `canCreate` | few-shot 2: „Postavu ti tady založí tvůj PJ — napiš mu v kanálu Postavy." + CTA chat |
| `svet.zadatel-ceka` | `AccessRequestPending` (`WorldDashboardPage.tsx` ř. ~87–92, stav `pending-access` z `useWorldStatus`) | banner + cancel | few-shot 3: „Tvoje žádost leží u PJ… Čekání není chyba." |
| `tm.hrac-bez-sceny` | `MapEmptyState.tsx` (`variant='empty'`, hráč) „Žádná aktivní scéna / Vyčkej, až tě PJ přiřadí" | ilustrace + text; PJ varianta má vlastní akce (vytvořit scénu, self-assign) — tu Vypravěč nedubluje | vysvětlení „PJ chystá scénu" + CTA chat. Pozn.: empty TM nemá aktivní canvas → kotva se zde skrývat nemusí (výjimka z kolizního pravidla, zapsat do spec) |
| `stranky.prazdne` | `PagesListPage.tsx` (sdílený `EmptyState` z `src/shared/ui/StatePlaceholder/`) | generický prázdný stav | PJ: „Založ první stránku" / hráč: vysvětlení kdo tvoří obsah |
| `svet.dashboard-cerstvy` | `WorldDashboard` (3 sloupce) — čerstvý svět po založení | sloupce s minimem obsahu | krok 2 cesty 26.1: „Svět NENÍ prázdný — 6 seedovaných stránek…" (probe, viz [05-retence-a-cesty.md](05-retence-a-cesty.md)) |

`MapEmptyState` varianty `forbidden`/`error` NEjsou empty-state — patří do chybové mapy (`errorCode → topicId`, [04-architektura.md](04-architektura.md)). V2: sdílená komponenta `EmptyState` (`StatePlaceholder`) dostane volitelný `vypravecKey` prop → plošné pokrytí bez per-obrazovka práce.

---

## 7. Zdroj 5 — HelpPage `sections/*.tsx` (v2–v3, bolest velká) + deep-link kontrakt

### 7.1 Inventura (ověřené velikosti a struktura)

| Soubor | kB | Struktura | Kotvy `id` dnes |
|---|---|---|---|
| `StartSection.tsx` | 7,3 | 5 akordeonů (První kroky · Co odemkne registrace · Orientace · Slovníček 12 pojmů · Motivy) | 0 |
| `PlatformSection.tsx` | 37,8 | 6 akordeonů + **37 `Tool` sub-akordeonů** (per nástroj, s `TagChip` audience) | 0 |
| `WorldSection.tsx` | 61,5 | 5 akordeonů + **39 `Tool`** + **20 `MapFeature`** (3. úroveň vnoření u TM) | 0 |
| `RolesSection.tsx` | 16,3 | 2 akordeony | **2** (`role-globalni`, `role-svetove`) — jediné v celé nápovědě |
| `AccountSection.tsx` | 13,4 | 12 akordeonů (profil, Camp postava, vzhled, přezdívka/e-mail, heslo, 2FA, avatar, soukromí, notifikace, světy, moderace, data, 15+, smazání) | 0 |
| `FaqSection.tsx` | 30,9 | 4 kategorie × 39 otázek (plain `<details>`, bez komponenty) | 0 |
| **Σ** | **~167** | ~30 akordeonů · ~96 sub · 39 FAQ | 2 |

Známé bolesti: (a) akordeony bez `id` (kotvy nutno doplnit ručně, postupně); (b) interní `<Link>` odkazy napříč routami (CI mrtvých odkazů je pokryje až po převodu do registru); (c) 3 CSS zdroje (`HelpPage.module.css`, `shared/ui/help/Help.module.css`, `WorldHelp.module.css`); (d) `HelpAccordion` s `persistKey` je controlled — **deep-link auto-open musí persistovaný stav přepsat** (dnes deep-link `?sekce=` funguje jen díky tomu, že HelpPage persistKey nepoužívá; `WorldToolboxPanel` ho používá).

### 7.2 Deep-link kontrakt `?sekce=X&topik=Y` (MVP-B; ✅ kontrakt schválen vlastníkem 2026-07-20)

- **Dnes funguje:** `?sekce=X`, X ∈ {start, platforma, svet, role, ucet, faq}, `parseTab` fallback `start`. Linkují na něj `WorldHelpModal` (patička) a `WorldToolboxPanel` (`?sekce=svet`).
- **Rozšíření (MVP-B):** `&topik=Y`; Y = stabilní kebab-case id akordeonu/sub-akordeonu/FAQ položky. Chování: přepni sekci → `scrollIntoView` cíle → auto-open celé `details` cesty k němu (vč. přepsání persistKey). **Neznámý topik = tiché degradování na sekci** (žádná chyba). Kontrakt je veřejný (bude v odkazech registru i changelogu) — **po schválení se nemění**.
- **Konvence id:** `<oblast>-<slug>` (`role-globalni` už existuje a vyhovuje); FAQ `faq-<slug>`. ID se registrují průběžně (ne big-bang): nejdřív cíle Tier-0 topiků (`links`/`deepLink` pole), zbytek při rozřezu kapitol. Registr vede seznam platných ID; CI hard-fail: `deepLink`/md odkazy jen na registrovaná ID.
- **MVP-A disciplína (oprava kritiky):** dokud kontrakt neběží, do registru jen holé `/ikaros/napoveda` (příp. `?sekce=`), žádné `&topik=` — jinak parametry během vlny 1 mrtvě spadnou na začátek stránky.

### 7.3 Rozřez po betě — pořadí (nikdy big-bang)

Kapitola po kapitole, při prohlubování obsahu dle telemetrie děr (28.2). HelpPage zůstává „Ishidova knihovna" (dlouhé čtení, tisk, SEO) — postupně se stává rendererem registru, ne mazaným kódem.

1. **FaqSection** — už čisté pole dat, 39 otázek → 39 topiků (AI konverze `a: ReactNode` → md + voice pass); render z registru = první důkaz konceptu.
2. **RolesSection** — karty+matice už data; JSX bloky (elevace, taby nastavení, Žadatel) → 3–4 topiky; jde o Tier-0 „role vysvětlovač", takže obsah stejně vzniká — rozřez je dvojí využití téže práce.
3. **AccountSection** — 12 malých samostatných témat, minimum vnoření.
4. **StartSection** — malá, ale kryje ji persona rozcestník; slovníček → docs/glossary sdílení (v2).
5. **PlatformSection** — 37 nástrojů, každý `Tool` ≈ 1 topik (title+audience tag+body se mapují 1:1 na `HelpTopic`).
6. **WorldSection** — největší a 3úrovňová (TM `MapFeature`); nakonec, po zkušenosti z předchozích.

DoD každé kapitoly: topiky v registru (source+verifiedAt) → HelpPage sekce renderuje z registru → smoke diff obsahu → teprve pak smazání JSX. Dvojí údržba mezitím řízená skillem `napoveda` ([08-skill-vypravec.md](08-skill-vypravec.md)).

---

## 8. Paritní checklist (brána smazání KAŽDÉHO zdroje)

- [ ] Obsah 1:1 v registru (diff review, ne po paměti); `source` + `verifiedAt` vyplněné.
- [ ] Role větve pokryté mapping testem (§5.3) — PomocnýPJ, Korektor, admin ±elevace.
- [ ] Všechny odkazy vedoucí NA zdroj přesměrované (grep `?sekce=`, `WorldHelpModal`, `toolboxItems`, FAQ „Kde najdu nápovědu přímo ve světě?" — ta dnes popisuje „?" tlačítka a panel „Co máš po ruce"; po nasazení FAB nutná aktualizace textu, jinak nápověda lže o nápovědě).
- [ ] Deep-linky na zdroj dál fungují (kontrakt §7.2 zmrazen).
- [ ] Skill `napoveda` už u daného zdroje nevyžaduje JSX úpravu (kapitola označená jako migrovaná).

## 9. Rizika specifická pro migraci

| Riziko | Mitigace |
|---|---|
| Wrap „?" tiše změní obsah pro PomocnéhoPJ (dvojí role-logika `audience` vs `canManageScenes`) | mapping tabulka §5.3 jako jediný zdroj + povinný test v MVP-B |
| Deep-linky psané před schválením kontraktu | MVP-A jen holé odkazy; schválení rozhodnutí 6 před D8; CI na registrovaná ID |
| `persistKey` accordion ignoruje deep-link open | auto-open přepisuje persistovaný stav (viz §7.1d); test na `WorldToolboxPanel` vzor |
| Duplicitní vysvětlení chyb (friendly-messaging už existuje) | deklarovaný vztah: friendly hláška = 1. linie (zůstává), chybový topik = 2. linie „proč a co dál"; texty hlášek postupně čerpat z registru (pole `shortMessage` topiku); CI kontrola, že errorCode s hláškou i topikem nemá protichůdné znění |
| Rozřez sections uvízne (1 vývojář) | pořadí §7.3 od data-driven kapitol; telemetrie děr (28.2) určuje co dřív; HelpPage nikdy nečeká na rozřez — žije dál celá |
| FAQ/JSX → md ztratí odkazy či formatt | AI konverze + dev review diffu; CI mrtvých odkazů po převodu |
