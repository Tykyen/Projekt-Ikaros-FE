# Plan — Monorepo migrace (A-3, separate phase before 9.4-I)

**Cíl:** Sjednotit `Projekt-Ikaros-FE` + `Projekt-ikaros` (BE) do jednoho monorepa `Projekt-Ikaros` s `packages/` pro shared kód. Zachovat git historie obou přes `git subtree`.

**ETA:** 2-3 dny (přesný čas závisí na BE branch inventory + CI/CD complexity)

**Status:** DRAFT — čeká na explicit confirm user (destruktivní akce)

**Motivace:** Long-term sdílení kódu mezi BE/FE (weather variance simulation, kalendář helpers, shared types). Memory `feedback_no_debt` — žádné duplicity.

---

## ⚠️ Před startem — co user musí udělat

### A) Inventory živých BE branches
```bash
cd c:/Matrix/ProjektIkaros/Projekt-ikaros
git branch -a | head -40
# Pro každou: rozhodnout LIVE (musí migrovat) nebo STALE (archive only)
```

**Speciální pozornost:**
- `feat/krok-10f-world-weather` — pravděpodobně rozpracovaný 9.4 BE. **Co tam je?**
- Pokud rozpracovaný → buď merge do main před migrací, nebo cherry-pick po migraci

### B) Vytvořit nový GitHub repo
- URL: `https://github.com/Tykyen/Projekt-Ikaros` (capital I, sjednocený název)
- Visibility: stejná jako stávající (private?)
- **Bez** auto-initialize (žádný README/license/gitignore) — chceme prázdný repo pro push

### C) CI/CD inventory
- Jaký CI máš v FE? (GitHub Actions? Vercel?)
- Jaký CI máš v BE? (GitHub Actions? Docker Hub? Vlastní server?)
- Deploy pipeline pro FE/BE?
- **Při migraci CI musí být pozastaveno** (jinak by deploys jely z neúplného stavu)

### D) Backup
Před cokoli destruktivního:
```bash
mkdir c:/tmp/backup-20260526
cp -r c:/Matrix/ProjektIkaros/Projekt-ikaros-FE c:/tmp/backup-20260526/
cp -r c:/Matrix/ProjektIkaros/Projekt-ikaros c:/tmp/backup-20260526/
```

---

## Fáze 1 — Prep & inventory (2-3h)

- [ ] Backup obou repos (viz D výše)
- [ ] BE branches inventory — seznam LIVE vs STALE
- [ ] FE branches inventory — stejně
- [ ] User vytvoří `Tykyen/Projekt-Ikaros` GitHub repo (D)
- [ ] User pozastaví CI/CD pipelines (C)
- [ ] Commit/push všechny in-progress changes v obou repos (žádné uncommitted)
- [ ] Specificky: `feat/krok-10f-world-weather` — buď merge do main, nebo dokumentovat pro post-migrace cherry-pick

---

## Fáze 2 — Lokální subtree merge (1-2h)

Cíl: vytvořit nový lokální monorepo se zachovanou historií obou.

```bash
# 1. Nový clean folder
mkdir c:/Matrix/Projekt-Ikaros-monorepo
cd c:/Matrix/Projekt-Ikaros-monorepo
git init

# 2. Initial commit (prázdný, jen aby existoval)
echo "# Projekt-Ikaros (monorepo)" > README.md
git add README.md && git commit -m "chore: initial monorepo commit"

# 3. Add FE jako subtree
git remote add fe-origin c:/Matrix/ProjektIkaros/Projekt-ikaros-FE
git fetch fe-origin
git subtree add --prefix=frontend fe-origin main

# 4. Add BE jako subtree
git remote add be-origin c:/Matrix/ProjektIkaros/Projekt-ikaros
git fetch be-origin
git subtree add --prefix=backend be-origin main

# 5. Cleanup remotes
git remote remove fe-origin
git remote remove be-origin
```

**Výsledek:**
- `frontend/` obsahuje původní FE repo s historií (přístupné přes `git log frontend/`)
- `backend/` obsahuje původní BE repo s historií (přes `git log backend/`)
- Jediný linear historie kombinuje oba

⚠️ **Sanity check:** `git log --oneline | wc -l` musí dát součet commits FE + BE + 2 merge commits + 1 initial.

---

## Fáze 3 — Workspace setup (1-2h)

### Root `package.json`
```json
{
  "name": "projekt-ikaros",
  "private": true,
  "workspaces": [
    "frontend",
    "backend",
    "packages/*"
  ],
  "scripts": {
    "fe:dev": "npm run dev -w frontend",
    "fe:build": "npm run build -w frontend",
    "fe:test": "npm run test -w frontend",
    "be:dev": "npm run start:dev -w backend",
    "be:build": "npm run build -w backend",
    "be:test": "npm run test -w backend",
    "test:all": "npm run test -w frontend && npm run test -w backend"
  }
}
```

### Packages structure
```
packages/
└── weather-simulation/
    ├── package.json     # "name": "@ikaros/weather-simulation"
    ├── tsconfig.json
    └── src/
        └── index.ts     # placeholder
```

### TSConfig adjustment
- `frontend/tsconfig.json` — add paths: `"@ikaros/weather-simulation": ["../packages/weather-simulation/src"]`
- `backend/tsconfig.json` — same
- Root `tsconfig.base.json` — common settings

### `node_modules` cleanup
Workspaces sdílí jeden `node_modules` v root. Smazat per-package `node_modules`:
```bash
rm -rf frontend/node_modules backend/node_modules
npm install  # v root, vytvoří jeden hoisted node_modules
```

⚠️ **Risk:** některé deps mohou vyžadovat hoisting fix. Test: `npm run fe:build` + `npm run be:build` musí oba projít.

