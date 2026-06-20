# Stop hook — připomene zapsat do chybového deníku, KDYŽ je kód novější než
# poslední zápis. Heuristika: mtime nejnovějšího src/*.ts(x) vs nejnovějšího
# docs/chybovy-denik/*.md. Self-resolving: po zápisu do deníku je deník
# novější → ticho. Měkká (systemMessage), neblokuje turn.
#
# Vrací JSON na stdout JEN když připomínka platí (jinak nic → hook je no-op).
# Schváleno uživatelem (2026-06-20) jako hlídka proti zapomínání zápisů.

# .claude/hooks → .claude → kořen projektu (nezávislé na cwd hooku)
$root = $PSScriptRoot | Split-Path | Split-Path

# -ErrorAction SilentlyContinue lokálně (ne globální $ErrorActionPreference) —
# u neexistující složky cmdlet jen mlčí, bez lint varování o „nepoužité" proměnné.
$src = Get-ChildItem -Path (Join-Path $root 'src') -Recurse -Include *.ts, *.tsx -File -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime -Descending | Select-Object -First 1
$denik = Get-ChildItem -Path (Join-Path $root 'docs\chybovy-denik') -Filter *.md -File -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime -Descending | Select-Object -First 1

if ($src -and (-not $denik -or $src.LastWriteTime -gt $denik.LastWriteTime)) {
  $msg = "[Chybovy denik] Menil jsi kod ($($src.Name)) po poslednim zapisu. " +
         "Zapis netrivialni opravy/reseni do docs/chybovy-denik/ (pravidlo base.md)."
  @{ systemMessage = $msg } | ConvertTo-Json -Compress
}
