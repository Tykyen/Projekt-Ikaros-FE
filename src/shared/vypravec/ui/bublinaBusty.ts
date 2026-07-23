/**
 * D-080c — busty do bublin: mluvčí (Ishida/Joe/Měďák) × nálada dle typu
 * bubliny. Oslava = slavi/schvaluje, chybové vysvětlení = varuje,
 * běžný tip = ukazuje/instruuje. Jen 256px webp (bublina je ~56 px kruh);
 * bez PNG fallbacku — webp drží všechny podporované prohlížeče platformy.
 */
import ishidaSlavi from '@/assets/vypravec/ishida-bust-slavi-256.webp';
import ishidaVaruje from '@/assets/vypravec/ishida-bust-varuje-256.webp';
import ishidaUkazuje from '@/assets/vypravec/ishida-bust-ukazuje-256.webp';
import joeSlavi from '@/assets/vypravec/joe-bust-slavi-256.webp';
import joeVaruje from '@/assets/vypravec/joe-bust-varuje-256.webp';
import joeUkazuje from '@/assets/vypravec/joe-bust-ukazuje-256.webp';
import medakSchvaluje from '@/assets/vypravec/medak-bust-schvaluje-256.webp';
import medakVaruje from '@/assets/vypravec/medak-bust-varuje-256.webp';
import medakInstruuje from '@/assets/vypravec/medak-bust-instruuje-256.webp';

export type MluvciBubliny = 'ikaros' | 'world' | 'tm';
type Nalada = 'slavi' | 'varuje' | 'ukazuje';

const BUSTY: Record<MluvciBubliny, Record<Nalada, string>> = {
  ikaros: { slavi: ishidaSlavi, varuje: ishidaVaruje, ukazuje: ishidaUkazuje },
  world: { slavi: joeSlavi, varuje: joeVaruje, ukazuje: joeUkazuje },
  tm: { slavi: medakSchvaluje, varuje: medakVaruje, ukazuje: medakInstruuje },
};

export function bustaProBublinu(
  mluvci: MluvciBubliny,
  b: { oslava?: boolean; dismissKey?: string },
): string {
  const nalada: Nalada = b.oslava
    ? 'slavi'
    : b.dismissKey?.startsWith('err.')
      ? 'varuje'
      : 'ukazuje';
  return BUSTY[mluvci][nalada];
}
