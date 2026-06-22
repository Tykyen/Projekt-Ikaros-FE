# Spec 15B.6 — Sociální sdílení & pozvánkové odkazy

**Stav:** ✅ IMPLEMENTOVÁNO 2026-06-22 (FE kód hotový, testy 6/6 zelené, build prošel, mobil-desktop audit OK; **čeká deploy** — BE beze změny, restart netřeba) · **Fáze:** 15B (H2 Objevitelnost / SEO) · **Roadmap:** [15B.6](../../roadmap2.md) [H2-06] · **Navazuje:** [15B.2 meta/sitemap](spec-15B.2-meta-sitemap.md) (OG tagy = náhled při sdílení), [15B.3 JSON-LD](spec-15B.3-json-ld.md) · **Navazuje v UI na:** krok „Pozvi přátele" z anon homepage (15.7)

**Cíl:** Z detailu světa jde jedním tapem **sdílet pozvánkovou URL** (`/svet/:slug`). Na mobilu nativní share sheet, na desktopu kopírování + přímá sharer-URL na Facebook/X. Sdílí se **holá URL** — žádné API klíče, žádný OAuth. Náhled (obrázek + titulek) si síť stáhne z OG meta tagů (15B.2).

📚 **Web Share API** (`navigator.share()`) = prohlížečové API, které otevře **nativní** systémové sdílení (mobil/PWA) → uživatel sám vybere cílovou app. Dostupné hlavně na mobilech a v PWA; na desktopu většinou chybí → fallback.
📚 **Sharer-URL** = veřejný GET endpoint sítě (`facebook.com/sharer/sharer.php?u=…`, `twitter.com/intent/tweet?url=…`), který otevře předvyplněný dialog sdílení. Žádná autorizace, jen URL v query.

---

## 0. Rozhodnutí z brainstormingu (2026-06-22, schváleno)

| # | rozhodnutí | volba | proč |
|---|---|---|---|
| R1 | **Co se sdílí** | **jen detail světa** `/svet/:slug` | wiki články/galerie jsou `member only` (route za auth) → neveřejné/neindexovatelné, sdílení ven nemá akviziční smysl. Vitrína 17.3 zatím neexistuje. |
| R2 | **Web Share vs sharer vs copy** | **adaptivně**: mobil/PWA → nativní `navigator.share`; desktop → menu (Kopírovat · Facebook · X) | nativní sheet je standardní mobilní vzor (1 tap); desktop `navigator.share` většinou chybí → explicitní sharer tlačítka. |
| R3 | **Fallback** | **Kopírovat odkaz** vždy dostupný (i v nativním menu jako jistota) | univerzál, funguje bez Web Share i bez sociálních sítí. |
| R4 | **Per-svět generovaná OG karta** | **NE** | 15B.2 už předává `image={world.imageUrl}` → náhled funguje. Kompozitní karta (název+žánr přes canvas/satori na BE) = mimo „náklad malý". → pozdější bod. |
| R5 | **Umístění** | tlačítko v rohu `WorldDetailHero` | hero se renderuje pro membera i non-membera → sdílení z detailu vždy po ruce (member „pozvi přátele", non-member „šíř objev"). Jedno místo = malý náklad, bez duplicit. |
| R6 | **Reuse menu** | sdílený `KebabMenu` (desktop popover + mobil bottom-sheet, hotové) | netvořit nový popover; konzistence s ostatními „akce" menu. |
| R7 | **Sharer sítě** | Facebook + X (Twitter) | dvě nejběžnější veřejné sharer-URL bez OAuth. WhatsApp/IG/… pokryje nativní share na mobilu. |
| R8 | **BE změna** | **žádná** | sdílení je čistě FE; OG infra (15B.2) i `world.imageUrl` už existují. |

**Záběr proti roadmapě:** roadmapa jmenuje detail světa + vitrínu (17.3) a fallback copy. Reálný povrch teď = **jen detail světa** (R1); vitrína se napojí, až vznikne. „Sdílení achievementů" je v roadmapě explicitně mimo záběr.

---

## 1. Architektura

```
WorldDetailHero (member i non-member)
┌───────────────────────────────────────────────┐
│ [badges]                        <ShareButton> │  ← roh hero
│ {world.name}                                   │
└───────────────────────────────────────────────┘
        │ klik
        ▼
 navigator.share?  ── ano (mobil/PWA) ─→ nativní share sheet
        │ ne (desktop)
        ▼
 <KebabMenu> ── Kopírovat odkaz (clipboard + toast)
            ── Facebook   (window.open sharer-URL)
            ── X          (window.open intent-URL)
```

Sdílená URL = `${window.location.origin}/svet/${world.slug}` (absolutní, runtime origin — shodně s canonical/JSON-LD z 15B.2/3).

