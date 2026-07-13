# Spec 21.5d — Hádanky (komunitní katalog) — úrovně + spoiler reveal + seed

> Roadmap: [docs/roadmap2.md](../../roadmap2.md) krok **21.5d** — poslední knihovna Společné tvorby. Dědí model 16.2b-2/21.5a (scope community + knihovny + kurátorství), ale **BEZ statblocků** (hádanka je systémově neutrální) a **BEZ obchodu**.
> **Stav:** 🟢 IMPLEMENTOVÁNO (2026-07-13) — BE modul `riddles` + seed skript (47 ks; U6 mini-einstein po doladění indicií) + FE `/ikaros/hadanky` (poslední stub pryč, všech 9 dlaždic hubu aktivních vč. opravené dlaždice Bestiář). Ověřeno: BE typecheck+lint ✓ · FE build ✓ · vitest. Zbývá: **spustit seed po deployi** (`npx ts-node scripts/seed-riddles/index.ts`) · skiny. Schváleno uživatelem 2026-07-13 po odsouhlasení soupisu [hadanky-seed-21.5d.md](hadanky-seed-21.5d.md).

---

## 1. Účel

Komunitní katalog **hádanek pro PJ** (`/ikaros/hadanky`): zadání + skrytá odpověď + postupné nápovědy + **úroveň obtížnosti** (lehká · střední · těžká · ultratěžká). Startuje se **seedem 48 volných hádanek** (lidová slovesnost, antika, bible, logický folklór — rešerše a copyright pravidla v [hadanky-seed-21.5d.md](hadanky-seed-21.5d.md)).

## 2. Klíčová rozhodnutí

- **R1 — Bez statblocků a bez obchodu.** Hádanka nemá per-systém mechaniku ani cenu → nejjednodušší knihovna (BE vzor `plants` + jednoúrovňová diskuse).
- **R2 — Úroveň povinná** (enum `lehka | stredni | tezka | ultratezka`) — hlavní filtr knihovny (zadání uživatele).
- **R3 — Spoiler reveal.** Odpověď a nápovědy jsou v detailu **skryté za klik** (odpověď 1 klik, nápovědy postupně po jedné). Žádný role-gate — katalog je platformový (world role tu neexistují), spoiler chrání před omylem, ne před zlým úmyslem. (Řeší otevřenou otázku roadmapy „reveal komu".)
- **R4 — Bez pole `name`.** Název by spoiloval (nebo by se musel vymýšlet) → identita hádanky = **zadání** (`question`); list zobrazuje zkrácené zadání, idempotence seedu dle `question`.
- **R5 — Plná editace jádra** (autor/kurátor) jedním PATCH — není lore/statblock split (vzor plants, ne bestie).
- **R6 — Seed = kurátorský import** (48 ks, `status:'approved'`, autor Superadmin) přes BE skript `scripts/seed-riddles/` (vzor `seed-plants`, bez obrázků, data přímo ve skriptu). Idempotence dle `question + scope`.

## 3. Datový model — `Riddle` (kolekce `riddles`, komentáře `riddle_comments`)

```
Riddle {
  scope: 'community'
  question ⭐                  // zadání (identita hádanky, R4)
  answer ⭐                    // odpověď (FE skrývá za spoiler)
  hints: string[]              // 0–5 nápověd, odkrývají se postupně
  difficulty ⭐                // 'lehka' | 'stredni' | 'tezka' | 'ultratezka' (R2)
  origin?                      // původ („lidová", „antika — Homér", …)
  description?                 // poznámka pro PJ / kontext (např. pověst o Homérovi)
  tags[]?, imageUrl?+výřez?    // obrázek volitelný (parita katalogů)
  status: 'draft'|'approved', authorId, approved*, moderation*
}
RiddleComment { riddleId, authorId, authorName, content, moderationHidden* }   // JEDNA úroveň
```

Endpointy `riddles/community/*`: list (filtr status/difficulty/tag) · get · create (draft) · PATCH `:id` (celé jádro, autor/kurátor) · approve (kurátor) · DELETE (autor-draft/kurátor) · comments GET/POST. Pending `community_riddle_pending_review`, moderace `ReportTargetType.Riddle` (M2/M3 hide + M4 hard delete), `media.orphaned` úklid obrázku. Kurátor = `isBestieCurator`.

## 4. FE

Route `/ikaros/hadanky` (+ `/:id`) nahrazuje poslední stub; dlaždice hubu active. Knihovny 2 + filtr **úroveň** (chips, barevné odlišení) + štítek. Řádek listu: badge úrovně · zkrácené zadání · počet nápověd · původ. Detail: zadání (lore styl) → **„Odhalit odpověď"** (spoiler) → nápovědy postupně („Nápověda 1/3…") → původ + poznámka → diskuse → akce (upravit / schválit / smazat / nahlásit). Editor: zadání ⭐, odpověď ⭐, úroveň ⭐ (select), nápovědy (dynamické řádky), původ, poznámka, štítky, obrázek. Reuse: forms/list/detail CSS kouzel, diskusní vzor. Data-atributy `data-riddle-*`.

## 5. Mimo scope

Skiny · reveal per-world role · „zahraj si" mód (kvíz) · U6 mini-einstein (doladit indicie → import dodatečně).
