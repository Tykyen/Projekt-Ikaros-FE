# Nápověda — seznam snímků k doplnění (spec 13.5)

Stránka Nápověda (`/ikaros/napoveda`) má připravená místa pro screenshoty. Dokud
snímek chybí, zobrazí se **záměrný prázdný stav** (dashed rámeček s výzvou) — nic
se nerozbije. Až snímek nafotíš, doplň `src` u příslušného klíče v jednom souboru:

**`src/features/ikaros/pages/HelpPage/media.ts`**

```ts
'svet.takticka-mapa': { src: '/help/svet-takticka-mapa.png', alt: '…', caption: '…' },
```

Obrázky ulož do `public/help/` (cesta pak začíná `/help/…`) nebo zadej URL na CDN.

## Co nafotit

| Klíč | Kde v nápovědě | Co má snímek ukázat |
|---|---|---|
| `start.hero` | Začni tady → hero | Atmosférický úvodní obrázek platformy (dekorace, volitelné) |
| `start.orientace` | Začni tady → Orientace v rozhraní | Celé rozhraní: hlavička (zvonek, hledání), levý sidebar, panely |
| `platforma.hospoda` | Platforma → Hospoda | Globální chat: zprávy, seznam přítomných, pole pro šepot |
| `platforma.profil` | Platforma → Profil | Stránka Profil — hlavička, postava v Rozcestí, sekce Bezpečnost |
| `svet.prehled` | Svět → Přehled světa | Tři sloupce: Akce, Novinky, Oblíbené stránky |
| `svet.takticka-mapa` | Svět → Taktická mapa | Hex grid s tokeny, iniciativní lišta, panel PJ |
| `svet.chat` | Svět → Chat světa | Kanály a konverzace vlevo, zprávy, panel Přítomní |
| `svet.kalendar` | Svět → Kalendář světa | Měsíční kalendář s akcemi, fázemi měsíce a sezónou |
| `svet.bestiar` | Svět → Bestiář | Mřížka statbloků se záložkami rozsahu (Můj / Svět / Systém) |
| `svet.pavucina` | Svět → Pavučina | Záložka Síť — silový graf vztahů (uzly + barevné hrany) |

## Doporučení

- **Poměr stran** zhruba 16:10 nebo širší — snímky se renderují přes celou šířku obsahu.
- Foť na **desktopu** (mobilní layout nemá smysl ukazovat ve většině nástrojů).
- `start.hero` je dekorativní ilustrace — když ji vynecháš, nevykreslí se vůbec
  (na rozdíl od ostatních, které mají prázdný stav s výzvou).
