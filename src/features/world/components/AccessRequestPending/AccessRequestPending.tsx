import { useState } from 'react';
import { toast } from 'sonner';
import { Button, ConfirmDialog } from '@/shared/ui';
import { useCancelAccessRequest } from '@/features/world/api/useWorldJoin';
import s from './AccessRequestPending.module.css';

interface Props {
  worldId: string;
  requestedAt: string;
}

/**
 * Spec 2.4 — banner pro pending-access stav. Zobrazuje datum podání +
 * tlačítko Zrušit žádost (s confirm dialogem). Po cancel se UI vrátí
 * na JoinCTA.
 */
export function AccessRequestPending({ worldId, requestedAt }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const cancel = useCancelAccessRequest();

  const formattedDate = new Date(requestedAt).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className={s.card}>
      <div className={s.icon} aria-hidden="true">
        ⏳
      </div>
      <h3 className={s.title}>Žádost čeká na schválení</h3>
      <p className={s.description}>
        Podáno <strong>{formattedDate}</strong>. PJ světa o tvé žádosti byl
        informován.
      </p>
      <Button
        variant="ghost"
        size="md"
        className={s.cancelBtn}
        disabled={cancel.isPending}
        onClick={() => setConfirmOpen(true)}
      >
        Zrušit žádost
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Zrušit žádost o vstup?"
        message="Žádost se smaže. Můžeš později podat novou."
        confirmLabel="Zrušit žádost"
        confirmVariant="danger"
        isPending={cancel.isPending}
        onConfirm={() => {
          cancel.mutate(worldId, {
            onSuccess: () => {
              toast.info('Žádost zrušena.');
              setConfirmOpen(false);
            },
            onError: () => {
              toast.error('Zrušení se nezdařilo.');
            },
          });
        }}
      />
    </div>
  );
}
