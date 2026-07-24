# Spec 27.3 — Scope registr A/B/C + scope freeze

**Status:** Návrh → implementace (2026-07-24)
**Rozsah:** klasifikace viditelné šíře platformy do tříd A/B/C + FE „preview" badge (B) + flag mechanismus skrytí (C) + pravidlo scope-freeze do docs
**Repo:** `Projekt-ikaros-FE` (FE only)
**Náklad:** malý (dle roadmap3 karty 27.3)
**Autor:** PJ + Claude
**Datum:** 2026-07-24
**Souvisí:** 27.1 (zlaté cesty = definice A-core) · 25.6/25.8 (`SystemLanding/flag.ts` = vzor C) · 25.5 (první dojem) · `docs/funkce/` (zdroj klasifikace)

---

## 1. Cíl (rešerše)

Každá **viditelná** funkce (= má vstupní bod v UI: nav položka / dlaždice / route) je zařazena do jedné ze tří tříd:

| Třída | Význam | Mechanismus | Support |
|---|---|---|---|
| **A** | Beta core — certifikováno (zlaté cesty 27.1), jádro produktu | nic (default viditelné) | plný |
| **B** | Funguje, ale okrajové / hloubkové / méně vyzrálé → vidět s štítkem **„Preview"** | `<PreviewBadge>` u nav položky | best-effort |
| **C** | Experimentální / blokované / niche co mate nováčka → **skryté za feature flagem** | flag (`scope.ts`) → nav hide + route `flagGate` | žádný (default off) |

**Produktové pravidlo Etapy III (scope freeze):** *žádná nová velká doména, dokud A-scope není certifikovaný* (výjimky jen po diskuzi). Zapsáno do registru jako závazná hlavička.

**Cíl UX:** nový uživatel vidí z prvního kontaktu ~20–35 % méně šíře — **výběrem, ne mazáním**.

---

## 2. Klíčové rozhodnutí — scoped, ne destruktivní

Riziko naivního čtení cíle: „schovej modul flagem" vezme funkci i **existujícím PJ**, kteří ji ve svém světě používají → regrese, ne „výběr místo mazání".

**Dělení (odsouhlaseno):**

- **Platformová / first-contact šíře** (co vidí anon/nováček PŘED vstupem do světa) — sem míří většina B; C jen pro blokované/experimentální plochy.
- **In-world nástroje** (co PJ používá uvnitř světa) — **zůstávají A/B**. Skrývat je flagem = brát PJ funkce. C uvnitř světa se **nepoužívá** (žádná in-world plocha není v tomto zátahu C).

**Důsledek pro C:** v tomto FE zátahu **neschováváme nic hotového naslepo.** C mechanismus je plně implementovaný a napojený (nav hide + route gate), ale aktivní jen pro **RPG systémy** (už blokované licencí, 25.8). Přesun libovolné B položky do C = **jeden řádek** v `scope.ts` (přidat `id` do `HIDDEN_FEATURES`). Tvrdé skrytí konkrétní plochy (voice krčma, campy…) je **produktové rozhodnutí autora** — připraveno, čeká na pokyn.

---

## 3. Registr A/B/C (kódem ověřeno z navigace + `docs/funkce/`)

Zdroj: statická inventura nav (IkarosLayout `PRIMARY_NAV`/`CHAT_ROOMS`, WorldLayout `buildFullWorldNav`) + stavy z `docs/funkce/`. Lidsky čitelné zrcadlo → `docs/scope-registr.md`. SSOT pro badge/flag → `src/shared/scope/scope.ts`.

### 3.1 Platforma (IkarosLayout)

