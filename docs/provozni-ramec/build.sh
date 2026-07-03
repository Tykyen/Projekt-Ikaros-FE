#!/usr/bin/env bash
# Sestavení knihy "Projekt Ikaros — Provozní rámec platformy".
# Vzor: docs/pravni-ramec (cat fragmentů v ORDER → Chrome --print-to-pdf).
# Reskin celé knihy = jen build/_head.html (CSS class kontrakt).
#
# Použití:  bash docs/provozni-ramec/build.sh
# Výstup :  docs/provozni-ramec/Ikaros-provozni-ramec.html (+ .pdf, je-li Chrome)
set -u

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
B="$DIR/build"
OUT_HTML="$DIR/Ikaros-provozni-ramec.html"
OUT_PDF="$DIR/Ikaros-provozni-ramec.pdf"

# Pořadí fragmentů (bez přípony .html). Kapitoly doplní writing workflow.
ORDER=(
  _head _cover _orientace _toc
  00-uvod 01-shrnuti
  _div1 10-dokumenty-webu 11-podminky-uziti 12-spotrebitel-platby 13-cookies-souhlas
  _div2 20-gdpr-mapa 21-gdpr-zaklady 22-prava-export 23-zpracovatele-transfer 24-nezletili-dpia
  _div3 30-dsa-klasifikace 31-notice-action 32-moderacni-matice 33-ochrana-osobnosti
  _div4 40-ugc-licence 41-licencni-karta 42-cc-osobnostni 43-kompatibilita-znacky 44-databaze-ai-trenink 45-jak-to-psat
  _div5 50-ai-act-cl50 51-ai-autorstvi 52-ai-zpracovatel-moderace
  _div6 60-podoba-cloveka 61-fotograf-osoba 62-foto-gdpr 63-foceni-akce 64-deti-akce 65-screenshoty-promo 66-ai-znacky-promo 67-prezentacni-kanaly
  _div7 70-kodex-hodnoty 71-chovani-fikce 72-role-etika 73-report-krize 74-monetizace-ai-revize
  _div8 80-podminky-zneni 81-podminky-rizika 82-podminky-checklisty
  _div9 90-vzor-podoba 91-vzor-deti 92-vzor-ugc-fotograf 93-vzor-disclaimery 94-akcni-plan 95-zdroje 96-slovnicek
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
