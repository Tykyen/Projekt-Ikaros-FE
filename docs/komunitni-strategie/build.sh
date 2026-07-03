#!/usr/bin/env bash
# Sestavení knihy "Projekt Ikaros — Komunitní napojení a strategie".
# Vzor: docs/pravni-ramec (cat fragmentů v ORDER → Chrome --print-to-pdf).
# Reskin celé knihy = jen build/_head.html (CSS class kontrakt).
#
# Použití:  bash docs/komunitni-strategie/build.sh
# Výstup :  docs/komunitni-strategie/Ikaros-komunitni-strategie.html (+ .pdf, je-li Chrome)
set -u

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
B="$DIR/build"
OUT_HTML="$DIR/Ikaros-komunitni-strategie.html"
OUT_PDF="$DIR/Ikaros-komunitni-strategie.pdf"

# Pořadí fragmentů (bez přípony .html). Kapitoly doplní writing workflow.
ORDER=(
  _head _cover _disclaimer _toc
  00-uvod 01-shrnuti
  _div1 10-mapa-komunity 11-kdo-pomuze
  _div2 20-co-pripravit 21-stranka-komunita 22-socialni-site 23-co-nabidnout
  _div3 30-jak-jednat 31-na-co-pozor
  _div4 40-textovy-balicek 41-postup-napojeni
  _div5 50-akcni-plan
  _div6 90-adresar-zdroju 91-crm-checklisty 92-slovnicek 93-zdroje
  _colophon _foot
)

echo "Sestavuji $OUT_HTML"
: > "$OUT_HTML"
missing=0
for f in "${ORDER[@]}"; do
  frag="$B/$f.html"
  if [ -f "$frag" ]; then
    cat "$frag" >> "$OUT_HTML"
    printf '\n' >> "$OUT_HTML"
  else
    echo "  ⚠ chybí fragment: $f.html (zatím nenapsán)"
    missing=$((missing+1))
  fi
done
echo "Hotovo. Chybějících fragmentů: $missing"

# --- PDF přes Chrome headless (best-effort) ---
CHROME=""
for c in \
  "/c/Program Files/Google/Chrome/Application/chrome.exe" \
  "/c/Program Files (x86)/Google/Chrome/Application/chrome.exe" \
  "$(command -v google-chrome 2>/dev/null)" \
  "$(command -v chromium 2>/dev/null)"; do
  if [ -n "$c" ] && [ -x "$c" ]; then CHROME="$c"; break; fi
done

if [ -n "$CHROME" ]; then
  TMP="$(mktemp -d)"
  PDF_TMP="$OUT_PDF.tmp"
  echo "PDF přes: $CHROME"
  "$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
    --user-data-dir="$TMP" --print-to-pdf="$PDF_TMP" "$OUT_HTML"
  rm -rf "$TMP"
  # Integrita: startxref musí ukazovat na klasickou tabulku 'xref'.
  if [ -f "$PDF_TMP" ]; then
    SX=$(tail -c 400 "$PDF_TMP" | grep -a -A1 '^startxref' | tail -1 | tr -dc '0-9')
    AT=$(tail -c +$((SX+1)) "$PDF_TMP" 2>/dev/null | head -c 4)
    if [ "$AT" = "xref" ]; then
      mv -f "$PDF_TMP" "$OUT_PDF" && echo "PDF OK (xref @ $SX): $OUT_PDF" \
        || echo "⚠ Nelze přepsat $OUT_PDF (otevřený?) — hotové PDF je: $PDF_TMP"
    else
      echo "⚠ Vygenerované PDF má vadný xref (@$SX='$AT') — NEpřepisuji, ponechávám $PDF_TMP"
    fi
  else
    echo "⚠ Chrome PDF nevytvořil."
  fi
else
  echo "⚠ Chrome nenalezen — vytvořeno jen HTML. PDF: otevřete HTML v Chrome → Tisk → Uložit jako PDF (pozadí grafiky zapnuté)."
fi
