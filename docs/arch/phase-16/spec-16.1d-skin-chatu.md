# Spec 16.1d — Skin chatu dle motivu světa (+ per-hráč override)

**Status:** ✅ **IMPLEMENTOVÁNO 2026-06-24** (schváleno + design audit + prototyp odsouhlasen). BE (pole `chatSkin` + whitelist na `/chat/appearance`) + FE (engine `useChatSkin`, aplikace na `WorldChatRoom`, selektor v `AppearancePopover`, atmosféra `chat-skins.css`). FE build zelený. **⚠️ BE čeká restart** (`feedback_be_restart_required`). Ornamenty = 1. pass (atmosféra plochy + chrome hlavičky); chat je plochý stream, ne bubliny → heavy ornamenty per prvek = volitelná vizuální iterace.
**Rozsah:** cross-stack — BE (1 pole + whitelist na existujícím endpointu) + FE (chat-skin engine, tokenizace chat chrome, 12 skin sad, selector v 🎨 paletce).
**Repo:** FE `Projekt-ikaros-FE` · BE `Projekt-ikaros`, commit na `main`.
**Autor:** PJ + Claude · **Datum:** 2026-06-24
**Souvisí:** roadmap2.md 16.1d · spec-16.2c (skiny **deníku** — paralelní, jiná osa) · `project_theme_root_ownership` · `feedback_theme_isolation` · `feedback_skin_originality` · 5.9b „Můj vzhled".

---

## 1. Cíl
Chat se vizuálně řídí **motivem světa** (žánrem). PJ zvolí motiv světa → propíše se do všech chatů (barvy + styl). Hráči, kterému to nesedí, dovolíme v 🎨 paletce **přebít skin svého chatu** vlastní volbou (jen jeho, jen v tomto světě). Doladění barvy/fontu/velikosti zprávy už existuje (6.2f) a zůstává.

## 2. Klíčové rozhodnutí — DVĚ nezávislé osy skinů (nemíchat)
- **Deník** = osa **herního systému** (matrix/drd/dnd…). Skiny deníku = 16.2c (`data-diary-skin`, 7 stylů scifi/fantasy/…). **Tato spec se ho NEDOTÝKÁ.** Vložený deník v chatu si drží svůj 16.2c skin.
- **Chat (chrome)** = osa **motivu světa**. Skin chatu = těchto 12 motivů (`data-chat-skin`). Týká se **bublin / railu / panelů / palety kanálů / hlaviček / fontů**, ne vloženého deníku.

## 3. Rozsah skinování (co se barví)
Chat **chrome**: bubliny zpráv, levý rail (seznam kanálů/konverzací), panely, hlavička konverzace, paleta barev kanálů (`--chat-group-1..12`), font chrome, volitelný ornament/textura per žánr. **NE** vložený deník postavy (ten je 16.2c).

## 4. Architektura

### 4.1 Proč nejde jen `data-theme` na chat (past) + co místo toho
`applyTheme` injektuje hodnoty motivu jako **inline `--theme-* vars na `:root`** pro JEDEN aktivní motiv. → **Nejde** jen dát chat subtree jiný `data-theme`: base tokeny na `:root` zůstanou světové.
**Řešení (REVIDOVÁNO 2026-06-24 — jednodušší než původní `--chat-*` refaktor):** Chat chrome **už čte `--theme-*` tokeny** (ověřeno: `--theme-surface/-surface-strong/-border-soft/-accent/-heading/-text-muted/-nav-active-bg`, `--font-display/-body` — přesně výstup `buildSkinVars`). `getTheme(skinId).vars` je **hotová sada týchž tokenů**. → Chat skin = **scoped přepsání `--theme-* na kontejneru chatu** (inline `style`), CSS cascade je vlije do celého chat subtree. **Žádný refaktor chat CSS** (40 modulů zůstává). Ornamenty (signature genre) navíc přes `[data-chat-skin]`.

