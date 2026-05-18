# Implementační plán 5.0g — Port 16 skinů

**Spec:** [spec-5.0g-skin-port.md](spec-5.0g-skin-port.md)
**Repo:** `Projekt-ikaros-FE` (bez BE změn)
**Větev:** `feat/krok-5.0g-skin-port`

---

## Task 1 — `ThemeId` + mapování pozadí

- [ ] `src/themes/types.ts` — `ThemeId` rozšířit o 16 slugů.
- [ ] Helper `src/themes/themes/_skinPort.ts` — mapa skin → sdílené pozadí/thumbnail webp (dle spec §3.2).

## Task 2 — Vzorový skin `fantasy`

- [ ] `src/themes/themes/fantasy/index.ts` — `Theme` objekt, plná `vars` sada (dle vzoru `modre-nebe`), barvy z §3.2.
- [ ] `src/themes/themes/fantasy/decorations.css` — signature ornament (§4.1b).
- [ ] Registrace v `registry.ts`.
- [ ] `tsc` + `build` ✓ → **ukázat autorovi** před zbytkem.

## Task 3 — Zbylých 15 skinů

- [ ] Pro každý (`heroic`, `urban-fantasy`, `soft-sci-fi`, `biopunk`, `post-postapo`, `dystopie`, `military`, `psycho`, `lovecraft`, `thriller`, `alt-historie`, `steampunk`, `dieselpunk`, `weird`, `grimdark`): `index.ts` + `decorations.css` dle vzoru `fantasy`, barvy §3.2, ornament §4.1b.
- [ ] Registrace všech v `registry.ts` (37 motivů celkem).

## Task 4 — Přemapování žánrů

- [ ] `genres.ts` — 16 dotčených žánrů → vlastní nový skin (1:1); `themeForGenre` bez sdílení.

## Task 5 — Testy + brána

- [ ] Testy: `registry` 37 položek, `themeForGenre` unikátní, `applyTheme` nových.
- [ ] `lint`, `lint:colors`, `tsc`, `build`, `test:run` ✓.

## Task 6 — Úklid

- [ ] `mobil-desktop` audit (vzorek skinů), roadmapa 5.0g, commit.

---

## Commity

1. `feat(themes): ThemeId + vzorový skin fantasy (krok 5.0g)`
2. `feat(themes): port 15 žánrových skinů ze starého Matrixu (krok 5.0g)`
3. `feat(svet): genres → 1:1 mapování na žánrové skiny (krok 5.0g)`
4. `test(themes): krok 5.0g — testy + roadmapa`
