# Emojibase data (self-hosted) — D-075

Data pro emoji picker `frimousse` (chat reakce, `EmojiPickerPopover.tsx`).

## Proč to leží tady, a ne se tahá z CDN

Frimousse defaultně `fetch`uje `https://cdn.jsdelivr.net/npm/emojibase-data@latest/...`.
Enforce CSP to blokovala (`connect-src`), takže **plná paleta emoji visela na
„Načítám…"** — a nikdo si toho dlouho nevšiml, protože lokální český quick-pick
(`czechEmoji.ts`) fungoval dál (nález 2 karty 24.2, `CH-125`).

Self-host řeší příčinu místo rozšiřování whitelistu:

- `connect-src` zůstává úzký (žádná cizí doména kvůli emoji),
- funguje nezávisle na dostupnosti jsdelivr,
- žádný odchozí požadavek na třetí stranu z prohlížeče uživatele (soukromí),
- rychlejší — stejný origin, gzip z našeho nginxu (`application/json` je v `gzip_types`).

## Co tu je

| Soubor | Velikost | Obsah |
| --- | --- | --- |
| `en/data.json` | ~718 kB (gzip ~150 kB) | 1941 emoji — glyfy, popisky, klíčová slova |
| `en/messages.json` | ~6 kB | názvy 10 skupin + 101 podskupin |

Zdroj: [`emojibase-data`](https://www.npmjs.com/package/emojibase-data) **v16**
(shodná major verze s tím, co používá frimousse — viz její `devDependencies`).

## Jak to konzumuje aplikace

`EmojiPickerPopover.tsx` předává `EmojiPicker.Root`:

```tsx
locale="en"
emojibaseUrl="/emojibase"
```

Knihovna z toho složí `${emojibaseUrl}/${locale}/${file}.json`. Pozor: **při
vlastním `emojibaseUrl` už knihovna do cesty nepřidává `@verzi`** — verzi tedy
řídí výhradně obsah téhle složky.

`locale` uvádíme explicitně, přestože `"en"` je default knihovny — kdyby ho
autoři změnili, fetch by minul tenhle adresář a paleta by se zase tiše rozbila.

## ⚠️ Pozor při auditu CSP

V bundlu (`dist/assets/*.js`) **zůstává řetězec `cdn.jsdelivr.net`** — je to
defaultní hodnota uvnitř frimousse (`typeof emojibaseUrl === "string" ? … : "https://cdn.jsdelivr.net/…"`).
Náš prop tu větev přebíjí, takže se **nikdy nevykoná**. Grep nad buildem ho ale
najde; ověřovat se to dá přítomností `emojibaseUrl:"/emojibase"` v témže bundlu.

## Cachování

Soubory spadají pod `location /` v nginxu, tedy `Cache-Control: no-cache, must-revalidate`.
V praxi to nebolí: nginx posílá `ETag`, takže revalidace vrací `304` bez těla, a
frimousse si data navíc drží v `localStorage` (klíčované ETagem). Kdyby se ukázalo,
že to zatěžuje, patřil by sem vlastní `location /emojibase/` s dlouhým `max-age`.

## Aktualizace dat

```bash
curl -sL -o public/emojibase/en/data.json \
  https://cdn.jsdelivr.net/npm/emojibase-data@16/en/data.json
curl -sL -o public/emojibase/en/messages.json \
  https://cdn.jsdelivr.net/npm/emojibase-data@16/en/messages.json
```

Emoji verze vychází zhruba jednou ročně, takže tohle není rutina. Po výměně
ověř, že picker načte paletu (nesmí viset na „Načítám…").

## Další jazyky

Stačí přidat `public/emojibase/<locale>/` se stejnou dvojicí souborů a předat
odpovídající `locale`. Český quick-pick (`czechEmoji.ts`) je na tomhle nezávislý —
je to náš vlastní ručně vybraný set s českými klíčovými slovy.
