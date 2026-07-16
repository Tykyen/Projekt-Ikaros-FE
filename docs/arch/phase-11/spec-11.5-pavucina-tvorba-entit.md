# Spec 11.5 — Pavučina: tvorba a materializace entit + vyvolávání

**Status:** Implementováno 2026-07-16 — FE build ✓ + BE typecheck ✓ + 68 FE testů ✓; čeká živé ověření (screenshoty) + commit
**Rozsah:** FE + BE — velké; tři propojené vrstvy (graf UX / materializace / nový Page-typ). Dodáme jako jeden krok se sub-kroky A→C.
**Repo:** `Projekt-ikaros-FE` + `Projekt-ikaros` (BE), větev `main` (dle konvence projektu bez feature větví)
**Velikost:** odhad ~18–22 souborů (B2 zmapováno: BE **1** soubor + FE ~6; těžiště práce je A+B1)
**Autor:** PJ + Claude
**Datum:** 2026-07-16
**Souvisí:** [spec-11.1](spec-11.1.md) (Pavučina jádro), fáze 7 (Wiki stránky), fáze 8 (Postavy)

---

## 1. Cíl

Umožnit PJ (a v rámci oprávnění hráči) **tvořit a propojovat entity přímo z Pavučiny** místo odskoku do jiných modulů, a **„vyvolat" (přeskočit na) napojenou reálnou entitu** jedním klikem. Zahrnuje: (A) tvorbu/propojení/vyvolání z grafu, (B1) „materializaci" subjektu do reálné stránky (PC/NPC/Lokace), (B2) doplnění chybějících reálných entit **Frakce / Organizace / Stát** jako nových typů wiki stránky, aby i ony šly napojit a vyvolat.

---

## 2. Kontext / motivace

Testerská zpětná vazba (PJ): *„Pavučina — uvítal bych možnost si přímo v této složce vytvořit novou postavu / NPC / frakci atd., s propojením mezi ostatní funkce a možností vyvolávání. Ulehčí mi to vzpomínat, kdo kde co s kým jak a proč."*

Dnešní Pavučina je **čtecí mapa vztahů** — tvorba subjektů je jen v tabu Subjekty (modal), z grafu nejde vytvořit ani propojit nic, a „subjekt" je odtržený od reálných entit světa. Navíc **Frakce/Organizace/Stát vůbec nemají reálnou entitu** — jsou jen typem uzlu, takže je nelze otevřít jako stránku. To přesně blokuje testerovo „vytvořit frakci a vyvolat ji".

Když to neuděláme: PJ dál skáče mezi moduly a frakce zůstávají „mrtvé" uzly bez obsahu.

---

## 3. Audit současného stavu

