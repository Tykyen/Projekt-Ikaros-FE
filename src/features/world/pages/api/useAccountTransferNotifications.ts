import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useSocketEvent } from '@/features/chat/api/useSocket';

interface TransferReceivedPayload {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: string;
  description: string;
}

/**
 * D-8.6-transfer-notification — Globální subscriber pro WS event
 * `account:transfer:received`. Po doručení převodu peněz na účet, kde je
 * uživatel vlastníkem nebo spoluvlastníkem, zobrazí toast a invaliduje
 * cache cílového účtu.
 *
 * Mount jednou v aplikaci (např. `WorldShell` nebo `IkarosShell`).
 */
export function useAccountTransferNotifications(): void {
  const qc = useQueryClient();

  useSocketEvent<TransferReceivedPayload>(
    'account:transfer:received',
    (payload) => {
      toast.success(
        `Příjem: ${payload.amount} ${payload.currency}${
          payload.description ? ` — ${payload.description}` : ''
        }`,
        { duration: 5000 },
      );
      // Invalidate accounts cache (worldId v query klíči poznáme jen z URL
      // path, ale uložené data jsou v cache pod tímto klíčem — invalidate
      // všech `accounts` klíčů projistotu).
      void qc.invalidateQueries({
        predicate: (q) => q.queryKey[0] === 'accounts',
      });
      void qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey.includes('accounts') &&
          q.queryKey[0] === 'characters',
      });
    },
  );
}
