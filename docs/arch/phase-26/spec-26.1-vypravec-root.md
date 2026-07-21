# Spec 26.1 — VypravecRoot: FAB + panel/bottom-sheet (Vypravěč MVP‑A, D3–D4)

Stav: schváleno 2026-07-21 (vlastník schválil HTML návrh `navrh-vypravec-ui.html` + průběžný mandát „dej se do spec a implementace") · Vazby: `docs/vypravec/03-interakcni-model.md` (závazný interakční model), `00-vize-a-rozhodnuti.md` §4.1 D3–D4, spec-26.0 (route registr — kolizní routy typované proti němu)

## Rozsah

Shell Vypravěče BEZ enginu: kotva FAB (stavy klid/spí vizuálně; badge/vede jen CSS hooky), pravidla skrytí, panel (desktop 380 px) / bottom-sheet (mobil, 2 zarážky zjednodušené na toggle), a11y základ, theming tokeny, placeholder siluety, kolizní politika rohu. Kontextový obsah = D5; journey = D7–D8; persistence = D6.

## Rozhodnutí

| # | Rozhodnutí | Proč |
|---|---|---|
| 1 | Mount `<VypravecRoot scope>` UVNITŘ obou layoutů (IkarosLayout `scope="ikaros"`, WorldLayout `scope="world" worldName=…` pod providerem), NE u routeru | world mount potřebuje WorldContext; pop-out `/karta-tokenu` je mimo layouty → FAB tam automaticky není |
| 2 | Kolizní routy = `Set<RoutePattern>` nad registrem spec-26.0, match přes `matchRoutePattern(pathname)` | překlep routy spadne v tsc; rename routy chytí parity test |
| 3 | Bottom-stack: FAB `bottom: calc(16px + env(safe-area-inset-bottom) + var(--voice-host-h,0px) + var(--pwa-banner-h,0px))` — **součet příspěvkových proměnných u konzumenta** místo jediné mutované `--fab-shift` | dva přispěvatelé by si jedinou proměnnou přepisovali (race bez JS koordinátoru); jména proměnných = kontrakt. ✎ Odchylka od 03 §2.1 — 03 aktualizováno |
| 4 | Voice host měří svou výšku ResizeObserverem a nastavuje `--voice-host-h` (výška+16) na `<html>` jen ve viditelném nedokovaném stavu; InstallBanner nastavuje `--pwa-banner-h` jen na mobilu (≤768 px) | politika 03 §2 beze změny chování obou prvků |
| 5 | Sonner: `offset={{ bottom: 84, right: 16 }}` (16+56+12 nad FAB), `mobileOffset` obdobně | toasty stackují NAD FAB (03 §2.1 bod 3) |
| 6 | Mobilní klávesnice: `visualViewport` resize heuristika (zmenšení > 150 px ⇒ skrýt FAB) | kolizní plocha „otevřená klávesnice" bez per-input instrumentace |
| 7 | Panel lazy (`React.lazy`), eager jen FAB + inline SVG siluety | rozpočet eager < 10 kB gz (04 §výkon) |
| 8 | Bottom-sheet zarážky MVP = dvě fixní výšky (40vh/75vh) přepínané tapem na madlo, bez drag fyziky | drag/spring = v2 polish; struktura DOM stejná |
| 9 | Zkratka Shift+V (mimo input/textarea/contentEditable); Esc zavírá; focus trap + restore | 03 §7; f/e/Ctrl+K v PageVieweru nekolidují |
| 10 | Vše barvy přes tokeny (`--surface-2`, `--acc`, `--text-*`…); vstupenka = mask, silueta = currentColor mask; žádné hex (lint:colors) | brand vzhled mimo svět dodá sám motiv ikaros; ve světě motiv světa |

## Soubory

- `src/shared/vypravec/ui/VypravecRoot.tsx` — orchestrace: skrytí (kolizní routy + klávesnice), Shift+V, lazy panel
- `src/shared/vypravec/ui/VypravecFab.tsx` — kotva (48/44 px, stavy)
- `src/shared/vypravec/ui/VypravecPanel.tsx` — lazy; desktop panel / mobil sheet; vstupenka hlavička; poctivý shell obsah (Kde jsem placeholder + odkaz Plná nápověda); focus trap, Esc
- `src/shared/vypravec/ui/siluety.tsx` — inline SVG placeholdery (cylindr mimo svět, lucerna ve světě)
- `src/shared/vypravec/ui/Vypravec.module.css`
- `src/shared/vypravec/kolizniRouty.ts` — typovaný whitelist kolizních rout
- Edity: IkarosLayout.tsx + WorldLayout.tsx (mount) · main.tsx (Toaster offset) · WorldVoiceHost.tsx (`--voice-host-h`) · InstallBanner.tsx (`--pwa-banner-h`)
- Test `src/shared/vypravec/ui/__tests__/vypravecRoot.spec.tsx`: skrytí na kolizních routách · otevření/zavření + Esc + focus restore · Shift+V (ne v inputu) · aria atributy

## Ověření

Vitest nové testy + parity/nav testy zelené · `npm run build` (tsc -b + bundle budget — eager příspěvek FAB kontrolovat) · statický `mobil-desktop` review · živé screenshoty od vlastníka (FAB na dashboardu, panel, mobil sheet, s voice kartou).
