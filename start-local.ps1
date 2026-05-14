# ============================================================
#  Projekt Ikaros – lokální spuštění (MongoDB + Backend + Frontend)
# ============================================================
#
#  Použití:
#    .\start-local.ps1              – spustí vše
#    .\start-local.ps1 -SkipMongo  – pokud MongoDB už běží, spustí jen BE + FE
#
#  Předpoklady:
#    • Docker Desktop (pro MongoDB kontejner)
#    • Node.js >= 18 + npm
#
#  Porty:
#    • MongoDB  → 27017  (kontejner matrix-mongodb-dev, DB: ikaros)
#    • Backend  → 3000   (NestJS)
#    • Frontend → 5173   (Vite)
#
#  Ukončení: Ctrl+C zastaví BE i FE. MongoDB kontejner poběží dál.
#            Zastavíš ho ručně: docker stop matrix-mongodb-dev
# ============================================================

param(
    [switch]$SkipMongo
)

$ErrorActionPreference = "Stop"
$root = "C:\Matrix\ProjektIkaros"
$beDir = Join-Path $root "Projekt-ikaros\backend"
$feDir = Join-Path $root "Projekt-ikaros-FE"

function Write-Step($msg) { Write-Host "`n>> $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "   OK  $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "   !!  $msg" -ForegroundColor Yellow }

# ============================================================
# 1) MongoDB
# ============================================================
if (-not $SkipMongo) {
    Write-Step "MongoDB (Docker: matrix-mongodb-dev)..."

    $existing = docker ps -a --filter "name=matrix-mongodb-dev" --format "{{.Names}}" 2>$null
    if ($existing -eq "matrix-mongodb-dev") {
        $running = docker ps --filter "name=matrix-mongodb-dev" --format "{{.Names}}" 2>$null
        if ($running -eq "matrix-mongodb-dev") {
            Write-Ok "Kontejner uz bezi."
        } else {
            docker start matrix-mongodb-dev | Out-Null
            Write-Ok "Kontejner restartovan."
        }
    } else {
        docker run -d `
            --name matrix-mongodb-dev `
            -p 27017:27017 `
            mongo:7 | Out-Null
        Write-Ok "Kontejner vytvoren a spusten (port 27017)."
    }
} else {
    Write-Warn "MongoDB preskocena (-SkipMongo)."
}

# ============================================================
# 2) Uvolnění portů
# ============================================================
Write-Step "Uvolnuji porty 3000 a 5173..."
foreach ($port in @(3000, 5173)) {
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($conns) {
        $conns | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
        Write-Ok "Port $port uvolnen."
    }
}

# ============================================================
# 3) Backend (NestJS)
# ============================================================
Write-Step "Spoustim Backend (nest start --watch)..."
$beJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    npm run start:dev
} -ArgumentList $beDir

# ============================================================
# 4) Frontend (Vite)
# ============================================================
Write-Step "Spoustim Frontend (vite dev)..."
$feJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    npm run dev
} -ArgumentList $feDir

Write-Host ""
Write-Host "==========================================" -ForegroundColor Magenta
Write-Host "  Backend  >>> http://localhost:3000"       -ForegroundColor White
Write-Host "  Swagger  >>> http://localhost:3000/docs"  -ForegroundColor White
Write-Host "  Frontend >>> http://localhost:5173"       -ForegroundColor White
Write-Host "  Pro ukonceni stiskni Ctrl+C"              -ForegroundColor Gray
Write-Host "==========================================" -ForegroundColor Magenta
Write-Host ""

# ============================================================
# 5) Přeposílání logů
# ============================================================
try {
    while ($true) {
        $beOut = Receive-Job -Job $beJob -ErrorAction SilentlyContinue
        if ($beOut) { $beOut | ForEach-Object { Write-Host "[BE] $_" -ForegroundColor Blue } }

        $feOut = Receive-Job -Job $feJob -ErrorAction SilentlyContinue
        if ($feOut) { $feOut | ForEach-Object { Write-Host "[FE] $_" -ForegroundColor Green } }

        if ($beJob.State -eq "Failed") {
            Write-Host "`n[BE] CHYBA – proces spadl." -ForegroundColor Red
            Receive-Job -Job $beJob -ErrorAction SilentlyContinue | Write-Host -ForegroundColor Red
            break
        }
        if ($feJob.State -eq "Failed") {
            Write-Host "`n[FE] CHYBA – proces spadl." -ForegroundColor Red
            Receive-Job -Job $feJob -ErrorAction SilentlyContinue | Write-Host -ForegroundColor Red
            break
        }

        Start-Sleep -Milliseconds 500
    }
} finally {
    Write-Host "`nZastavuji BE a FE..." -ForegroundColor Yellow
    Stop-Job  -Job $beJob -ErrorAction SilentlyContinue
    Stop-Job  -Job $feJob -ErrorAction SilentlyContinue
    Remove-Job -Job $beJob -Force -ErrorAction SilentlyContinue
    Remove-Job -Job $feJob -Force -ErrorAction SilentlyContinue
    Write-Host "BE a FE zastaveny." -ForegroundColor Green
    Write-Host "MongoDB stale bezi. Zastav ji: docker stop matrix-mongodb-dev" -ForegroundColor Yellow
}
