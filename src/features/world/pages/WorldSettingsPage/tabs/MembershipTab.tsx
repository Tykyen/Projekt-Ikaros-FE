import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button, ConfirmDialog, Spinner } from '@/shared/ui';
import { WorldRole } from '@/shared/types';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useMyWorlds } from '@/features/world/api/useWorlds';
import { useRemoveMember } from '@/features/world/api/useRemoveMember';
import { SettingsPanel } from '../components/SettingsPanel';
import s from './MembershipTab.module.css';

/**
 * 5.3e — odchod ze světa. Čtenář+ může odejít; PJ ne (musel by svět
 * předat nebo smazat). Uzavírá D-064.
 */
export default function MembershipTab() {
  const { world, userRole } = useWorldContext();
  const navigate = useNavigate();
  const myWorldsQ = useMyWorlds();
  const removeMember = useRemoveMember(world?.id ?? '');
  const [confirm, setConfirm] = useState(false);

  if (!world) return null;

  const entry = myWorldsQ.data?.find((e) => e.world.id === world.id);
  const membershipId = entry?.membership.id;
  const isPJ = userRole === WorldRole.PJ;

  async function leave() {
    if (!membershipId) return;
    try {
      await removeMember.mutateAsync(membershipId);
      toast.success(`Opustil jsi svět „${world!.name}".`);
      navigate('/');
    } catch {
      toast.error('Odchod ze světa selhal. Zkus to znovu.');
    }
  }

  return (
    <SettingsPanel
      title="Odejít ze světa"
      description="Ukončení členství v tomto světě."
    >
      {isPJ ? (
        <p className={s.note}>
          Jako PJ nemůžeš svět opustit — jsi jeho správce. Musel bys svět
          nejdřív předat jinému PJ (zatím nedostupné) nebo ho smazat.
        </p>
      ) : (
        <>
          <p className={s.note}>
            Po odchodu ztratíš přístup k obsahu světa. Pokud to není uzavřený
            svět, můžeš později znovu požádat o vstup.
          </p>
          {myWorldsQ.isLoading ? (
            <Spinner />
          ) : (
            <Button
              type="button"
              variant="danger"
              disabled={!membershipId}
              onClick={() => setConfirm(true)}
            >
              Odejít ze světa
            </Button>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Odejít ze světa?"
        message={`Opravdu chceš opustit svět „${world.name}"? Ztratíš přístup k jeho obsahu.`}
        confirmLabel="Odejít"
        confirmVariant="danger"
        isPending={removeMember.isPending}
        onConfirm={async () => {
          await leave();
          setConfirm(false);
        }}
      />
    </SettingsPanel>
  );
}
