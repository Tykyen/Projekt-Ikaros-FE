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

## Dodatek spec-26.8: cesty a návody jsou taky obsah

Registr od fáze 26 obsahuje i **cesty** (`registry/journeys/*.ts` — kroky s
replikami a done podmínkami) a **návody** (`registry/navody.ts` — 3–7 kroků
imperativem). Tabulka změna → akce pro ně platí stejně:

- Nová stránka/tlačítko v toku cesty → zkontroluj `cta.to`, `narratorLine`
  a done podmínku dotčených kroků (event payload/probe se mohly změnit).
- Změna UI labelu, který návod cituje → oprav krok návodu (návod cituje
  CÍLOVOU obrazovku doslovně).
- Nový netriviální modul → zvaž zápis do `netrivialniRouty.ts` — ale JEN
  pokud panel má pro routu header/topik („Provedu tě" nesmí vést do prázdna).
- Po každé změně registru spusť `npx vitest run src/shared/vypravec/registry`
  (CI validace: mrtvé routy, unikátní ID, topicId kroků) a u textů voice pass
  proti few-shotům v `docs/vypravec/02-persona-a-grafika.md` §2.