---

## 2. Komponenta `ShareButton`

**Cesta:** `src/shared/ui/ShareButton/ShareButton.tsx` (+ `.module.css`, `index.ts`) — sdílený primitiv (znovupoužitelný pro budoucí vitrínu 17.3).

**Props:**
```ts
interface ShareButtonProps {
  url: string;        // absolutní URL ke sdílení
  title: string;      // název (Web Share `title` + sharer text)
  text?: string;      // delší popis pro nativní share (volitelný)
  className?: string;
}
```

**Chování:**
- Render: `<button>` „Sdílet" + ikona `Share2` (lucide). `aria-label="Sdílet"`.
- Klik:
  - `navigator.share` **i** `navigator.canShare?.({url})` true → `await navigator.share({ title, text, url })`. `AbortError` (uživatel zrušil) = tiše ignorovat; jiná chyba → fallback otevřít menu.
  - jinak → otevřít `KebabMenu` (anchor = tlačítko) s položkami:
    - **Kopírovat odkaz** (ikona `Link`) → `navigator.clipboard.writeText(url)` + `toast.success('Odkaz zkopírován')`, chyba → `toast.error('Kopírování selhalo')`.
    - **Facebook** (ikona `Facebook`) → `window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url), '_blank', 'noopener,noreferrer')`.
    - **X** (ikona `Twitter`) → `window.open('https://twitter.com/intent/tweet?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(title), '_blank', 'noopener,noreferrer')`.

⚠️ `window.open` bez `noopener` = bezpečnostní díra (otevřená stránka může přes `window.opener` přesměrovat původní záložku — reverse tabnabbing). Vždy `noopener,noreferrer`.

⚠️ Web Share API i Clipboard API vyžadují **secure context** (HTTPS/localhost) a `navigator.share` musí běžet z **user gesture** (klik) — splněno, voláme přímo v `onClick`.

---

## 3. Integrace do `WorldDetailHero`

- Přidat `<ShareButton>` do `s.content` headeru (roh, např. absolutně pozicovaný top-right nad overlay, nebo do řady `s.badges`).
- `url = ${origin}/svet/${world.slug}`, `title = world.name`, `text = metaDescription(world.description) ?? undefined`.
- Tlačítko viditelné vždy (member i non-member). Žádné gating rolí — pozvánková URL je veřejná podstata kroku.

⚠️ `WorldDetailHero` dnes nemá přístup k `origin` — spočítat `window.location.origin` uvnitř komponenty (vzor z `WorldDashboardPage`/`Seo`).

---

## 4. Responsivita

- Mobil ≤ 768px: `navigator.share` typicky dostupné → nativní sheet; tlačítko musí být tap-friendly (≥ 40px), nepřekrývat název v hero.
- Desktop > 1024px: `KebabMenu` popover ukotvený k tlačítku.
- KebabMenu mobil fallback (bottom-sheet) se uplatní jen na zařízeních bez Web Share — funguje out-of-the-box.
- Po grafické úpravě → skill `mobil-desktop`.

---

## 5. Testy (vitest, bez globals, explicit importy, `fireEvent`)

`src/shared/ui/ShareButton/ShareButton.test.tsx`:
1. **desktop fallback** (`navigator.share` undefined) → klik otevře menu se 3 položkami.
2. **Kopírovat** → volá `clipboard.writeText(url)` + `toast.success` (mock obojí).
3. **Facebook/X** položky → `window.open` voláno se správnou sharer-URL (mock `window.open`, ověřit `encodeURIComponent`).
4. **nativní share** (`navigator.share` mock) → klik volá `navigator.share({title,text,url})`, menu se NEotevře.
5. **AbortError** z `navigator.share` → tiše bez chyby (žádný `toast.error`).

---

## 6. Co se NEdělá (vědomě)

- ❌ Sdílení wiki článků/galerií (member only, neveřejné) — R1.
- ❌ Generovaná per-svět OG karta (BE render) — R4, případně pozdější bod.
- ❌ Sdílení achievementů (roadmapa explicitně mimo záběr — systém úspěchů neexistuje, herní obsah je privátní).
- ❌ BE změna jakákoli — R8.
- ❌ Vitrína (17.3) — `ShareButton` je ale navržen znovupoužitelně, napojí se až vznikne.

---

## 7. Po implementaci

- [ ] Zaškrtnout 15B.6 v `docs/roadmap2.md` + doplnit `> ✅ Implementováno` blok.
- [ ] `funkce` (inventura) + `napoveda` (hráčský výtah — nové „Sdílet" tlačítko).
- [ ] `mobil-desktop` audit.
- [ ] Build (`npm run build`) + testy zelené před push.
