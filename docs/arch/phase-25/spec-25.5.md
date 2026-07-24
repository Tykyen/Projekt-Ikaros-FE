# Spec 25.5 — Úklid prvního dojmu

**Status:** ✅ Implementováno 2026-07-24 (② nulové indikátory · ③ PWA value-gate · ④ prefetch nápovědy · ⑤ BetaMarker; ① vypuštěno — legitimní cizí svět). Čeká FE deploy + živé ověření.
**Rozsah:** FE only — malý/střední (4 dílčí úpravy first-impression). **Žádný BE.**
**Repo:** `Projekt-ikaros-FE`, větev `main` (work-on-main)
**Velikost:** odhad ~10 souborů / ~250 ř.
**Autor:** PJ + Claude
**Datum:** 2026-07-24
**Souvisí:** roadmap3 §25.5 · spec-25.3 (betaStage.ts + BetaBanner — bod ⑤ odsud explicitně odložen) · spec-15.1 (PWA install hint — bod ③) · registry HelpPage/Vypravěč (bod ④)

---

## 1. Cíl

Odstranit čtyři drobné kazy prvního dojmu z rešerše živého webu: ② nulové indikátory („Putyka 0 online") nesmí být první signál · ③ PWA install prompt naskakuje dřív, než uživatel zažil hodnotu (odhad −5–15 % první konverze) · ④ ~3s spinner při otevření nápovědy · ⑤ beta štítek chybí v layoutech, kde se dnes nerenderuje (celý svět, chat, admin, fullscreen mapa, anonymní návštěvník).

**Proč (rešerše):** průřezový princip Etapy III č. 4 — *„Prázdno je horší než málo."* První dojem rozhoduje o retenci testera; každý z těchto čtyř bodů je levná oprava s měřitelným dopadem na konverzi/důvěru.

---

## 2. Audit současného stavu

### ② Nulové indikátory
- **Hlavní viník:** [IkarosLayout.tsx:341-350](../../../src/app/layout/IkarosLayout/IkarosLayout.tsx#L341) — badge počtu přítomných u chat místností (Putyka, campy) se renderuje **vždy i s „0"**; podmíněná je jen CSS třída `roomCountActive` (zvýraznění), samotná nula je vidět.
- **Vzor „skryj nulu" už v projektu existuje:** [IkarosLayout.tsx:199](../../../src/app/layout/IkarosLayout/IkarosLayout.tsx#L199) (`pendingCount > 0 && …`, hlídáno testem), [IkarosLayout.tsx:304](../../../src/app/layout/IkarosLayout/IkarosLayout.tsx#L304) (nadpis „Chat" skryje 0), [VoiceKrcmaRoom.tsx:114](../../../src/features/voice/components/VoiceKrcmaRoom.tsx#L114) („krčma je tichá" místo 0).
- **Veřejný katalog:** [WorldCard.tsx:64](../../../src/features/ikaros/pages/DashboardPage/components/WorldCard.tsx#L64) `formatPlayers()` vrací „0 hráčů" pro nový svět, bezpodmínečně.

### ③ PWA install prompt
- [useInstallPrompt.ts:96](../../../src/features/pwa/useInstallPrompt.ts#L96) — `shouldShow = !standalone && !dismissed && (canPrompt || isIos)`. **Žádná brána „prožitá hodnota"** — banner naskočí, jakmile prohlížeč pošle `beforeinstallprompt` (Android/desktop téměř hned) nebo hned na iOS.
- Dismiss flag existuje: `pwa:install-dismissed`, re-offer po 14 dnech ([useInstallPrompt.ts:16-17](../../../src/features/pwa/useInstallPrompt.ts#L16)).
- Banner mountnutý globálně bez podmínky na route/session: [main.tsx:74](../../../src/app/main.tsx#L74).

### ④ Spinner nápovědy
- Není fetch — je to **Suspense fallback při stahování lazy JS chunku** HelpPage: [router.tsx:169](../../../src/app/router.tsx#L169) (`fallback={<Spinner center />}`), route [router.tsx:302](../../../src/app/router.tsx#L302).
- Chunk je těžký: [HelpPage.tsx](../../../src/features/ikaros/pages/HelpPage/HelpPage.tsx) staticky importuje 6 sekcí + [FaqSection](../../../src/features/ikaros/pages/HelpPage/sections/FaqSection.tsx#L4) tahá 39 FAQ položek jako JSX + lucide ikony. HelpPage sám nemá žádný runtime fetch → ~3 s = čistě doba stažení chunku.

### ⑤ Beta štítek / patička
- `SiteFooter` nese štítek `({BETA_STAGE_SHORT})` ([SiteFooter.tsx:23](../../../src/shared/ui/SiteFooter/SiteFooter.tsx#L23)), ale renderuje se jen v **IkarosLayout** a jen mimo focus módy (gate `showRightPanel`, [IkarosLayout.tsx:842](../../../src/app/layout/IkarosLayout/IkarosLayout.tsx#L842)). **Chybí:** celý WorldLayout (dashboard světa, chat, TM, wiki), IkarosLayout chat/admin/bestiar, chybové/popout stránky.
- `BetaBanner` je jen pro přihlášené ([BetaBanner.tsx:29](../../../src/features/beta/BetaBanner.tsx#L29)) → **anonym nevidí beta signál** nikde mimo běžné Ikaros plochy s footerem.
- Konstanta `BETA_STAGE_SHORT` = jediný zdroj termínu ([betaStage.ts:13](../../../src/shared/config/betaStage.ts#L13)) — připraveno z 25.3.

---

## 3. Návrh řešení

### 3.1 (②) Skrýt nulu na first-impression plochách

- **Chat room badge** [IkarosLayout.tsx:341-350](../../../src/app/layout/IkarosLayout/IkarosLayout.tsx#L341): při `count === 0` číslo **nevykreslit** (prázdná místnost = bez badge, resp. jen decentní obrys bez čísla — sjednotit se vzorem `pendingCount > 0 && …` na ř. 199). Aktualizovat CSS komentář v [IkarosLayout.module.css:354](../../../src/app/layout/IkarosLayout/IkarosLayout.module.css#L354) (dnes tvrdí „zobrazuje se vždy i 0").
- **Katalog světů** [WorldCard.tsx:64](../../../src/features/ikaros/pages/DashboardPage/components/WorldCard.tsx#L64): `formatPlayers()` při `playerCount === 0` → **„zatím bez hráčů"** místo „0 hráčů".

**Vědomě NEměníme** (0 tam nese legitimní informaci, ne prázdný dojem): veřejný profil „0 světů", diskuze `postCount`/`likeCount`, admin overview (interní).

### 3.2 (③) Brána „prožitá hodnota" pro PWA prompt

Nový tiny util (např. `src/features/pwa/valueGate.ts`):
- `hasExperiencedValue()` — čte localStorage flag `pwa:value-experienced`.
- `markValueExperienced()` — idempotentně flag nastaví; voláno na jednoznačném hodnotovém milníku: **vstup do světa** (mount WorldLayout) a/nebo **odeslání chat zprávy**.
- **Fallback pro pasivní uživatele:** čítač návštěv `pwa:visits` (increment při startu appky v main.tsx); práh **≥ 2** = „vrátil se, má zájem".

Rozšíření [useInstallPrompt.ts:96](../../../src/features/pwa/useInstallPrompt.ts#L96):
```
const experienced = hasExperiencedValue() || visitCount >= 2;
const shouldShow = experienced && !standalone && !dismissed && (canPrompt || isIos);
```
Platí pro obě cesty (nativní i iOS návod). Dismiss/re-offer logika beze změny.

💡 Proč milník **i** čítač: aktivní uživatel dostane prompt hned po první reálné akci; pasivní až na 2. návštěvě. Bez čítače by leh­ký návštěvník prompt nedostal nikdy.

### 3.3 (④) Prefetch chunku nápovědy

Přednačíst lazy chunk HelpPage **na pozadí po idle**, ať je při kliknutí už v cache (Vite dedupuje `import()` podle specifikátoru — druhé volání = hotový modul, spinner zmizí). V [main.tsx](../../../src/app/main.tsx) přidat vedle stávajícího idle bootstrapu:
```
// po startu, nízká priorita: přednačti nápovědu (častá onboarding cesta)
requestIdleCallback?.(() => { void import('@/features/ikaros/pages/HelpPage/HelpPage'); });
```
(+ `setTimeout` fallback pro Safari, které `requestIdleCallback` nemá — stejný vzor jako VypravecRoot.)

🔀 Alternativa (zamítnuto): rozdělit sekce HelpPage na vlastní lazy importy — přidalo by spinnery *uvnitř* stránky, horší UX. Prefetch je čistší a nemění strukturu.

### 3.4 (⑤) Globální minimální beta marker

Nová komponenta `src/features/beta/BetaMarker.tsx` (+ `.module.css`) — **malý decentní fixed štítek** „beta" z `BETA_STAGE_SHORT`, mountnutý globálně v [main.tsx:74](../../../src/app/main.tsx#L74) jako sibling `InstallBanner` → nezávislý na layoutu, viditelný **všude** (WorldLayout, chat, admin, fullscreen TM) i pro **anonyma**.

- Pozice: fixed roh, nenápadný; **nesmí kolidovat** s FAB Vypravěče (bottom-right 16+56), toasty (bottom-right offset 84), InstallBanner (spodní lišta) ani UpdateBanner. Kandidát: bottom-left / top-corner — finál v `frontend-design`.
- Barvy z motivových tokenů (ne hardcoded), scoped, `mobil-desktop` po impl.
- **Nenahrazuje** SiteFooter ani BetaBanner — je to persistentní minimální signál navíc. Koordinaci s footerem „(beta)" (možná duplicita na content plochách) doladí `frontend-design`; default = marker přítomen vždy (footer scrolluje pryč, marker je stálý).

---

## 4. Out of scope

- **① Testovací svět s „test" v názvu** — **vypuštěno.** Ověřeno s autorem: nejde o náš testovací artefakt, ale o **legitimní svět tvůrce**, který ho jen tak pojmenoval. Do cizího uživatelského obsahu nezasahujeme (přejmenování ani skrytí není na nás). Systémový filtr na „test" v názvu je navíc křehký (zasáhl by legitimní světy). Pokud by testovacích světů ve výkladní skříni přibylo, řešit samostatnou kartou (admin flag `hiddenFromCatalog`) — ne zde.
- Změna zdroje presence počtů (BE/WS) — jen FE render.
- Telemetrie konverze PWA promptu (měření dopadu ③) — mimo tuto kartu.
- Redesign HelpPage / zmenšení jejího bundlu — řešíme jen vnímanou latenci prefetchem.
- Doplnění plného SiteFooter do WorldLayout (varianta A) — autor zvolil B (minimální marker).

---

## 5. Acceptance kritéria

1. ✅ Prázdná chat místnost (Putyka 0) v levém menu **nezobrazí „0"** (jen název, bez badge).
2. ✅ Nový svět v katalogu ukáže „zatím bez hráčů" místo „0 hráčů".
3. ✅ PWA install banner se **neukáže** hned po prvním načtení anonymnímu/čerstvému uživateli; ukáže se až po hodnotovém milníku nebo 2. návštěvě. Dismiss (14 dní) beze změny.
4. ✅ Otevření `/ikaros/napoveda` po chvíli od startu appky **neukáže ~3s spinner** (chunk přednačten); první návštěva bez prefetche degraduje bezpečně na dnešní chování.
5. ✅ Beta marker je viditelný ve WorldLayout, chatu, admin, **fullscreen taktické mapě** i pro **anonyma**; nese termín z `BETA_STAGE_SHORT`.
6. ✅ Marker nekoliduje s FAB Vypravěče, toasty ani PWA/Update bannery; mobil i desktop (`mobil-desktop`).
7. ✅ Žádná regrese: existující test na `pendingCount` badge ([IkarosLayout.spec.tsx](../../../src/app/layout/IkarosLayout/IkarosLayout.spec.tsx)) prochází; build `npm run build` čistý.

---

## 6. Test plán

- **Unit/vitest:** ② badge se při 0 nevykreslí (rozšířit/obdoba `IkarosLayout.spec.tsx`); `formatPlayers(0)` → „zatím bez hráčů"; ③ `shouldShow` false bez experienced, true po `markValueExperienced()` / `visits≥2`.
- **Manuální smoke (autor na živém webu):** čerstvý anon → žádný install banner hned; po vstupu do světa / 2. návštěvě banner naskočí. Nápověda bez spinneru. Beta marker ve všech layoutech + fullscreen TM + odhlášeně.
- `mobil-desktop` na marker + WorldCard text. `frontend-design` na vizuál markeru **před** implementací ⑤.

---

## 7. Riziko & rollback

| Riziko | Mitigace |
|---|---|
| ③ Gate schová prompt i „zaslouženému" uživateli (moc přísný) | Milník OR čítač ≥2 — aktivní dostane hned, pasivní na 2. návštěvě; prahy laditelné konstantou |
| ④ Prefetch zvýší data pro uživatele, co nápovědu neotevřou | Idle priorita + jeden malý chunk; přijatelné (onboarding cesta je častá). Případně přepnout na hover-prefetch |
| ⑤ Marker koliduje/ruší v rohu | `frontend-design` před impl + `mobil-desktop`; z-index a pozice testovány proti FAB/toastům |
| ② Skrytí 0 rozbije test/očekávání | Sjednoceno s existujícím vzorem ř. 199; vitest pokrývá |

**Rollback:** každý bod je izolovaný diff → revert po jednotlivých bodech bez vazby na ostatní.

---

## 8. Rozhodnutí autora (2026-07-24)

- **①** vypuštěno — legitimní cizí svět, nezasahujeme (viz Out of scope).
- **②③④** dle návrhu výše (autor: „beru / ok / dobře").
- **⑤ = varianta B** — minimální globální beta marker, ne plný footer do všech layoutů.

---

**Po schválení specu napíšu implementační plán** (přesné file diffy, `frontend-design` návrh markeru, integrace value-gate, vitest) a teprve pak kód.
