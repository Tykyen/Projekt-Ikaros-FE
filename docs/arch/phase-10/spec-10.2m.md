# Spec 10.2m — Nástroje + oprávnění

## Účel
Poslední vrstva taktické mapy: drobné herní **nástroje** (ping, měření vzdálenosti)
+ **audit oprávnění** PJ vs hráč. Čistě FE — BE infrastruktura (ping handler,
`scene.isLocked`) je hotová.

## Stav před krokem

| Funkce | Stav |
|--------|------|
| Fullscreen | ✅ hotovo (`MapZoomControls`) |
| Permission gating PJ/hráč | ✅ hotovo (`useTokenPermissions`, respekt `scene.isLocked`) |
| BE `map:ping`→`map:pinged` handler | ✅ hotovo (`maps.gateway.ts`) |
| Vrstva `layer-pings` v rendereru | ✅ existuje (prázdná) |
| **Ping (FE klient)** | ❌ chybí |
| ~~Měření vzdálenosti~~ | 🚫 **VYŘAZENO** (uživatel 2026-05-31 — nepotřebujeme) |

---

## m-1 — Ping

**Chování:** double-click na plochu mapy → ephemeral ping marker viditelný **všem
na scéně** (PJ i hráči). Marker = rozpínající se kruh/vlna v `--map-ping-color`
+ popisek, auto-mizí po ~2 s.

**Popisek (herní identita, NE jméno účtu):** PJ ve světě → `"PJ"` (priorita role),
hráč → jméno postavy, kterou hraje (`character.name`), fallback `"Hráč"`. Skutečné
jméno/username účtu se u pingu nikdy nezobrazuje. *(Pozn.: `diceRollerName` z 10.2j
má jiný fallback — padá na jméno účtu; sjednocení napříč herní vrstvou je kandidát
na samostatnou úpravu.)*

**Tok (BE už hotový):**
- FE emit `socket.emit('map:ping', { sceneId, x, y, userName })` (mapa-space souřadnice).
- BE broadcastuje `map:pinged (x, y, userName)` všem ostatním na scéně.
- Odesílatel si marker přidá lokálně (BE broadcastuje jen `client.to`, ne sobě).

**FE komponenty:**
- `useMapSocket`: přidat `onPing` listener + `emitPing(x, y, userName)` — **vzor:
  existující `emitSpotlight`** (ephemeral, žádný operation log).
- `PingsLayer` (PixiJS): render aktivních pingů do `layer-pings`, animace přes
  `useTick` (rozpínání + fade), respekt `prefers-reduced-motion` (statický puls).
  Lokální stav pingů (pole `{ id, x, y, userName, born }`), TTL ~2 s, auto-cleanup.
- Double-click handler v `TacticalMapView`: screen→mapa-space přepočet (existující
  transform root), emit + lokální add. **Nekoliduje s pan/zoom** (double-click ≠ drag).

💡 *Ephemeral = ping se nikam neukládá, neteče přes operations log ani catch-up;
je to čistý „blik" v reálném čase. Stejný princip jako spotlight z 10.2f.*

⚠️ *Double-click na touch (mobil) = double-tap; ověřit, že nekoliduje s pinch-zoom.*

---

## m-2 — Měření vzdálenosti — 🚫 VYŘAZENO
Uživatel rozhodl 2026-05-31, že měření vzdálenosti není potřeba. Funkce se
neimplementuje. `hexDistance` zůstává (používá ji combat range). Pokud by se
v budoucnu hodilo, vychází se z původního návrhu (dock nástroj + čára + „N polí").

---

## m-3 — Audit oprávnění (PJ vs hráč)

Ověřit a doplnit matici (z velké části hotovo v `useTokenPermissions`):
- **PJ (≥ PomocnyPJ / Sa / Admin):** tokeny (move/spawn/remove), fog, efekty,
  scéna (aktivace/lock/hidden), ping, měření.
- **Hráč:** jen **vlastní** token (drag dle `characterSlug` match), ping, měření.
  Fog/efekty/scéna read-only.
- **`scene.isLocked`** — hráč nemůže hýbat tokeny (PJ ano). Už respektováno.

⚠️ **Dluh:** per-token `isLocked` (zamknout konkrétní token, ne celou scénu)
neexistuje — `MapToken` nemá pole `isLocked`, vyžadovalo by BE schema + op. Mimo
scope 10.2m → zapsáno přes skill `dluh`.

---

## Mimo scope (defer / dluh)
- Per-token `isLocked` (dluh — BE+FE).
- Měření vzdálenosti (vyřazeno uživatelem).

## Definition of done
- [ ] Ping: double-click → marker všem na scéně, ~2 s, jméno
- [ ] Audit oprávnění ověřen (PJ vs hráč), `scene.isLocked` respektován
- [ ] Per-token lock zapsán jako dluh
- [ ] Testy: ping listener v `useMapSocket`, ping marker lifecycle
- [ ] `mobil-desktop` audit (double-tap ping)
- [ ] `napoveda` aktualizována
- [ ] roadmapa: 10.2m zaškrtnuto → **10.2 hotová**
