# Side-task: chat na plnou výšku (`/chat`, `/chat/rozcesti*`)

## Cíl

Chatovací okno (`ChatRoom`) na stránkách Hospoda a Rozcestí vyplní výšku
viewportu — zmizí ~220px prázdné rezervy nad oknem. Nad chatem zůstane jen
drobný odstup ~8px od headeru.

## Kontext

- `.main` v `IkarosLayout.module.css` má napevno `padding-top: 220px` —
  globální rezerva pro dekorativní pruh nad obsahem všech stránek.
- `ChatRoom.module.css` tu rezervu schválně zrcadlí přes `--chat-reserve: 220px`:
  výška místnosti = `calc(100dvh - var(--header-h) - var(--chat-reserve))`,
  aby okno nepřeteklo viewport. Stejná hodnota se uplatní i u `.state`
  (loading / error stav).
- Důsledek: na `/chat` i `/chat/rozcesti*` je nad chatem 220px prázdné plochy.
- Layout už chat rozlišuje: `isChat = pathname.startsWith('/chat')` →
  modifier class `bodyNoRight` (viz `spec-chat-hide-right-panel.md`).

## Rozsah změn

### `IkarosLayout`
1. Nová modifier class `s.mainChat` na `<main>` — aplikuje se když `isChat`.
2. `.mainChat { padding-top: var(--sp-2); }` — přepíše globálních 220px na ~8px.

### `ChatRoom.module.css`
3. `--chat-reserve` snížit z `220px` na `var(--sp-2)` — musí sedět s krokem 2,
   jinak okno přeteče nebo nedosáhne spodku viewportu.

## Mechanismus

`isChat` se v `IkarosLayout` už počítá. Modifier class na `.main` stejným
principem jako existující `bodyNoRight` na `.body`.

`ChatRoom` se renderuje výhradně na `/chat*`, takže `--chat-reserve` lze
změnit přímo v jeho CSS — není potřeba podmiňovat routou.

## Mimo scope

- Globální `.main { padding-top: 220px }` pro ne-chat stránky zůstává beze změny.
- Vnitřní layout `ChatRoom` (zprávy / Přítomní / input) — beze změny.

## Responsive

- Beze změny chování: rezerva 220px → ~8px platí stejně pro mobil i desktop.
- Po implementaci ověřit skillem `mobil-desktop`.

## Stav

- [x] Implementováno (2026-05-16)
