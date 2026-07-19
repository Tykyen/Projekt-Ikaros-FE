import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { toast } from 'sonner';
import { Button, ConfirmDialog, Spinner, Modal } from '@/shared/ui';
import { currentUserAtom } from '@/shared/store/authStore';
import { WorldRole } from '@/shared/types';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useMyWorlds } from '@/features/world/api/useWorlds';
import { useRemoveMember } from '@/features/world/api/useRemoveMember';
import { useWorldMembers } from '@/features/world/api/useWorldMembers';
import { useTransferOwnership } from '@/features/world/api/useTransferOwnership';
import { SettingsPanel } from '../components/SettingsPanel';
import { ROLE_LABEL } from '../lib/worldRoles';
import s from './MembershipTab.module.css';

/**
 * 5.3e — odchod ze světa (Čtenář+). Vlastník světa odejít nemůže — musí ho
 * nejdřív předat (D-NEW-world-transfer). Uzavírá D-064.
 */
export default function MembershipTab() {
  const { world } = useWorldContext();
  const currentUser = useAtomValue(currentUserAtom);
  const navigate = useNavigate();
  const myWorldsQ = useMyWorlds();
  const removeMember = useRemoveMember(world?.id ?? '');
  const membersQ = useWorldMembers(world?.id ?? '');
  const transfer = useTransferOwnership(world?.id ?? '');

  const [confirm, setConfirm] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [newOwnerId, setNewOwnerId] = useState('');

  if (!world) return null;

  const entry = myWorldsQ.data?.find((e) => e.world.id === world.id);
  const membershipId = entry?.membership.id;
  // Odejít nemůže jen vlastník světa; PJ bez vlastnictví ano (BE to dovolí).
  const isOwner = world.ownerId === currentUser?.id;

  // Kandidáti na nového vlastníka — členové kromě sebe, role Hráč+.
  const candidates = (membersQ.data ?? []).filter(
    (m) => m.userId !== currentUser?.id && m.role >= WorldRole.Hrac,
  );

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

  async function doTransfer() {
    if (!newOwnerId) return;
    try {
      await transfer.mutateAsync(newOwnerId);
      toast.success('Svět předán. Nyní jsi Pomocný PJ.');
      setTransferOpen(false);
      setNewOwnerId('');
    } catch {
      toast.error('Předání světa selhalo. Zkus to znovu.');
    }
  }

  return (
    <>
      {isOwner && (
        <SettingsPanel
          title="Předat svět"
          description="Předání vlastnictví světa jinému členovi."
          query={{
            // Bez tohohle by `candidates = membersQ.data ?? []` na chybě spadlo
            // na prázdno → „Svět nemá jiného člena" (lež) a předání zablokované.
            isLoading: membersQ.isLoading,
            isError: membersQ.isError,
            refetch: membersQ.refetch,
          }}
        >
          <p className={s.note}>
            Jako vlastník můžeš svět předat jinému členovi — ten se stane PJ,
            ty Pomocným PJ. Poté můžeš svět i opustit.
          </p>
          <Button
            type="button"
            onClick={() => setTransferOpen(true)}
            disabled={candidates.length === 0}
          >
            Předat svět
          </Button>
          {candidates.length === 0 && (
            <p className={s.hint}>
              Svět nemá jiného člena (Hráč+), kterému by šlo vlastnictví předat.
            </p>
          )}
        </SettingsPanel>
      )}

      <SettingsPanel
        title="Odejít ze světa"
        description="Ukončení členství v tomto světě."
      >
        {isOwner ? (
          <p className={s.note}>
            Jako vlastník světa nemůžeš odejít — nejdřív svět předej jinému
            členovi (sekce výše).
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
      </SettingsPanel>

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

      <Modal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        title="Předat svět"
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setTransferOpen(false)}
              disabled={transfer.isPending}
            >
              Zrušit
            </Button>
            <Button
              variant="danger"
              onClick={() => void doTransfer()}
              loading={transfer.isPending}
              disabled={!newOwnerId}
            >
              Předat svět
            </Button>
          </>
        }
      >
        <div className={s.transferBody}>
          <p className={s.note}>
            Nový vlastník získá roli PJ a plnou správu světa. Ty se staneš
            Pomocným PJ. Tuto akci nelze vzít zpět bez součinnosti nového
            vlastníka.
          </p>
          <label className={s.transferLabel} htmlFor="transfer-owner">
            Nový vlastník
          </label>
          <select
            id="transfer-owner"
            className={s.transferSelect}
            value={newOwnerId}
            onChange={(e) => setNewOwnerId(e.target.value)}
          >
            <option value="">— vyber člena —</option>
            {candidates.map((m) => (
              <option key={m.id} value={m.userId}>
                {m.user?.username ?? 'Neznámý uživatel'} ({ROLE_LABEL[m.role]})
              </option>
            ))}
          </select>
        </div>
      </Modal>
    </>
  );
}
