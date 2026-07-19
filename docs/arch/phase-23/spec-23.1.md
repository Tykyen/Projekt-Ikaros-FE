# Spec 23.1 — Zálohy s off-site cílem + test obnovy

**Stav:** schváleno uživatelem 2026-07-19 · implementováno (čeká na B2 setup + první běh)
**Karta:** roadmap3 fáze 23, karta 23.1 · **Původ:** roadmap2 karta 14.4 + dluh D-DB-BACKUP-CRON

## Problém

`db-backup.yml` (FE repo) uměl mongodump+gzip+retenci+diskovou pojistku, ale: běžel jen ručně (`workflow_dispatch`), záloha ležela na TOMTÉŽ disku jako Mongo (disk s incidenty 07/2026) a obnova nebyla nikdy otestována. „Záloha", která nepřežije smrt disku a nikdy nebyla obnovena, není záloha.

## Rozhodnutí

- **Off-site cíl = Backblaze B2** (rozhodnuto v roadmapě: S3-kompatibilní, pro naše objemy ~zdarma, rclone nativní podpora).
- **Upload server → B2 přímo** přes rclone v SSH kroku workflow. Zamítnutá alternativa: stažení do runneru a upload odtud (data 2×, mezikrok navíc).
- **Žádný secret na serveru:** rclone se konfiguruje čistě env proměnnými (`RCLONE_CONFIG_B2_*`) poslanými přes SSH stdin — na serveru nezůstává config ani klíč, v argv procesů se neobjeví.
- **Restore drill = samostatný workflow, měsíčně** — ne jednorázový test. Obnovuje do čistého `mongo:7` (verze prod dle `docker-compose.prod.yml`) v efemérním GitHub runneru; hlídá i stáří zálohy < 48 h (= důkaz, že denní cron reálně běží).
- **Selhání → Discord** přes stávající ops webhook (`DISCORD_ALERT_WEBHOOK`, tentýž URL jako BE alerty, přidán jako GitHub secret).

## Zásahy

| # | Soubor | Změna |
|---|---|---|
| 1 | FE `.github/workflows/db-backup.yml` | `schedule:` cron 02:00 UTC (~04:00 léto) · rclone auto-instalace na serveru · upload do B2 `mongo/daily/` + ověření velikosti · neděle → server-side kopie do `mongo/weekly/` · B2 retence `--min-age 8d`/`29d` s `--b2-hard-delete` · fail-fast bez B2 secrets · Discord alert při selhání |
| 2 | FE `.github/workflows/db-restore-drill.yml` **(nový)** | měsíčně (1. den 03:30 UTC) + ručně: stáhne nejnovější daily z B2 → kontrola stáří → `mongo:7` kontejner → `mongorestore` → verifikace (počty kolekcí, users/worlds neprázdné) → Discord souhrn (časy download/restore) |
| 3 | BE `docs/ops-runbook.md` §6 | přepsán: nový stav, postup ostré obnovy, časy z prvního drillu (doplnit po běhu) |

## Konfigurace (GitHub, FE repo)

- secrets: `B2_KEY_ID`, `B2_APP_KEY` (application key omezený na bucket), `DISCORD_ALERT_WEBHOOK`
- vars: `B2_BUCKET`
- B2 bucket: privátní, SSE zapnuté, lifecycle „Keep only the last version" (pojistka k `--b2-hard-delete` — B2 jinak mazané soubory jen skrývá a účtuje dál)

## Retence (7 denních + 4 týdenní)

- `daily/` — smazat > 8 dní → vždy 7–8 denních
- `weekly/` — kopie každou neděli, smazat > 29 dní → 4 týdenní (v neděli krátce 5)
- lokálně na serveru posledních 5 (rychlý přístup, NENÍ to záloha — tentýž disk)

## Vědomě nekryto

`uploads-data` volume (média primárně na Cloudinary = off-site z podstaty) a Meili (reindexuje se při startu BE). Známé chování GitHub cronu: zpoždění v řádu desítek minut; po 60 dnech bez aktivity repa se scheduled workflow vypne (zapsáno v runbooku).

## Ověření

První ostrý běh: ① ruční dispatch `db-backup.yml` → soubor v B2 `daily/` · ② ruční dispatch `db-restore-drill.yml` → zelený verify + Discord souhrn · ③ časy z drillu zapsat do runbooku §6 · ④ druhý den zkontrolovat, že cron běžel sám.
