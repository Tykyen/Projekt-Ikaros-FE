# Spec 19.2 — Počítadla nákladů (storage / provoz) — jen měřit

**Stav:** návrh (2026-07-08, čeká schválení) · **Fáze:** 19 · **Roadmap:** [§19.2](../../roadmap2.md) [Příloha B]
**Závislosti:** sdílí BE modul `admin` (admin-stats) a FE `OverviewTab` s [19.1](spec-19.1.md). Vzor cache = 15B.7.
**Repozitáře:** BE (agregace + volitelně Cloudinary usage) + FE (sekce v Přehledu). **Jen měřit — žádné vynucování kvót** (to je další krok roadmapy, potvrzeno uživatelem 2026-07-08).
**Zobrazuje se v:** Administrace → Přehled, sekce „Náklady". Guard `AdminGuard`.

📚 **Blob** = nahraný soubor (obrázek, PDF). **Cloudinary** = externí služba, kde bydlí nahrané obrázky; účtuje se dle uloženého objemu a přenosu.

---

## 0. Účel jednou větou

Admin vidí, **kolik obsahu platforma drží a co ji provozně stojí** — počty nahraných blobů (per typ i per nejnáročnější svět), přesné byty tam, kde je známe, a volitelně skutečné využití Cloudinary účtu.

## 1. Zásadní zjištění z auditu kódu (2026-07-08) — mění scope

| # | zjištění | důsledek |
|---|---|---|
| **Z1** | **AI (Fáze 18) NEEXISTUJE.** Žádná generativní AI, žádné OpenAI/Anthropic, žádné tokeny. Jediné „AI-ish" = lokální ONNX embedding search (bez API, bez tokenů, neloguje kdo/kolik). | **„AI limity" z roadmapy vypadávají** — není co měřit. Zmínit jako „až Fáze 18". |
| **Z2** | **Velikost obrázků v bytech se do DB NEUKLÁDÁ.** Galerie, mapy, taktické scény, emotes, avatary, world/page/news obrázky, bestie — všude jen `imageUrl`/`publicId`, nikdy `bytes`. `UploadedImage` typ `size` vůbec nemá. | **Storage v bytech nelze dopočítat z DB** pro obrázky. Jen **počet souborů** (`countDocuments`). |
| **Z3** | **Byty známe jen na 2 místech:** chat přílohy (`chat-message.attachments[].size`) a admin PDF (`platform-document.sizeBytes`). | Přesné MB jen pro tyto dvě kategorie. |
| **Z4** | Storage backend = **Cloudinary** (`CLOUDINARY_URL`), disk-fallback do `backend/uploads/`. Skutečné byty účtu vrací **Cloudinary Admin API `/usage`** (1 volání: storage, bandwidth, transformace, kredity). | Volitelná sekce „skutečný provoz" — když creds jsou; jinak skrytá. Externí volání → cache 1 h. |
| **Z5** | Žádné počítadlo kvóty neexistuje (`D-NEW-UM10` = jen upload rate-limit UM-10, nic nesčítá). Zvuky = jen `youtubeUrl` (nulový storage). Dungeon mapy = procedurální JSON (žádný blob). | Kvóty/vynucení mimo scope (další krok). Zvuky/dungeony do počtu blobů nepatří (nejsou Cloudinary). |

## 2. Rozsah (co měříme teď) — tři vrstvy

### Vrstva A — počty blobů (čistě odvozené z DB, vždy dostupné)
`countDocuments` na kolekcích s `imageUrl`, seskupené podle typu a podle `worldId`:

| Typ blobu | Kolekce | Vazba | Poznámka |
|---|---|---|---|
| Galerie (platform) | `ikaros_gallery` | uživatel (`authorId`) | platformová, ne svět |
| Mapy světa (atlas) | `world_map_entries` | svět (`worldId`) | |
| Taktické scény | `map_scenes` | svět (`worldId`) | jen kde `imageUrl != ''` |
| Emotes | `custom_emotes` | svět/globální (`worldId`) + `createdBy` | |
| Obrázky stránek | `pages` | svět (`worldId`) | `imageUrl` + `galleryImages[]` |
| Bestie | `bestiae` | svět/systém/user | `imageUrl` |
| Avatary světů | `worlds` | svět | `imageUrl` (1×) |
| Ostatní (news/events/timeline) | příslušné | svět/platforma | `imageUrl` |

Výstup: **celkový počet blobů**, **rozpad podle typu**, **top ~10 světů podle počtu blobů** (kdo generuje nejvíc obsahu).

### Vrstva B — přesné byty (odvozené, kde je DB má) (Z3)
- **Chat přílohy:** suma `attachments[].size` napříč `chatmessages` (+ scheduled/global/world/platform-chat). Rozpad per svět (`worldId`).
- **Admin PDF:** suma `platform_documents.sizeBytes` per uploader.
- Výstup: „Přesně změřeno: chat přílohy X MB, dokumenty Y MB" — s poznámkou, že je to jen část celku.

### Vrstva C — skutečný provoz Cloudinary (volitelné, externí) (Z4)
- Když jsou Cloudinary creds: 1× denně (cache 1 h) zavolat Admin API `/usage` → storage (GB), bandwidth (GB), transformace, kredity, plán.
- Když creds chybí (dev/disk-fallback): sekce se **skryje** (žádná chyba, `available:false`).
- Toto je jediné **skutečné číslo nákladů** (byty i přenos celého účtu) — vrstva A/B jsou jen relativní/částečné.

