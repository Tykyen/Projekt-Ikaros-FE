# Technické dluhy

> Soubor obsahuje **pouze otevřené a odložené** dluhy.
> Historie uzavřených dluhů dohledatelná v git logu (`git log --all -- docs/dluhy.md`).
> Stav k **2026-07-19**. Vyřešené se **mažou**
>
> ⚠️ **Než něco z tohoto souboru začneš řešit, ověř to proti HEAD.** Zdroj pravdy je kód, ne report.
>
> 🔄 **2026-07-19 — všechny tehdy otevřené dluhy překlopeny do [`roadmap3.md`](roadmap3.md)** (po ověření 15/15 proti HEAD):
> D-DB-BACKUP-CRON → karta 23.1 · D-DIARY-HP-DELTA+D-073 → 29.1 · D-HP-MAP-SYSTEMS → 29.2 · D-DICE-SERVER-RNG → 29.3 · D-MEILI-CZ → 29.4 · D-PERF-BE → 29.5 · D-NEW-UM10+D-19.2-BYTES → 29.6 · D-NEW-UM02 → 29.7 · D-NEW-color-tokens → 29.8 · D-19.1-RETENCE → 28.2+29.9 · D-NEW-PC21 → 29.10 · D-NEW-chat-presence-scale → 30.2 · D-RT-SCALE → 30.1 · D-063 (+content-erasure) → 31.1.
> Původní plné texty: git log tohoto souboru (commit před 2026-07-19).
>
> **Nové dluhy se dál zapisují sem** (skill `dluh`); při revizi roadmapy se překlápí do příslušné fáze roadmap3.

---

## Otevřené

### D-075 — Emoji picker tahá data z cizí CDN místo self-hostu

**Soubor:** `src/features/chat/components/EmojiPickerPopover.tsx` (knihovna `frimousse`) + `default.conf.template` (CSP `connect-src`)
**Problém:** `frimousse` si pro **plnou paletu** emoji `fetch`uje `emojibase-data` z `https://cdn.jsdelivr.net/npm/emojibase-data@…`; projekt nikde nepředává prop `emojibaseUrl`, takže jede default. Do 24.2 to CSP `connect-src` blokovala → paleta visela na „Načítám…". Nevšiml si toho nikdo, protože lokální český quick-pick (`czechEmoji.ts`, ~120 emoji) fungoval dál a picker se tvářil funkčně.
**Dopad:** Nízký — funkčně opraveno (24.2 přidala doménu do `connect-src`, JEN connect, ne script-src). Zbývající dluh je **provozní a bezpečnostní**: závislost na dostupnosti cizí CDN (výpadek jsdelivr = rozbitá paleta), zbytečně rozšířený CSP whitelist a odchozí požadavek na třetí stranu z pohledu soukromí uživatele.
**Řešení:** Stáhnout `emojibase-data` do `public/` (jen potřebné locale) a předat `EmojiPicker.Root` prop `emojibaseUrl` mířící na vlastní origin. Pak vrátit `cdn.jsdelivr.net` z `connect-src` pryč. Bonus: funguje offline a rychleji.
**Kdy:** Až se bude sahat na chat nebo řešit soukromí/třetí strany (GDPR revize). Není urgentní — funkčnost je obnovená.

---

---

## Odložené (čeká na trigger)

*(žádné — trigger-based položky žijí jako karty ⏳ ve fázích 29–30 roadmap3)*
