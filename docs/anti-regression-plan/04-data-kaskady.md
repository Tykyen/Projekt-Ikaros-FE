# 04 — Data & kaskády (znovu-leak po smazání / integrita)

> Nálezy, kde regrese = osiřelý blob, dangling ref nebo nekonzistentní DB. Klíčová osa `CLASS` — tyhle
> nálezy mívají **jeden kořen** a víc instancí; chránit kořen, ne jednu instanci. Osy: `EX` `CLASS` `TEETH`.

## Cílové nálezy
| ID | Audit | Co | Pojistka dle registru | Podezření |
|---|---|---|---|---|
| CD-01..04 | cascade-delete | blob leak + dangling scéna | opraveno, **M-SCAN neběžel** (DB) | 🔴 existenci pojistky nelze potvrdit |
| CD-08/09 | cascade-delete | + testy | ověřit AIM | |
| DI-01..05 | db-integrity | string FK, TYPE drift, pending refs | M-TYPE/M-SCAN **neběžel** | 🔴 bez živé pojistky |
| DI-02 | db-integrity | sekundární refs nevalidované | **vědomě neopraveno** | by-design? potvrdit + dluh |
| F-01 | form-schema | reset hesla rozbitý | opraveno, kontraktový test | ověřit živost (FE G1?) |
| F-02 | form-schema | XSS timeline | opraveno | 🔴 cílený XSS test? |
| F-03 | form-schema | GDPR souhlas | opraveno | test? |
| F-27 | form-schema | username drift | opraveno, kontraktový test | |
| UM-01 | upload-media | SVG ven z whitelistu | opraveno | magic-byte test? |
| UM-02 | upload-media | privátní media veřejná URL | ⚖️ dluh D-NEW-UM02 | akceptováno |
| UM-03..09 | upload-media | orphaned blob cleanup | opraveno, **orphan-scan čeká Cloudinary** | L7 infra limit |

## Checklist
1. **Oživit M-SCAN/M-TYPE** (cascade + db-integrity) — paměť říká „blokován chybějící DB connection"
   ([project_db_integrity_audit], [project_cascade_delete_audit]). Zjistit, jestli jde spustit proti
   `MongoMemoryReplSet` (vzor race/seed-scenario harness) → povýší CD/DI z G0 na G2.
2. **CD-01..04 CLASS** — orphan blob má generický kořen (`media.orphaned` event, UM). Ověř, že kořen
   pokrývá i cascade cestu, ne jen upload → jinak `AR-xx` CLASS gap.
3. **F-02 XSS** — cílený test, že timeline sanitizuje? Bez něj G0 (XSS regrese tichá a kritická).
4. **DI-02** — potvrdit „vědomě neopraveno" jako ⚖️ + zapsat do dluhu s pojistkou „integrity-scan flag",
   ne nechat viset.
5. UM orphan-scan = L7 (potřebuje Cloudinary API) → syntetický test na cleanup logiku v repu, reálný scan
   akceptovat jako infra-limit.

## Seed kandidáti
- **K-AR4** 🔴 `EX`/`TEETH` — CD-01..04 M-SCAN neběžel.
- **K-AR8** 🟠 `CLASS` — orphan blob kořen vs instance.
- **K-AR9** 🟠 `LIVE` — DI integrity scan neběžel.

## Výstup
- M-SCAN/M-TYPE oživené (nebo dokumentovaný blok). CD/DI/F-data/UM na G2/G3.
- F-02 XSS cílený test (Fáze B). DI-02 → dluh.
