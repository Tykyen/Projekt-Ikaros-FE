# Spec 19.3 — LFG / Nábory (nástěnka náborů)

**Stav:** 🚧 rozpracováno · koncept odsouhlasen 2026-07-08, spec čeká na finální schválení
**Roadmapa:** [roadmap2.md](../../roadmap2.md) — 19.3 „LFG / nábory (objevování her a hráčů)"
**Návrh vzhledu:** [docs/navrhy/19.3-nabory-nastenka.html](../../navrhy/19.3-nabory-nastenka.html) (prototyp deska + typy lístku)

---

## 1. Účel

Lehké „hledám hru / hledám hráče" — veřejná **nástěnka náborů** na platformě. Řeší krok 5 trychtýře (prázdná platforma) a reálnou českou potřebu, kterou nikdo česky neřeší.

**Vstupní bod:** tlačítko **„Hledá se"** pod „Zobrazit vše →" v bloku přehledu světů (VESMÍRY) → vede na nástěnku `/ikaros/nabory`.

---

## 2. Model — dvě osy, každá řídí JINOU část (uživatel 2026-07-08)

> ⚠️ **Terminologická past.** „Motiv" má v projektu dvojí význam. Zde striktně:

| Část UI | Řídí | Osa | Odkud |
|---|---|---|---|
| **Lístek** (papírek) — tvar, jak je stavěný, **font I barva** | **motiv světa** | **12** | `getTheme(motiv).vars` aplikované **inline na lístek** + tvar `[data-nabor-motiv]` |
| **Deska / pozadí nástěnky** | **globální skin diváka** | 33 | `--theme-*` na `:root` (ThemeProvider), automaticky |

