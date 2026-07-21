# Vypravěč — 03 Interakční model a UX povrchy

Stav: podklad · 2026-07-20 · Vazby: roadmap3 fáze 25.2 (Vypravěč MVP), 26.1–26.5 (cesty a návody), 26.4 (volba persony), 28.2 (vyhodnocení bety)
Sousedé: architektura enginu, registru a persistence → [04-architektura.md](04-architektura.md); obsah cest 26.1–26.3, milníky a metriky → podklad retenční vrstvy; hlas a grafika → podklad persony.

---

## 1. Kotva a povrchy

- **Jedna stabilní kotva:** `<VypravecRoot/>` mountnutý v `router.tsx` vedle IkarosLayout a WorldLayout. **NE** v pop-outu `/svet/:slug/karta-tokenu` (druhý monitor = pracovní plocha). Čte `useLocation` + `WorldContext` (worldId, world, isPJ, userRole, character) → scope + publikum bez nového fetche.
- **Vzhled kotvy:** fixed FAB pravý dolní roh; desktop 48 px avatar (mimo svět brand grafika, ve světě tokenizovaná silueta), mobil 44 px. Přesná geometrie a z-index → §2 (závazná politika).
- **Povrch po kliknutí:** desktop rohový panel 380 px × min(70vh) kotvený vpravo dole (otevře se PŘED pravým panelem IkarosLayoutu, nepřekrývá ho trvale); mobil bottom-sheet se 2 zarážkami (1/3 rychlé menu, 3/4 plný obsah). **Nikdy fullscreen; nikdy nepřekrývá prvek, o kterém právě mluví** — míří-li highlight do pravého dolního kvadrantu, panel se dočasně přemístí doleva (v2 polish; MVP: panel se při highlightu sbalí).

## 2. Obyvatelé pravého dolního rohu — inventura a kolizní politika (ZÁVAZNÉ)

Inventura fixed prvků ověřená v kódu (2026-07-20). Každý nový fixed prvek = povinná aktualizace této tabulky (stejné spec pravidlo jako whitelist kolizních ploch §5).

