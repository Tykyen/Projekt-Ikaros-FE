# Stop hook — BLOKUJÍCÍ brána chybového deníku.
#
# Proč blokující: měkká verze (systemMessage) mířila na UŽIVATELE → musel ji
# Claudeovi přeposílat, a Claude zápis odkládal/zapomínal. `decision:block` míří
# reason PŘÍMO modelovi → musí se k deníku postavit, NEŽ dokončí tah.
#
# Heuristika: mtime nejnovějšího src/*.ts(x) vs nejnovějšího docs/chybovy-denik/*.md.
# Když je kód novější → block s instrukcí. Self-resolving: po zápisu je deník
# novější → příště ticho. Anti-loop: když už hook jednou blokoval tenhle stop
# (`stop_hook_active`), PROPUSTÍ (Claude se vědomě rozhodl — i „triviální, přeskoč").
# Fail-open: jakákoli chyba hooku NIKDY neblokuje turn.
#
# Schváleno uživatelem (2026-06-20) jako tvrdá pojistka spolehlivosti deníku.

try {
  # stdin = JSON vstupu hooku (obsahuje stop_hook_active).
  $raw = [Console]::In.ReadToEnd()
  if ($raw) {
    try {
      if ([bool]((ConvertFrom-Json $raw).stop_hook_active)) { exit 0 }
    } catch {
      # nečitelný vstup → ignoruj, pokračuj na mtime check
    }
  }

  # .claude/hooks → .claude → kořen projektu (nezávislé na cwd hooku)
  $root = $PSScriptRoot | Split-Path | Split-Path

  $src = Get-ChildItem -Path (Join-Path $root 'src') -Recurse -Include *.ts, *.tsx -File -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
  $denik = Get-ChildItem -Path (Join-Path $root 'docs\chybovy-denik') -Filter *.md -File -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1

  if ($src -and (-not $denik -or $src.LastWriteTime -gt $denik.LastWriteTime)) {
    $reason = "STOP HOOK - chybovy denik: menil jsi kod ($($src.Name)) po poslednim zapisu do " +
      "docs/chybovy-denik/. Podle base.md: pokud to byla netrivialni oprava / reseni / zmena " +
      "pristupu nebo vlastni chyba/slepa ulicka, ZAPIS to TED (CH-xxx nebo RESENI) " +
      "vcetne indexu README.md. Pokud slo jen o trivialni jednoradkovy fix nebo rutinu, " +
      "kratce to uvedy v odpovedi (proc se nezapisuje) a muzes skoncit."
    @{ decision = 'block'; reason = $reason } | ConvertTo-Json -Compress
    exit 0
  }
} catch {
  # Fail-open: bug v hooku nesmi nikdy zablokovat praci.
  exit 0
}
exit 0
