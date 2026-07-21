# 08 — Přestavba skill vrstvy pro Vypravěče

Stav: podklad · 2026-07-20 · Vazby: roadmap3 fáze 25.2 (obsah bety), 26.1–26.5 (Vypravěč/cesty), 28.2 (vyhodnocení bety) · Sousední podklady: [04-architektura.md](04-architektura.md) (registr, CI validace, telemetrie)

Účel: Vypravěč stojí na řetězu pravdy **kód → `docs/funkce/` → registr (`src/shared/vypravec/registry/`) → doručovací plochy**. Řetěz drží skill vrstva — bez ní registr zastará stejně jako dnes HelpPage (dluh D-048). Tento podklad definuje: (1) rozšíření skillu `funkce`, (2) kompletní nový text skillu `napoveda` (draft k odsouhlasení), (3) týdenní obsahovou směnu, (4) rename po betě, (5) souhru s ostatními skilly, (6) časovou osu platnosti.

---

## 1. Rozšíření skillu `funkce` — krok „vypiš dotčené topiky"

`funkce` zůstává beze změny účelu (hluboká kódem ověřená inventura). Přidává se **jeden krok** do sekce Postup — mezi dnešní krok 6 (datum snímku) a 7 (spuštění `napoveda`); dnešní 7→8, 8→9:

```markdown
7. **Vypiš dotčené topiky Vypravěče.** Každý topik registru nese `source: { kapitola }`
   — kotvu do kapitoly `docs/funkce/`, kterou jsi právě změnil. Najdi je:

   grep -rn "kapitola: '<NN>'" src/shared/vypravec/registry/

   (`source.kapitola` = jen dvouciferné číslo kapitoly, např. '13' — formát viz 04 §2)

   Výstup = seznam topic ID (+ routeHeaders/errorTopics odkazující na kapitolu),
   jejichž zdroj pravdy se posunul. Předej ho skillu `napoveda` jako vstup
   (ta rozhodne: update body / verifiedAt / status / audience).
   Složka `src/shared/vypravec/registry/` ještě neexistuje → krok přeskoč (před MVP-A).
```

Proč tady a ne v `napoveda`: `funkce` je jediné místo, které **ví, která kapitola se změnila** — grep v momentě změny je levnější a spolehlivější než zpětné hledání. `napoveda` pak nepracuje „z paměti", ale z konkrétního seznamu.

Do sekce „Vztah k `napoveda`" v hlavičce skillu se doplní věta: *`funkce` po každé změně předává seznam dotčených topiků (grep `source.kapitola`); `napoveda` bez tohoto seznamu nezná rozsah dopadu.*

---

## 2. Nový skill `napoveda` — kompletní draft SKILL.md

**K odsouhlasení. Do `.claude/skills/napoveda/SKILL.md` se zapíše až po schválení tohoto podkladu** — draft je navržený tak, aby fungoval ode dne schválení (přechodový režim), ne až od vzniku registru.

Klíčové vlastnosti draftu:
- **Tři režimy** dle stavu migrace (přechodový / dvojí / cílový) — skill se nasadí jednou a sám říká, co v které etapě dělat.
- **Tabulka změna → akce v registru** jako jádro (nahrazuje dnešní tabulku změna → sekce HelpPage, která se stává podřízenou).
- Zapracované opravy kritiky: pole `status` u topiku (poctivost u 🚧), koordinace s friendly-messaging (topik = 2. linie, ne konkurenční text), odkazy na `/ikaros/napoveda` do MVP-B jen holé, příp. `?sekce=X`; nikdy `&topik=` (deep-link kontrakt ještě neplatí), povinné doplňování kolizního whitelistu u nových „soustředěných" ploch.
- **Definition of done fáze: kód + `funkce` + topik + changelog** — tím base.md pokrývá Vypravěče bez další změny pravidel.

````markdown
---
name: napoveda
description: Udržuj obsah Vypravěče — registr src/shared/vypravec/registry/ (topiky, routeHeaders, errorTopics, changelog) a dočasně i HelpPage — v souladu se změnou funkčnosti. Spusť po dokončení implementace každé fáze/feature, VŽDY po skillu funkce, před commitem. Vstupem je seznam dotčených topiků od skillu funkce.
---

