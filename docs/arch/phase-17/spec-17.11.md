# Spec 17.11 — Pop-out karty tokenu do samostatného okna (druhý monitor)

**Stav:** NÁVRH — čeká schválení · **Priorita:** navazuje na 17.10 · **Náklad:** střední (FE; fázováno) · **Rozsah:** cesta „2 — věrná" (kompaktní karta vč. bestií + hody do mapy)

## Cíl
Hráč/PJ si otevře **kartu tokenu v samostatném okně prohlížeče** a přesune ji na **druhý monitor** — na hlavním vidí mapu, na druhém trvale svou postavu / statblok nestvůry. Nejde o drag uvnitř okna (to bylo 17.10 vyřazeno), ale o **skutečné OS okno** (`window.open`).

Karta v okně = **věrná kompaktní karta** (`TokenSystemSheet`), ne celý profil postavy. Hody z okna se propíšou **do mapy** (3D overlay + log).

## Proč to jde (ověřeno kódem, agent 2026-07-07)
- **Auth:** JWT je v `localStorage` (`ikaros.jwt`), same-origin sdílený mezi okny → **nové okno je automaticky přihlášené**. Žádný cookie/login problém.
- **Vzor pop-out existuje:** `VoiceKrcmaRoom.tsx:82-88` — `window.open('/…?popout=1', name, 'popup=yes,width,height')` + detekce `params.get('popout')`. Přímo použitelná šablona.
- **PC/NPC data z API dle slug:** combat panely i `DiaryTab` fetchují `useCharacterDiary(worldId, slug)` / `useCharacter(...)` → obsah karty lze poskládat **jen z URL** (`worldSlug` + `characterSlug`), nezávisle na paměti mapy.
- **Bestie ALE nemá slug ani URL** — data žijí jen ve snapshotu tokenu ve scéně (`token.systemStats/abilities/notes`). Nutný jiný klíč: `sceneId + tokenId` + fetch scény.
- **Nové okno = separátní document** — nesdílí React strom ani jotai atomy. Hody z okna → mapa proto potřebují cross-window kanál (**`BroadcastChannel`**).

## Architektura
1. **Nová route** `/svet/:worldSlug/karta-tokenu` (standalone, mimo `WorldLayout` chrome), parametrizovaná query:
   - PC/NPC: `?slug=<characterSlug>&system=<systemId>`
   - Bestie: `?scene=<sceneId>&token=<tokenId>` (data ze scény)
2. **Standalone page** `TokenCardPopoutPage` — načte data dle query (PC/NPC přes `useCharacter`/`useCharacterDiary`; bestie přes fetch scény → token snapshot) a vyrenderuje **stejný `TokenSystemSheet`** jako karta na mapě. Chrome okna minimální (jen karta, žádné menu/nav).
3. **Tlačítko „🔗 Otevřít v okně"** v hlavičce `TokenInfoPanel` (vedle 📌/🪟/✕) → `window.open(url, 'ikaros-token-<id>', 'popup=yes,width=460,height=800')`.
4. **Hody z okna → mapa:** `BroadcastChannel('ikaros-map-<worldId>')`. Pop-out okno `postMessage({type:'map-roll', payload})`, hlavní okno (mapa) poslouchá → `mapDice.roll(...)`. Fallback: když kanál není (starý prohlížeč), hod se pošle jen jako chat/log přes API (bez 3D overlay).

## Fáze (postupně, každá samostatně funkční)
- **P1 — PC/NPC karta v okně (bez hodů do mapy):** route + `TokenCardPopoutPage` (PC/NPC fetch dle slug) + tlačítko v hlavičce karty. Hody v okně fungují lokálně (API/log), ale zatím se **nepropíšou** do 3D overlaye mapy. **← MVP, největší hodnota pro hráče.**
- **P2 — bestie:** rozšířit page o `?scene&token` větev (fetch scény → token snapshot → `BestiePanelView`). Skrýt PJ-akce (Zamknout/Odstranit) v pop-out.
- **P3 — hody do mapy:** `BroadcastChannel` most okno↔mapa; hod z pop-out spustí 3D overlay + zapíše do map dice logu v hlavním okně.

## Otevřené otázky / rozhodnutí k potvrzení
1. **Chrome pop-out okna** — úplně holé (jen karta), nebo s tenkou lištou (jméno + zavřít)? *Návrh: tenká lišta s jménem, ať okno má identitu.*
2. **Víc oken naráz** — povolit pop-out víc karet současně (víc tokenů na víc monitorů)? *Návrh: ano, `window.open` name per token id.*
3. **Skin** — pop-out okno dědí motiv světa (ikaros) + deníkový skin karty? Musí si `ThemeProvider`/`DiarySkinScope` nastavit samo (nové okno nemá kontext). *Návrh: ano, standalone page obalí týmiž providery.*
4. **Mobil** — pop-out je desktop featura (druhý monitor). Na mobilu tlačítko skrýt, nebo nechat (otevře tab)? *Návrh: skrýt na ≤768px.*

## Rizika
- **Bestie bez URL** (P2) — nutný fetch celé scény jen kvůli jednomu tokenu; ověřit, že existuje endpoint scény dle id a že token snapshot stačí.
- **BroadcastChannel** (P3) — podpora OK v moderních prohlížečích; nutný fallback.
- **Skin/providery v novém okně** — standalone page musí sama sestavit `ThemeProvider` + `DiarySkinScope` + `WorldContext` (jinak karta bez motivu). Riziko duplicit; ověřit minimální set providerů.
- **Popup blocker** — `window.open` z user-gesture (klik) projde; jinak blokován. Tlačítko = klik → OK.

## Dokumentace po implementaci
`funkce` (pop-out karty), `napoveda` (jak dát kartu na druhý monitor), `mobil-desktop` (skrytí na mobilu), `chybovy-denik` (nálezy), roadmap 17.11.

## Nezahrnuto
Editace postavy z pop-out okna se zpětným zápisem do mapy nad rámec hodů (P3); pop-out jiných panelů (počasí, deník PJ) — jen karta tokenu.