| Plocha | Route | Třída | Pozn. |
|---|---|---|---|
| Úvodník | `/` | **A** | vstupní bod |
| Vytvořit svět | `/ikaros/vytvorit-svet` | **A** | zlatá cesta ① start |
| Prozkoumat světy / Vesmíry | `/ikaros/vesmiry` | **A** | objevování |
| Putyka (hlavní chat) | `/chat` | **A** | core komunikace |
| Notifikace / Pošta / Profil / Přátelé | `/ikaros/{posta,profil,uzivatele}` | **A** | účet |
| Podporovatelé | `/ikaros/podporovatele` | **A** | monetizace (viditelné záměrně) |
| Nápověda / Podmínky / Soukromí / Kodex / Kontakt | patička | **A** | právní + pomoc |
| Administrace (Správa/Emoty/Chat správy) | `/admin*` | **A** | admin-only, není šíře nováčka |
| **Společná tvorba** (články/galerie/diskuze) | `/ikaros/tvorba` | **B** | komunitní obsah — okrajové pro nováčka |
| **Hledá se / Nábory** (LFG) | `/ikaros/nabory` | **B** | 19.3; niche |
| **Voice krčma** | `/chat/voice` | **B** | 17.6; realtime nestabilita → preview |
| **Fantasy / Mystery / Sci-fi camp** | `/chat/camp{,2,3}` | **B** | tematický RP; nižší priorita v betě |
| **RPG systémy** | `/ikaros/systemy` | **C** | blokované licencí (25.8, existující flag) |

### 3.2 Svět (WorldLayout — in-world nástroje)

| Nástroj | nav `id` | Třída | Pozn. |
|---|---|---|---|
| Chat světa | (chat) | **A** | zlatá cesta ② |
| Stránky / Pravidla / Skupiny | (esenciál) | **A** | neskrývatelné |
| Postavy / Moje postava | — | **A** | zlatá cesta ① |
| Akce (game-events) | `akce` | **A** | zlatá cesta ④ |
| Taktická mapa | `takticka-mapa` | **A** | zlatá cesta ③ |
| Bestiář | `bestiar` | **A** | zlatá cesta ③ |
| Deník PJ | `denik-pj` | **A** | core PJ nástroj |
| Novinky / Hráči / Nastavení | — | **A** | core |
| **Časová osa** | `timeline` | **B** | worldbuilding hloubka |
| **Kalendář** | `kalendar` | **B** | worldbuilding hloubka |
| **Pavučina** (graf vztahů) | `pavucina` | **B** | pokročilé |
| **Mapa vesmíru** (3D) | `mapa` | **B** | okrajové vs. taktická |
| **Atlas map** | `mapy` | **B** | 13.4 |
| **Obchod** | `obchod` | **B** | ekonomika |
| **Převodník měn** | `prevodnik-men` | **B** | ekonomika |
| **Storyboard** (scénáře) | `scenare` | **B** | PJ pokročilé |
| **Generátor počasí** | `pocasi` | **B** | okrajové |
| **Zvuková databáze** | `zvuky` | **B** | 13.3 |
| **Stavitel** (podzemí/města) | `dungeon-builder` | **B** | 21.3; supporter, pokročilé |

**Mimo registr (ne samostatná plocha):** Streamer overlay (17.9) = režim taktické mapy (query param), ne vstupní bod → není first-contact šíře; Magický systém / Technologie = seedovaná wiki (obsah, ne nástroj); Oblíbené = zkratky na obsah.

---

## 4. Implementace (FE)

### 4.1 SSOT — `src/shared/scope/scope.ts`
- `type ScopeTier = 'A' | 'B' | 'C'`
- `PREVIEW_FEATURES: ReadonlySet<string>` — klíče plochy B (world nav `id` + platform `navKey`/room `key`). Zdroj pravdy pro badge.
- `HIDDEN_FEATURES: ReadonlySet<string>` — klíče plochy C aktuálně skryté. `scope.ts` **nereexportuje** `SYSTEM_LANDINGS_PUBLIC` (ten zůstává ve `SystemLanding/flag.ts` kvůli bundle-splittingu), jen ho dokumentačně eviduje.
- `isPreview(key)`, `isHidden(key)` helpery.
- Komentář = odkaz na `docs/scope-registr.md` + freeze pravidlo + návod na přesun tieru.

