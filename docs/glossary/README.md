# Slovníček pojmů Ikaros

Slovníček projektových pojmů — drží jednotný jazyk napříč kódem, dokumentací i komunikací.

Každý pojem = jeden soubor s frontmatterem (`name`, `aliases`, `category`, `related`, `status`).

**Statusy:**
- `stable` — definice prošla revizí, používá se.
- `draft` — kostra, čeká na revizi obsahu.
- `deprecated` — pojem vyřazen, nepoužívat (popis vysvětluje proč a co místo toho).

Nový pojem se přidává **přes skill `slovnicek`** — návrh → souhlas → zápis. Šablona: [_template.md](_template.md).

**Auto-připomínka:** Stop hook [`glossary-reminder.ps1`](../../.claude/hooks/glossary-reminder.ps1) hlídá, jestli se měnila funkčnost (`docs/funkce` / `docs/arch`) po poslední revizi slovníčku. Po revizi (přidání pojmu NEBO rozhodnutí, že netřeba) **touchni [`.reviewed`](.reviewed)** — tím se připomínka utiší do další změny funkčnosti.

---

## Kategorie

### architektura
Stack, providers, routing, error boundary, build, platformové workflow.

- [cooldown.md](cooldown.md) — časová pauza mezi opakováním akce
- [deletion-pending.md](deletion-pending.md) — 30denní hold smazaného účtu
- [dvoufazove-overeni.md](dvoufazove-overeni.md) — 2FA/TOTP druhý faktor + trusted device
- [reaktivace.md](reaktivace.md) — obnovení účtu v hold režimu
- [tisk.md](tisk.md) — window.print stránky/postavy/deníku (pilíř A exportu)
- [vyhledavani.md](vyhledavani.md) — fulltext (MeiliSearch) + sémantické (embedding) hledání
- [gdpr-export.md](gdpr-export.md) — export vlastních dat uživatele do JSON
- [self-healing.md](self-healing.md) — lazy-create chybějících subdoců postavy
- [cascade-delete.md](cascade-delete.md) — kaskádní úklid dat po smazání entity

### role-a-prava
Platformové i světové role, kdo co smí, hierarchie, oprávnění.

- [superadmin.md](superadmin.md) — nejvyšší globální role nad platformou
- [ikarus.md](ikarus.md) — globální role č. 9 (TBD, D-053)
- [globalni-role.md](globalni-role.md) — role nad celou platformou Ikaros
- [spravci-obsahu.md](spravci-obsahu.md) — globální role 10–12 (články/galerie/diskuze)
- [granular-permissions.md](granular-permissions.md) — jemné permission flagy
- [world-role.md](world-role.md) — role v rámci konkrétního světa
- [world-membership.md](world-membership.md) — uživatel × svět × role
- [zadatel.md](zadatel.md) — `WorldRole.Zadatel = 0` (uchazeč o vstup)
- [ctenar.md](ctenar.md) — `WorldRole.Ctenar = 1` (pasivní)
- [hrac.md](hrac.md) — `WorldRole.Hrac = 2` (aktivní hráč)
- [korektor.md](korektor.md) — `WorldRole.Korektor = 3` (redakce bez mazání)
- [pomocny-pj.md](pomocny-pj.md) — `WorldRole.PomocnyPJ = 4` (asistent PJ)
- [pan-jeskyne.md](pan-jeskyne.md) — `WorldRole.PJ = 5` (vede svět)
- [governance.md](governance.md) — R-20: autorita uvnitř světa = PJ, ne admin
- [akj-urovne.md](akj-urovne.md) — stupně utajení informací ve světě
- [akj-zalozka.md](akj-zalozka.md) — chráněná záložka na stránce (clearance/grant)
- [pristup-ke-strance.md](pristup-ke-strance.md) — gate viditelnosti stránky (OR podmínek)

### svet
Svět jako jednotka — dashboard, nastavení, navigace, obsah, společenství.

