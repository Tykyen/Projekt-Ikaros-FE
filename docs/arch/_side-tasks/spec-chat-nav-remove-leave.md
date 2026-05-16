# Side-task: zrušení „×" (odchod z místnosti) v levém menu chatu

## Cíl

Z navigace `CHAT` v levém sidebaru zmizí tlačítko „×", které u místnosti,
kde uživatel zrovna je (`myRooms`), umožňovalo odchod přímo z menu.

## Kontext

- „×" renderuje `IkarosLayout` u `NavLink` chat-místnosti, když
  `myRooms.has(room.roomKey)` — viz `s.roomLeave` button.
- Funkci zajišťuje `leaveRoomFromNav` → emituje `chat:hospoda:leave` /
  `chat:room:leave` a odebere místnost z `myRoomsAtom`.
- `myRoomsAtom` samotný **zůstává** — `ChatRoom` ho čte i zapisuje pro
  join/leave logiku. Ruší se jen jeho použití v navigaci.

## Rozhodnutí

- Odchod z místnosti zůstane jen přes tlačítko **„Odejít"** v záhlaví
  místnosti (`ChatRoom`). Důsledek: opustit místnost lze jen z jejího
  pohledu — vědomě akceptováno.

## Rozsah změn — `IkarosLayout`

1. Odstranit JSX bloku `s.roomLeave` button (`myRooms.has(...) && <button>`).
2. Odstranit `leaveRoomFromNav` funkci.
3. Odstranit `myRooms` / `setMyRooms` (`useAtomValue` / `useSetAtom`).
4. Uklidit nepoužité importy: `X` (lucide), `getSocket`, `myRoomsAtom`.
5. `IkarosLayout.module.css` — odstranit dead `.roomLeave` (+ navázané
   selektory).

## Mimo scope

- `myRoomsAtom`, `ChatRoom` join/leave logika, „Odejít" v záhlaví — beze změny.

## Návazné úpravy

- `napoveda` — `PagesSection` (Hospoda) text zmiňuje `„×" u místnosti
  v levém menu` → upravit, odchod jen tlačítkem „Odejít".

## Stav

- [x] Schváleno
- [x] Implementováno