| Prvek (zdroj) | Geometrie / z-index | Kdy | Kolize s FAB | Politika |
|---|---|---|---|---|
| **WorldVoiceHost** (Jitsi 17.6; `voice/components/WorldVoiceHost.module.css .host`, mount WorldLayout.tsx:852) | fixed right:16 bottom:16; z 200; š. 320 (min 220, max calc(100vw−32px)); na TM `[data-docked]` = 1×1 px off-screen, zastupuje ho čip v liště | aktivní voice ve světě | **PŘÍMÁ — tatáž pozice**; voice call je core scénář, kdy hráč nápovědu potřebuje | Voice host ve viditelném stavu (ne `data-docked`) nastaví na `<html>` `--voice-host-h` (výška karty + 16 px mezera); FAB si ji vezme přes `--fab-shift` → vyskočí NAD kartu. Bez JS koordinátoru, vzor existujícího `--map-inset-right`. Posun voice karty zamítnut — zavedený UX kotvený v rohu. |
| **Sonner Toaster** (`app/main.tsx:65`) | fixed bottom-right (default offset 32/24 px); z ~999999999 — vždy nad vším | kdykoli, celá aplikace | přímá — toast pravidelně překryje kliknutí na FAB | Nastavit `<Toaster offset>` tak, aby toasty stackovaly NAD FAB: bottom-right offset ≈ 16+56+12 px. |
| **PWA InstallBanner** (`pwa/InstallBanner.module.css .banner`) | fixed bottom-center; š. min(100vw−2sp, 30rem); z `--z-toast`=500 | `beforeinstallprompt`, dokud nezavřen | na úzkém mobilu šířkou zasahuje do rohu | Banner se zapojí do bottom-stack kontraktu: při zobrazení na mobilu přičte svou výšku do `--fab-shift`. |
| **PWA UpdateBanner** (`pwa/UpdateBanner.module.css`) | fixed TOP-center; z 500 | nová verze SW | žádná | — |
| **DiceRollOverlay** (`dice/components/DiceRollOverlay.module.css`) | overlay inset:0 z 5000 pointer-events:none; readout bottom 22 %, z 10001, max-width 92vw | pár sekund při/po hodu | jen vizuální (z 10001 > FAB), neklikatelný | Neřešit — pointer-events:none, dočasné. |
| **DiceBox3D host** (`dice/components/DiceBox3D.module.css .host`) | fixed střed; min(52vw,560px)×min(56vh,520px); z 5000; PE none | během 3D hodu | žádná (roh nezasažen) | Neřešit. |
| **TokenInfoPanel dock** (TM deník; `token-panel/TokenInfoPanel.module.css .modeDock`) | fixed right:0, top:header, bottom:0 — celý pravý sloupec; šířku vystavuje jako `--map-inset-right` na `<html>` | TM s deníkem v dock režimu | zabírá celý pravý okraj vč. rohu | TM je kolizní plocha → FAB tam skryt (§5). Kdyby se v budoucnu zobrazoval, MUSÍ respektovat `--map-inset-right`. |
| **MapPjPanel flyout** (mobil; `pj-panel/MapPjPanel.module.css:344`) | fixed left/right/bottom:0; max-height 60vh — bottom sheet | TM mobil ≤768 px, otevřený PJ flyout | překryje celý spodek | Kryto skrytím FAB na TM. |
| **ThemeSwitcher** mobil bottom-sheet (`themes/ThemeSwitcher.module.css:181`) | fixed bottom:0 full-width; max-height 70vh | otevřený výběr motivu (mobil) | dočasný overlay | Smí FAB překrýt — žádoucí. |
| **WorldLayout / IkarosLayout mobilní drawery** (`WorldLayout.module.css:355`, `IkarosLayout.module.css:541`) | fixed top/bottom:0; width 280 px; z 301 | otevřené mobilní menu | dočasně překryjí pravý okraj | Žádoucí. Drawer navíc nese položku „Vypravěč" (§5 — mobilní náhradní vstup). |
| **YearScrubber drawer** (Timeline mobil; `YearScrubber.module.css:133`) | fixed right; width min(320px,88vw); z 1001 | otevřený rok-scrubber | dočasný | Žádoucí. |
| **MaintenanceOverlay** (`shared/ui/MaintenanceOverlay`) | fixed inset:0 fullscreen | režim údržby | irelevantní (překrývá vše) | Vypravěč reaguje replikou momentu 3c, ne soubojem o z-index. |
| **Theme decorations** (`themes/themes/*/decorations.css`, ~30 souborů) | fixed rohové/okrajové; PE none; nízký z | dle aktivního motivu | jen vizuální šum v rohu | FAB je překryje; při návrhu FAB/siluety počítat s ornamentem v rohu (kontrast přes tokeny). |
| **Modaly/backdropy/popovery** (Modal, Lightbox, KebabMenu, LinkPicker, EmojiPicker, PagePicker, drawery kalendáře…) | fullscreen scrim nebo kotvené; z 400–1100 | jen při otevření | dočasně překryjí FAB | Žádoucí chování, ne kolize. |
| **Cookie lišta** | NEEXISTUJE (grep: jen text PrivacyPage) | nikdy (zatím) | — | Až vznikne: bottom-center jako InstallBanner + povinné zapojení do bottom-stack kontraktu (`--fab-shift`). |

### 2.1 Kolizní politika (souhrn pravidel)