### 4.2 Identita skinů = `ThemeId` (world-scope), jeden zdroj pravdy
- `data-chat-skin` hodnoty = existující `ThemeId` světových motivů (`listThemes('world')`): `ikaros, fantasy, dark-fantasy, vesmir, cyberpunk, steampunk, apokalypsa, horor, mystery, historie, moderni, western` (12). Žádný nový registr id — reuse `src/themes`.
- ⚠️ Pozor na záměnu: chat-skin `fantasy` (ThemeId) ≠ diary-skin `fantasy` (16.2c, jiný namespace).

### 4.3 Resolver — `useChatSkin(worldId)` (vzor `useDiarySkin`)
Efektivní skin chatu =
1. **override** člena `WorldMembership.chatSkin`, pokud je platný `ThemeId`; jinak
2. **efektivní motiv světa** = `preview?.themeId ?? membership.themeId(5.9b) ?? resolveWorldTheme(world).themeId` (stejná logika jako WorldLayout).

Vrací `{ skin, isExplicit, setSkin, isPending }`. Setter → endpoint (4.5) + optimistic update cache (vzor `useDiarySkin`). `chatSkin = null/undefined` = auto (dědí motiv světa); žádný zvlášť „auto" string.

### 4.4 Aplikace (na WorldChatRoom kontejner)
- **`data-chat-skin={skin}` vždy** (= efektivní skin) → hák pro ornamenty.
- **Inline `style = getTheme(skin).vars` JEN při explicitním overridu** (skin ≠ efektivní motiv světa). Default (bez overridu) = chat **dědí `:root`** (vč. 5.9b overrides + přesného vzhledu světa) → žádná duplikace, neztratí se členovy custom overrides. Override = plné přebarvení chatu na zvolený žánr.
- **Fonty:** override skin může mít font, který svět nenačetl → hook zavolá `loadThemeFonts(skinId)` (helper extrahovaný z `applyTheme`, jen `loadFont`, bez zápisu na `:root`).

### 4.5 BE (vzor `chatColor/chatFont`)
- **Pole** `WorldMembership.chatSkin?: string | null` (default `null` → auto).
- **Endpoint** — rozšířit existující `/worlds/:id/chat/appearance` (GET+PATCH, `useMembershipAppearance`) o `chatSkin`. **Whitelist = 12 `ThemeId`** (cizí string → 400 / ignorovat).
- ⚠️ `project_be_field_checklist` (schema · DTO · service · toEntity — začít od mapperu) · `feedback_be_restart_required` (po BE restart) · `feedback_no_mixed_be_fe_batch` (BE a FE ne v jedné dávce).

### 4.6 Bez refaktoru chat CSS (REVIDOVÁNO 2026-06-24)
Původní plán „refactor 40 chat modulů na `--chat-*`" je **zbytečný** — chat už čte `--theme-*`. Paleta+font skinu se vlije přes scoped přepis `--theme-*` na kontejneru (4.4). 40 modulů zůstává netknutých.

### 4.7 Ornamenty (jediná část, co potřebuje cílit DOM)
⚠️ Chat = **CSS moduly (hashované třídy)** → ornamenty (filigrán, hazard-tape, nýty…) nejdou cílit globálně přes `.bubble`. Řešení: gating uvnitř relevantních modulů přes ancestor atribut — `:global([data-chat-skin="cyberpunk"]) .header { … }`. Selektivně jen na pár prvků (hlavička konverzace, hlava railu, bublina, composer). Originální per skin (`feedback_skin_originality`).

