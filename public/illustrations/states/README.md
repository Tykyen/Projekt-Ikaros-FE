# Ilustrace prázdných & chybových stavů (spec 15.6)

11 nadžánrových ilustrací (dark fantasy / sci-fi / postapo / současnost) pro sdílenou komponentu `<StatePlaceholder>`.

## Formát
- **WebP** (dodáno jako JPEG → zkonvertováno `scripts/convert-states-webp.mjs`, q80, max 768 px)
- pozadí **není** průhledné → komponenta vybledává okraje CSS maskou (`mask-image: radial-gradient`)
- styl: viz spec-15.6 §7 (atmosférický painterly, temná tlumená paleta)

## Soubory (název = klíč v `stateIllustrations.ts`)

### Prázdné stavy (empty)
| soubor | stav |
|---|---|
| `characters.webp` | žádné postavy / družina |
| `pages.webp` | prázdná wiki / lore stránky |
| `worlds.webp` | žádné světy |
| `gallery.webp` | prázdná galerie obrázků |
| `events.webp` | prázdný kalendář / akce |
| `messages.webp` | prázdný mail / chat / diskuze |
| `generic-empty.webp` | obecné prázdno (fallback) |

### Chybové stavy (error)
| soubor | stav |
|---|---|
| `forbidden.webp` | 403 — nemáš přístup |
| `notfound.webp` | 404 — nenalezeno |
| `crash.webp` | 500 — appka spadla |
| `load-error.webp` | nepodařilo se načíst (retry) |

Nové/přegenerované obrázky házej jako `.jpg`/`.png` sem a spusť `node scripts/convert-states-webp.mjs` (převede + smaže originál).