- [svet.md](svet.md) — instance hry / komunity uvnitř Ikaros
- [matrix-svet.md](matrix-svet.md) — speciální seed svět (Tyky)
- [world-dashboard.md](world-dashboard.md) — úvodní strana světa (3 sloupce)
- [soft-delete-sveta.md](soft-delete-sveta.md) — 30denní obnovovací okno smazaného světa
- [predani-sveta.md](predani-sveta.md) — změna vlastníka (PJ) světa
- [nastaveni-sveta.md](nastaveni-sveta.md) — `WorldSettings` (motiv, skupiny, měny, kalendáře…)
- [hlavni-lista.md](hlavni-lista.md) — konfigurovatelné menu světa (menu builder)
- [herni-system.md](herni-system.md) — RPG systém světa (`world.system`)
- [technologicka-uroven.md](technologicka-uroven.md) — žánrová škála techniky (TÚ 0–14)
- [zanr-sveta.md](zanr-sveta.md) — předvolba žánru světa (odvozuje motiv)
- [hero-image.md](hero-image.md) — hlavní obrázek s výřezem (focal point/zoom)
- [stranka.md](stranka.md) — jednotná obsahová entita `Page` (wiki/postavy/…)
- [typ-stranky.md](typ-stranky.md) — druh stránky (Lokace/Noviny/Postava/…)
- [sablona-stranky.md](sablona-stranky.md) — per-svět šablona atributové tabulky
- [matrix-rulebook-hub.md](matrix-rulebook-hub.md) — spojená Pravidla/Magie/Technologie (systém Matrix)
- [backlinks.md](backlinks.md) — „Odkazuje sem" (zpětné odkazy stránky)
- [novinky.md](novinky.md) — veřejná oznámení světa s komentáři
- [oblibena-stranka.md](oblibena-stranka.md) — osobní záložka stránky per svět

### chat
Chatový subsystém — kanály, konverzace, zprávy, presence.

