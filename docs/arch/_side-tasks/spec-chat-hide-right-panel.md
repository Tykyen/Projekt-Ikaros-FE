# Side-task: skrytí pravého panelu na stránce Hospoda (`/chat`)

## Cíl

Na chatové stránce (`/chat` a budoucí podstránky `/chat/*`) se nezobrazuje pravý
panel `IkarosLayout` (Administrace / Moje světy / Oblíbené). Chat tím dostane
uvolněnou šířku. Platí pro všechny přihlášené uživatele (`/chat` je za
`requireAuth`).

## Kontext

- `/chat` je chráněná route → uživatel je vždy přihlášený → pravý panel je tam
  dnes vždy renderovaný.
- Pravý panel obsahuje obecný platformový obsah nesouvisející s chatem.
- `.body` v `IkarosLayout.module.css` je CSS grid:
  - desktop `280px 1fr 280px`, anon `280px 1fr`, mobil `1fr` (panely v drawerech).

## Rozsah změn — `IkarosLayout`

1. `s.rightPanel` (desktop aside) — nerenderovat na `/chat*`.
2. `s.drawerRightSidebar` (mobilní drawer) — nerenderovat na `/chat*`.
3. `s.rightHamburger` (tlačítko v headeru) — skrýt na `/chat*` (jinak otvírá
   prázdný drawer).
4. `.body` grid — na `/chat*` modifier class `bodyNoRight` přepne grid na 2
   sloupce (`280px 1fr`), aby nevznikl prázdný sloupec.

## Mechanismus

`useLocation()` → `isChat = pathname.startsWith('/chat')`. Modifier class na
`.body` (stejný princip jako existující `.shellAnon .body`).

## Mimo scope

- Levý sidebar (Navigace / Vesmíry / Chat) zůstává — slouží k přepínání mezi
  chat-roomy.
- Vnitřní sloupec „Přítomní" v `ChatRoom` zůstává (jiná komponenta).

## Stav

- [x] Implementováno
