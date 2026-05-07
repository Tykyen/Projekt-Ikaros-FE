# Projekt Ikaros — Frontend

Frontend pro [Projekt Ikaros](https://github.com/Tykyen/Projekt-Ikaros) (NestJS backend).

**Stack:** React 19 + Vite + TypeScript + React Router + TanStack Query + Axios

## Vztah k BE

| Vrstva | Repo | Tech | Port (dev) |
|---|---|---|---|
| Backend | [Projekt-Ikaros](https://github.com/Tykyen/Projekt-Ikaros) | NestJS + MongoDB | `3000` |
| Frontend | tento repo | Vite + React + TS | `5173` |

FE komunikuje s BE přes REST (`/api/*`). Real-time kanál bude doplněn (TBD).

## Vývoj — rychlý start

```bash
# 1. Naklonuj repo
git clone https://github.com/Tykyen/Projekt-Ikaros-FE.git
cd Projekt-Ikaros-FE

# 2. Nainstaluj závislosti
npm install

# 3. Nastav env (zkopíruj a uprav)
cp .env.example .env.development

# 4. Spusť BE (v sourozeneckém repu)
#    cd ../Projekt-ikaros && npm run start:dev

# 5. Spusť FE
npm run dev
```

FE poběží na `http://localhost:5173`, BE musí běžet na `http://localhost:3000`.

## Skripty

- `npm run dev` — Vite dev server (HMR)
- `npm run build` — produkční build
- `npm run preview` — preview produkčního buildu
- `npm run lint` — ESLint

## Struktura (cíl)

```
src/
  api/           # axios klient, dotazy na BE
  components/    # sdílené UI komponenty
  pages/         # routy (každá routa = složka)
  hooks/         # vlastní React hooks
  contexts/      # React Context providers
  types/         # TS typy (zrcadlo BE DTO)
  utils/         # helpery
  App.tsx
  main.tsx
```

## Konvence

Veškerá pravidla pro práci s tímto repem (jazyk, dluhy, paralelní agenti, škálovací limity) jsou v [AGENTS.md](./AGENTS.md) a [.claude/rules/base.md](./.claude/rules/base.md).