- [kanal.md](kanal.md) — skupina konverzací (= `ChatGroup` v BE)
- [konverzace.md](konverzace.md) — jednotlivá místnost (= `ChatChannel` v BE)
- [propojeny-kanal.md](propojeny-kanal.md) — kanál navázaný na družinu (znak skupiny)
- [access-mode.md](access-mode.md) — přístupový režim konverzace
- [sepot.md](sepot.md) — soukromá zpráva uvnitř konverzace
- [presence-indikator.md](presence-indikator.md) — barevná tečka online stavu
- [neviditelny-mod.md](neviditelny-mod.md) — skrytí vlastního online stavu
- [pj-persona.md](pj-persona.md) — podpis vedení v chatu (unified „PJ" / individual)
- [npc-mod.md](npc-mod.md) — psaní zpráv „za NPC" (override jméno/avatar)
- [hospoda.md](hospoda.md) — platformový veřejný chat (Rozcestí)
- [vlastni-emote.md](vlastni-emote.md) — per-svět / globální obrázkové emoji

### tema-a-skin
Vzhledová vrstva — barvy, ornamenty, theme system.

- [skin.md](skin.md) — konkrétní vzhledová varianta
- [tema.md](tema.md) — vzhled jako systém (`data-theme`)
- [ornament.md](ornament.md) — dekorativní vrstva skinu
- [matrix-rain.md](matrix-rain.md) — animovaný déšť znaků (skin ikaros)
- [theme-overrides.md](theme-overrides.md) — custom CSS tokeny per-svět / per-uživatel
- [theme-adjust.md](theme-adjust.md) — a11y doladění (brightness/contrast/bgDim)

### ui
Layouty, komponenty, dlaždice, mobil/desktop chování.

- [dlazdice.md](dlazdice.md) — modulární blok v dashboardech
- [tombstone.md](tombstone.md) — vizuální stav smazaného účtu
- [zpracovat-tab.md](zpracovat-tab.md) — univerzální fronta žádostí
- [default-avatar.md](default-avatar.md) — fallback avatar (muž / žena / bytost)
- [sidebar.md](sidebar.md) — levý boční navigační panel (chat)
- [token-panel.md](token-panel.md) — boční panel detailu tokenu (dock/drag/overlay)
- [editor-obsahu.md](editor-obsahu.md) — rich-text editor (TipTap)
- [wikilink.md](wikilink.md) — vnitřní odkaz `[[…]]` přes LinkPicker
- [deep-link.md](deep-link.md) — URL parametr na entitu/stav
- [live-preview.md](live-preview.md) — živý náhled obsahu při editaci
- [lightbox.md](lightbox.md) — overlay prohlížeč obrázku se zoomem
- [breadcrumb.md](breadcrumb.md) — drobečková navigace

### herni-mechaniky
Herní logika — postavy, mapa, čas, příběh, ekonomika, nástroje hry.

*Postavy a bestiář:*
- [postava.md](postava.md) — jednotná entita `Character` / hráčská postava (PC)
- [npc.md](npc.md) — nehráčská postava vedená PJ
- [bestie.md](bestie.md) — katalogová šablona tvora/nepřítele
- [bestiar.md](bestiar.md) — katalog bestií (3 scope)
- [lokace.md](lokace.md) — stránka/Character typu místo (jen kalendář)
- [subdokument-postavy.md](subdokument-postavy.md) — 5 subdoců postavy (deník/kalendář/finance/výbava/poznámky)
- [denik-postavy.md](denik-postavy.md) — vyprávěcí deník + listina statů
- [staty-systemu.md](staty-systemu.md) — hodnoty dle herního systému (per-system schema)

*Taktická mapa:*
- [takticka-mapa.md](takticka-mapa.md) — PixiJS bojiště (tokeny/fog/efekty/iniciativa)
- [token.md](token.md) — herní figurka na mapě
- [token-panel.md](token-panel.md) — viz ui (panel detailu tokenu)
- [fog-of-war.md](fog-of-war.md) — mlha války (skryté oblasti)
- [iniciativa.md](iniciativa.md) — combat tracker, živé řazení bojovníků
- [efekt-na-mape.md](efekt-na-mape.md) — vizuální efekt (barva/exploze/bariéra)
- [mapova-scena.md](mapova-scena.md) — jedna scéna/bojiště (per-hráč přiřazení)
- [skryta-scena.md](skryta-scena.md) — scéna v přípravě (overlay „není připravena")
- [zamcena-scena.md](zamcena-scena.md) — viditelná, ale uzamčená pro pohyb
- [prirazeni-sceny.md](prirazeni-sceny.md) — navázání hráče na scénu (`currentSceneId`)
- [knihovna-map.md](knihovna-map.md) — per-PJ úložiště šablon scén
- [hexova-mrizka.md](hexova-mrizka.md) — axiální hex souřadnice (q, r)
- [operations-model.md](operations-model.md) — typované operace mapy + undo
- [ping.md](ping.md) — broadcast značka na mapě (double-tap)
- [spotlight.md](spotlight.md) — PJ „ukazováček" (ephemeral ring)

*Čas a příběh:*
- [kalendar-sveta.md](kalendar-sveta.md) — fantasy/historický kalendář světa
- [herni-cas.md](herni-cas.md) — aktuální in-game datum
- [sezona.md](sezona.md) — roční období v kalendáři
- [mesicni-faze.md](mesicni-faze.md) — fáze měsíce / nebeský stav
- [prestupny-rok.md](prestupny-rok.md) — volitelné pravidlo přestupných roků
- [casova-osa.md](casova-osa.md) — timeline historie světa
- [generator-pocasi.md](generator-pocasi.md) — počasí dle data/sezóny
- [pavucina.md](pavucina.md) — campaign graf vztahů NPC/frakcí
- [storyline.md](storyline.md) — příběhová linka v pavučině
- [storyboard.md](storyboard.md) — stromová struktura scénářů/scén
- [herni-akce.md](herni-akce.md) — nadcházející sezení s RSVP a komentáři

*Ekonomika:*
- [obchod.md](obchod.md) — herní obchod (položky, kategorie)
- [mena.md](mena.md) — platidlo světa (kód/symbol/kurz)
- [financni-ucet.md](financni-ucet.md) — peněžní účet postavy
- [nakup.md](nakup.md) — atomická transakce koupě (+ refund)

*Mapy, kostky a nástroje:*
- [vesmirna-mapa.md](vesmirna-mapa.md) — force-directed graf míst (universe)
- [obrazkovy-atlas.md](obrazkovy-atlas.md) — statická galerie obrázkových map
- [zvukova-databaze.md](zvukova-databaze.md) — YouTube ambient/SFX + nominace do globálu
- [dungeon-builder.md](dungeon-builder.md) — tile-based editor kobek (stub)
- [kostky.md](kostky.md) — sada kostek světa (dle systému)

---

## Abecední index

- [access-mode.md](access-mode.md) — přístupový režim konverzace (all / roles / members)
- [akj-urovne.md](akj-urovne.md) — stupně utajení informací ve světě
- [akj-zalozka.md](akj-zalozka.md) — chráněná záložka na stránce
- [backlinks.md](backlinks.md) — „Odkazuje sem" (zpětné odkazy)
- [bestiar.md](bestiar.md) — katalog bestií (3 scope)
- [bestie.md](bestie.md) — katalogová šablona tvora
- [breadcrumb.md](breadcrumb.md) — drobečková navigace
- [cascade-delete.md](cascade-delete.md) — kaskádní úklid po smazání
- [casova-osa.md](casova-osa.md) — timeline historie světa
- [cooldown.md](cooldown.md) — časová pauza mezi opakováním akce
- [ctenar.md](ctenar.md) — pasivní světová role
- [deep-link.md](deep-link.md) — URL parametr na entitu/stav
- [default-avatar.md](default-avatar.md) — fallback avatar
- [deletion-pending.md](deletion-pending.md) — 30denní hold smazaného účtu
- [denik-postavy.md](denik-postavy.md) — deník + listina statů postavy
- [dlazdice.md](dlazdice.md) — modulární blok v dashboardech
- [dungeon-builder.md](dungeon-builder.md) — tile-based editor kobek
- [dvoufazove-overeni.md](dvoufazove-overeni.md) — 2FA/TOTP + trusted device
- [editor-obsahu.md](editor-obsahu.md) — rich-text editor (TipTap)
- [efekt-na-mape.md](efekt-na-mape.md) — vizuální efekt na taktické mapě
- [financni-ucet.md](financni-ucet.md) — peněžní účet postavy
- [fog-of-war.md](fog-of-war.md) — mlha války na mapě
- [gdpr-export.md](gdpr-export.md) — export vlastních dat do JSON
- [generator-pocasi.md](generator-pocasi.md) — generátor počasí světa
- [globalni-role.md](globalni-role.md) — role nad celou platformou Ikaros
- [governance.md](governance.md) — R-20: autorita uvnitř světa = PJ
- [granular-permissions.md](granular-permissions.md) — jemné permission flagy
- [hero-image.md](hero-image.md) — hlavní obrázek s výřezem
- [herni-akce.md](herni-akce.md) — nadcházející sezení s RSVP
- [herni-cas.md](herni-cas.md) — aktuální in-game datum
- [herni-system.md](herni-system.md) — RPG systém světa
- [hexova-mrizka.md](hexova-mrizka.md) — axiální hex souřadnice
- [hlavni-lista.md](hlavni-lista.md) — menu builder světa
- [hospoda.md](hospoda.md) — platformový veřejný chat
- [hrac.md](hrac.md) — aktivní účastník hry ve světě
- [ikarus.md](ikarus.md) — globální role č. 9 (TBD)
- [iniciativa.md](iniciativa.md) — combat tracker na mapě
- [kalendar-sveta.md](kalendar-sveta.md) — kalendář světa (struktura času)
- [kanal.md](kanal.md) — skupina konverzací (`ChatGroup` v BE)
- [knihovna-map.md](knihovna-map.md) — úložiště šablon scén
- [konverzace.md](konverzace.md) — jednotlivá místnost (`ChatChannel` v BE)
- [korektor.md](korektor.md) — redakční světová role
- [kostky.md](kostky.md) — sada kostek světa
- [lightbox.md](lightbox.md) — overlay prohlížeč obrázku
- [live-preview.md](live-preview.md) — živý náhled při editaci
- [lokace.md](lokace.md) — stránka/Character typu místo
- [matrix-rain.md](matrix-rain.md) — animovaný déšť znaků (skin ikaros)
- [matrix-rulebook-hub.md](matrix-rulebook-hub.md) — spojená pravidla (systém Matrix)
- [matrix-svet.md](matrix-svet.md) — speciální seed svět
- [mapova-scena.md](mapova-scena.md) — jedna scéna/bojiště
- [mena.md](mena.md) — platidlo světa
- [mesicni-faze.md](mesicni-faze.md) — fáze měsíce / nebeský stav
- [nakup.md](nakup.md) — transakce koupě
- [nastaveni-sveta.md](nastaveni-sveta.md) — `WorldSettings`
- [neviditelny-mod.md](neviditelny-mod.md) — skrytí vlastního online stavu
- [novinky.md](novinky.md) — oznámení světa s komentáři
- [npc.md](npc.md) — nehráčská postava vedená PJ
- [npc-mod.md](npc-mod.md) — psaní zpráv „za NPC"
- [oblibena-stranka.md](oblibena-stranka.md) — osobní záložka stránky
- [obchod.md](obchod.md) — herní obchod
- [obrazkovy-atlas.md](obrazkovy-atlas.md) — galerie obrázkových map
- [operations-model.md](operations-model.md) — typované operace mapy + undo
- [ornament.md](ornament.md) — dekorativní vrstva skinu
- [pan-jeskyne.md](pan-jeskyne.md) — vede svět (PJ)
- [pavucina.md](pavucina.md) — campaign graf vztahů
- [ping.md](ping.md) — broadcast značka na mapě
- [pj-persona.md](pj-persona.md) — podpis vedení v chatu
- [pomocny-pj.md](pomocny-pj.md) — asistent PJ
- [postava.md](postava.md) — jednotná entita Character / PC
- [predani-sveta.md](predani-sveta.md) — předání vlastnictví světa
- [prestupny-rok.md](prestupny-rok.md) — pravidlo přestupných roků
- [presence-indikator.md](presence-indikator.md) — barevná tečka online stavu
- [prirazeni-sceny.md](prirazeni-sceny.md) — navázání hráče na scénu
- [pristup-ke-strance.md](pristup-ke-strance.md) — gate viditelnosti stránky
- [propojeny-kanal.md](propojeny-kanal.md) — kanál navázaný na družinu
- [reaktivace.md](reaktivace.md) — obnovení smazaného účtu
- [sablona-stranky.md](sablona-stranky.md) — šablona atributové tabulky
- [self-healing.md](self-healing.md) — lazy-create chybějících subdoců
- [sepot.md](sepot.md) — soukromá zpráva uvnitř konverzace
- [sezona.md](sezona.md) — roční období v kalendáři
- [sidebar.md](sidebar.md) — levý boční navigační panel
- [skin.md](skin.md) — konkrétní vzhledová varianta
- [skryta-scena.md](skryta-scena.md) — scéna v přípravě
- [soft-delete-sveta.md](soft-delete-sveta.md) — 30denní obnova smazaného světa
- [spotlight.md](spotlight.md) — PJ „ukazováček" na mapě
- [spravci-obsahu.md](spravci-obsahu.md) — globální role 10–12 (obsah)
- [staty-systemu.md](staty-systemu.md) — staty dle herního systému
- [storyboard.md](storyboard.md) — stromová struktura scénářů
- [storyline.md](storyline.md) — příběhová linka v pavučině
- [stranka.md](stranka.md) — obsahová entita Page
- [subdokument-postavy.md](subdokument-postavy.md) — 5 subdoců postavy
- [superadmin.md](superadmin.md) — nejvyšší globální role
- [svet.md](svet.md) — instance hry / komunity
- [takticka-mapa.md](takticka-mapa.md) — PixiJS bojiště
- [technologicka-uroven.md](technologicka-uroven.md) — škála techniky (TÚ)
- [tema.md](tema.md) — vzhled jako systém
- [theme-adjust.md](theme-adjust.md) — a11y doladění (brightness/contrast)
- [theme-overrides.md](theme-overrides.md) — custom CSS tokeny
- [tisk.md](tisk.md) — window.print stránky/postavy
- [token.md](token.md) — herní figurka na mapě
- [token-panel.md](token-panel.md) — panel detailu tokenu
- [tombstone.md](tombstone.md) — vizuální stav smazaného účtu
- [typ-stranky.md](typ-stranky.md) — druh stránky
- [vesmirna-mapa.md](vesmirna-mapa.md) — force-directed graf míst
- [vlastni-emote.md](vlastni-emote.md) — obrázkové emoji
- [vyhledavani.md](vyhledavani.md) — fulltext + sémantické hledání
- [wikilink.md](wikilink.md) — vnitřní odkaz `[[…]]`
- [world-dashboard.md](world-dashboard.md) — úvodní strana světa (3 sloupce)
- [world-membership.md](world-membership.md) — uživatel × svět × role
- [world-role.md](world-role.md) — role v rámci konkrétního světa
- [zadatel.md](zadatel.md) — uchazeč o vstup do světa
- [zamcena-scena.md](zamcena-scena.md) — uzamčená scéna pro pohyb
- [zanr-sveta.md](zanr-sveta.md) — předvolba žánru světa
- [zpracovat-tab.md](zpracovat-tab.md) — univerzální fronta žádostí
- [zvukova-databaze.md](zvukova-databaze.md) — YouTube ambient/SFX databáze