## 5. Selector (UI)
V [`AppearancePopover`](../../src/features/world/chat/components/AppearancePopover.tsx) („Vzhled mé zprávy v tomto světě", 🎨) přidat sekci **„Vzhled chatu"**: seznam 12 motivů (emoji/název + barevný náhled) + „Automaticky (dle světa)" = reset na `null`. Klik = optimistic přepnutí (živý náhled bublin v popoveru). Uloží se přes stejný PATCH jako barva/font.

## 6. Fáze
- **F1 — BE:** pole `chatSkin` + whitelist 12 ThemeId na `/chat/appearance`. Restart. (samostatná dávka)
- **F2 — FE engine + Ikaros baseline:** `useChatSkin` hook, `data-chat-skin` aplikace, refactor chat chrome na `--chat-*`, **`[data-chat-skin="ikaros"]` jako referenční sada** (formalizace dnešního vzhledu do tokenů), selector v 🎨 paletce. → 1 skin funkční end-to-end.
- **F3 — zbylých 11 motivů:** Fantasy → Western. **Každý motiv rovnou naplno** (rozhodnuto 2026-06-24: kvalita > rychlost) — barvy + font + **originální ornamenty/textury** per žánr, ne fáze „barvy-napřed". Sdílený token základ; blízké žánry (cyberpunk≈vesmir, fantasy≈dark-fantasy) sdílí bázi, liší se ornamentem. Originální ornamenty per skin (`feedback_skin_originality`) — žádné sdílení/recyklace mezi motivy.
  - **✅ Fantasy (2026-06-25) — 1. F3 motiv HOTOVÝ.** Chrome (CSS-only, scoped `[data-chat-skin='fantasy']`): signature filigrán-vlnovka přes `mask`+token (hlavička `::after`, RP datum), iluminovaná iniciála `.title::first-letter`, rail filigrán marker, avatar prstence (NPC smaragd `--theme-accent-cyan`), whisper smaragd, composer filigrán rohy. **Souboj panel** = přemapování mapových `--map-ui-*` tokenů scoped na `.tabWrap` (combat portovaný z 16.1e mapy; mapa netknutá). **Zbývá:** fantasy chat modaly (sdílený `Modal` portáluje mimo `.room`). Vzory v `chybovy-denik/fe.md` (16.1d-F3) = předloha pro dark-fantasy→western.
  - **✅ Dark-fantasy (2026-06-25) — 2. F3 motiv HOTOVÝ** (replikace vzoru fantasy, záměrný protiklad: OSTRÉ/LOMENÉ/krvavé místo oblého/zlatého). Zubatá (zig-zag) krvavá nit hlavičky přes `mask`, blackletter krvavá drop-cap (Grenze Gotisch), RP datum = lomená linka s krvavou špičkou, rail zubaté ostří (`clip-path`), avatar = gotický štít (`radius` ne kruh) + krvavý prstenec (NPC ocel `--theme-accent-cyan`), krvavá kapka u jména (`.name::before clip-path`), whisper ocel, composer ostré rohy; souboj přemapování `--map-ui-*` na krvavou. Stejné DOM háčky jako fantasy. **Zbývá (jako fantasy):** modaly. Pozn.: avatar `clip-path` zavržen (ořezával portréty) → hranatý `radius`.
  - **✅ Vesmir (2026-06-25) — 3. F3 motiv HOTOVÝ** (čistý sci-fi holo-HUD; odliš od ikaros = chladný cyan NASA bez glitche, od fantasy = technický ne organický). Hlavička = rohový HUD bracket-tick (`.header::before` cyan L) + Orbitron uppercase titul (BEZ drop-capu), RP datum = HUD linky s koncovým L-tickem (mono uppercase), rail = HUD bracket marker, avatar = hranatý cyan HUD rámeček + inset glow (NPC modrá `--theme-accent-cyan`), jméno = HUD tick `▸` (`.name::before content`), whisper modrá, composer cyan bracket-ticky, telemetry mřížka (chat-skins.css); souboj přemapování `--map-ui-*` na cyan. **Zbývá (jako ost.):** modaly. Pozn.: avatar rohové ticky zavrženy (`.avatar overflow:hidden` by je ořízl) → cyan rámeček.
  - **✅ Cyberpunk (2026-06-25) — 4. F3 motiv HOTOVÝ** (corpo hazard; odliš od ikaros = industriální žlutá ne fialový neon, od vesmir = drsný ne čistý). Signature = **hazard-tape** (žluto-černé šrafy přes `repeating-linear-gradient` 45° na `transparent` = prosvítá tma, 0 hardcoded černé): hlavička horní okraj (rozšíření F2 `border-image`) + RP datum proužky + rail marker + composer spodek; **barcode strip** u jména (`.name::before repeating-linear-gradient` 90°), Chakra Petch uppercase titul, avatar industriální žlutý rámeček (NPC ocel), whisper ocel; souboj přemapování `--map-ui-*` na žlutou. **Zbývá (jako ost.):** modaly. Pozn.: ID tag `0x..` vynechán (vyžadoval by `.tsx`), barcode jako signature stačí.
  - **✅ Steampunk (2026-06-25) — 5. F3 motiv HOTOVÝ** (mosaz & ozubení; odliš od fantasy = mechanické nýty/kov ne oblé zlato, od cyberpunk = teplá viktoriánská mosaz ne neon). Signature = **nýty** (3D cvočky přes 4 `radial-gradient` pozadí na hlavičce/composeru, 0 DOM navíc) + **otáčející se ozubená kola** v RP divideru (gear přes `mask` SVG + rotace, `prefers-reduced-motion` safe) + **embossed bevel** (kovový reliéf přes `box-shadow`/`text-shadow`, tmavý díl z `color-mix(--bg-primary)` = 0 hardcoded černé); mosazný nýt u jména, avatar embossed rámeček (NPC patina), whisper patina; souboj přemapování `--map-ui-*` na mosaz. **Zbývá (jako ost.):** modaly. Pozn.: otáčející kolo v hlavičce vynecháno (nemá DOM háček) — nýty + embossed nesou signature; kolo jen v RP divideru (CSS mask).
  - **✅ Apokalypsa (2026-06-25) — 6. F3 motiv HOTOVÝ** (military stencil & rez; odliš od cyberpunk = vojenská zeleň+rez ne neon, od steampunk = zrezavělá drsnost ne leštěná mosaz). Signature = **duct-tape záplata** (`::before`/`::after` pseudo, khaki z `color-mix(--theme-text)` = 0 hardcoded šedé, pootočená+clip-path) + **stencil** (Oswald uppercase + stencil glyf `.name::before clip-path`) + **rezavé skvrny** (`radial-gradient` v rzi `--theme-accent-cyan`) + **dashed (trhané) okraje**; avatar military rám + dashed outline (NPC rez), trhaný rail marker, whisper rez; souboj přemapování `--map-ui-*`. **Zbývá (jako ost.):** modaly. Pozn.: LED kontrolka + číslo kanálu vynechány (DOM) — apokalypsa = statická drsnost bez animace (dle designu).
  - **✅ Horor (2026-06-25) — 7. F3 motiv HOTOVÝ** (viktoriánský sépiový okultismus; odliš od dark-fantasy = sépie/parchment, tlumený strach, organické ink-bleed ne krvavé ostré). Signature = **inkoustová kaňka** (clip-path organická skvrna u jména/RP/rail) + **ink-bleed** rozpité okraje (hlavička/composer přes `mask` vlnitý SVG) + **candle-flicker** iluminované iniciály (nepravidelný `text-shadow`, `prefers-reduced-motion` safe); avatar = vybledlá fotografie (`filter:sepia` + vinětace, NPC popel), whisper popel; souboj přemapování `--map-ui-*` na svíčkové zlato. **Zbývá (jako ost.):** modaly. Pozn.: crest svíčka vynechán (DOM) → candle-flicker přesunut na iniciálu.
  - **✅ Mystery (2026-06-25) — 8. F3 motiv HOTOVÝ** (noir detektivka; odliš od horor = vyšetřování/lampové jantar+modrošedá/déšť ne okultismus/sépie, analytický chlad). Signature = **redakční začerněné pruhy** (RP datum + `.name::before` jantarový blok) + **lampový úhel světla** (diagonální `linear-gradient` sheen na hlavičce/composeru) + dešťové streaky (chat-skins.css); avatar case-file (NPC modrošedá), Cinzel uppercase, whisper modrošedá; souboj přemapování `--map-ui-*`. **Zbývá (jako ost.):** modaly. Pozn.: case ID + motion (rain-streak/flicker) vynechány — statický noir (čitelnost dlouhého streamu).
  - **✅ Historie (2026-06-25) — 9. F3 motiv HOTOVÝ** (iluminovaný středověký rukopis; odliš od fantasy = rubrikace+drop-cap+oxblood, autentický středověk ne elfí filigrán/smaragd). Signature = **rumělková rubrikace** (oxblood `--theme-accent-cyan` linky/markery + zlatý lem) + **iluminovaná drop-cap** + **fleurony ❧** (RP datum + `.name::before content`); avatar iluminovaný zlatý rám + oxblood inset (NPC oxblood), Cormorant, whisper oxblood, composer rubrikační dvojrám; souboj přemapování `--map-ui-*`. **Zbývá (jako ost.):** modaly. Pozn.: vosková pečeť vynechána (`::before` by překrýval obsah hlavičky), motion žádný (klid skriptoria).
  - **✅ Moderni (2026-06-25) — 10. F3 motiv HOTOVÝ** (editorial magazín, ZÁMĚRNĚ klidný protipól; minimalismus = vzhled nese typografie Fraunces + whitespace, ne ornament). Signature = **jediná krátká terakotová vlasová linka** (hlavička `::after` zkrácená) + editorial kicker RP (mono uppercase mezi tenkými linkami) + **pull-quote** (`.content em` terakota větší) + čistá karta composeru (radius+stín); avatar čistý kruh (NPC šalvěj ring), whisper šalvěj bez podkladu, žádná značka u jména; souboj přemapování `--map-ui-*`. **Zbývá (jako ost.):** modaly. Pozn.: nejtěžší disciplína = restraint (odolat dekoraci); 0 DOM odchylek.
  - **✅ Western (2026-06-25) — 11. F3 motiv HOTOVÝ → F3 KOMPLETNÍ (11/11)** (wanted-poster letterpress; odliš od apokalypsa = spálená oranž/wood-type/šerifská hvězda ne military zeleň). Signature = **šerifská hvězda ★** (`.name::before` + rail `.item::before content`) + **provazový dělič** (RP `repeating-linear-gradient` 66° vinuté lano) + **wanted-poster dvojrám** (hlavička `double` border, avatar/composer border+outline) + Rye wood-type; whisper šalvěj; souboj přemapování `--map-ui-*`. Pozn.: WANTED kicker + crest hvězda vynechány (DOM). **Zbývá (jako ost.):** modaly.
  - **🎉 F3 KOMPLETNÍ 2026-06-25 — všech 11 motivů + Ikaros baseline = 12 chat skinů na profesionální úrovni.** Každý nese vlastní tvarový jazyk + signature ornament (ne přebarvený sdílený vzhled), všechny CSS-only scoped `[data-chat-skin]`, build+`mobil-desktop` ověřeno. **Společné zbývající:** chat modaly (Upravit kanál/skupinu — sdílený `Modal` portáluje mimo `.room`) + panel kostek (uživatel má vlastní nápad, odloženo).
  - **Followup (nezávislé na motivu): rámeček skupiny zpráv** — sdílený `MessageList`/`MessageItem` (`groupEnd` prop + per-item box, barva kanálu `--ch-accent`), baseline pro **všechny** skiny. Řeší splývání zpráv v plochém streamu.
- Po každé grafické vlně → `mobil-desktop`; po dokončení funkčnosti → `funkce` + `napoveda`.

## 7. Co NEděláme
- Žádný skin vloženého **deníku** v chatu (zůstává 16.2c osa systému).
- Žádné per-konverzace / per-postava skiny (jen per uživatel × svět).
- PJ „vynutit skin chatu všem" (override zakázat) = otevřená otázka, ne teď.
- Žádné globální `:root` zásahy (`feedback_theme_isolation` — vše scoped `[data-chat-skin]` uvnitř chatu).

## 8. Otevřené otázky
- ~~**Hloubka F3**~~ → **ROZHODNUTO 2026-06-24: každý motiv naplno** (barvy + font + ornamenty/textury), kvalita > rychlost.
- **Ikaros baseline:** formalizovat dnešní vzhled 1:1, nebo ho při té příležitosti i vizuálně povýšit?
- **Mapování ThemeId → label/emoji** v selectoru: vzít z theme registru (`theme.name`), emoji doplnit (registr motivů emoji nemá).
- Náhled v selectoru: barevný swatch stačí, nebo mini chat-bubble preview?
