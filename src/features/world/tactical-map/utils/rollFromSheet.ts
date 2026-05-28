/**
 * 10.2c-edit-9g (Fáze C+D) — roll utility pro per-system sheets v token panelu.
 *
 * Konzument: MatrixSheet, Drd2Sheet, FateSheet, ... — klik na dovednost
 * / iniciativu volá tento helper s `{label, modifier, kind}`. Roll použije
 * existing `chat/dice/lib/rollEngine` (Fate / generic) a výsledek zobrazí
 * jako toast (sonner). Plný chat send vyžaduje channelId context — defer
 * Fáze D2 (až vyřeším který channel posílat — currently active scéna /
 * world default).
 *
 * Format zpráv mirror Matrix old `formatFateMessage`.
 */
import { toast } from 'sonner';
import {
  rollFate,
  rollGenericDice,
  type RollKind,
} from '@/features/world/chat/dice/lib/rollEngine';
import {
  formatFateMessage,
  formatGenericDiceMessage,
} from '@/features/world/chat/dice/lib/formatMessage';

export interface RollRequest {
  /** Lidský label (jméno dovednosti / „Iniciativa"). */
  label: string;
  /** Modifikátor přidaný k roll sumu (např. skill level). Default 0. */
  modifier?: number;
  /**
   * Typ kostky. `fate` = 4dF (Matrix / Fate). `d20` / `d6` / ... pro
   * generic systémy. Pro nestandartní pool kostky volej rollEngine přímo.
   */
  kind?: RollKind;
  /** Kdo rolluje — zobrazí se v toast (default „Postava"). */
  rollerName?: string;
}

export function performSheetRoll(req: RollRequest): void {
  const { label, modifier = 0, kind = 'fate', rollerName = 'Postava' } = req;

  let message: string;
  let total: number;

  if (kind === 'fate') {
    const r = rollFate();
    total = r.sum + modifier;
    message = formatFateMessage(label, modifier, r);
  } else if (
    kind === 'd4' ||
    kind === 'd6' ||
    kind === 'd8' ||
    kind === 'd10' ||
    kind === 'd12' ||
    kind === 'd20' ||
    kind === 'd100'
  ) {
    const r = rollGenericDice(kind);
    total = r.sum + modifier;
    message = formatGenericDiceMessage(label, modifier, r);
  } else {
    // pool/mixed nepodporováno z deníku v MVP
    toast.error(`Roll kind ${kind} není podporován ze sheet`);
    return;
  }

  // Toast s formátovanou zprávou
  toast.success(message, {
    description: `Celkem: ${total >= 0 ? '+' : ''}${total}`,
    duration: 5000,
  });
}