1. **FAB:** `position:fixed; right:16px; bottom:calc(16px + env(safe-area-inset-bottom) + var(--fab-shift, 0px)); z-index:190` — tj. POD WorldVoiceHost (200) i pod `--z-toast` (500). FAB je perzistentní prvek; **dočasné overlaye ho mají právo překrýt.**
2. **Bottom-stack kontrakt:** kdo obsadí spodek viewportu ve viditelném stavu (voice host, InstallBanner na mobilu, budoucí cookie lišta), přičte svou výšku + 16 px mezeru do `--fab-shift` na `<html>`. Čistě CSS proměnná, žádný JS koordinátor — ověřený vzor `--map-inset-right`.
3. **Sonner:** offset v `main.tsx`, toasty stackují nad FAB (viz tabulka).
4. **Taktická mapa:** FAB skryt (kolizní plocha §5); alternativa čipu v liště (jako voice) = v2, pokud testeři vstup na TM postrádají.
5. **DiceRollOverlay + dekorace motivů:** neřešit (pointer-events:none, dočasné).
6. **Guard:** nový fixed prvek bez zápisu sem = nález pro `dluh`; při neznámé kolizi default = FAB skrýt (§5).

## 3. Stavy kotvy (vizuální stavový automat)

| Stav | Vzhled | Kdy |
|---|---|---|
| Klid | statický avatar / silueta | default |
| Badge | tečka/číslo na kotvě | nevnucená čekající informace (nový krok, nepřečtený changelog) |
| Bublina | 1–2 věty + max 1 CTA u kotvy | jediná proaktivní forma (§4) |
| Mluví | otevřený panel; 2snímková idle animace (respektuje reduced-motion) | konverzace |
| Vede | kotva s mini-progress kroužkem (krok 3/5) | aktivní cesta |
| Spí | poloprůhledný, žádné bubliny/badge | režim „jen na zavolání" |

**Bubliny:** oslava auto-zmizí po 8 s; **proaktivní tip s CTA nemizí sám** — trvá do zavření nebo odchodu z routy (pomalý nováček ho dočte). Zavření 1 tapem; zavřené se **nikdy** neopakuje (persistováno per uživatel; pole `dismissed` merguje BE jako set-union, viz [04-architektura.md](04-architektura.md)).

## 4. Push/pull ústava (anti-Clippy, závazná)

Pull je default. Proaktivně smí Vypravěč promluvit jen ve 4 momentech (každý max 1×, persistováno):

1. **Post-registrace** — jediné auto-otevření panelu vůbec: volba persony (26.4), přeskočitelná 1 klikem.
2. **První vstup do sekce** z whitelistu ~12 netriviálních rout (TM, pavučina, kalendář, počasí, chat světa, obchod, tvorba…): bublina „Poprvé tady? Provedu tě." [Ukaž mi to] [Teď ne].
3. **Detekovaný zákys:** (a) empty state (`vypravec.reportEmpty(key)`), (b) 2× stejná chyba za session (interceptor počítá code+route → topik z chybové mapy), (c) MaintenanceOverlay → uklidňující replika.
4. **Milník cesty** — krátká oslava.

**Zakázáno vždy:** promluvit při aktivním vstupu (otevřený editor/composer, drag na mapě, focus v inputu), fullscreen overlay, opakovat zavřené, radit k akci v done-logu, časové/poziční triggery (jen behaviorální).

### 4.1 Auto-tichý režim (upřesnění)

