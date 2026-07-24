# Spec 25.3 — Beta rámec: banner + očekávání + štítek

**Status:** ✅ Schváleno k implementaci (2026-07-24) — banner nese OBA odkazy (var. A)
**Rozsah:** FE only — malý (globální dismissable banner + centralizace štítku). **Žádný BE.**
**Repo:** `Projekt-ikaros-FE`, větev `main` (work-on-main)
**Velikost:** odhad ~6 souborů / ~250 ř.
**Autor:** PJ + Claude
**Datum:** 2026-07-24
**Souvisí:** roadmap3 §25.3 · spec-25.1 (kanál hlášení chyb — banner sem odkáže) · spec-26.3 (onboardingStore — persistence dismiss) · registry/changelog.ts (odkaz „Co je nového") · SystemLanding/flag.ts (vzor konstanty) · 25.5 ⑤ (rozšíření patičky — SAMOSTATNÁ karta, jen provázání)

---

## 1. Cíl

Přihlášený tester hned po loginu **jednou** uvidí rámec bety: co je beta, co smí být rozbité, kde se hlásí chyby, kde je changelog. Zavře → **už se nevrátí** (persistováno cross-device). Zároveň platforma nese **konzistentní štítek stavu** (dnes hardcoded „(beta)" jen v patičce) z jednoho zdroje pravdy, aby šel termín přepnout jednou konstantou.

**Proč (rešerše):** riziko rozdílného očekávání 60–75 % — web říká „beta", interně teprve certifikujeme (fáze 23–27 běží). Nekomunikovaný rozdíl = tester hlásí „nedodělek" jako vadu, nebo naopak čeká hotový produkt a odejde zklamaný. Banner + jednotný štítek to ohraničí předem.

---

## 2. Audit současného stavu

- **Žádný beta banner ani „po-loginu" oznámení neexistuje.** Slovo „beta" je hardcoded jen v [SiteFooter.tsx:22](../../../src/shared/ui/SiteFooter/SiteFooter.tsx#L22).
- **Vzory dismissable lišty:** [LastInfoBar.tsx](../../../src/features/world/components/LastInfoBar.tsx) (dismiss přes localStorage s verzí `updatedAt` — nová zpráva se ukáže znovu) · [InstallBanner.tsx](../../../src/features/pwa/InstallBanner.tsx) + [UpdateBanner.tsx](../../../src/features/pwa/UpdateBanner.tsx) (globální bannery mountnuté v [main.tsx:74-80](../../../src/app/main.tsx#L74-L80), mimo router).
- **Persistence cross-device (nejsilnější vzor):** [onboardingStore.ts](../../../src/shared/vypravec/state/onboardingStore.ts) — `dismissed: string[]` (ř. 40), `zavritTip(id)` idempotentní dismiss, localStorage-first (synchronní čtení → **žádný flash**) + debounced PATCH `/users/me/onboarding` (`$addToSet`, bezpečné napříč zařízeními, přežije reinstal). Init keyed on `userId` v [VypravecRoot.tsx:121-172](../../../src/shared/vypravec/ui/VypravecRoot.tsx#L121-L172) (řeší modálový login bez remountu).
- **Odkazy, na které banner míří:**
  - hlásit chyby (25.1 hotové) → globální event `window.dispatchEvent(new Event('vypravec:nahlasit-chybu'))`, handler [VypravecRoot.tsx:433-444](../../../src/shared/vypravec/ui/VypravecRoot.tsx#L433).
  - changelog → event `vypravec:otevrit` → pohled „Co je nového" ([VypravecPanel.tsx:843-865](../../../src/shared/vypravec/ui/VypravecPanel.tsx#L843)); registry [changelog.ts](../../../src/shared/vypravec/registry/changelog.ts).
- **Verze buildu** dostupná: `__APP_VERSION__` ([vite.config.ts:19](../../../vite.config.ts#L19)).

⚠️ **Nesrovnalost v roadmapě (k opravě mimo tuto kartu):** 25.3 píše „kde je changelog (25.4)", ale karta 25.4 je *Ukázkové světy*. Changelog reálně žije ve Vypravěči („Co je nového" + `lastSeenChangelog`). Banner odkazuje na Vypravěče; odkaz „(25.4)" je překlep.

---

## 3. Návrh řešení

### 3.1 Centralizace štítku stavu — `src/shared/config/betaStage.ts`

Jeden tiny modul (vzor `SystemLanding/flag.ts` — jen konstanta, žádný datový import → bundle budget):

```ts
// Stav platformy pro veřejné štítky. Přepnutí termínu = změna zde (+ bump BANNER_VERSION).
export const BETA_STAGE_LABEL = 'beta';        // rozhodnuto autorem 2026-07-24
export const BETA_STAGE_SHORT = 'beta';         // do patičky (sjednocuje dnešní „(beta)")
export const BETA_BANNER_VERSION = 'v1';        // bump ⇒ banner se ukáže znovu všem
```

- **Patička** [SiteFooter.tsx:22](../../../src/shared/ui/SiteFooter/SiteFooter.tsx#L22): hardcoded `(beta)` → `({BETA_STAGE_SHORT})`. Jediný zdroj pravdy pro termín.
- **Rozšíření renderu patičky** do WorldLayout + focus módů (25.5 ⑤) **není součástí 25.3** — jen po zavedení konstanty půjde udělat triviálně. Neděláme cizí kartu.

### 3.2 Komponenta `BetaBanner` — `src/features/beta/BetaBanner.tsx` (+ `.module.css`)

⚠️ **Odchylka od původního návrhu (rozhodnuto při implementaci):** místo `main.tsx` (fixed overlay) je banner **proužek ve flow pod hlavičkou v OBOU layoutech** ([IkarosLayout](../../../src/app/layout/IkarosLayout/IkarosLayout.tsx) za `</header>` · [WorldLayout](../../../src/app/layout/WorldLayout/WorldLayout.tsx) vedle `LastInfoBar`). Důvod: appka nemá jeden globální scroll (`<main>` scrolluje sám) → fixed overlay by překryl hlavičku. Proužek ve flow posune obsah a je konzistentní s `LastInfoBar`/`ShowcaseBar`. `.shell` obou layoutů je flex-column (`flex-shrink:0` header) → proužek navíc je bezpečný. Banner NENÍ gated `showRightPanel` → je vidět i v chat/admin/bestiar focus módech (na rozdíl od patičky).

- **Dismissable proužek pod hlavičkou**, viditelný na všech stránkách obou layoutů.
- **Podmínka zobrazení:** přihlášen (`isAuthenticatedAtom`) **AND** onboardingStore inicializován **AND** `!dismissed.includes('beta-banner:' + BETA_BANNER_VERSION)`. Anonym banner nevidí (má vlastní onboarding + patičkový štítek). Localstorage-first ⇒ žádný flash u vracejícího se.
- **Obsah** (jeden řádek na desktopu, wrap na mobilu):
  - text: „**{BETA_STAGE_LABEL}** — funkce se ladí a něco může být rozbité. Vaše data bereme vážně (denní zálohy)."
  - akce „**Našel jsem chybu**" → `dispatch('vypravec:nahlasit-chybu')`
  - akce „**Co je nového**" → `dispatch('vypravec:otevrit')` (nasměruje na changelog)
  - **X** „Rozumím, zavřít" → `zavritTip('beta-banner:' + BETA_BANNER_VERSION)` (idempotentní, BE-synced)
- **A11y:** `role="status"`, `aria-live="polite"`, X má `aria-label`; klávesnicově dostupné.
- **Layout:** proužek v normálním flow na vršku (ne fixed overlay — neodsekává obsah, po zavření nezabírá místo). Vizuál = decentní beta pruh v duchu `LastInfoBar`/`UpdateBanner`; ladí s aktivním motivem (barvy z tokenů, ne hardcoded). Finální vzhled projde `frontend-design` v impl. plánu + `mobil-desktop` po implementaci.

### 3.3 Verzování sdělení

Dismiss klíč nese `BETA_BANNER_VERSION` (vzor `LastInfoBar` s `updatedAt`). Až se rámec změní (např. přechod „testovací provoz" → „beta" s kohortou A, nebo nové důležité sdělení), bump `v1`→`v2` znovu ukáže banner **všem** — bez BE migrace.

---

## 4. Out of scope

- Rozšíření patičky do WorldLayout / focus módů → **25.5 ⑤**.
- Banner pro anonymní návštěvníky (mají onboarding „Začni tady" + patičku).
- Změna textů changelogu / hlášení chyb (hotové v 25.1 / registry).
- Server-řízený obsah banneru (dnes statický text v kódu; kdyby bylo potřeba měnit za běhu → budoucí, reuse `lastInfo` vzor).

---

## 5. Acceptance kritéria

1. ✅ Přihlášený s nezavřeným bannerem ho vidí na libovolné stránce (dashboard, svět, TM).
2. ✅ „Našel jsem chybu" otevře formulář hlášení (25.1); „Co je nového" otevře changelog.
3. ✅ X zavře banner; po reloadu i **na jiném zařízení** (stejný účet) je pryč (onboardingStore sync).
4. ✅ Anonym banner nevidí; žádný flash u vracejícího se uživatele.
5. ✅ Bump `BETA_BANNER_VERSION` ⇒ banner se objeví znovu i těm, co ho zavřeli.
6. ✅ Patička i banner nesou stejný termín z `betaStage.ts` (přepnutí = jedna konstanta).
7. ✅ Mobil i desktop (`mobil-desktop`); a11y `role="status"` + klávesnice.

---

## 6. Rozhodnutí autora (2026-07-24)

- **Termín štítku = „beta"** všude už teď (banner i patička), z konstanty `BETA_STAGE_LABEL`. Pozdější změna = 1 řádek.
- **Odkazy v banneru vedou na existující nástroje ve Vypravěči** (hlášení chyb 25.1, changelog) — banner je rozcestník + ohraničení očekávání, ne nová funkce.

Vše ostatní (umístění, persistence, verzování) navrženo výše.

---

**Po schválení specu napíšu implementační plán** (přesné file diffy, integrace s onboardingStore/subscribe, `frontend-design` vizuál) a teprve pak kód.