### 3.1 Pavučina / campaign (FE)
- Uzly = `CampaignSubject` (typy PC/NPC/FACTION/ORG/STATE/LOCATION/OTHER) — samostatný denormalizovaný záznam s volitelnými **textovými** ukazateli `linkedPageSlug` / `linkedCharacterSlug` (žádná FK). [types.ts:26-53](../../../src/features/world/campaign/types.ts#L26)
- Tvorba subjektu jen v tabu Subjekty přes [SubjectForm](../../../src/features/world/campaign/components/SubjectForm.tsx) (modal). Našeptávač už umí napojit na **existující** postavu/NPC/lokaci (persona + pages directory) a doplní slug+typ+avatar. [SubjectForm.tsx:83-117](../../../src/features/world/campaign/components/SubjectForm.tsx#L83)
- `pageTypeToSubjectType` mapuje jen `Postava hráče→PC`, `NPC→NPC`, `Lokace→LOCATION`; zbytek `null`. [SubjectForm.tsx:16-27](../../../src/features/world/campaign/components/SubjectForm.tsx#L16)
- Graf ([PavucinaGraph](../../../src/features/world/campaign/components/PavucinaGraph.tsx)): levý klik = fokus/ego-síť, pravý klik = `onOpenSubject` → odskok do tabu Subjekty. **Žádná tvorba, žádné propojení tažením, žádné vyvolání.** [PavucinaGraph.tsx:317-321](../../../src/features/world/campaign/components/PavucinaGraph.tsx#L317)
- „Vyvolání" dnes existuje jen jako odkaz `→ Wiki stránka` v detailu subjektu, a **jen pro `linkedPageSlug`** — `linkedCharacterSlug` odkaz nemá. [SubjectDetail.tsx:59-66](../../../src/features/world/campaign/components/SubjectDetail.tsx#L59)
- Vrstvy: subjekty jsou owner-scoped (per PJ/hráč). Materializace hráčova soukromého subjektu na reálnou stránku = posun do (pending) světové entity.

### 3.2 Reálné entity světa (Page)
- Reálné entity mají **jen 3 druhy**, všechny jsou `Page` rozlišené polem `type`: **Postava hráče**, **NPC**, **Lokace**. BE po vytvoření Page auto-vytvoří `Character` a napojí `characterRef`. Tvorba přes `useCreatePage` → `POST /worlds/:worldId/pages` (povinné: `slug`, `type`, `title`).
- `PAGE_TYPES` (BE `pages/interfaces/page.interface.ts`, FE `pages.types.ts`): Lokace, Noviny, Seznam, Galerie, Zoom, Rodokmen, Obrazovka, Ostatní, Postava hráče, NPC — **žádná Frakce/Organizace/Stát**.
- URL zobrazení: univerzální `/svet/:worldSlug/:slug` (PageViewer), rozlišení layoutu dle `type` uvnitř.
- Oprávnění tvorby ([resolveCreateMode](../../../../Projekt-ikaros/backend/src/modules/pages/pages.service.ts#L1353)): role ≥ PomocnyPJ → rovnou živé; role ≥ Hráč + typ ∈ `PLAYER_PROPOSABLE` (NPC, Lokace, Ostatní, Seznam, Galerie, Rodokmen) → pending; PC hráč založit nesmí; jinak 403.

### 3.3 Nesrovnalosti k pojmenování
- **N1:** Frakce/Organizace/Stát nemají entitu → testerovo „vyvolat frakci" nemá kam vést. → řeší B2.
- **N2:** `linkedCharacterSlug` nemá klikací odkaz (jen `linkedPageSlug`). → řeší A.
- **N3:** materializace mění viditelnost (soukromý subjekt → světová stránka) — musí být vědomá, s jasnou hláškou.

---

## 4. Návrh řešení

### 4.A — Graf jako pracovní plocha (obal)
Sjednotit tvorbu/propojení/vyvolání do **kontextového menu na uzlu** + akce na plátně, bez odskoku z tabu Síť.

- **Context-menu na uzlu** (pravý klik nebo dedikované „⋯"): *Otevřít detail · **Vyvolat** (přeskok na reálnou stránku) · + Nový vztah odsud · Upravit · Smazat*.
- **„+ Subjekt" na plátně** (tlačítko v ovládacím pruhu; volitelně dvojklik na prázdno) → otevře stávající `SubjectForm`. Nový uzel se objeví v grafu (poloha u místa akce, jinak střed).
- **Nový vztah z grafu:** z menu „+ Nový vztah odsud" → otevře `RelationshipForm` s předvyplněným subjektem A; výběr B = stávající combobox. *(Drag-to-connect tažením = nice-to-have, mimo scope — `react-force-graph` to nemá nativně.)*
- **Vyvolání (N2 fix):** akce „Vyvolat" otevře `/svet/:worldSlug/:slug` dle `linkedPageSlug` **nebo** `linkedCharacterSlug` (postava má stejný `/:slug`). Rozšířit i `SubjectDetail`, aby odkaz vedl i z `linkedCharacterSlug`. Bez napojení → akce disabled s tooltipem „Není napojena reálná stránka".

### 4.B1 — Materializace subjektu → reálná entita (PC/NPC/Lokace)
Když subjekt nemá `linkedPageSlug`/`linkedCharacterSlug` a je typu PC/NPC/LOCATION:
- V `SubjectDetail` (a v context-menu) akce **„Založit reálnou stránku"** → zavolá `useCreatePage` (`type` odvozený z typu subjektu, `title` = jméno subjektu, `slug` = slugify jména) → po úspěchu **napojí** vzniklý `linkedPageSlug` (+ `linkedCharacterSlug` u PC/NPC) zpět na subjekt (`updateSubject`).
- **Obráceně** (při tvorbě subjektu): v `SubjectForm` přepínač *„vytvořit ve světě i reálnou stránku a napojit ji"* — zobrazí se jen při tvorbě nenapojeného subjektu materializovatelného typu, který viewer smí založit (role-aware). ✅ hotovo (B1b).
- **Role-aware (N3):**
  - PJ/PomocnyPJ → stránka rovnou živá.
  - hráč → NPC/Lokace vznikne jako **pending** (návrh); jasná hláška „Odesláno PJ ke schválení".
  - hráč + PC → akce skrytá/disabled (BE stejně vrátí 403) s vysvětlením.
- Kolize slugů: při 409 nabídnout dovětek (`-2`) nebo napojení na existující.

### 4.B2 — Frakce / Organizace / Stát jako reálné wiki-like typy
Přidat 3 nové `PAGE_TYPES` chovající se **jako `Ostatní`** — čistá wiki `Page`, **bez** auto-`Character` subdocu, **generický** viewer layout (ne PostavaLayout).

- BE: rozšířit `PAGE_TYPES` enum; DTO `@IsIn` projde přes `Object.values`; **ověřit, že auto-Character se NEspustí** (jen pro PC/NPC/Lokace) — pokud je logika whitelist, nové typy automaticky vynechá; jinak upravit.
- FE: zrcadlo `pages.types.ts`; ikona + label + barva typu (badge v directory/seznamu/breadcrumbs); volby v `NewPageWizardModal`.
- `pageTypeToSubjectType`: doplnit `Frakce→FACTION`, `Organizace→ORG`, `Stát→STATE` → našeptávač Pavučiny napojí i tyto.
- Materializace (B1) se tím rozšíří i na FACTION/ORG/STATE (stejný mechanismus, jen bez `linkedCharacterSlug`).
- Oprávnění: rozhodnutí, zda Frakce/Org/Stát patří do `PLAYER_PROPOSABLE` (viz §9).

**B2 dotčená místa (zmapováno):**

*Povinné — jinak nezbuildí / nefunguje:*
1. BE enum — `pages/interfaces/page.interface.ts:2-20` (`PAGE_TYPES`): přidat `Frakce:'Frakce'`, `Organizace:'Organizace'`, `Stat:'Stát'` (za `Ostatni`).
2. FE zrcadlo — `pages.types.ts:11-27` (`PAGE_TYPES`), stejné 3 klíče. `ALL_PAGE_TYPES` se dopočítá.
3. FE layout-switch — `PageViewer/PageViewer.tsx:47-59` (`LAYOUTS: Record<PageType,…>`): přidat 3 klíče → `OstatniLayout`. ⚠️ runtime fallback existuje, ale **exhaustivní `Record<PageType>` shodí `tsc -b`** bez explicitních klíčů.
4. FE ikony — `PagesListPage/lib/pageTypeMeta.tsx:17-29` (`PAGE_TYPE_ICON: Record<PageType,LucideIcon>`): 3 klíče (Lucide `Flag`/`Users`/`Landmark`). ⚠️ stejná Record past.
5. FE — `campaign/SubjectForm.tsx:16-27` (`pageTypeToSubjectType`): doplnit `Frakce→FACTION`, `Organizace→ORG`, `Stát→STATE`. *(`campaign/types.ts` + `labels.ts` už FACTION/ORG/STATE mají — neměnit.)*
6. FE wizard — `NewPageWizardModal.tsx:5-12` (typy voleb) + ChoiceCard bloky; mapování volby→`?type=` v `WorldLayout.tsx:282-293` (`handleWizardChoice`).

*Auto (ověřeno, bez zásahu):* auto-Character whitelist `pages.service.ts:336-344` (nové typy Character NEdostanou); DTO `@IsIn(Object.values(PAGE_TYPES))`; mongoose schema bez enumu; directory endpoint + repo (generický `$in`); editor default `Ostatní`; badge/chip/filtr seznamy přes `ALL_PAGE_TYPES`; Meili search neindexuje `type`; kalendář (bez Character → nezobrazí, správně).

*Volitelné:* `useAutoLink.ts:25` (`ENTITY_TYPES`) — auto-linkování zmínek nových typů v textu (komentář sám zmiňuje „státy, organizace").

---

## 5. Out of scope
- Drag-to-connect tažením myší v grafu (jen menu).
- Vlastní bohatý layout stránky Frakce (stat-blok frakce, členové, území) — zatím generická wiki; případně samostatný spec.
- Real-time WS sync Pavučiny mezi více PJ (campaign nemá gateway; mimo MVP).
- „Vyvolat NPC do chatu / na mapu" — vyvolání = navigační přeskok na stránku, ne spawn do scény.
- Bulk import/export, PDF.

---

## 6. Acceptance kritéria
1. ✅ V tabu Síť lze vytvořit nový subjekt z plátna (bez přepnutí do Subjekty) a uzel se objeví.
2. ✅ Context-menu na uzlu nabízí Vyvolat / +Vztah / Upravit / Smazat / Detail.
3. ✅ „Vyvolat" přejde na reálnou stránku dle `linkedPageSlug` i `linkedCharacterSlug`; bez napojení je disabled.
4. ✅ Subjekt PC/NPC/Lokace bez vazby lze „materializovat" → vznikne reálná Page + subjekt se na ni napojí.
5. ✅ Materializace je role-aware: hráč dostane pending u NPC/Lokace, PC nesmí; PJ rovnou živě.
6. ✅ Existují Page-typy Frakce/Organizace/Stát; jdou založit z wizardu; zobrazí se generickým layoutem; **nedostanou** Character subdoc.
7. ✅ Frakce/Org/Stát se dají materializovat z Pavučiny a následně vyvolat.
8. ✅ Našeptávač v `SubjectForm` napojí i Frakce/Org/Stát stránky (`pageTypeToSubjectType`).
9. ✅ `mobil-desktop` audit grafu i menu prošel; funkce hlídá `funkce` + `napoveda`.

---

## 7. Test plán
- **Automated:** unit pro `pageTypeToSubjectType` (nové mapování); unit slugify/kolize; BE test že Frakce/Org/Stát create **nezaloží** Character; role-aware materializace (PJ živě / hráč pending / PC 403).
- **Manuální smoke (autor na živém webu):** vytvořit subjekt z grafu → materializovat → vyvolat; založit Frakci z wizardu i z Pavučiny; ověřit pending flow jako hráč; screenshoty menu na mobilu i desktopu.

---

## 8. Riziko & rollback
| Riziko | Mitigace |
|---|---|
| Nový Page-typ shodí build — dva exhaustivní `Record<PageType,…>` (`PageViewer.tsx:47`, `pageTypeMeta.tsx:17`) mají runtime fallback, ale TS bez klíčů neprojde | přidat všechny 3 klíče v obou; `npm run build` (tsc -b) v ověření. Auto-Character whitelist ověřen — nové typy Character nedostanou (bez zásahu) |
| Materializace hráče nechtěně zveřejní soukromý subjekt | pending režim + explicitní hláška + potvrzení |
| Kolize slugů při materializaci | 409 handling: dovětek nebo napojení na existující |
| Context-menu nepoužitelné na dotyku (mobil) | menu i přes „⋯" tlačítko, ne jen pravý klik; `mobil-desktop` |
| `react-force-graph` pozice nového uzlu | nechat force layout dopočítat; nezamykat pozici |

**Rollback:** featura je aditivní (nové akce + nové typy). Rollback = revert FE komponent; nové Page-typy zůstanou validní data (neničí existující).

---

## 9. Otázky k autorovi
Autor delegoval směr (A+B1+B2 najednou). Zbývající volby — navrhované defaulty, potvrď nebo změň:
1. **Hráč smí navrhnout Frakci/Organizaci/Stát?** Návrh: **ano** (pending, konzistentní s Lokace/Ostatní). Alt: PJ-only (světový lore).
2. **Tvorba vztahu z grafu:** menu „+Vztah odsud" (návrh) vs. i drag-to-connect (víc práce). Návrh: jen menu.
3. **Ikona/barva nových typů:** navrhnu v rámci implementace (Frakce = 🏛/erb, Organizace = 🏢, Stát = 🗺); dolaď přes `frontend-design` pokud chceš vlastní tvar.
4. **„Materializovat" i hromadně** (víc subjektů naráz)? Návrh: ne, jen po jednom (jednoduchost).

---

**Po schválení specu napíšu implementační plán** (přesné CLI / file diff, rozdělený na sub-kroky A / B1 / B2).
