import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { toast } from 'sonner';
import { Spinner, ConfirmDialog } from '@/shared/ui';
import { currentUserAtom } from '@/shared/store/authStore';
import {
  WorldRole,
  type WorldMembership,
  type WorldSettings,
} from '@/shared/types';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldMembers } from '@/features/world/api/useWorldMembers';
import { useWorldSettings } from '@/features/world/api/useWorldSettings';
import {
  useUpdateMember,
  type UpdateMemberPayload,
} from '@/features/world/api/useUpdateMember';
import { useUpdateMemberCharacter } from '@/features/world/api/useUpdateMemberCharacter';
import { useRemoveMember } from '@/features/world/api/useRemoveMember';
import { useCharacterDirectory } from '@/features/world/pages/api/useCharacterDirectory';
import { SettingsPanel } from '../components/SettingsPanel';
import { MemberRow } from '../components/MemberRow';
import { GroupColorEditor } from '../components/GroupColorEditor';
import s from './MembersTab.module.css';

/**
 * 5.3c — správa členů světa: role, skupiny, AKJ úrovně, odebrání.
 * Barvy skupin (`GroupColorEditor`) jen pro PJ+.
 */
export default function MembersTab() {
  const { world, worldSlug, userRole } = useWorldContext();
  const currentUser = useAtomValue(currentUserAtom);
  const membersQ = useWorldMembers(world?.id ?? '');
  const settingsQ = useWorldSettings(world?.id ?? '');
  const directoryQ = useCharacterDirectory(world?.id ?? '');
  const updateMember = useUpdateMember(world?.id ?? '');
  const updateMemberCharacter = useUpdateMemberCharacter(world?.id ?? '');
  const removeMember = useRemoveMember(world?.id ?? '');
  const [toRemove, setToRemove] = useState<{ id: string; name: string } | null>(
    null,
  );
  /** 9.1 C — místo CreateCharacterModal naviguj rovnou do PageEditoru s
   *  předvyplněným ownerem (`?type=PostavaHrace&owner=<userId>`). */
  const navigate = useNavigate();
  function createForMember(member: WorldMembership) {
    const userId = member.user?.id ?? member.userId;
    navigate(
      `/svet/${worldSlug}/nova-stranka?type=PostavaHrace&owner=${encodeURIComponent(userId)}`,
    );
  }

  // FIX-5 companion — pokud svět ještě nikdy neuložil `WorldSettings` (BE
  // vrací null), nabídneme PJ prázdný editor (první „Uložit" vytvoří záznam
  // přes PUT). `useMemo` (ne holý object literal) je tu nutný: `GroupColorEditor`
  // teď resetuje svůj lokální state při změně `settings` reference (FIX-5) —
  // bez memoizace by fallback object dostal NOVOU referenci (`new Date()...`)
  // při KAŽDÉM re-renderu MembersTab a reset by mazal rozepsané úpravy skupin
  // i bez jakékoli skutečné změny dat.
  const editorSettings = useMemo<WorldSettings>(
    () =>
      settingsQ.data ?? {
        id: '',
        worldId: world?.id ?? '',
        hiddenNavItems: [],
        customGroups: [],
        groupColors: {},
        akjTypes: [],
        hideDefaultWeather: false,
        timelineCalendarSlug: null,
        updatedAt: new Date().toISOString(),
      },
    [settingsQ.data, world?.id],
  );

  if (!world) return null;

  // R-20 (role-audit) — platform Admin nemá governance moc; viewerRole = skutečná
  // world role (admin bez staff role nevidí PJ akce: role, odebrání, skupiny).
  const viewerRole: WorldRole = userRole ?? WorldRole.Zadatel;

  function handleUpdate(payload: UpdateMemberPayload) {
    updateMember.mutate(payload, {
      onSuccess: () => toast.success('Člen aktualizován.'),
      onError: () => toast.error('Úprava člena selhala.'),
    });
  }

  function handleAssignCharacter(membershipId: string, characterPath?: string) {
    // World-scoped avatar = obrázek přiřazené postavy (z directory).
    const avatarUrl = characterPath
      ? (directoryQ.data ?? []).find((c) => c.slug === characterPath)?.imageUrl
      : undefined;
    updateMemberCharacter.mutate(
      { membershipId, characterPath, avatarUrl },
      {
        onSuccess: () =>
          toast.success(
            characterPath ? 'Postava přiřazena.' : 'Postava odpojena.',
          ),
        onError: () => toast.error('Přiřazení postavy selhalo.'),
      },
    );
  }

  // PC = postava hráče: ne NPC a ne Lokace (Lokace má taky Character
  // s kind='location', ale jako postavu hráče ji přiřadit nelze).
  const pcCharacters = (directoryQ.data ?? []).filter(
    (c) => !c.isNpc && c.kind !== 'location',
  );

  const customGroups = editorSettings.customGroups ?? [];
  const akjTypes = editorSettings.akjTypes ?? [];

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
                pcCharacters={pcCharacters}
                viewerRole={viewerRole}
                viewerUserId={currentUser?.id ?? ''}
                onUpdate={handleUpdate}
                onRemove={(id, name) => setToRemove({ id, name })}
                onAssignCharacter={handleAssignCharacter}
                onCreateForMember={createForMember}
              />
            ))}
          </div>
        ) : (
          <p className={s.empty}>Tento svět zatím nemá žádné členy.</p>
        )}
      </SettingsPanel>

      {viewerRole >= WorldRole.PJ && !settingsQ.isLoading && (
        <SettingsPanel
          title="Skupiny a barvy"
          description="Skupiny člení party/frakce světa. Barva je odlišuje v chatu a seznamech. Tady je založíš (název + barva), pak je můžeš nahoře přidělit členům."
        >
          <GroupColorEditor worldId={world.id} settings={editorSettings} />
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
