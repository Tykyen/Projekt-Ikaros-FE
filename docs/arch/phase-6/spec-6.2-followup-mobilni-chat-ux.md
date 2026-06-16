# Spec 6.2-followup — Mobilní chat UX + Ikaros branding

**Status:** ✅ Implementováno
**Rozsah:** FE (chat composer + zprávy + hlavička konverzace + PWA ikony + service worker)
**Repo:** `Projekt-ikaros-FE`
**Datum:** 2026-06-16
**Autor:** PJ + Claude
**Souvisí:** [spec-6.2.md](spec-6.2.md) (composer + per-svět vzhled), [sw.js](../../../public/sw.js), [manifest.webmanifest](../../../public/manifest.webmanifest)

> Balík drobných UX oprav chatu na mobilu nahlášených z testování + výměna brand symbolu (okřídlený Ikaros) pro PWA a notifikace.

---

## 1. Chat dlaždice nad fold (úvodní strana světa)

Na mobilu byla dlaždice Chat až pod velkým boxem Akce. Přehozeno pořadí
grid-areas v [WorldDashboard.module.css](../../../src/features/world/pages/WorldDashboardPage/WorldDashboard/WorldDashboard.module.css)
na `hraci → chat → akce → novinky → oblibene`. Jen `@media (max-width: 768px)`.

## 2. Mazání vlastní zprávy (FE bylo přísnější než BE)

[MessageItem.tsx](../../../src/features/chat/components/MessageItem.tsx) ukazoval
koš jen pro `canDelete` (PJ/Admin moderace). BE `chat.service.deleteMessage`
přitom self-delete povoluje (`msg.senderId === requester.id`). Sjednoceno:
podmínka `(canDelete || (isSelf && !isDice))`.
- **Dice výjimka:** BE má dice guard (hod smí mazat jen PJ/Admin) → vlastní hod
  vlastník nemaže, jinak by FE koš narazil na 403.
- Akce na mobilu jsou trvale viditelné (`@media (hover: none)`), koš se tak
  objeví bez hoveru.

## 3. Enter na mobilu = odstavec

Telefon nemá Shift → `Enter` vždy odesílal a nešlo dělat odstavce. Nový hook
[useCoarsePointer.ts](../../../src/features/world/chat/lib/useCoarsePointer.ts)
(`matchMedia('(pointer: coarse)')`). V [ChannelComposer.tsx](../../../src/features/world/chat/components/ChannelComposer.tsx)
`onKeyDown`: na dotyku `Enter` = nový řádek, odesílá jen tlačítko Odeslat.
Desktop beze změny (`Enter` odešle, `Shift+Enter` řádek).

## 4. Paletka „Vzhled mé zprávy" přesunuta do hlavičky

Byla zahrabaná v přeplněném toolbaru composeru. Přesunuta do hlavičky
konverzace ([ChannelView.tsx](../../../src/features/world/chat/components/ChannelView.tsx))
vedle 🔍/❔/👥. [AppearancePopover](../../../src/features/world/chat/components/AppearancePopover.tsx)
dostal prop `placement='up'|'down'` — v hlavičce se otevírá dolů+vpravo
(`@media (min-width:769px) .popover.down`), na mobilu je spodní sheet beze změny.
Odebrán nepoužitý prop `surfaceColor` z composeru.

## 5. Čitelnost na výšku (portrait)

Velikosti písma jsou fixní px laděné pro desktop; landscape telefonu (>768px)
bere desktop styly a vyhovuje, portrait (<768px) byl titěrný. Zvětšeno jen
`@media (max-width: 768px)`:
- zprávy ([MessageItem.module.css](../../../src/features/chat/components/MessageItem.module.css)):
  obsah 17px, jméno 15px, čas 13px, vzdušnější meta, avatar 32px.
- composer ([ChannelComposer.module.css](../../../src/features/world/chat/components/ChannelComposer.module.css)):
  vstup 16px (+ vypne iOS auto-zoom při focusu), tlačítko Odeslat 15px.
- Zprávy s ručně nastavenou velikostí (paletka) si svou velikost drží.

## 6. Ikaros brand symbol (PWA + notifikace)

Zdroj: okřídlená postava 1024×1024. Generátor
[scripts/gen-ikaros-icons.mjs](../../../scripts/gen-ikaros-icons.mjs) (sharp):
- `icons/icon-192.png`, `icon-512.png` (app, any)
- `icons/icon-maskable-512.png` (safe-zone padding ~74 %)
- `favicon.webp`
- `icons/badge-96.png` — **monochromní silueta na průhledném pozadí** (Android
  notifikační badge bere jen alfu).

[sw.js](../../../public/sw.js): `icon` = `icon-192.png`, `badge` = `badge-96.png`.

> Pozn.: PWA app symbol na ploše („základní symbol mobilní aplikace") = stejné
> `icon-*` soubory. Pro instalovanou appku se projeví po reinstalaci/aktualizaci SW.
