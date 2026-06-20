# Stop hook — připomene zkontrolovat slovníček, KDYŽ se měnila funkčnost po
# poslední revizi slovníčku. Heuristika: mtime nejnovějšího .md v docs/funkce
# nebo docs/arch (tam vznikají pojmy) vs. marker docs/glossary/.reviewed.
# Self-resolving: po revizi slovníčku (přidání pojmu NEBO rozhodnutí, že netřeba)
# se touchne .reviewed → marker je nejnovější → ticho. Měkká (systemMessage),
# neblokuje turn.
#
# Vrací JSON na stdout JEN když připomínka platí (jinak nic → hook je no-op).
# Schváleno uživatelem (2026-06-20) jako hlídka proti zapomínání pojmů.
#
# Záměrně NEhlídá src/ (to dělá denik-reminder) ani celé docs/ (audit dokumenty
# se mění furt → alarm fatigue). funkce/+arch/ = jediný zdroj, kde se rodí slovník.

# .claude/hooks → .claude → kořen projektu (nezávislé na cwd hooku)
$root = $PSScriptRoot | Split-Path | Split-Path

# Nejnovější .md napříč zdroji pojmů. -ErrorAction SilentlyContinue lokálně —
# u neexistující složky cmdlet jen mlčí.
$sources = @('docs\funkce', 'docs\arch') | ForEach-Object { Join-Path $root $_ }
$newest = $sources |
  ForEach-Object { Get-ChildItem -Path $_ -Recurse -Include *.md -File -ErrorAction SilentlyContinue } |
  Sort-Object LastWriteTime -Descending | Select-Object -First 1

$marker = Get-Item (Join-Path $root 'docs\glossary\.reviewed') -ErrorAction SilentlyContinue

if ($newest -and (-not $marker -or $newest.LastWriteTime -gt $marker.LastWriteTime)) {
  $msg = "[Slovnicek] Menila se funkcnost ($($newest.Name)) po posledni revizi slovnicku. " +
         "Spust skill slovnicek: zkontroluj nove/zmenene pojmy v docs/glossary/. " +
         "Po revizi touchni docs/glossary/.reviewed (utisi pripominku)."
  @{ systemMessage = $msg } | ConvertTo-Json -Compress
}
