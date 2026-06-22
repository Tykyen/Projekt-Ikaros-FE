# Stop hook — BLOKUJÍCÍ brána chybového deníku.
#
# Proč blokující: měkká verze (systemMessage) mířila na UŽIVATELE → musel ji
# Claudeovi přeposílat, a Claude zápis odkládal/zapomínal. `decision:block` míří
# reason PŘÍMO modelovi → musí se k deníku postavit, NEŽ dokončí tah.
#
# Detekce: git working tree — necommitnuté změny v src/*.ts(x). Když existují →
# block s instrukcí. Self-resolving: po commitu (uživatel commituje ručně) je
# working tree čistý → příště ticho. Anti-loop: když už hook jednou blokoval
# tenhle stop (`stop_hook_active`), PROPUSTÍ (Claude se vědomě rozhodl — i
# „triviální, přeskoč"). Fail-open: jakákoli chyba hooku NIKDY neblokuje turn.
#
# Schváleno uživatelem (2026-06-20) jako tvrdá pojistka spolehlivosti deníku.
# 2026-06-22: přepnuto z mtime na git working tree. Mtime ≠ autorství — checkout,
#   IDE auto-save i watcher posunou mtime bez obsahové změny → hook plašil falešně
#   po každém tahu (commitnutý soubor s novým mtime vypadal „novější než deník").

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

  # Necommitnuté změny v src/*.ts(x). `--porcelain -- src` omezí na složku src,
  # filtr přípony pokryje i rename (`orig -> new.tsx`).
  $dirty = & git -C $root status --porcelain -- src 2>$null |
    Where-Object { $_ -match '\.tsx?$' }

  if ($dirty) {
    $first = ([string]($dirty | Select-Object -First 1)).Trim()
    $reason = "STOP HOOK - chybovy denik: mas necommitnute zmeny v src ($first). " +
      "Podle base.md: pokud to byla netrivialni oprava / reseni / zmena " +
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
