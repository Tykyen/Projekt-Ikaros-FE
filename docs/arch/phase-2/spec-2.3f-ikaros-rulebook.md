# Spec 2.3f — Ikaros pravidla: Pravidlová kniha světa

> **STATUS: SPEC ODSOUHLASEN (PJ 2026-06-07) — NEIMPLEMENTOVÁNO.**
> Otevřené otázky vyřešeny (viz „Vyřešené otázky" níž). Naváže na 2.3b–e.
> ⚠️ PJ priorita: **výkladní skříň** — graficky i textově profesionální, „hodně mi
> na tom záleží". Další krok: impl. plán F0 → souhlas → kód.

---

## Záměr (potvrzeno s PJ)

Svět se systémem **„Ikaros pravidla"** (id `matrix`) dostane vlastní
**Pravidlovou knihu** — vícestránkovou, dobře čitelnou a srozumitelnou.

- ⚠️ **NE raw klon staré DB.** PJ chce, abych obsah **přepsal/učesal pro
  srozumitelnost** a **graficky přetvořil** (čitelné, přehledné). Důraz je na
  **grafickou stránku** + textové úpravy. Interaktivita: **sbalovací nadpisy,
  překlikávání/taby**.
- Kniha je **per-svět editovatelná** (PJ přidává / odebírá / mění kapitoly).
- Kniha je **přenositelná mezi světy** (PJ si ji uloží a načte v jiném světě —
  „možná je někdy využije").

## Struktura knihy (ze screenshotů + zadání PJ)

Hub stránka `pravidla` (type `Seznam`, sidebar menu) → kapitoly:

1. Tvorba postav
2. Aspekty
3. Body osudu
4. Sázky
5. Iniciativa
6. Úroveň sil
7. Přetlak
8. Únava
9. Léčení a zranění
10. **Magická pravidla** → vlastní pod-menu typů magie. Ze screenshotu (oříznuto):
    Alchymie, Antimagie, Démonologie, Druidská magie, Exorcismus, Léčebná magie,
    Magie těla, Nekromancie, Obranná magie, … → **chci VŠECHNY** (úplný seznam z DB).
    Každý typ = vlastní stránka s obsahem + obrázkem (vzor: Alchymie se stupni 1–6
    + ilustrace).
11. **Programování** (vychází z Matrixu, dělané jinak) → pod-topiky:
    Boj s programy, Druhy připojení, Identifikace, Matrixová rozhraní,
    Offline vs. Online, Programování AKJ, Systémová obrana, Svobodný Matrix.
12. **Jazyková politika** → jen *Úrovně jazykového zvládnutí* + *Základní
    informace o jazykovém prostředí světa*. ⚠️ **BEZ** „Státy a jazyková politika".
13. **Jazykové rodiny** → předpřipravené pro hráče, plně editovatelné (fallback
    „kdyby cokoliv").

## Zdroj obsahu + obrázky

- Obsah je ve **staré Matrix DB** (PJ: „máš to v databázi a obrázcích").
  `C:\Matrix\dump\MatrixDatabase\Pages.bson` (binární → `mongorestore` →
  `mongoexport` → JSON). Slugy: `tvorba-postav`, `aspekty`, `body-osudu`,
  `alchymie`, `programovani-akj`, `jazykova-politika`, `jazykove-rodiny`,
  `magicka-pravidla`, …
- Stará Matrix app = C# backend (`C:\Matrix\Matrix\backend`), DB `MatrixDatabase`.
  Migrace world ID `6d6174726978000000000001` (`migrate-matrix-world.js`).
- Obrázky: původně **Cloudinary** URL. Ověřit, zda staré URL žijí; jinak re-upload
  do Ikaros Cloudinary (`upload.service.ts`).

## Architektura (zjištěno — Explore 2026-06-07)

- **Page model:** `menu: MenuItem[]` (`{label, href, order}`) + `sections:
  PageSection[]` (`{title, content, items[], isCollapsed, order}`) + `content`
  (TipTap HTML) + `imageUrl`/`bigImage` + `galleryImages[]`.
  - Schema: `backend/src/modules/pages/schemas/page.schema.ts`
  - Interface: `…/pages/interfaces/page.interface.ts` (PageSection 50–64, MenuItem 80–84)
- **Hub** = type `Seznam` → `SeznamLayout.tsx` (3 sloupce: menu / content /
  table+AutoTOC), aktivní položka přes `?item=<href>`.
- **Sbalovací nadpisy** = `sections[].isCollapsed` (`PageSections.tsx`).
  **Překlikávání** = hub menu / `?item`.
- **Obrázky:** Cloudinary (`upload.service.ts` 106–325), sdílené URL → lze
  referencovat napříč světy (klon obrázku není nutný).
- ❌ **Žádný built-in clone stránek.** Vzor pro „přenositelné mezi světy":
  `dungeon-maps.service.ts` `exportTemplate`/`exportScene` (template repo +
  create v cílovém světě). To je vzor pro per-PJ knihovnu pravidel.
- **Seed:** `pages-world-seed.listener.ts` (@OnEvent `world.created`). Bulk =
  sekvenční `pagesRepo.save()` (není `saveMany`).
- **FE editory:** `PageEditor/panels/MenuPanel.tsx` (menu), PageSectionDto /
  MenuItemDto v `create-page.dto.ts`.

## Návrh řešení — 3-vrstvá architektura (ODSOUHLASENO 2026-06-07)

⚠️ **Změna oproti původnímu „TS data v repu → seed".** Dodatek PJ: *Superadmin musí
moct v budoucnu měnit pravidla i obrázky.* Do TS v repu Superadmin za běhu nesáhne
(jen vývojář přes deploy). Proto kanón leží v **DB**, ne v kódu.

| Vrstva | Kdo edituje | K čemu |
|---|---|---|
| **Master kniha** (DB) | Superadmin | kanonická Ikaros pravidla, jediný zdroj pravdy + zdroj seedů |
| **Kopie ve světě** | PJ daného světa | per-svět úpravy; master tím nehne |
| **Přenosná knihovna** | PJ | uložit/načíst knihu do jiného světa |

- **Bootstrap masteru:** starý obsah vyextrahovat → **učesat texty + strukturu
  (PJ priorita)** → uložit jako JSON v repu (`pages/rulebook/*` = verzovaná záloha)
  → jednorázový **idempotentní import** do DB masteru. Repo = záloha, DB master =
  živý kanón.
- **Seed světa:** `world.created` pro `matrix` → **klon masteru** do světa (NE z TS,
  NE runtime z mrtvé Matrix DB). Vzor klonu: `dungeon-maps.service.ts exportTemplate`.
- **Per-svět editace:** klonované stránky = běžné Pages → PJ edituje/maže/přidává
  (funguje out-of-the-box).
- **Přenositelnost mezi světy:** per-PJ **„knihovna pravidlových knih"** (vzor map
  library) — UI **Uložit / Načíst knihu v hlavičce hubu Pravidla** (jen PJ), NE
  v Nastavení světa. Samostatná fáze (F5).
- **Superadmin editace masteru** (vč. výměny obrázků) = samostatná pozdější fáze
  (F6); architektura na ni připravená od F1.
- **Grafika (PJ priorita „výkladní skříň"):** `frontend-design` skill jako motor;
  z reálného obsahu po F0 odvodit **`rulebook-design`** projektový skill (typografie,
  sbalovací/taby vzory, rámování ilustrací) → konzistence napříč kapitolami.
  Dedikovaný „rulebook" layout nad rámec `SeznamLayout`. Postup: prototyp 1–2 kapitol
  → souhlas PJ s vizuálem → teprve pak hromadná výroba.

## Vyřešené otázky (2026-06-07)

1. **Úplný seznam typů magie** — vyextrahovat z DB v F0 (PJ chce VŠECHNY typy).
2. **Získání zdroje** — ✅ PJ dal přístup. Mongo nástroje nejsou na PATH, ale
   `Pages.bson` přečtu **Node skriptem přes `bson` balík** (v `backend/node_modules`).
   Žádný `mongorestore`, žádný běžící `mongod`, nulová instalace.
3. **Matrix vs. univerzální škály (2.3c-e)** — ✅ pro `matrix` **vypnout** seed
   `magicky-system` **i** `technologie`. Všechna pravidla žijí jen v rulebooku
   („oddělená a samostatná, vše v jednom"). `pravidla` text seed rulebook stejně
   nahradí. Ostatní systémy beze změny. Gate: `world.system === 'matrix'` v
   `pages-world-seed.listener.ts`.
4. **Obrázky** — ✅ cíl je **re-host do Ikaros CloudinF** (Superadmin je má
   spravovat → musí být v našem systému). Staré URL jen dočasně při vývoji. **F0
   vyrobí soupis všech obrázků** (kapitola/kouzlo, starý URL, rozměr, popisek) →
   PJ dodá nové, zařadím.
5. **Rozsah grafiky** — ✅ **výkladní skříň**, profesionální. Dedikovaný rulebook
   layout, `frontend-design` motor, odvozený `rulebook-design` skill. Prototyp
   → souhlas → hromadná výroba.
6. **Přenositelnost + Superadmin editace** — ✅ 3-vrstvá architektura (viz „Návrh
   řešení"). UI Uložit/Načíst v hlavičce hubu Pravidla. Superadmin editace masteru
   = F6.

## Fázování (odsouhlaseno 2026-06-07)

- **F0** — ✅ HOTOVO (2026-06-07). Extrakce `Pages.bson` přes `bson` skript →
  inventář [`rulebook-inventory.md`] + **učesaný obsah všech 13 kapitol**
  [`rulebook-content.md`] (1–9 jádro, 10 = 21 typů magie, 11 = 8 mechanik
  Programování, 12–13 jazyky) + soupis 26 obrázků. Čeká revize PJ + editorní
  průchod (uvozující věty + Rychlé přehledy) před buildem.
- **F1** — Master kniha v DB (import z F0 JSON) + klon-do-světa pro `matrix`
  (vypnutý generický `magicky-system`/`technologie` seed) + Pravidla hub
  (`Seznam` + menu) + kapitoly Tvorba postav … Léčení a zranění.
  ⚠️ Před tím **`frontend-design` audit** → odvodit `rulebook-design` skill →
  **prototyp 1–2 kapitol → souhlas PJ**, pak teprve zbytek.
- **F2** — Magická pravidla (sub-kniha všech typů + obrázky, re-host CloudinF).
- **F3** — Programování — jen **8 mechanik** z hubu `matrix-informace` (Boj s programy,
  Druhy připojení, Identifikace, Matrixová rozhraní, Offline vs. Online, Programování
  AKJ, Systémová obrana, Svobodný Matrix).
- **F4** — Jazyková politika (bez států) + Jazykové rodiny (editovatelné).
- **F5** — Přenositelnost mezi světy (per-PJ knihovna, save/load v hlavičce hubu).
- **F6** — Superadmin editace masteru (úpravy pravidel + výměna obrázků za běhu).
- **F7** — 🕓 ODLOŽENO PJ: Katalog programů (68 záznamů, 6 kategorií, sbalovací
  záznamy; ~93 tis. znaků + 68 obrázků). Konceptuálně blízko Bestiáři.

## Workflow pro příště

Tento doc = spec. Per fáze: **souhlas → impl. plán → souhlas → kód.**
Před grafikou `frontend-design`; po UI `mobil-desktop`; po fázi `napoveda`.
Commit přímo na main (FE) + BE repo; git ručně dle pokynu PJ.

## Vazba na hotové (2.3b–e)

`matrix` má dnes: auto-preset kostek (Fate), prázdná Pravidla (čeká), seed
`technologie`/`magicky-system` univerzálních škál. Tato kniha pro `matrix`
nahrazuje text-seed Pravidel a (dle otázky 3) nejspíš i `magicky-system`.
Label systému už přejmenován na **„Ikaros pravidla"**.