---

## Fáze 4 — GitHub push (30min)

```bash
git remote add origin https://github.com/Tykyen/Projekt-Ikaros.git
git push -u origin main
```

Verify na GitHubu:
- `frontend/` directory viditelný se commits z FE repo
- `backend/` directory viditelný se commits z BE repo
- `git log frontend/Projekt-ikaros-FE/...` shows full history

---

## Fáze 5 — Migrate active branches (2-4h)

Per LIVE branch ze starých repos:

### FE branch migrace (např. `feat/theme-system-iterace-a`)
```bash
cd c:/Matrix/ProjektIkaros/Projekt-ikaros-FE
git format-patch main..feat/theme-system-iterace-a --output-directory=/tmp/patches/

cd c:/Matrix/Projekt-Ikaros-monorepo
git checkout -b feat/theme-system-iterace-a
git am --directory=frontend /tmp/patches/*.patch
```

### BE branch migrace (např. `feature/krok-10f-world-weather`)
```bash
cd c:/Matrix/ProjektIkaros/Projekt-ikaros
git format-patch main..feature/krok-10f-world-weather --output-directory=/tmp/be-patches/

cd c:/Matrix/Projekt-Ikaros-monorepo
git checkout main
git checkout -b feat/9.4-be-world-weather
git am --directory=backend /tmp/be-patches/*.patch
```

⚠️ **Pozor:** patches obsahují cesty z původního repa (root). `--directory=frontend` (resp. `--directory=backend`) prefix je přidá. Pokud format-patch obsahuje renames nebo speciální paths, může vyžadovat manual fix.

**Doporučení:** migrovat jen branches, které máš opravdu rozpracované (ne stale kroky 1.x). Stale branches zůstanou v archivovaných old repos jako reference.

---

## Fáze 6 — CI/CD update (2-3h)

### GitHub Actions
- Pokud máš `.github/workflows/` v FE/BE — sjednotit do root `.github/workflows/`
- Per workflow upravit paths (např. `working-directory: frontend` místo root)
- Jobs běží paralelně: `test-frontend`, `test-backend`, `lint-all`

### Deploy
- FE: Vercel/Netlify — update build command na `npm run fe:build` + `working-directory: frontend`
- BE: Docker — `Dockerfile` cesty (`COPY backend/package.json` místo `COPY package.json`)

---

## Fáze 7 — Cutover & cleanup (1h)

- [ ] Archive old GitHub repos (Settings → Archive this repository) — read-only, ne delete
- [ ] Update README v starých repos: „Moved to https://github.com/Tykyen/Projekt-Ikaros"
- [ ] Update local development:
  - User klonuje nový monorepo někam (např. `c:/Matrix/Projekt-Ikaros`)
  - Staré složky `Projekt-ikaros-FE` a `Projekt-ikaros` jsou nadále jako backup, ale dev práce přechází na nový
- [ ] Update CLAUDE.md / AGENTS.md ve novém monorepu
- [ ] Update working dirs config (Claude Code)

---

## Fáze 8 — Start 9.4-I M0 ve novém monorepu

Po úspěšné migraci pokračovat dle [plan-9.4-I-pocasi.md](phase-9/plan-9.4-I-pocasi.md) M0 — nyní bude vypadat jen jako:

```bash
cd c:/Matrix/Projekt-Ikaros
mkdir -p packages/weather-simulation/src
# ... create package.json, tsconfig, public API
npm install -w packages/weather-simulation
```

Žádný workspace setup už není potřeba — to je hotové.

---

## Risk register

| Risk | Pravděpodobnost | Dopad | Mitigace |
|---|---|---|---|
| Subtree merge ztratí blame nebo historii | Low | Med | Backup před, sanity check log po |
| node_modules hoisting bortí některý dep | Med | Med | Test obou builds po install |
| Branch migrace conflicts | Med | Low | Per-branch handling, skip pokud nejde |
| CI/CD config inconsistency | High | High | Pause CI před migrace, manual review after |
| Old repo PRs zůstanou viset | Low | Low | Archive starých = PR zmraženo, ale viditelné |
| User změní mínění mid-migrace | – | High | Backup umožňuje rollback (původní repos beze změny) |

---

## Definition of Done

- [ ] Lokální monorepo `c:/Matrix/Projekt-Ikaros` existuje s `frontend/` + `backend/` + `packages/`
- [ ] GitHub repo `Tykyen/Projekt-Ikaros` má commits z obou původních
- [ ] `npm run fe:build` + `npm run be:build` oba projdou
- [ ] `npm run fe:test` + `npm run be:test` oba zelené
- [ ] CI/CD funguje (test PR push)
- [ ] Staré 2 repos archivovány s pointerem na nový
- [ ] CLAUDE.md/AGENTS.md ve novém repo updated
- [ ] User může lokálně pracovat z `c:/Matrix/Projekt-Ikaros`

---

## Rollback plan

Pokud něco selže během migrace:

1. **Lokálně:** smazat `c:/Matrix/Projekt-Ikaros-monorepo` — backup repos nezasaženy
2. **Remote:** smazat (nebo nesmáznout) `Tykyen/Projekt-Ikaros` repo
3. **Aktivní staré repos** beze změny — práce pokračuje tam
4. **Pokus 2** po analýze co selhalo

---

## Schválení

Tento plán **NEBYL spuštěn**. Před první destruktivní akcí potřebuji explicit OK od user:

1. **„OK, jeď A-3"** — spustím Fáze 1 (inventory) a požádám tě o GitHub repo creation
2. **„Nejdřív otázky"** — máš konkrétní obavy / chceš detail
3. **„Vrať se k E"** — duplicita + parity test (nedestruktivní, ETA ~5d, akceptovatelný dluh)