⚠️ **Poctivost UI:** vrstva A jsou počty (ne velikost), vrstva B je jen zlomek storage, vrstva C je celek účtu. UI musí jasně říct, co je co — jinak admin uvěří, že „počet blobů" = náklad.

## 3. BE — endpoint a cache (modul `admin`)

| metoda | routa | guard | odpověď |
|---|---|---|---|
| `GET` | `/admin/stats/costs` | `AdminGuard` (Admin+) | `CostStats` (§4) |

- **Cache:** in-memory TTL **1 h** (počty i Cloudinary usage se mění pomalu; chrání DB i Cloudinary rate-limit). Vzor `AnalyticsService`.
- **Cloudinary usage** přes existující SDK v `upload` modulu (`cloudinary.api.usage()`); obalit try/catch → `available:false` při chybě/chybějících creds. **Nikdy nesmí shodit endpoint** (externí závislost).
- Bez query parametrů (costs jsou aktuální stav, ne období).

## 4. CostStats (BE DTO = FE typ)

```ts
interface CostStats {
  generatedAt: string;
  blobs: {                                   // vrstva A — počty
    total: number;
    byType: { type: string; count: number }[];
    topWorlds: { worldId: string; worldName: string; count: number }[]; // ~10
  };
  measuredBytes: {                           // vrstva B — kde je známe
    chatAttachments: number;                 // bytes
    adminDocuments: number;                  // bytes
  };
  cloudinary: {                              // vrstva C — volitelné
    available: boolean;
    storageBytes?: number;
    bandwidthBytes?: number;
    transformations?: number;
    credits?: { used: number; limit: number };
    plan?: string;
  };
  ai: { available: false };                  // Z1 — placeholder, „až Fáze 18"
}
```

## 5. FE — sekce v OverviewTab

Nová sekce **„Náklady"** v [OverviewTab](../../../src/features/admin/components/OverviewTab/OverviewTab.tsx), za „Růst & retence" (19.1). Komponenta `src/features/admin/components/CostsSection/`:

- **Cloudinary blok** (jen když `available`): karty Storage · Přenos · Transformace · Kredity (bar použito/limit). Když `available:false` → decentní řádek „Cloudinary usage nedostupné (dev/bez creds)".
- **Počty blobů:** karta „Celkem blobů" + rozpad podle typu (horizontální bary) + top světy (list `worldName → count` s barem). Popisek: „počet souborů, ne velikost".
- **Přesně změřeno:** malý blok „Chat přílohy X MB · Dokumenty Y MB" s tooltipem „jediné kategorie s přesnou velikostí".
- **AI:** decentní řádek „AI zatím nezavedeno (Fáze 18)".
- Hook `useCostStats()` (vzor `useAdminStats`, `staleTime` 5 min, key `adminKeys.costs`). Bez období.
- Loading skeleton + error. **Mobil:** karty 2→1 sloupec, top-světy list plná šířka. `mobil-desktop` audit.

## 6. Bezpečnost & soukromí

- **Jen Admin+** (`AdminGuard`). Žádné PII — jen počty a agregované byty; `worldName` je veřejný název světa.
- Cloudinary usage = data o účtu provozovatele, ne o uživatelích. Bezpečné pro admina.
- Costs endpoint nic nemění (read-only), žádné mazání/vynucení.

## 7. Mimo záběr / budoucí (dluh)

- **Vynucování kvót** (blok/upozornění při překročení) — **další krok roadmapy** (potvrzeno uživatelem). Vyžaduje ukládat `bytes` při uploadu (D-19.2-BYTES) + kvótu per svět/uživatel + gate v upload cestě.
- **Storage v bytech per obrázek (D-19.2-BYTES):** přidat `bytes` (z Cloudinary `result.bytes` / `file.size`) do image schémat při uploadu → přesná velikost per svět/uživatel. Retroaktivně nepokryje staré bloby.
- **AI počítadla** — až bude Fáze 18 (generativní AI). Placeholder `ai.available:false` je připraven.
- **Per-svět Cloudinary rozpad** — Cloudinary `/usage` je account-level; per-svět jde jen přes folder konvenci + Admin API search (drahé) → dluh, ne teď.

## 8. Testy

- **BE** `admin-stats.service.spec` (rozšíření): blob counts per typ/svět (seed), suma chat attachment bytes (seed zpráv s `attachments[].size`), admin PDF bytes, Cloudinary usage mock (available true/false), cache TTL 1 h. Cloudinary chyba → `available:false`, endpoint nespadne.
- **FE** `CostsSection.test`: data → Cloudinary karty / počty / přesné byty; `available:false` → skrytý Cloudinary blok; loading; error. Vitest bez globals.
- Build zelený.

## 9. Ops & dotčené soubory

**BE (změna):** `admin-stats.service.ts` (`getCosts`), `admin.controller.ts` (route), `admin.module.ts` (přístup k modelům galerie/map/emotes/pages/bestie/chat/platform-document + `cloudinary` SDK z upload modulu), nové `dto/cost-stats.dto.ts`. **Restart BE nutný.**
**FE (nové):** `src/features/admin/components/CostsSection/{CostsSection.tsx,*.module.css,__tests__/}`, `api/{useCostStats.ts,costs.types.ts}`. **FE (změna):** `OverviewTab.tsx`, `adminKeys.ts` (`costs` key).
**Env:** žádné nové (Cloudinary creds už jsou; při absenci vrstva C skrytá).
**Docs:** `roadmap2.md` (19.2 náklady zaškrtnout + oprava dvojího čísla), `docs/funkce/`, `dluhy.md` (D-19.2-BYTES).
