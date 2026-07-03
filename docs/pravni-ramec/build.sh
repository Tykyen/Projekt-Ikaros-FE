#!/usr/bin/env bash
# Sestavení knihy "Projekt Ikaros — Právní rámec platformy".
# Vzor: docs/vize (cat fragmentů v ORDER → Chrome --print-to-pdf).
# Reskin celé knihy = jen build/_head.html (CSS class kontrakt).
#
# Použití:  bash docs/pravni-ramec/build.sh
# Výstup :  docs/pravni-ramec/Ikaros-pravni-ramec.html (+ .pdf, je-li Chrome)
set -u

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
B="$DIR/build"
OUT_HTML="$DIR/Ikaros-pravni-ramec.html"
OUT_PDF="$DIR/Ikaros-pravni-ramec.pdf"

# Pořadí fragmentů (bez přípony .html). Kapitoly doplní writing workflow.
ORDER=(
  _head _cover _disclaimer _toc
  00-uvod 01-shrnuti
  _div1 10-ip-vrstvy 11-autorske-databaze 12-tajemstvi-soutez 13-ip-inventar
  _div2 20-znamka 21-pravo-systemu 22-deniky-bestiare 23a-systemy-pilotni 23b-systemy-vyhnout 24-dopisy-strategie
  _div3 30-licencni-karta 31-licence-uzivatelu 32-databaze-scraping 33-ai-obsah 34-datovy-model
  _div4 40-diskuse-dsa 41-gdpr 42-nezletili-kyber
  _div5 50-formy 51-podpora-dph 52-startup-partner 53-governance
  _div6 60-akcni-plan 61-rizikovy-registr 62-otazky 63-checklisty
  _div7 90-vzory-nda 91-vzory-dopisy 92-vzory-disclaimery 93-zdroje 94-slovnicek
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
  # Chrome zapisuje do .tmp; do finálu jen po ověření (atomický mv) — brání
  # poškození souboru (nekonzistentní xref / souběžný zápis / zamčený cíl).
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
