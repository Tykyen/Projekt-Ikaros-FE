# Upload / media audit — plán (11. styl auditu)

> **Cílová otázka:** *Nahraje se jen co má, smí to jen kdo má, zůstane privátní co má — a uklidí se po smazání?*

Read-only sweep upload/media vrstvy (Cloudinary + disk fallback) napříč FE i BE. Navazuje na předchozí audity ([cascade-delete](../cascade-delete-audit.md) řešil blob cleanup při *delete*; tenhle audit jde dál — **replace orphan, validace, privacy, injection**).

## Mapa

| Soubor | Pokrývá | Hlavní osy |
|---|---|---|
| [`00-cross-cutting.md`](00-cross-cutting.md) | storage architektura · upload inventory matice · validační vrstvy · blob lifecycle · privacy model · tooling (M-INV/M-PROBE/M-IDOR/M-ORPHAN/FZ) | všechny |
| [`01-avatary.md`](01-avatary.md) | user + character avatar (5 MB, `public_id:main` overwrite) | DL, TV, AU |
| [`02-chat-prilohy.md`](02-chat-prilohy.md) | world + global chat (10/50 MB), cron cleanup, message ACL | AU, DL, PV, IJ |
| [`03-emotes.md`](03-emotes.md) | world + global emote (512 KB), TOCTOU shortcode→orphan | RC, DL, TV |
| [`04-obsah.md`](04-obsah.md) | hero/page/galerie/news/timeline/game-event, replace orphan, duplicitní hooky | DL, OR, CT, AU |
| [`05-mapy-tokeny.md`](05-mapy-tokeny.md) | mapa background + token image — **privátní mapy** | PV, DL |
| [`06-privatni-media.md`](06-privatni-media.md) | bezpečnostní jádro: signed URL? SVG XSS? IDOR? AKJ obrázky? | PV, AU, IJ |
| [`07-infra-fallback.md`](07-infra-fallback.md) | disk fallback `/static/`, GDrive bloby, rate-limit, magic bytes, EXIF, dekomprese | FB, TV, EX, SZ, RL |

Registr nálezů: [`../upload-media-audit.md`](../upload-media-audit.md).

## Postup sweepu

1. **00 napřed** — postavit `M-INV` matici (strojový sken endpointů × validace × cleanup), ta vygeneruje drift kandidáty pro oblasti.
2. **Oblasti 01–05** entity-based — pro každý touchpoint ověřit create → replace → delete → render.
3. **06 bezpečnostní jádro** napříč — PV/AU/IJ; sem konvergují nejtěžší nálezy (🔴).
4. **07 infra** — fallback, validace, kvóty.
5. **Maximum vrstva** (volitelně dle dohody) — `M-PROBE` (nahraj podvržené soubory), `M-ORPHAN` (Cloudinary Admin API sken), `FZ`/Stryker.

## Pravidlo zápisu

Jen **přečtené** se píše do registru jako důkaz (Explore shrnutí přestřelují — zkušenost z [db-integrity](../db-integrity-audit.md)). Hypotéza bez ověření zůstává `K-UM` / 🟡.