### 4.2 `<PreviewBadge>` — `src/shared/ui/PreviewBadge/`
- Tenká vrstva nad existující `Badge` (`variant="warning"`, malá velikost). Reuse = konzistence + minimum kódu.
- Text „Preview", `title`/`aria-label` = „Funkce v betě — může se měnit, nižší priorita supportu."
- Responsivní: inline, nezalomí lištu (jen ikona ⚗/tečka na úzkém viewportu — `mobil-desktop`).

### 4.3 Zapojení B (preview badge)
- **Platforma:** `NavItemDef.preview?: boolean` → render `<PreviewBadge>` v `NavItem`. Přidat `preview: true` na `tvorba`. Nábory (`Hledá se →`) a chat místnosti (`voice`, `camp*`) dostanou badge v jejich renderu (odvozeno z `PREVIEW_FEATURES`).
- **Svět:** `NavNode.preview?: boolean` odvozeno z `PREVIEW_FEATURES.has(id)` v `buildFullWorldNav`; render badge v world nav (lišta + drawer).

### 4.4 Zapojení C (flag skrytí)
- Mechanismus = vzor 25.8: nav položka se nevykreslí, když `isHidden(key)`; route dostane `flagGate` loader (redirect `/`).
- **Aktivní C = RPG systémy** (přes existující `SYSTEM_LANDINGS_PUBLIC`, beze změny). `HIDDEN_FEATURES` obsahuje `'systemy'` jako evidenci.
- Nová skrytí = přidat `id` do `HIDDEN_FEATURES` + (u world nav) filtr už respektuje; u platform nav / route přidat gate dle vzoru.

### 4.5 Docs
- `docs/scope-registr.md` — lidsky čitelný registr (tabulka §3) + freeze pravidlo + odkaz na `scope.ts`.
- Vazba z `docs/funkce/00-prehled.md` (řádek do průřezových konceptů).

---

## 5. Out of scope (návrhy k pozdějšímu zvážení)
- **B2 — default-hide B nástrojů v novém světě** (reuse `hiddenNavItems`, BE seed) → skutečné „−20–35 % šíře" pro nový svět bez odebrání funkce. **BE zásah** → mimo tento FE zátah (fb_no_mixed_batch); doporučeno jako navazující karta.
- Tvrdé skrytí voice/campů (produktové rozhodnutí autora).
- Streamer overlay režim (query param, ne plocha).

---

## 6. Acceptance kritéria
1. ✅ Registr A/B/C v `docs/scope-registr.md` + freeze pravidlo, zdroj `docs/funkce/`.
2. ✅ SSOT `scope.ts` — `PREVIEW_FEATURES`/`HIDDEN_FEATURES` + helpery.
3. ✅ `<PreviewBadge>` reuse `Badge`; `mobil-desktop` na dotčené lišty.
4. ✅ B badge se renderuje u platform (tvorba/nábory/voice/campy) i world (11 nástrojů) položek.
5. ✅ C mechanismus napojený (nav hide + route gate); aktivní pro `systemy` beze změny chování.
6. ✅ Přesun tieru = 1 řádek v `scope.ts` (žádná regrese; nic hotového nezmizí).
7. ✅ tsc + eslint + vitest + build zelené; route-registry parita drží.
8. ✅ `funkce` (průřezový koncept scope registru) + `napoveda` (pokud se mění chování) + roadmap3 zaškrtnuto.

---

## 7. Riziko & rollback
| Riziko | Mitigace |
|---|---|
| Badge rozbije úzkou lištu (mobil) | inline, `mobil-desktop` review; degradace na ikonu ≤ malý viewport |
| Skrytí hotové funkce = regrese | vědomě neschováváme nic hotového; C aktivní jen pro už-blokované systémy |
| Registr zastará vs. kód | SSOT v `scope.ts`, docs = zrcadlo; přesun 1 řádek |

**Rollback:** vše aditivní (nový modul + badge + volitelný flag). Revert = odstranit `preview` props + `scope.ts` + PreviewBadge; C beze změny (systémy už byly za flagem).
