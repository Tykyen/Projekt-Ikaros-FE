# Spec 13.5 — Kompletní přepracování Nápovědy (`/ikaros/napoveda`)

**Status:** ✅ Realizováno (2026-06-06) — kompletně, všechny dávky 0–6. Sada bloků `components/`, 6 tabů, `media.ts` registr + `napoveda-screenshoty.md` manuál focení. Build/testy/lint:colors/mobil-desktop ✓.
**Rozsah:** FE only (`Projekt-ikaros-FE`). Žádné BE změny.
**Cíl uživatele:** současná nápověda je „hrozná" (ploché taby + odrážkové karty). Chceme **onboarding pro nového uživatele** — přehledné, graficky bohaté, vnořené rozevírací sekce, „plné obrázků, typů a návodů". Plný rozsah: projet **všechny** sekce.
**Souvisí:** skill `napoveda` (drží obsah v souladu), [spec-13.4](spec-13.4.md), [spec-3.6](../phase-3/spec-3.6.md) (původní HelpPage).

---

## 0. PRO TEBE, AGENTA V ČISTÉ SESSION (čti první)

Tenhle dokument je **samostatný** — nepotřebuješ předchozí konverzaci. Vše podstatné je tady + v repu.

**Závazný workflow (z `base.md`):** spec (tenhle) → impl. plán → souhlas uživatele → kód. Tj. **nezačínej kódit naslepo** — po přečtení napiš stručný impl. plán první dávky (viz §10) a nech ho odsouhlasit. Po každé grafické úpravě spusť skill `mobil-desktop`. Mluv česky.