- **Motiv (12) = world-scope themes** (registry „krok 5.7", `scope: 'world'`): `ikaros`, `fantasy`, `dark-fantasy`, `vesmir` (=Sci-Fi), `cyberpunk`, `steampunk`, `apokalypsa` (=Post-apokalypsa), `horor`, `mystery`, `historie` (=Historický), `moderni` (=Současnost), `western`. **= přesně `world.themeId`.**
- **Klíč:** lístek je kompletně určen motivem světa (tvar + font + **barva**), NEzávisle na globálním skinu. Deska pod ním = globální skin diváka. Lístek „Dark Fantasy světa" je zelenočerný gotický v každém globálním skinu.
- **Mechanismus:** motiv = theme → lístek dostane `style={getTheme(nabor.motiv).vars}` (inline `--theme-*` přebijí `:root`) → barvy+fonty motivu. Tvar/ornament z `naborSkins.css` `[data-nabor-motiv='X'] [data-nabor-card]` (12 bloků, barvy čtou lokální `var(--theme-*)`). Deska čte `:root` `--theme-*` = globální skin.
- **Není to 12×33 ručních variant** — 12 tvarových bloků, barvy z inline motiv-vars. Vzor tvarů dle [bestieSkins.css](../../../src/features/world/bestiar/components/bestieSkins.css) (0 hardcoded barev — [[color_token_debt]]).
- ⚠️ **Font loading:** 12 motivů = 12 sad fontů; na nábor-stránce preload fontů všech přítomných motivů (polish, ne blokující kostru).

### Výběr motivu lístku (R3, R7 vyřešeno)
- **Hráč** (nábor „hledám hru") → **vybírá motiv** z 12 (picker při tvorbě).
- **PJ** (nábor „hledám hráče") → motiv = **`world.themeId`** propagovaného světa (auto; PJ smí přepsat pickerem). **R7 vyřešeno: svět už motiv má** (nastavení „Motiv světa" = `world.themeId`, [ThemeTab](../../../src/features/world/pages/WorldSettingsPage/tabs/ThemeTab.tsx)).

---

## 3. Entita `Nabor`

Vlastní entita (NE nadstavba nad Diskuze; z Diskuze se převezme jen vzor moderace).

| Pole | Typ | Pozn. |
|---|---|---|
| `id` | string | |
| `strana` | `'hledam-hru' \| 'hledam-hrace'` | určuje odznak + filtr |
| `motiv` | enum 12 | tvar lístku (viz §2) |
| `worldId?` | string | jen u `hledam-hrace`; ref na propagovaný svět |
| `title` | string | nadpis lístku |
| `body` | string | popis (krátký text) |
| `imageUrl?` | string | volitelný drobný obrázek (Cloudinary; kvóta 19.2) |
| `system?` | string | RPG systém; u PJ zdědí z `world.system` |
| `mode` | `'online' \| 'naживo'` | + volitelně místo (u naživo) |
| `place?` | string | město (u naживo) |
| `seatsTotal?` | number | jen `hledam-hrace` |
| `seatsTaken?` | number | jen `hledam-hrace`; obsazenost |
| `status` | `'open' \| 'closed' \| 'expired'` | „obsazeno" / expirace |
| `authorId`, `authorName` | string | + `authorIsDeleted?` (tombstone, [[world_soft_delete]]) |
| `createdAtUtc`, `expiresAtUtc` | string | auto-expirace (viz §6) |

---

## 4. Strana = odznak (ne tvar)

Rozhodnutí: strana `hledám hru / hledám hráče` je **odznak + barva + filtr**, NE samostatný tvar. Tvar je estetická volba (motiv), strana je datový fakt → svazovat = kombinatorický nesmysl.

---

## 5. Moderace + role

- **Zakládá:** Ikarus (každý přihlášený).
- **Maže / moderuje:** autor · **Správce diskuzí** · Admin · Superadmin (viz [[role_system]]; Správce diskuzí = globální role, platformový scope — sedí).
- **Nahlašování** inzerátu (napojit na 20.1). Schvalování (`isApproved` vzor z Diskuze) — 🔎 *rozhodnout: pre-moderace vs. post-moderace (nahlásit).* Doporučení: post-moderace (nábory chceme svižné), nahlášení → fronta správcům.

---

## 6. Životnost — expirace / obsazeno

⚠️ Bez životnosti se nástěnka zaplní mrtvými nábory. Proto:
- `expiresAtUtc` — auto-expirace (návrh: 30 dní; po expiraci `status='expired'`, skryté z výchozího filtru).
- Autor smí ručně **„Zavřít / obsazeno"** (`status='closed'`).
- `hledam-hrace`: při `seatsTaken >= seatsTotal` vizuál „plno" (neruší automaticky — PJ rozhodne).

---

## 7. Kontaktní smyčka — „Ozvat se"

Statický lístek nemá vlákna (na rozdíl od Diskuze). Tlačítko **„Ozvat se"** → napojení na existující zprávy/profil autora (DM). 🔎 *rozhodnout kanál:* přímá zpráva vs. lehká „žádost o připojení". Doporučení: DM (reuse existující messaging).

---

## 8. FE architektura

- **Route:** `/ikaros/nabory` (logged-in; analogicky Diskuze `requireAuth`), `/ikaros/nabory/nova` (tvorba).
- **Nástěnka (deska):** tokenová textura (`--bg-primary/-secondary` + `--theme-glow`), pinboard layout (columns), rozházené lístky.
- **Univerzální lístek (skeleton):** `NaborLístek` s `data-nabor-card`, `data-nabor-motiv`, `data-nabor-portrait` (stabilní selektory). Skeleton = strana(odznak) · nadpis · meta(systém/režim/místa) · popis · patička(autor+čas) · „Ozvat se". Prázdná pole skrývat.
- **Motivové skiny:** `naborSkins.css` (globální, NE module) — 12 bloků `[data-nabor-motiv='X'] [data-nabor-card] {…tvar+ornament…}`, barvy z `--theme-*`. **Vzor 1:1 dle [bestieSkins.css](../../../src/features/world/bestiar/components/bestieSkins.css).**
- **Filtr:** strana · systém · režim (client-side + BE query).
- **Tvorba:** `NaborNovaPage` / modal — picker motivu (hráč) nebo auto (PJ+svět), pole dle §3.
- **Vstup:** tlačítko „Hledá se" v komponentě přehledu světů.

## 9. BE (navazující sub-krok)

Nový modul `nabory` (vzor dle `discussions`): schema `Nabor`, DTO, service, controller, repository (toEntity whitelist — [[be_field_check]]), moderace gating, endpoints: `GET /nabory` (filtr+paginace), `POST /nabory`, `PATCH /nabory/:id` (status/edit), `DELETE /nabory/:id` (autor+moderátoři), `POST /nabory/:id/ozvat-se`. Po BE změně restart ([[fb_be_restart]]).

---

## 10. Rozhodnutí (schválena / navržena)

| # | Rozhodnutí | Stav |
|---|---|---|
| R1 | 12 motivových tvarů (parita bestiář), NE 4 | ✅ (uživatel 2026-07-08) |
| R2 | Motiv = tvar; barva = globální skin; nezávislé osy | ✅ |
| R3 | Hráč vybírá motiv; PJ = motiv světa (přepíše) | ✅ |
| R4 | Strana = odznak/barva, ne tvar | ✅ |
| R5 | Papír lístku tónovaný motivem (token-driven), ne fixní světlý | ✅ |
| R6 | Vlastní entita Nábor, moderace vzorem z Diskuze | ✅ |
| R7 | PJ dědí `world.themeId` (svět už motiv má, nastavení „Motiv světa") | ✅ |
| R10 | Lístek = motiv KOMPLETNĚ (tvar+font+barva) přes inline `getTheme(motiv).vars`; deska = globální skin | ✅ (uživatel 2026-07-08) |
| R8 | Pre- vs post-moderace | 🔎 návrh post |
| R9 | „Ozvat se" kanál (DM vs žádost) | 🔎 návrh DM |
| R11 | Systém = **canonical id z registru** (select), NE volný text | 🔎 návrh (§12) |
| R12 | Registry systémů+žánrů přesunout do `shared/rpg/`, konzumenti re-exportují | 🔎 návrh (§12) |
| R13 | Nová osa **žánr** (11 z registru); PJ dědí z `world.genre`, hráči volitelný | 🔎 návrh (§12) |
| R14 | Filtry systém+žánr **vždy viditelné** (z registru, ne z dat) | 🔎 návrh (§12) |
| R15 | Nábor **nemá „Vlastní" žánr** — jen 11 registry hodnot nebo prázdno | 🔎 návrh (§12) |

---

## 12. Sub-krok 19.3b — tříditelnost dle systému a žánru

**Podnět:** žádost testera 2026-07-16 („nábory by měly jít třídit i podle systémů či podle žánrů").

### 12.1 Proč to dnes nefunguje

| # | Problém | Místo |
|---|---|---|
| A | Filtr systému **existuje, ale je skrytý** — `{systems.length > 0 && …}`, nabídka se odvozuje z načtených náborů → na prázdné/řídké desce zmizí. Tester ho nikdy neviděl. | [NaboryPage.tsx:80](../../../src/features/ikaros/pages/NaboryPage.tsx#L80) |
| B | **Systém je volný text** (`<input placeholder="DrD, JaD, D&D 5e…">`), ale `pickWorld` do něj nalije `world.system` = **id** (`dnd5e`). PJ → „dnd5e", hráč → „D&D 5e", třetí → „DnD 5E" = **tři různé systémy ve filtru**. Filtr, který netrefí. | [NaborNovaPage.tsx:191](../../../src/features/ikaros/pages/NaborNovaPage.tsx#L191), [:42](../../../src/features/ikaros/pages/NaborNovaPage.tsx#L42) |
| C | **Žánr na náboru neexistuje** vůbec, ačkoliv svět ho má povinně (`world.genre`, 11 hodnot). | [types/index.ts:434](../../../src/shared/types/index.ts#L434), [genres.ts](../../../src/features/ikaros/pages/CreateWorldPage/constants/genres.ts) |

⚠️ **B není chybějící featura, ale rozbitá data.** Náprava je teď zadarmo (deska prázdná / řídká — ověřit `db.nabory.count()`), s každým dalším lístkem dráž.

### 12.2 Žánr ≠ motiv

Motiv lístku (12 tvarů) se s žánry (11) skoro kryje — **nesmí se sloučit**. Motiv je **vizuální osa** (hráč si vybírá volně, PJ smí přepsat); žánr je **datový fakt**. Filtrovat podle motivu = „chci horor" vrátí lístky podle toho, komu se líbil rámeček. Dvě osy, jako strana × motiv v §4.

### 12.3 Registr systémů — dnes 3 kopie (⚠️ nález)

| Zdroj | Id | Rozsah | Konzument |
|---|---|---|---|
| [`RPG_SYSTEMS`](../../../src/features/ikaros/pages/CreateWorldPage/constants/systems.ts) | **dlouhá** (`drd-plus`, `call-of-cthulhu`) | 14 + `vlastni` | wizard světa, nastavení světa |
| [`BESTIE_SYSTEMS`](../../../src/features/ikaros/bestiar/components/systems.ts) | **canonical** (`drdplus`, `coc`) | 14 + `generic` | komunitní bestiář (platformový katalog) |
| [`SYSTEM_ALIASES` / `resolveSystemId`](../../../src/features/world/systemId.ts) | most mezi nimi | — | diary/map/combat registry |

`resolveSystemId` je deklarovaná „jediná zdrojová pravda aliasů", ale **nabídky** jsou dvě. Nábor je platformový katalog jako komunitní bestiář → **canonical id** je správná osa. Vyrobit čtvrtou kopii pro nábory = past [[link_picker]].

**Návrh (R12):** `BESTIE_SYSTEMS`+`systemLabel` přesunout do `shared/rpg/systems.ts` jako `PLATFORM_SYSTEMS`; `GENRES`+`themeForGenre` do `shared/rpg/genres.ts`. Bestiář a `CreateWorldPage` **re-exportují** → nulová změna chování, žádný velký diff. `RPG_SYSTEMS` (dlouhá id) zůstává vlastnictvím wizardu — to je world-scope kontrakt s BE `SystemPresetsService`, nesahat.

### 12.4 Změny — FE

- **Entita** `Nabor`: `system?: string` = **canonical id** (`PLATFORM_SYSTEMS`), + nové `genre?: string` (label z `GENRES`).
- **Tvorba** ([NaborNovaPage](../../../src/features/ikaros/pages/NaborNovaPage.tsx)):
  - Systém: `<input>` → **`<select>`** z `PLATFORM_SYSTEMS`.
  - `pickWorld` ukládá **`resolveSystemId(world.system)`** (`drd-plus` → `drdplus`) — tím mizí drift B u kořene.
  - Žánr: nový `<select>` z 11 `GENRES` (**bez „Vlastní"**, R15). PJ dědí `world.genre`; pokud má svět custom žánr, dědění se nechytne → PJ vybere z 11 ručně. Povinný u `hledam-hrace` (svět žánr povinně má), volitelný u `hledam-hru`.
- **Deska** ([NaboryPage](../../../src/features/ikaros/pages/NaboryPage.tsx)):
  - Filtry systém + žánr **vždy viditelné**, plněné z registru (R14) — už nikdy nezmizí na prázdné desce.
  - Nabídku systémů zúžit na hodnoty **přítomné v datech**? **Ne** — prázdný výsledek je platná odpověď („nikdo teď nehraje CoC"), skrytá volba je matoucí. Zvážit jen odšednutí (`disabled`) prázdných.
  - Filtry se skládají **průnikem** (`filterNabory` už tak funguje, jen přibude `genre`).
- **Lístek** ([NaborListek](../../../src/features/ikaros/components/NaborListek.tsx)): meta zobrazí **label**, ne id (`systemLabel(n.system)`), + žánr.
- **Testy**: `nabory.spec.ts` — filtr žánru, průnik systém×žánr; parita `PLATFORM_SYSTEMS` × `resolveSystemId` (analog [registry.test.ts](../../../src/features/world/map-systems/__tests__/registry.test.ts)).

### 12.5 Změny — BE ([[be_field_check]], 4 místa)

- `nabor.schema.ts`: `@Prop() genre?: string`.
- `create-nabor.dto.ts` + `patch-nabor.dto.ts`: `genre?` s `@IsIn(GENRES)`; `system?` z volného `@IsString() @MaxLength(60)` → **`@IsIn(SYSTEM_IDS)`** (uzavře drift natvrdo).
- `repositories` `toEntity` whitelist: přidat `genre`.
- ~~`GET /nabory` query filtr: `system`, `genre`~~ → **ZAMÍTNUTO při implementaci** (2026-07-16). Důvod: nástěnka **potřebuje celý aktivní seznam** i po zafiltrování — jinak nepozná, které volby nemají jediný lístek (zešednutí, §12.4), a musela by na to druhý request nebo facety. Objem je desítky lístků, ne feed. Server-side filtr by tedy byl mrtvý kód, který FE nezavolá. Filtr zůstává client-side ve `filterNabory`; až nástěnka poroste přes ~stovky lístků, přijde na řadu paginace + facety **naráz** (budoucí rozšíření, NEevidováno jako dluh — trigger se signalizuje sám pomalým `GET /nabory`; smazáno z dluhy.md 2026-07-19, protože client-side je pro současné měřítko platné rozhodnutí, ne dluh).
- **Migrace — NEblokující** (korekce 2026-07-16): `@IsIn` je validace **vstupu**, ne čtení → staré volnotextové záznamy v DB přežijí a normálně se načtou; jen se nechytnou do filtru (najdou se fulltextem). Nové zápisy i patche jdou ze selectu, takže projdou. `db.nabory.count()` tedy není podmínkou nasazení — při nenulovém počtu dodat jednorázovou normalizaci přes `resolveSystemId` samostatně. **Restart BE** ([[fb_be_restart]]).
- ⚠️ **Enum na 2 místech** (FE `shared/rpg` + BE DTO) — stejná past jako [[theme_ids_dual]]; zmínit v komentáři obou.

### 12.6 Zamítnuté alternativy

- **Autocomplete nad volným textem** — sjednotí zápis jen u těch, kdo si vyberou z nabídky; drift se vrátí zadními vrátky.
- **Filtrovat podle motivu místo žánru** — viz §12.2, filtr by lhal.
- **Čtvrtá kopie registru v `features/ikaros/nabory`** — [[link_picker]].

### 12.7 Postup

1. 🚧 Spec (tato sekce) → **schválení**.
2. `shared/rpg/` (systems+genres) + re-exporty; build+testy zelené (čistý refaktor, 0 změn chování).
3. FE: entita, tvorba (2 selecty + `resolveSystemId`), deska (2 filtry), lístek (labely), testy.
4. BE: schema+DTO+toEntity+query, jest, **restart**.
5. `mobil-desktop` (filtrová lišta má nově 4 skupiny — riziko zalomení na mobilu) · `funkce` · `napoveda` · ruční commit.

---

## 11. Postup (bestiářský playbook pro motivy)

1. ✅ Návrh desky + typů lístku (HTML prototyp).
2. 🚧 Spec (tento dokument) → schválení.
3. Funkční kostra FE (skeleton lístek + nástěnka + filtr + tvorba + Ozvat se + vstup + entita/API kontrakt) — ověřit build+testy.
4. 12 motivů: per motiv **frontend-design návrh → uživatel vybere → impl do `naborSkins.css` → render-verify**. Zdroj pravdy log: `docs/nabor-motivy.md` (analog `docs/bestiar-motivy.md`).
5. BE modul `nabory` + restart.
6. `mobil-desktop` · `funkce` · `napoveda` · ruční commit.
