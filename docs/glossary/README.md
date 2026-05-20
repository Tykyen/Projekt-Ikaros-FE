# Slovníček pojmů Ikaros

Slovníček projektových pojmů — drží jednotný jazyk napříč kódem, dokumentací i komunikací.

Každý pojem = jeden soubor s frontmatterem (`name`, `aliases`, `category`, `related`, `status`).

**Statusy:**
- `stable` — definice prošla revizí, používá se.
- `draft` — kostra, čeká na revizi obsahu.
- `deprecated` — pojem vyřazen, nepoužívat (popis vysvětluje proč a co místo toho).

Nový pojem se přidává **přes skill `slovnicek`** — návrh → souhlas → zápis. Šablona: [_template.md](_template.md).

---

## Kategorie

### architektura
Stack, providers, routing, error boundary, build, platformové workflow.

- [cooldown.md](cooldown.md) — časová pauza mezi opakováním akce
- [deletion-pending.md](deletion-pending.md) — 30denní hold smazaného účtu
- [reaktivace.md](reaktivace.md) — obnovení účtu v hold režimu

### role-a-prava
Platformové i světové role, kdo co smí, hierarchie, oprávnění.

- [superadmin.md](superadmin.md) — nejvyšší globální role nad platformou
- [ikarus.md](ikarus.md) — globální role č. 9 (TBD, D-053)
- [globalni-role.md](globalni-role.md) — role nad celou platformou Ikaros
- [granular-permissions.md](granular-permissions.md) — jemné permission flagy
- [world-role.md](world-role.md) — role v rámci konkrétního světa
- [world-membership.md](world-membership.md) — uživatel × svět × role
- [zadatel.md](zadatel.md) — `WorldRole.Zadatel = 0` (uchazeč o vstup)
- [ctenar.md](ctenar.md) — `WorldRole.Ctenar = 1` (pasivní)
- [hrac.md](hrac.md) — `WorldRole.Hrac = 2` (aktivní hráč)
- [korektor.md](korektor.md) — `WorldRole.Korektor = 3` (redakce bez mazání)
- [pomocny-pj.md](pomocny-pj.md) — `WorldRole.PomocnyPJ = 4` (asistent PJ)
- [pan-jeskyne.md](pan-jeskyne.md) — `WorldRole.PJ = 5` (vede svět)
- [akj-urovne.md](akj-urovne.md) — stupně utajení informací ve světě

### svet
Svět jako jednotka — dashboard, layout, navigace, společenství.

- [svet.md](svet.md) — instance hry / komunity uvnitř Ikaros
- [matrix-svet.md](matrix-svet.md) — speciální seed svět (Tyky)

### chat
Chatový subsystém — kanály, konverzace, zprávy, presence.

- [kanal.md](kanal.md) — skupina konverzací (= `ChatGroup` v BE)
- [konverzace.md](konverzace.md) — jednotlivá místnost (= `ChatChannel` v BE)
- [access-mode.md](access-mode.md) — přístupový režim konverzace
- [sepot.md](sepot.md) — soukromá zpráva uvnitř konverzace
- [presence-indikator.md](presence-indikator.md) — barevná tečka online stavu
- [neviditelny-mod.md](neviditelny-mod.md) — skrytí vlastního online stavu

### tema-a-skin
Vzhledová vrstva — barvy, ornamenty, theme system.

- [skin.md](skin.md) — konkrétní vzhledová varianta
- [tema.md](tema.md) — vzhled jako systém (`data-theme`)
- [ornament.md](ornament.md) — dekorativní vrstva skinu
- [theme-overrides.md](theme-overrides.md) — custom CSS tokeny per-svět / per-uživatel
- [theme-adjust.md](theme-adjust.md) — a11y doladění (brightness/contrast/bgDim)

### ui
Layouty, komponenty, dlaždice, mobil/desktop chování.

- [dlazdice.md](dlazdice.md) — modulární blok v dashboardech
- [tombstone.md](tombstone.md) — vizuální stav smazaného účtu
- [zpracovat-tab.md](zpracovat-tab.md) — univerzální fronta žádostí
- [default-avatar.md](default-avatar.md) — fallback avatar (muž / žena / bytost)

### herni-mechaniky
Herní logika — postavy, sezení, eventy, akce. *(zatím prázdné, naplní se ve fázi 16+)*

---

## Abecední index

- [access-mode.md](access-mode.md) — přístupový režim konverzace (all / roles / members)
- [akj-urovne.md](akj-urovne.md) — stupně utajení informací ve světě
- [cooldown.md](cooldown.md) — časová pauza mezi opakováním akce
- [ctenar.md](ctenar.md) — pasivní světová role
- [default-avatar.md](default-avatar.md) — fallback avatar
- [deletion-pending.md](deletion-pending.md) — 30denní hold smazaného účtu
- [dlazdice.md](dlazdice.md) — modulární blok v dashboardech
- [globalni-role.md](globalni-role.md) — role nad celou platformou Ikaros
- [granular-permissions.md](granular-permissions.md) — jemné permission flagy
- [hrac.md](hrac.md) — aktivní účastník hry ve světě
- [ikarus.md](ikarus.md) — globální role č. 9 (TBD)
- [kanal.md](kanal.md) — skupina konverzací (`ChatGroup` v BE)
- [konverzace.md](konverzace.md) — jednotlivá místnost (`ChatChannel` v BE)
- [korektor.md](korektor.md) — redakční světová role
- [matrix-svet.md](matrix-svet.md) — speciální seed svět
- [neviditelny-mod.md](neviditelny-mod.md) — skrytí vlastního online stavu
- [ornament.md](ornament.md) — dekorativní vrstva skinu
- [pan-jeskyne.md](pan-jeskyne.md) — vede svět (PJ)
- [pomocny-pj.md](pomocny-pj.md) — asistent PJ
- [presence-indikator.md](presence-indikator.md) — barevná tečka online stavu
- [reaktivace.md](reaktivace.md) — obnovení smazaného účtu
- [sepot.md](sepot.md) — soukromá zpráva uvnitř konverzace
- [skin.md](skin.md) — konkrétní vzhledová varianta
- [superadmin.md](superadmin.md) — nejvyšší globální role
- [svet.md](svet.md) — instance hry / komunity
- [tema.md](tema.md) — vzhled jako systém
- [theme-adjust.md](theme-adjust.md) — a11y doladění (brightness/contrast)
- [theme-overrides.md](theme-overrides.md) — custom CSS tokeny
- [tombstone.md](tombstone.md) — vizuální stav smazaného účtu
- [world-membership.md](world-membership.md) — uživatel × svět × role
- [world-role.md](world-role.md) — role v rámci konkrétního světa
- [zadatel.md](zadatel.md) — uchazeč o vstup do světa
- [zpracovat-tab.md](zpracovat-tab.md) — univerzální fronta žádostí