**Tvrdá omezení projektu (jinak rozbiješ build/styl):**
- **FE NIKDY neformátuj prettierem** (projekt nemá prettier config → default double-quotes rozbije styl, obří diff). Formátuj `npx eslint --fix <soubory>`.
- **Tokeny only, žádné hardcoded barvy** — `npm run lint:colors`. Bílé/černé overlaye přes `color-mix(... var(--surface-x))` nebo `rgb(var(--white-rgb)/α)`, ne `rgba(0,0,0,…)`.
- **Testy:** vitest bez globals (explicitní importy `import { describe, it, expect, vi } from 'vitest'`), `fireEvent` (ne user-event, byť funguje). Spouštěj **`npm run test:run -- <cesta/adresář>`**, NE `npx vitest run` (flaky „failed to find current suite"; když to spadne s „no tests", re-run přes npm script / adresář).
- **Deploy gate:** před hotovo VŽDY `npm run build` (tsc -b + vite), ne jen `tsc --noEmit`.
- **Štítky stavu jen `✅ Funguje` / `🚧 Připravujeme`** — žádné jiné. Nedokumentuj nefunkční jako funkční.
- **Anonymní pohled** (stránka je veřejná i nepřihlášenému): „v profilu (po přihlášení)", ne „v tvém profilu".
- **Žádné interní termíny** v textu nápovědy (D-NNN dluhy, „spec 13.x", BE error kódy). Ty patří do `docs/`.
- **Nedokumentuj role bez reálného chování** jako plné — Korektor/Čtenář/Žadatel/Ikarus drž v poznámce „v přípravě" (viz skill `napoveda`).

**Jak ověřit výsledek (skill `verify`/`run`):** `npm run dev`, otevři `/ikaros/napoveda`, projdi taby + rozbal/sbal sekce na desktopu i v mobilním viewportu (375px).

---

## 1. Co je teď a co je špatně

Soubory: `src/features/ikaros/pages/HelpPage/`
- `HelpPage.tsx` — shell: 5 tabů (`start/stranky/ucet/role/faq`), `?sekce=` v URL, **přebujelý changelog v leadu** (lze zkrátit/přesunout).
- `helpers.ts` — `HELP_TABS`, `TAB_LABELS`.
- `HelpPage.module.css` — **už má dobrý token základ:** `statusPill(Ok/Soon)`, `pageItem`, `callout`, `roleCardGrid/roleCard` (+ role color tokeny `--role-world-*`, `--role-star-*`), `matrix` (permission matice se sticky 1. sloupcem), `faqItem` (`<details>/<summary>`), `tableWrap`. **Stav na tom, nepiš od nuly.**
- `sections/StartSection.tsx` — onboarding intro (odrážky).
- `sections/PagesSection.tsx` — ~50 `PageDoc` karet ve 4 skupinách (`Ikaros funguje/připravujeme`, `Světová vrstva funguje/připravujeme`). Plochý seznam.
- `sections/AccountSection.tsx` — podsekce profilu (`<h2>` bloky 1–7).
- `sections/RolesSection.tsx` — role karty + permission matice (globální + světové). **NEní rozevírací** — uživatel chce collapsible.
- `sections/FaqSection.tsx` — ~23 Q&A (`<details>`).
- `__tests__/HelpPage.spec.tsx` — krytí struktury.

**Bolesti:** ploché, dlouhé, bez hierarchie, bez vizuálních bloků, role se nedají sbalit, žádné obrázky/ilustrace, lead je nečitelný changelog. Reference kvality, kterou doháníme: starý Matrix `C:\Matrix\Matrix\frontend\src\pages\Ikaros\IkarosHelp.tsx` (vnořené harmoniky + bohaté bloky; má inline styly — my použijeme tokeny).

---

## 2. Design direction (charakter „příručka / manuál")

Žije uvnitř platformního skinu — barvy dědí z tokenů, audit řeší **strukturu, hierarchii a bloky**.

**Koncept:** *Rozcestník příručky.* Nahoře hero s úvodem a vstupními kartami, pod tím **vnořené rozevírací sekce**: top sekce → pod-sekce (nástroj) → bohatý obsah. Jeden vizuální jazyk napříč celou nápovědou.

**Princip rozevírání:** každá sekce i pod-sekce jde otevřít/zavřít nezávisle (ne „jen jedna otevřená"). Stav otevření drž v komponentě; volitelně klíčové sekce přes `?sekce=` deep-link. Použij `<details>/<summary>` jádro (jako `faqItem`) → a11y a klávesnice zdarma, `prefers-reduced-motion` respekt u animace rozbalení.

**Sada znovupoužitelných bloků** (anatomie — z toho stav komponenty v §5):
- **HelpAccordion / HelpSubAccordion** — `<details>` s hlavičkou: ikona (lucide) + titulek (`--font-display`, uppercase, letter-spacing) + volitelný `TagChip` + chevron (rotace na `[open]`). Tělo: `--surface-2` jemné, `border-left`/rámeček.
- **InfoCard** — ikona + nadpis + popis + barevný akcent (`border-left: 3px var(--akcent)`), reuse vizuálu `roleCard`. Pro „co nástroj umí" v kostce.
- **TagChip** — malý pill (audience/role): „Hráč + PJ", „Pouze PJ", „Vše". Reuse `roleCardBadge` / `statusPill` vzhledu; barva z role tokenu kde dává smysl.
- **TermGrid** — dvousloupcová mřížka pojem→popis (`pojem` `--text-strong`, `popis` muted). Pro výčty polí/parametrů.
- **CalloutBox** — varianty `tip` / `pozor` / `příklad`. Reuse `callout` (border-left akcent); `příklad` použij `--font-mono` blok. Ikona dle varianty.
- **PermissionTable** — reuse `matrix` (sticky 1. sloupec, ✓/—, drop-shadow check). Hlavička = role ikony (`WorldRoleIcon`).
- **StepList** — číslovaný návod „jak na to" (1→N), výrazná čísla v kroužku (akcent), krátký text na krok.
- **GlossaryItem** — pojem + jednovětné vysvětlení (pro slovníček nových termínů; odkaz do `docs/glossary/` NE — text je pro hráče).

**Ilustrace a screenshoty (požadavek (a) bloky + (c) ilustrace + budoucí foto):**
- **IllustrationSlot** — dekorativní obrázek (atmosféra) k hero/sekci. Bere `src` + `alt`; když `src` chybí → **nevykreslí se** (žádný rozbitý placeholder). Zdroj: existující theme/asset obrázky nebo `/public`.
- **ScreenshotSlot** — orámovaný blok s ikonou a popiskem „[screenshot: …]" + `caption`. Bere volitelný `src`: když je → ukáže obrázek s rámečkem a popiskem; když chybí → **elegantní prázdný stav** (dashed `--frame-border`, ikona obrazovky, text „Sem doplníme snímek: <caption>"). Cíl: uživatel později nafotí a jen doplní `src`. Placeholder musí vypadat **záměrně**, ne rozbitě.
- **Registr obrázků** — `src/features/ikaros/pages/HelpPage/media.ts` mapuje klíč → `{ src?, alt, caption }`. Sekce odkazují klíčem. Uživatel doplňuje fota na jednom místě.

**Motion:** staggered `fadeUp` reveal top sekcí při vstupu (animation-delay), chevron rotace, jemný hover lift na InfoCard. Vše `prefers-reduced-motion` respekt.

**Navigace top sekcí:** ponech horní **taby** (už fungují, `?sekce=`), na desktopu zvaž navíc **boční rejstřík** (sticky obsah) uvnitř dlouhých tabů (Svět). Mobil: jen taby + harmoniky (boční rejstřík skryt).

**Hledání (nice-to-have, ne blokující):** filtr pole nad obsahem, které schová nepasující pod-sekce (čistě klientské, podle titulku/textu). Když prázdné → „Nic nenalezeno".

---

## 3. Informační architektura (cílový strom — pokrýt VŠE)

Top taby (přejmenování + reorganizace; `helpers.ts`):

1. **Začni tady** (`start`) — hero (co je Ikaros, pro koho), `StepList` „První kroky" (registrace → profil → vstup do světa), „Orientace v rozhraní" (hlavička, zvonek/notifikace, hledání), **Slovníček** (PJ, svět, postava, AKJ, token, motiv…). IllustrationSlot v hero.

2. **Platforma** (`platforma`, dnes částečně `stranky`) — vnořená harmonika, Ikaros-level nástroje. Pod-sekce (z inventáře PagesSection „Ikaros"): Úvodník · Profil & Veřejný profil · Online indikátor · Přehled vesmírů · Pošta · Notifikační centrum (zvonek) · Hospoda (globální chat) · Rozcestí I.–III. · Diskuze · Články · Galerie · Akce (kalendář) · Novinky · Adresář uživatelů · Reset hesla · Správa platformy (`/admin`, jen admini) · Globální emoty (správa). Každá: InfoCard (co umí) + StepList (jak) + TagChip (kdo) + ScreenshotSlot + případně PermissionTable.

3. **Svět** (`svet`) — největší, vnořená harmonika (mirror staré „Světy"). Pod-sekce (z inventáře): Přehled světa · Role ve světě (krátce, detail v tabu Role) · Wiki Stránky (čtení + editor + index + správa) · Skupiny (Informace) · Pravidla/Magický systém/Technologie · Mapa vesmíru · **Mapy (atlas, 13.4)** · Taktická mapa (pod-pod-sekce: PC/NPC-Bestie/deníky/kostky/ping/efekty/mlha/iniciativa/scény/řízení — viz stará nápověda jako obsahový vzor) · Bestiář · Pavučina · Storyboard (scénáře) · Generátor počasí · Převodník měn · Obchod · Kalendář světa + Správa kalendářů · Časová osa · Chat světa (kanály/zprávy/akce/profily/kostky/hledání/uživatelé/sync) · Zvuky (jukebox) · Deník PJ · Hlavní lišta světa (12.2) · AKJ — zamčené záložky · Osobní výbava (batohy/inventář) · Nastavení světa. Každá nástrojová pod-sekce: InfoCard + StepList + TagChip + PermissionTable (Hráč/PomocnyPJ/PJ) + ScreenshotSlot.

4. **Role & oprávnění** (`role`) — **rozevírací** skupiny (uživatel to explicitně chce): „Globální role" (Superadmin/Admin/správci…) a „Světové role" (PJ/PomocnyPJ/Korektor/Hráč/Čtenář/Žadatel) → každá skupina = HelpAccordion s `roleCard` mřížkou + PermissionTable. Zachovat role color tokeny.

5. **Účet & profil** (`ucet`) — podsekce jako harmonika: Registrace/přihlášení · Přezdívka · E-mail · Heslo/reset · Avatar · Postava (rozcestí) · Smazání účtu (tombstone) · Přátelé/blokování. StepList u akcí.

6. **FAQ** (`faq`) — ponech `<details>` list, ale **seskup** do kategorií (Účet · Svět · Hra · Obecné) přes HelpSubAccordion. ~23 dotazů už existuje → migrovat.

> Pojmenování tabů a hranice sekcí může executor doladit; **podmínka: pokrýt všechny inventarizované položky** (viz §7) a nic „funkčního" nevynechat.

---

## 4. (vypuštěno — sloučeno do §2/§5)

## 5. Komponentová sada (soubory + props)

```
src/features/ikaros/pages/HelpPage/
├── HelpPage.tsx                      ← shell (taby, hero, ?sekce=); zeštíhlit lead
├── helpers.ts                        ← HELP_TABS (nové), TAB_LABELS
├── media.ts                          ← NOVÉ: registr obrázků/screenshotů (klíč → {src?,alt,caption})
├── HelpPage.module.css               ← rozšířit (stavět na existujícím)
├── components/                       ← NOVÉ: sada bloků
│   ├── HelpAccordion.tsx (+ Sub)     ← <details> wrapper, hlavička ikona+titulek+TagChip+chevron
│   ├── InfoCard.tsx
│   ├── TagChip.tsx
│   ├── TermGrid.tsx
│   ├── CalloutBox.tsx                ← variant: 'tip'|'pozor'|'priklad'
│   ├── StepList.tsx
│   ├── PermissionTable.tsx           ← wrapper nad .matrix (data-driven)
│   ├── ScreenshotSlot.tsx            ← src? → obrázek | prázdný stav
│   ├── IllustrationSlot.tsx          ← src? → obrázek | nic
│   └── *.module.css | sdílený HelpPage.module.css
└── sections/                         ← přepsat dle §3 na bloky + harmoniky
    ├── StartSection.tsx
    ├── PlatformSection.tsx           ← (z PagesSection „Ikaros")
    ├── WorldSection.tsx              ← (z PagesSection „Svět")
    ├── RolesSection.tsx              ← collapsible
    ├── AccountSection.tsx            ← harmonika
    └── FaqSection.tsx                ← seskupené
```

Props (orientačně, executor doladí typy):
- `HelpAccordion`: `{ id, icon, title, tag?, defaultOpen?, children }`. Reuse `faqItem` chevron mechaniku.
- `InfoCard`: `{ icon, title, accent?: roleKey|'accent', children }`.
- `TagChip`: `{ kind: 'hrac'|'pj'|'pjasst'|'vse'|'soon'|'ok', label }`.
- `TermGrid`: `{ items: { term, desc }[] }`.
- `CalloutBox`: `{ variant, title?, children }`.
- `StepList`: `{ steps: ReactNode[] }`.
- `PermissionTable`: `{ columns: {key,label,icon}[], rows: { action, allow: Record<colKey, boolean> }[] }`.
- `ScreenshotSlot`/`IllustrationSlot`: `{ media: keyof typeof MEDIA }` (klíč do `media.ts`).

CSS: rozšiř `HelpPage.module.css` o `helpAccordion*`, `infoCard*`, `tagChip*`, `termGrid*`, `stepList*`, `screenshotSlot*`, `illustration*`. Reuse `matrix*`, `roleCard*`, `callout`, `statusPill`. **Token-only.**

---

## 6. Obrázky / screenshoty — strategie

- `media.ts` = jediné místo se zdroji: `export const HELP_MEDIA = { 'svet.takticka-mapa': { src: undefined, alt: 'Taktická mapa', caption: 'Hex grid s tokeny a PJ panelem' }, ... } as const;`
- `ScreenshotSlot media="svet.takticka-mapa"` → když `src` undefined, vykreslí **záměrný prázdný stav** (dashed rámeček, ikona, „Sem doplníme snímek: {caption}"). Uživatel pak jen vyplní `src` (cesta do `/public/help/...` nebo CDN).
- Dekorativní `IllustrationSlot` bez `src` = nevykreslí nic (layout nesmí spadnout).
- **Připrav „manuál ke focení":** v `docs/` krátký seznam, které screenshoty kde chybí (klíče z `media.ts` bez `src`), ať uživatel ví, co nafotit. Lze generovat z `media.ts` nebo ručně.

---

## 7. Migrace obsahu (zdroj → kam) — pokrýt vše

| Zdroj (teď) | Kam (nově) |
|---|---|
| `PagesSection` 4 skupiny (~50 PageDoc) | rozdělit dle vrstvy: Ikaros → **Platforma**, Svět → **Svět**; každá PageDoc → pod-sekce s InfoCard+Steps+Tag+ScreenshotSlot |
| `RolesSection` karty + matice | **Role** — zabalit do collapsible skupin, zachovat role tokeny + matici |
| `AccountSection` `<h2>` 1–7 | **Účet** — harmonika |
| `FaqSection` ~23 Q&A | **FAQ** — seskupit do kategorií |
| `StartSection` | **Začni tady** — hero + StepList + slovníček |
| `HelpPage.tsx` lead (changelog) | zkrátit na 1–2 věty; „co je nového" případně malá sekce v Start |

Obsah neztrácet — text z PageDoc `what`/`who` přenes do InfoCard/TagChip; statusy `ok/soon` → `✅/🚧` (statusPill). Při psaní drž pravidla skillu `napoveda` (anonymní pohled, žádné interní termíny, jen ✅/🚧).

---

## 8. Akceptační kritéria

1. 6 tabů (Začni tady / Platforma / Svět / Role / Účet / FAQ), `?sekce=` deep-link funguje; lead zeštíhlen.
2. Vnořené rozevírací sekce — top i pod-sekce jdou nezávisle otevřít/zavřít; **Role jsou rozevírací**.
3. Sada bloků (HelpAccordion, InfoCard, TagChip, TermGrid, CalloutBox, StepList, PermissionTable, ScreenshotSlot, IllustrationSlot) hotová, token-only.
4. Pokryté **všechny** inventarizované položky (§7); nic funkčního nechybí; statusy ✅/🚧.
5. ScreenshotSlot bez `src` = záměrný prázdný stav (ne rozbitý); `media.ts` registr.
6. Responsivní (mobil 375 / tablet / desktop) — harmoniky i tabulky; `mobil-desktop` audit ✓.
7. `npm run build` ✓, `npx eslint` na dotčených ✓, `npm run lint:colors` bez nových nálezů, `npm run test:run` ✓.
8. Testy aktualizované/rozšířené (struktura tabů, render bloků, role collapsible, screenshot prázdný stav).
9. A11y: `<details>` klávesnice, chevron `aria`, kontrast tokenů; `prefers-reduced-motion`.

---

## 9. Test plán

- `HelpAccordion` — otevře/zavře, `defaultOpen`, `aria`.
- `ScreenshotSlot` — s `src` ukáže `img`, bez `src` ukáže prázdný stav s caption.
- `PermissionTable` — render řádků/sloupců, ✓/—.
- `RolesSection` — skupiny collapsible, role karty + matice renderují.
- `HelpPage` — 6 tabů, přepínání `?sekce=`, každý tab se vyrenderuje bez chyby.
- Smoke: každá sekce se vyrenderuje (žádný crash), žádný `[screenshot]` placeholder nevypadá rozbitě.

---

## 10. Plán realizace po dávkách (každá samostatně shippable)

> Po každé dávce: `eslint --fix` dotčených, `npm run test:run -- <dir>`, a u UI dávek `mobil-desktop`. Před koncem `npm run build`.

- **Dávka 0 — kostra & sada bloků:** `components/*` + CSS + `media.ts` + unit testy bloků. Žádná změna obsahu sekcí. (Etalon vzhledu — nech odsouhlasit.)
- **Dávka 1 — Role (pilot obsahu):** přepiš `RolesSection` na collapsible + bloky. (Uživatel ji jmenoval první.)
- **Dávka 2 — Začni tady:** hero + StepList + slovníček + lead zeštíhlení.
- **Dávka 3 — Svět:** největší; vnořené harmoniky všech světových nástrojů (vč. pod-pod-sekcí taktické mapy). Obsah migruj z PagesSection „Svět" + jako obsahový vzor použij starou nápovědu.
- **Dávka 4 — Platforma:** Ikaros-level nástroje.
- **Dávka 5 — Účet + FAQ:** harmonika účtu + seskupené FAQ.
- **Dávka 6 — dotažení:** boční rejstřík (desktop), volitelné hledání, „manuál ke focení" (seznam chybějících screenshotů), finální `mobil-desktop` + `build`.

---

## 11. Reference

- **Vzor kvality (obsah i členění):** `C:\Matrix\Matrix\frontend\src\pages\Ikaros\IkarosHelp.tsx` (+ `WorldSubSections`, `MapSubSections`, `ChatSubSections`). Inline styly NEkopíruj — převeď na tokeny.
- **Existující bloky k reuse:** `src/features/ikaros/pages/HelpPage/HelpPage.module.css` (matrix, roleCard, callout, statusPill, faqItem, tableWrap).
- **Sdílené UI:** `@/shared/ui` — `WorldRoleIcon`, `RoleStar`, `Tabs`, `KebabMenu`, `ImageLightbox`. Ikony `lucide-react`.
- **Pravidla obsahu:** skill `napoveda` (`.claude/skills/napoveda`).

> Po přečtení: napiš impl. plán Dávky 0 a nech odsouhlasit, pak začni kódit.
