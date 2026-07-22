/**
 * Spec 26.5 (D9) — moment 3b (03 §4): 2× TÁŽ chyba (code+route) za session →
 * bublina s vysvětlením „proč + co dál" (2. linie; 1. linie friendly hláška
 * zůstává v místě chyby). Čítač v sessionStorage — nový tab = čistý stůl.
 */
import { odebirejApiChyby, type ApiChyba } from './chybovyKanal';
import { najdiChybovyTopik } from '../registry/errorTopics';
import { bublinaStore } from '../ui/bublinaStore';

const PREFIX = 'vypravec:err:';

function zapocitej(ch: ApiChyba): number {
  const klic = `${PREFIX}${ch.code ?? ch.status}:${ch.route}`;
  let n = 0;
  try {
    n = Number(sessionStorage.getItem(klic) ?? '0') + 1;
    sessionStorage.setItem(klic, String(n));
  } catch {
    n = 2; // bez storage radši poradit hned napodruhé nefunkčním čítačem
  }
  return n;
}

function zpracuj(ch: ApiChyba): void {
  // 401 řeší refresh/logout flow klienta — Vypravěč do toho nemluví.
  if (ch.status === 401) return;
  const topik = najdiChybovyTopik(ch.code, ch.status);
  if (!topik) return;
  if (zapocitej(ch) < 2) return;
  bublinaStore.show({
    dismissKey: topik.id,
    text: topik.text,
    akce: topik.akce,
  });
}

let zapojeno = false;
/** Napojení na chybový kanál (jednou; volá VypravecRoot init). */
export function zapojChybovouMapu(): void {
  if (zapojeno) return;
  zapojeno = true;
  odebirejApiChyby(zpracuj);
}
