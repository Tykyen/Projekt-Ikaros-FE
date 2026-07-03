# Seznam snímků pro manuál „Vize platformy" — co nafotit

Cílem je ukázat **uživateli i partnerům, co dnes platforma reálně nabízí** (Část II) a navodit budoucnost (Část IV). Důraz: **funkce a co z nich má uživatel.**

## Jak fotit (důležité — ať to vypadá profesionálně)

- **Bohatý obsah, ne prázdné obrazovky.** Foť v naplněném světě (např. Matrix) s reálnými stránkami, postavami, mapou, chatem. Prázdná appka vypadá mrtvě.
- **Jednotný skin** napříč většinou snímků (doporučuju hlavní fialový „ikaros") — kromě snímku S-MOTIVY, kde naopak ukaž rozmanitost.
- **Skryj osobní údaje** (reálné e-maily, soukromé zprávy) — použij demo účet / zacloumej citlivé.
- **Rozlišení:** desktop ~1500–1700 px na šířku, čisté (klidně schovej lištu prohlížeče). Mobil = portrét ~390–430 px.
- **Formát:** PNG. **Pojmenování:** přesně podle ID níže (`S02-prihlaseni.png` …) a ulož do `docs/vize/img/`. Podle názvu je sám zařadím do správných slotů.
- Není nutné nafotit vše naráz — začni 🔴 **must-have** (největší dopad), 🟡 doplníme později.

---

## 🔴 Must-have — jádro „co nabízíme" (priorita 1)

| ID | Co zachytit | Kde (cesta) | Stav na snímku | Zařízení |
|---|---|---|---|---|
| S-HERO | Nejhezčí celkový dojem — dashboard světa nebo taktická mapa (na obálku/úvod) | `/svet/:slug` nebo `/takticka-mapa` | „takhle to žije" | desktop |
| S38-mapa-boj | **Taktická bojová mapa** — tokeny PC/NPC/bestie + mlha války + lišta iniciativy | `/svet/:slug/takticka-mapa` | rozehraný souboj | desktop |
| S24-dashboard | Úvodní strana světa (3 sloupce: akce / novinky / oblíbené) | `/svet/:slug` | naplněný svět | desktop |
| S30-wiki | Wiki/encyklopedická stránka světa (bohatá lore: text, obrázek, odkazy) | `/svet/:slug/:stranka` | hezká lore stránka | desktop |
| S32-akj | **Utajené záložky (AKJ)** — ideálně zamčená 🔒 i odemčená vedle sebe (2 snímky: `S32a-akj-zamceno`, `S32b-akj-odemceno`) | wiki stránka s AKJ | zámek + obsah | desktop |
| S33-denik | **Deníkový list postavy** v českém systému (Dračí doupě / Jeskyně a draci / Dračí hlídka) | postava → deník | vyplněný list | desktop |
| S35-bestiar | Bestiář — katalog statbloků | `/svet/:slug/bestiar` | plný katalog | desktop |
| S37-chat-svet | Chat světa — **hraní za postavu** (avatar + jméno postavy, kanály) | `/svet/:slug/chat` | konverzace za postavy | desktop |
| S44-kalendar | Herní kalendář s nebeskými tělesy / sezónami | `/svet/:slug/kalendar` | naplněný měsíc | desktop |
| S47-pavucina | Pavučina — graf vztahů postav/lokací/úkolů | `/svet/:slug/pavucina` | propojený graf | desktop |
| S-MOTIVY | Montáž 3–4 různých skinů/motivů (ukázat rozmanitost 21+ témat) | různé světy/motivy | 3–4 výřezy | desktop |
| S50-mobil | Mobilní pohled — chat nebo deník postavy na telefonu | libovolná klíčová obrazovka | portrét | **mobil** |

---

## 🟡 Nice-to-have — doplní hloubku (priorita 2)

| ID | Co zachytit | Kde (cesta) | Zařízení |
|---|---|---|---|
| S07-uvodnik | Úvodní stránka platformy (přihlášený) | `/` | desktop |
| S08-svety | Seznam vesmírů / objevování světů | `/ikaros/vesmiry` | desktop |
| S09-tvorba | Průvodce tvorbou světa (volba systému/magie) | `/ikaros/vytvorit-svet` | desktop |
| S40-vesmir | Vesmírná 3D mapa | `/svet/:slug/mapa` | desktop |
| S41-atlas | Obrázkový atlas map | `/svet/:slug/mapy` | desktop |
| S45-timeline | Časová osa světa | `/svet/:slug/timeline` | desktop |
| S46-pocasi | Generátor počasí (efekty / na mapě) | `/svet/:slug/pocasi` | desktop |
| S48-storyboard | Storyboard / scénáře | `/svet/:slug/scenare` | desktop |
| S36-obchod | Obchod + převodník měn | `/svet/:slug/obchod` | desktop |
| S25-hraci | Správa hráčů + role ve světě | nastavení → členové | desktop |
| S03-2fa | Nastavení 2FA (QR + záložní kódy) | profil → bezpečnost | desktop |
| S04-profil | Veřejný profil uživatele (vyplněný) | `/ikaros/uzivatel/:id` | desktop |
| S14-hospoda | Globální chat „Hospoda" | `/chat` | desktop |
| S15-camp | Camp (atmosférická místnost) | `/chat/camp` | desktop |
| S10-clanky | Články (přehled nebo detail) | `/ikaros/clanky` | desktop |
| S11-galerie | Galerie | `/ikaros/galerie` | desktop |
| S12-diskuze | Diskuze (vlákno) | `/ikaros/diskuze` | desktop |
| S22-search | Vyhledávání / Ctrl+K paleta | kdekoli (Ctrl+K) | desktop |
| S20-admin | Admin panel — přehled se statistikami | `/admin` | desktop |
| S17-push | Push notifikace na telefonu (bublina) | telefon (PWA) | **mobil** |
| S19-napoveda | Stránka Nápověda (6 tabů) | `/ikaros/napoveda` | desktop |
| S31-editor | Editor stránky (TipTap, vkládání) | `/svet/:slug/nova-stranka` | desktop |

---

## Část IV (Vize) a Část III (konkurence)

- **Vize (budoucí funkce)** nemají reálné snímky — sloty tam nechám jako elegantní „koncept" rámečky, nebo k nim mohu udělat jednoduché schéma. Volitelně: pro „fórovku" lze použít snímek dnešního chatu světa (S37) jako základ.
- **Konkurence** je tabulková/analytická — snímky nepotřebuje (tahle část zůstává štíhlá dle tvého zadání).

> Až nafotíš, hoď soubory do `docs/vize/img/` pod uvedenými názvy. Já je zasadím do slotů, doladím popisky a přerenderuju finální PDF.