3 po sobě zavřené bubliny bez interakce → auto-tichý režim + jednorázové ohlášení („Nebudu rušit. Kdybys mě potřeboval, víš, kde mě najdeš."), snadné znovu-zapnutí z panelu. Závazná upřesnění:

- **Tlumí JEN proaktivní bubliny a badge** (momenty 2 a 3). **Aktivní cesta běží dál beze změny** — lišta kroku i mini-progress kroužek zůstávají (cesta je explicitně vyžádaná, není proaktivita); uživatel uprostřed cesty nesmí ztratit vedení kvůli třem nesouvisejícím tipům.
- **Do čítače 3 zavření se počítají jen tipy momentů 2 a 3.** Oslavy (moment 4), repliky vyžádané klikem a bublina „Pokračujeme u kroku 4?" se nepočítají.

## 5. Kolizní plochy — pravidlo skrytí

Na kolizních plochách se kotva **skryje úplně** („raději neviditelný než překážející"): chat composery (Putyka, chat světa), taktická mapa, otevřený PageEditor, otevřená klávesnice na mobilu. Lišta aktivní cesty se sbalí do minimalizovaného proužku (definice §8.3); completion eventy běží dál, oslava se doručí až mimo kolizní plochu.

**Náhradní vstupy — po fázích (oprava nekonzistence §3.4 vs. §9 syntézy):**

| Fáze | Desktop | Mobil |
|---|---|---|
| **MVP-A** (před vlnou 1) | „?" (WorldHelpButton) = **přiznaný LEGACY vstup** — renderuje STARÝ obsah in-situ helpů, ne topiky registru; + zkratka Shift+V | Shift+V neexistuje → **položka „Vypravěč" v existujících mobilních drawerech** (WorldLayout drawer, IkarosLayout drawer) — vždy dostupná, otevře bottom-sheet. Kolizní plochy tak nejsou slepé místo ani v MVP-A. |
| **MVP-B** (první dny bety) | „?" po wrapu in-situ helpů renderuje **tytéž topiky registru** (parita; mapping test audience) | drawer položka zůstává (trvalý vstup, ne dočasná berlička) |

**Spec pravidlo:** každá nová „soustředěná" plocha (např. 17.10 workspace) se do whitelistu kolizních ploch doplňuje povinně; default při neznámé kolizi = skrýt. Migrace kotvy do hlavičky = až v2, pokud ji testeři budou postrádat.

## 6. Mobil vs. desktop

- Mobil: bottom-sheet; při navigaci s highlightem se sheet zavře, zůstane tenký proužek s replikou dole (highlight nesmí být pod sheetem). Touch targety 44 px. Otevřená klávesnice = kolizní plocha (bubliny zakázány, FAB skryt).
- Desktop: panel + highlight koexistují; tutoriálová lišta plovoucí dole.
- Responsivita se ověřuje staticky (CSS review: media queries, overflow, min-width) + živé screenshoty od vlastníka dle pravidel projektu.

## 7. Přístupnost

- Kotva `<button aria-label="Vypravěč — nápověda a průvodce">`, dosažitelná Tabem; zkratka **Shift+V** (před implementací ověřit kolize — f/e/Ctrl+K obsazené v PageVieweru), Esc zavírá, focus trap v panelu, po zavření focus zpět na vyvolávač.
- Bubliny `role="status"` (aria-live polite, nikdy assertive); panel `role="dialog" aria-labelledby`.
- Highlight má vždy **slovní ekvivalent**: lišta/panel obsahuje textový popis cesty („Nastavení → tab Členové") — screen-reader dostane rovnocennou navigaci; cílový prvek dočasně `aria-description`.
- `prefers-reduced-motion`: statický 2px obrys místo pulzu, žádná idle animace, sheet bez spring.
- Barvy výhradně tokeny motivu + overlay vzor `rgb(var/α)` — žádné pevné barvy (lint:colors); Vypravěč nikdy nesahá na `:root`.

## 8. Tři režimy

### 8.1 NÁPOVĚDA (pull — „kde jsem, co tu smím")

Panel má 3 bloky shora dolů:

**A) Kontextová hlavička „Kde jsem"** — šablona z route+role, nulový BE dotaz, nulový klik po otevření: „Jsi v **Encyklopedii světa Askalon** jako **Hráč**…" Zdroj: registr `RouteHeader` (~25 rout v MVP) + WorldContext. Mimo pokryté routy poctivý fallback (replika 8) — žádné plošné AI stuby.

**B) Kontextové akce** — max 4 karty: topiky matchující route + audience, filtrované o nerelevantní (done-log). Např. /postavy pro Hráče bez postavy: [Jak získám postavu?] [Doveď mě za PJ] [NPC vs. Bestie?].

**C) Trvalé menu** — Cesty (s progresem) · Zeptat se (fulltext, je-li v buildu) · Co je nového · Plná nápověda (/ikaros/napoveda) · Nastavení Vypravěče.