# Skill: napoveda (obsah Vypravěče + HelpPage)

Drží doručovanou nápovědu v souladu s realitou. Řetěz pravdy: kód → `docs/funkce/`
→ **registr `src/shared/vypravec/registry/`** → plochy (Vypravěč panel, HelpPage,
in-situ „?", empty-states). **Nové help texty vznikají VÝHRADNĚ v registru** — nikdy
hardcoded bublina/tooltip/text v komponentě (jinak vzniká šestý zdroj driftu).

## Režim skillu (zjisti PRVNÍ)

| Režim | Poznávací znak | Co udržuješ |
|---|---|---|
| PŘECHODOVÝ | `src/shared/vypravec/registry/` neexistuje | jen HelpPage (tabulka §HelpPage níže) |
| DVOJÍ | registr existuje, sekce HelpPage nemigrované | registr (primárně) + JSX nemigrovaných sekcí HelpPage |
| CÍLOVÝ | dotčená sekce HelpPage renderuje z registru | jen registr |

Režim se určuje **per dotčená sekce** — migrace jde kapitola po kapitole (nikdy big-bang).
Stav migrace: tabulka v `src/shared/vypravec/registry/MIGRACE.md` (zakládá se s registrem).

## Kdy spustit

Stejné spouštěče jako skill `funkce` (nová route · stub→funkční · změna chování ·
změna rolí/oprávnění · nový koncept · nový workflow) + navíc:
- **nový/změněný errorCode nebo friendly hláška** (403/404/409/429…),
- **nová „soustředěná" plocha** (fullscreen editor, composer, mapový režim),
- **změna kroků tutoriálové cesty** (journeys).

Nespouštěj při: refaktoring bez funkční změny · typo/CSS/theme · BE-only interní změna.
Vstup: seznam dotčených topiků od skillu `funkce` (grep `source.kapitola`).

## Tabulka změna → akce v registru

| Změna | Akce v `src/shared/vypravec/registry/` |
|---|---|
| Nová route/stránka | `routeHeaders.ts` nový RouteHeader (name+blurb+audienceNotes) + aspoň tenký topik v `topics/<oblast>.ts`; route musí být v typovaném route registru |
| Stub → funkční | topik: přepiš `body` na realitu, `status: 'stub'→'funkcni'` (nebo `'castecne'`), `verifiedAt` = dnes |
| Změna chování existující funkce | update `body` dotčených topiků + `verifiedAt` = dnes |
| Změna rolí/oprávnění | update `audience` (+ `minAudienceNote` pro role pod floorem); zkontroluj audience-sanity tabulku (parita s guardy) |
| Nový pojem/žargon | přidej do `tags` dotčených topiků (synonymický můstek pro fulltext); heslo slovníčku = v2 (skill `slovnicek`) |
| Nový errorCode / změna friendly hlášky | `errorTopics.ts`: mapování errorCode → topicId; topik = 2. linie „PROČ + co dál". Friendly hláška (rule friendly-messaging) = 1. linie a ZŮSTÁVÁ; obě znění nesmí protiřečit — zkontroluj proti FE/BE hlášce |
| User-facing změna (cokoli, co uživatel uvidí) | záznam do `changelog.ts` `{version, date, title, body, topicId?}`; nový/výrazně změněný topik dostane `since` (štítek „nové") |
| Rename/přesun route | update `routes`, `links.to`, `deepLink` všech dotčených topiků — CI test mrtvých odkazů to jinak shodí |
| Nová „soustředěná" plocha | doplň kolizní whitelist (pravidlo skrytí kotvy) — POVINNÉ, default při neznámé ploše = skrýt |
| Nový cíl navigace/kroku cesty | `anchors.ts` `{id, route, visibleFor?, mobileNote?, fallbackText}` + atribut `data-vypravec` v komponentě |
| Změna tutoriálové cesty | `journeys/*.ts` (kroky, DoneCondition, narratorLine — voice pass) |

## Pravidla psaní textů (voice pass)

- Hlas Ishida dle style-guide: tykání · proaktivní replika ≤ 200 znaků · topik 3–6 vět
  + akce · flavor max 1/8 · humor NIKDY v chybových stavech · žádné vykřičníky
  v instrukcích, zdrobněliny, guilt-trip.
- **Žádné tvrzení mimo zdrojovou kapitolu `docs/funkce/`** (pole `source` to kotví).
- `status` topiku odpovídá stavu v `docs/funkce/` (✅→'funkcni', 🚧→'castecne'/'stub')
  — Vypravěč u 🚧 říká pravdu, nepiš nedokončené jako funkční.
- Anonymní pohled: „v profilu (po přihlášení)", ne „v tvém profilu".
- Žádné interní termíny (D-NNN, spec §, BE error kódy) v textech pro hráče.
- Odkazy na plnou nápovědu: do zavedení deep-link kontraktu (MVP-B) jen holé
  `/ikaros/napoveda`, příp. `?sekce=X` (ta už dnes funguje); NIKDY `&topik=Y`
  před schválením kontraktu (07 §7.2).
- Barvy/UI netvoř — obsahový skill; UI změny řeší `frontend-design`/`mobil-desktop`.

## HelpPage — dočasná dvojí údržba (režim DVOJÍ)

Dokud dotčená sekce HelpPage nerenderuje z registru, propiš user-facing změnu i do JSX:

| Typ změny | Cíl v `src/features/ikaros/pages/HelpPage/` |
|---|---|
| Platformní stránka | `sections/PlatformSection.tsx` → `<Tool>` ve skupině |
| Světová stránka / taktická mapa | `sections/WorldSection.tsx` → `<Tool>` / `<MapFeature>` |
| Role/oprávnění | `sections/RolesSection.tsx` → `GLOBAL_/WORLD_CARDS` + tabulky (3 propojené — sync) |
| Profil | `sections/AccountSection.tsx` → `HelpAccordion` blok |
| Pojem/FAQ | `sections/FaqSection.tsx` (`FAQ` s `cat`) + slovníček v `StartSection` (`TermGrid`) |
| Screenshot | `media.ts` + `<ScreenshotSlot>` |

Vždy: reuse bloky z `components/` · štítky jen ✅/🚧 · aktualizuj „Aktualizováno k"
v `HelpPage.tsx`. Jakmile je sekce migrovaná (zápis v `MIGRACE.md`), JSX edit ODPADÁ
— edituje se jen registr. Nepřidávej tab bez souhlasu uživatele.

## Definition of done fáze

Fáze/feature NENÍ hotová bez: **kód + `funkce` + topik (registr) + changelog**.
Chybí-li kterákoli část, fáze se nezaškrtává v roadmapě.

## Postup

1. **Převezmi vstup** od skillu `funkce`: seznam dotčených topiků + typ změny.
   Bez seznamu (skill spuštěn samostatně) proveď grep `source.kapitola` sám.
2. **Klasifikuj** dle tabulky změna → akce; změn víc → jednu po druhé.
3. **Edituj registr** dle tabulky + pravidel psaní. U KAŽDÉHO dotčeného topiku
   nastav `verifiedAt` na dnešní datum (i když se text nemění a jen jsi ověřil platnost).
4. **Changelog** při každé user-facing změně.
5. **Režim DVOJÍ:** propiš do nemigrovaných sekcí HelpPage (tabulka výše).
6. **Verifikace:**
   ```bash
   npm run test:run -- src/shared/vypravec      # CI validace registru: unikátní ID, mrtvé odkazy, audience sanity, kotvy
   npm run test:run -- src/features/ikaros/pages/HelpPage   # jen pokud editována HelpPage
   npm run lint:colors
   ```
7. **Krátký report uživateli** — 1–2 věty: které topiky/sekce, jaká akce.

## Vazba na ostatní workflow

- **Vstup od `funkce`** (seznam dotčených topiků) — vždy až PO ní; `funkce` = pravda,
  `napoveda` = doručení.
- **Navazuje na `spec-driven-development`** Fázi 3 (po implementaci, se zaškrtnutím roadmapy).
- **`chybovy-denik`**: oprava obsahu/CI nezabrala 2× nebo cyklíš v migraci → CH-xxx;
  dokončená migrace sekce HelpPage → ✅ ŘEŠENÍ. Běžné obsahové edity NEzapisuj.
- Řeší kontinuálně dluh **D-048** (HelpPage content drift) — nemigrovaná sekce
  s driftem = záznam přes skill `dluh`.
- Čistě grafická změna (skin/theme) → NEspouštěj (řeší `mobil-desktop`/`frontend-design`).
````

---

## 3. Týdenní obsahová směna — přesný postup

Rituál 30 minut; **v betě 2× týdně** (po–čt), po betě 1× týdně. Ne skill, ale opakovaný úkol vlastníka + AI; skripty vznikají v MVP-A D10 (`stale` jako CI soft-report, `gaps` nad telemetrií).

| Krok | Co | Nástroj / výstup |
|---|---|---|
| 1 | **Stale report** — topiky, jejichž `verifiedAt` < git datum poslední změny `source.kapitola`; topiky, jejichž `status` nesedí na značky 🚧/✅ v `docs/funkce/` (grep kapitoly); route coverage (routy bez headeru/topiku) | `npm run vypravec:stale` → seznam topic ID + důvod |
| 2 | **Gaps report** — z telemetrické kolekce (TTL 90 dní): top `search_miss` dotazy, routy s `no_topic`, topiky s převahou 👎, nejčastěji zavírané tipy (`dismissed`) | `npm run vypravec:gaps` → žebříčky s počty |
| 3 | **Backlog směny** — sloučit 1+2, priorita: chybové topiky (uživatel v nouzi) → stale Tier 0 → gaps s nejvyšším počtem → coverage díry. Vzít jen co se vejde do 30 min; zbytek zůstává v reportu na příště | ruční výběr, max ~5 jednotek |
| 4 | **AI draft** — per jednotka: prompt = zdrojová kapitola `docs/funkce/` + šablona jednotky (TOPIK/NÁVOD/TIP/VYSVĚTLENÍ CHYBY) + style-guide s few-shoty; prompt ZAKAZUJE tvrzení mimo kapitolu | diff registru |
| 5 | **Voice pass** — kontrola proti style-guide (tykání, limity délky, flavor 1/8, žádný humor v chybách) | upravený diff |
| 6 | **Review + commit** — dev čte diff (nepíše), nastaví `verifiedAt`, spustí CI validace registru, commit | `npm run test:run -- src/shared/vypravec` |

Zásady: raději poctivý fallback než stub (žádné plošné AI stuby) · search_miss s < 2 výskyty ignorovat (šum malé kohorty) · nový topik vzniklý ze směny dostává `since` → štítek „nové" + volitelně řádek changelogu.

---

## 4. Rename `napoveda` → `vypravec-obsah` (po betě)

Doporučení SYNTÉZY (rozhodnutí 9): **teď jen nový obsah skillu pod starým jménem** (méně churn v pravidlech před betou), rename až po betě. Rename = 3 mechanické kroky:

1. `.claude/skills/napoveda/` → `.claude/skills/vypravec-obsah/` (přejmenovat složku, `name:` a `description:` ve frontmatter; obsah beze změny).
2. **base.md — jednořádková změna** (jediné místo, kde je jméno skillu v pravidlech):

```diff
-Změna funkčnosti (route · stub→funkční · chování · role/oprávnění · BE schopnost · dluh) → `funkce` (kódem ověřená inventura `docs/funkce/`, zdroj pravdy) + `napoveda` (hráčský výtah `/ikaros/napoveda`); měň oba.
+Změna funkčnosti (route · stub→funkční · chování · role/oprávnění · BE schopnost · dluh) → `funkce` (kódem ověřená inventura `docs/funkce/`, zdroj pravdy) + `vypravec-obsah` (registr Vypravěče + `/ikaros/napoveda`); měň oba.
```

3. Reference v `funkce` SKILL.md („Vztah k `napoveda`", krok 8) — sed `napoveda` → `vypravec-obsah`.

Proč po betě: v betě se pravidla nemění pod rukama (stejný důvod jako „design cest neměnit uprostřed vlny"); rename nenese žádnou funkční hodnotu, jen srozumitelnost názvu.

---

## 5. Souhra skillů — kdy který

Pořadí při změně funkčnosti (jeden průchod, před commitem):

```
spec-driven-development (Fáze 1–2: spec → souhlas → kód)
  → [chybovy-denik: jen když při implementaci nastala chyba/cyklení nebo netriviální řešení]
  → funkce        (pravda: docs/funkce/ + NOVĚ výpis dotčených topiků — §1)
  → napoveda      (doručení: registr + changelog + případně HelpPage JSX — §2)
  → spec-driven-development Fáze 3 (zaškrtnutí roadmapy; DoD = kód + funkce + topik + changelog)
```

| Skill | Role vůči Vypravěči | Kdy NE |
|---|---|---|
| `spec-driven-development` | Rámec každé fáze Vypravěče samotného (engine, panel, cesty) i každé feature, která pak generuje obsahovou práci | obsahová směna (§3) — ta nemá spec, jede podle šablon |
| `funkce` | Zdroj pravdy; jediný ví, co se změnilo → předává seznam topiků | grafické změny |
| `napoveda` (→ `vypravec-obsah`) | Doručení do registru + dočasně HelpPage; changelog | interní/BE-only změny bez dopadu na uživatele |
| `chybovy-denik` | (a) CH-xxx: CI validace registru padá opakovaně, oprava topiku nezabrala, cyklení při migraci sekce; (b) ✅ ŘEŠENÍ: dokončená migrace kapitoly HelpPage, netriviální oprava enginu/kotvy | běžné drafty směny, jednořádkové úpravy textů |
| `dluh` | Nemigrovaná sekce s objeveným driftem, odložená CI validace, chybějící kotva | — |
| `slovnicek` | v2: hesla slovníčku sdílená s `docs/glossary/` | MVP (tags v topicích stačí) |

Anti-kolizní pravidlo: **obsah topiků nikdy nevzniká ve skillu `funkce`** (ta jen ověřuje a ukazuje) a **fakta nikdy nevznikají ve skillu `napoveda`** (ta jen přepisuje ověřené do hlasu Ishidy). Poruší-li se směr, vzniká drift.

---

## 6. Časová osa platnosti

| Etapa | Platí |
|---|---|
| **HNED (od schválení podkladů)** | Schválení draftů §1+§2 → zápis do `.claude/skills/` (nový text `napoveda` funguje v PŘECHODOVÉM režimu — registr neexistuje, udržuje se HelpPage postaru; krok grep ve `funkce` se přeskakuje). Zákaz nových hardcoded help textů v komponentách platí okamžitě. |
| **MVP-A (D1: vznik registru)** | Režim DVOJÍ: registr primární, HelpPage sekundární; `MIGRACE.md` založen; krok grep ve `funkce` aktivní; DoD fáze = kód + funkce + topik + changelog; CI validace registru v `test:run`; odkazy jen holé `/ikaros/napoveda`, příp. `?sekce=X` — nikdy `&topik=`. |
| **MVP-B / start bety** | Deep-link kontrakt `?sekce&topik` schválen → parametrické odkazy hromadně; skripty `vypravec:stale` + `vypravec:gaps` plné (telemetrie teče) → **obsahová směna 2× týdně**; migrace vlny 1–2 (data-driven zdroje HelpPage) → první sekce v CÍLOVÉM režimu. |
| **Po betě** | Rename `napoveda` → `vypravec-obsah` + jednořádková změna base.md (§4); coverage hard-fail s viditelným allowlistem (čištěný ve směně); migrace HelpPage kapitola po kapitole (nejdřív FaqSection/RolesSection — už data-driven) → dvojí údržba postupně mizí; směna 1× týdně; staleness přes hash sekce = v3. |
