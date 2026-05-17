import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { toast } from 'sonner';
import { Spinner, ConfirmDialog } from '@/shared/ui';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole, WorldRole } from '@/shared/types';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldMembers } from '@/features/world/api/useWorldMembers';
import { useWorldSettings } from '@/features/world/api/useWorldSettings';
import {
  useUpdateMember,
  type UpdateMemberPayload,
} from '@/features/world/api/useUpdateMember';
import { useRemoveMember } from '@/features/world/api/useRemoveMember';
import { SettingsPanel } from '../components/SettingsPanel';
import { MemberRow } from '../components/MemberRow';
import { GroupColorEditor } from '../components/GroupColorEditor';
import s from './MembersTab.module.css';

/**
 * 5.3c — správa členů světa: role, skupiny, AKJ úrovně, odebrání.
 * Barvy skupin (`GroupColorEditor`) jen pro PJ+.
 */
export default function MembersTab() {
  const { world, userRole } = useWorldContext();
  const currentUser = useAtomValue(currentUserAtom);
  const membersQ = useWorldMembers(world?.id ?? '');
  const settingsQ = useWorldSettings(world?.id ?? '');
  const updateMember = useUpdateMember(world?.id ?? '');
  const removeMember = useRemoveMember(world?.id ?? '');
  const [toRemove, setToRemove] = useState<{ id: string; name: string } | null>(
    null,
  );

  if (!world) return null;

  const isGlobalAdmin =
    currentUser?.role !== undefined && currentUser.role <= UserRole.Admin;
  const viewerRole: WorldRole = isGlobalAdmin
    ? WorldRole.PJ
    : (userRole ?? WorldRole.Zadatel);

  function handleUpdate(payload: UpdateMemberPayload) {
    updateMember.mutate(payload, {
      onSuccess: () => toast.success('Člen aktualizován.'),
      onError: () => toast.error('Úprava člena selhala.'),
    });
  }

  const settings = settingsQ.data ?? null;
  const customGroups = settings?.customGroups ?? [];
  const akjTypes = settings?.akjTypes ?? [];

  return (
    <>
      <SettingsPanel
        title="Členové světa"
        description="Role, skupiny a AKJ úrovně členů. Změny se ukládají okamžitě."
      >
        {membersQ.isLoading ? (
          <Spinner center />
        ) : membersQ.data && membersQ.data.length > 0 ? (
          <div className={s.table}>
            {membersQ.data.map((m) => (
              <MemberRow
                key={m.id}
                membership={m}
                customGroups={customGroups}
                akjTypes={akjTypes}
                viewerRole={viewerRole}
                viewerUserId={currentUser?.id ?? ''}
                onUpdate={handleUpdate}
                onRemove={(id, name) => setToRemove({ id, name })}
              />
            ))}
          </div>
        ) : (
          <p className={s.empty}>Tento svět zatím nemá žádné členy.</p>
        )}
      </SettingsPanel>

      {viewerRole >= WorldRole.PJ && settings && (
        <SettingsPanel
          title="Skupiny a barvy"
          description="Skupiny člení party/frakce světa. Barva je odlišuje v chatu a seznamech."
        >
          <GroupColorEditor worldId={world.id} settings={settings} />
        </SettingsPanel>
      )}

      <ConfirmDialog
        open={!!toRemove}
        onClose={() => setToRemove(null)}
        title="Odebrat člena?"
        message={`Člen „${toRemove?.name}" ztratí přístup do světa. Může znovu požádat o vstup.`}
        confirmLabel="Odebrat"
        confirmVariant="danger"
        isPending={removeMember.isPending}
        onConfirm={async () => {
          if (!toRemove) return;
          try {
            await removeMember.mutateAsync(toRemove.id);
            toast.success('Člen odebrán.');
          } catch {
            toast.error('Odebrání selhalo.');
          }
          setToRemove(null);
        }}
      />
    </>
  );
}