**TopicView:** renderuje se v panelu z existujících bloků `@/shared/ui/help` (HelpAccordion, StepList, CalloutBox…); role-podmíněné sekce dle jednotného audience; `minAudienceNote` vysvětlí i to, co uživatel nesmí; inline odkazy `navigate:` přepínají do režimu Navigace. **Patička zpětné vazby (povinná součást TopicView): „Pomohlo ti to? [Ano] [Ne]"** — textově dle style-guide (bez emoji); Ano/Ne → telemetrický event `feedback ±`; po „Ne" navíc fallback řádek „Zkus plnou nápovědu, nebo napiš správcům." Bez patičky nemá telemetrie feedbacku odkud vzniknout; zapsat i do šablony TOPIK v obsahovém podkladu.

**Chybový podrežim:** mapa `errorCode → topicId` (~15 položek: 403 role-floor, Žadatel, 404 private světa, 409 LIMIT_REACHED/WORLD_QUOTA_REACHED, 429 REJECTED_RECENTLY, SOLE_PJ_BLOCK, WORLD_OWNER_CANNOT_LEAVE, INSUFFICIENT_FUNDS, USERNAME_CHANGE_VIA_REQUEST, NOT_APPLICABLE, NOT_SUPPORTER, kostky whitelist, AKJ 🔒, SESSION_REVOKED, MaintenanceOverlay). Vždy: PROČ + co dál + akce. Vztah k existující vrstvě friendly-messaging: friendly hláška = 1. linie (zůstává), chybový topik = 2. linie „proč a co dál" — detail koordinace a CI kontrola znění v obsahovém podkladu.

### 8.2 NAVIGACE („vezmi mě tam")

Dvoufázová akce:
1. **Přesun:** `navigate(route)` s doplněním parametrů z kontextu (worldSlug z URL; chybí-li svět, výběr z „Moje světy"; u kroků cesty z `contextWorldId` cesty).
2. **Ukázání:** highlight cílového prvku — MVP = pulzující obrys + scroll-into-view, `pointer-events:none` (nikdy neblokuje interakci), konec klikem kamkoli nebo po 8 s. Radiální maska/ztmavení a přemisťování panelu = v2 polish.

**Kotvy `data-vypravec`** = explicitní kontrakt v kódu (ne CSS selektory): `{id, route, visibleFor?, mobileNote?, fallbackText}`; MVP ~20 kotev (⚙ hlavičky světa, tab #pristup, „+ Navrhnout", 🎲 composer, JoinCTA, zvoneček…). Když kotva neexistuje (role ji skrývá, mobilní drawer), Vypravěč to ví z registru a řekne definovaný **slovní fallback** („Na mobilu je ozubené kolečko schované v menu — otevři ho a ukážu ti dál."). CI guard testuje existenci kotev.

**Role-gate:** vyžaduje-li cíl vyšší roli, Vypravěč **nenaviguje do 403** — vysvětlí floor + co s tím.

### 8.3 TUTORIÁL (cesty s ověřením)

**Krok = úkol v reálném UI, nikdy tooltip sekvence.**

```ts
interface JourneyStep {
  id: string;                 // 'pj.create-world'
  title: string;              // „Založ svět"
  narratorLine: string;       // Ishidova replika (flavor)
  cta: { label: string; to: string };   // deep-link na místo činu
  anchor?: AnchorId;
  done: DoneCondition;        // state = pravda, event = trigger oslavy (04-architektura)
  topicId?: string;
  skipAllowed: true; estMin: number;
}
```

**UI:** minimalizovaná **lišta kroku** (desktop plovoucí dole: title + progress 3/5 + [Vezmi mě tam] [Přeskočit] [Pauza]; mobil sticky proužek). Panel se po přečtení sbalí, uživatel pracuje v plném UI. Fázování: max 5 viditelných kroků naráz.

**Definice „sbalení" na kolizní ploše (závazná):** sbalení ≠ zmizení. Lišta se zmenší na **jednořádkový minimalizovaný proužek** (jen title kroku + progres, bez CTA, výška ~32 px), který na kolizní ploše zůstává — i na mobilu nad composerem s otevřenou klávesnicí; pointer-events jen na sobě, composer neblokuje. Tap na proužek = rozbalení lišty (mimo focus composeru).

**Krok cílící na composer** (např. 26.1 krok 5 „Napiš do svého světa"): replika kroku se doručí **PŘED vstupem do composeru** — CTA [Vezmi mě tam] nejdřív zobrazí narratorLine („Otevřu ti Globální konverzaci — napiš cokoli, třeba pozdrav."), pak teprve naviguje; v composeru zůstane jen sbalený proužek. Completion event `message.sent` splnění jen potvrdí; oslava se doručí až mimo kolizní plochu. Poslední instrukce cesty tak nikdy nezmizí přesně v místě činu.

**Detekce splnění:** `DoneCondition` (fe-event / probe / visit) s pravidlem **state = zdroj pravdy, event = jen okamžitý trigger oslavy**; kroky idempotentní derivace stavu → auto-odškrtnou se zpětně (checklist nikdy nelže). Eventy nesou payload `{worldId?, channelKind?}` a probe/deep-linky kroků se scopují na `contextWorldId` cesty — detail v [04-architektura.md](04-architektura.md).

**Pauza/obnova:** `journeyProgress` v UserOnboardingState; obnova kdykoli z menu Cesty; při dalším loginu s aktivní cestou max 1 bublina za session „Pokračujeme u kroku 4?" [Jo] [Později] [Zrušit cestu]. Obnova začíná probe resyncem. V jiném světě, než je `contextWorldId` cesty, se lišta sbalí do badge „cesta pokračuje ve světě X" s navigate CTA.

## 9. Rozsah pro anonyma (scope × anonym)

Audience `anon` existuje (AnonStartPanel se nahrazuje rozcestníkem Vypravěče); závazná tabulka, kde anonym FAB vidí a které momenty platí:

| Plocha | FAB pro anonyma | Povolené momenty | Poznámka |
|---|---|---|---|
| Veřejné platformní routy (landing, /ikaros/vesmiry, /ikaros/nabory, /ikaros/napoveda, legal) | **ano** | 2 (první vstup) + 3 (zákys/chyba) | Rozcestník místo volby persony — CTA míří na registraci; nahrazuje „Začni tady". |
| Uvnitř světa s `publicShowcase` (anonymní Čtenář) | **ano** | 2 + 3 | Obsah topiků filtrován audience `anon` (čtenářský pohled + výzva k registraci); `minAudienceNote` vysvětluje, co odemkne účet/role. |
| Auth formuláře (login/registrace) | ano, ale žádná proaktivita (focus v inputu = aktivní vstup) | — | |
| Neveřejné routy | anonyma tam guard nepustí (redirect) | — | Kotva se neřeší. |

- **Moment 1** (post-registrace) se anonyma z definice netýká; **moment 4** (milník) také ne — anonym nemá cesty.
- Persistence anonyma: výhradně localStorage (`seenRoutes`, `dismissed`); po registraci jednorázový delta merge do BE; ztráta při smazání storage akceptovaná (rozhodnutí 12 syntézy).

## 10. Rizika specifická pro interakční model

| Riziko | Mitigace |
|---|---|
| Nový fixed prvek obsadí roh bez koordinace | Závazná inventura §2 + bottom-stack kontrakt `--fab-shift`; nezapsaný prvek = dluh |
| Toast překryje kliknutí na FAB | Sonner offset nad FAB (§2.1 bod 3) — nastavit v MVP-A při stavbě FAB |
| Mobilní uživatel na kolizní ploše bez vstupu do Vypravěče | Trvalá položka „Vypravěč" v mobilních drawerech od MVP-A (§5) |
| Poslední krok cesty zmizí v composeru | Definované sbalení + replika před vstupem (§8.3) |
| Auto-tichý režim umlčí aktivní cestu | Explicitně vyloučeno (§4.1) — tlumí jen momenty 2 a 3 |
| Highlight se rozbije refaktorem | Kotvy = kontrakt + CI guard + slovní fallback (§8.2) |
