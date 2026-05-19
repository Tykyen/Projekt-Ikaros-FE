import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Modal, Button, Input } from '@/shared/ui';
import { parseApiError } from '@/shared/api/client';
import { WorldRole } from '@/shared/types';
import { useWorldMembers } from '@/features/world/api/useWorldMembers';
import { useCreateChannel } from '../api/useChannelMutations';
import type {
  ChannelAccessMode,
  GroupWithChannels,
} from '../lib/types';
import s from './CreateDialogs.module.css';

interface CreateChannelDialogProps {
  worldId: string;
  onClose: () => void;
  groups: GroupWithChannels[];
  defaultGroupId: string | null;
  currentUserId: string;
}

const ACCESS_OPTIONS: { value: ChannelAccessMode; label: string; hint: string }[] =
  [
    { value: 'all', label: 'Globální', hint: 'Všichni členové (od role Hráč)' },
    { value: 'roles', label: 'Dle rolí', hint: 'Jen vybrané world role' },
    { value: 'members', label: 'Vybraní členové', hint: 'Ručně zvolení lidé' },
  ];

const ROLE_OPTIONS: { value: WorldRole; label: string }[] = [
  { value: WorldRole.Hrac, label: 'Hráč' },
  { value: WorldRole.Korektor, label: 'Korektor' },
  { value: WorldRole.PomocnyPJ, label: 'Pomocný PJ' },
  { value: WorldRole.PJ, label: 'PJ' },
];

/** Dialog „Nová konverzace" — založení `ChatChannel` + hromadné 1:1 (PJ). */
export function CreateChannelDialog({
  worldId,
  onClose,
  groups,
  defaultGroupId,
  currentUserId,
}: CreateChannelDialogProps) {
  const [name, setName] = useState('');
  const [groupId, setGroupId] = useState(
    () => defaultGroupId ?? groups[0]?.group.id ?? '',
  );
  const [accessMode, setAccessMode] = useState<ChannelAccessMode>('all');
  const [roles, setRoles] = useState<WorldRole[]>([]);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);

  const members = useWorldMembers(worldId);
  const createChannel = useCreateChannel(worldId);
  const busy = createChannel.isPending || bulkBusy;

  const memberList = useMemo(
    () => (members.data ?? []).filter((m) => m.user),
    [members.data],
  );

  const toggle = <T,>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed || !groupId || busy) return;
    try {
      await createChannel.mutateAsync({
        groupId,
        name: trimmed,
        accessMode,
        allowedRoles: accessMode === 'roles' ? roles : undefined,
        allowedMemberIds: accessMode === 'members' ? memberIds : undefined,
      });
      toast.success('Konverzace vytvořena');
      onClose();
    } catch (err) {
      toast.error(`Vytvoření selhalo: ${parseApiError(err)}`);
    }
  };

  /** Hromadná akce — pro každého Hráče bez 1:1 konverzace ji založí. */
  const createOneToOneForAll = async () => {
    if (!groupId || busy) return;
    const hraci = memberList.filter((m) => m.role >= WorldRole.Hrac);
    // Existující 1:1 = `members` konverzace s přesně [PJ, hráč].
    const existingPairs = new Set<string>();
    for (const { channels } of groups) {
      for (const c of channels) {
        if (
          c.accessMode === 'members' &&
          c.allowedMemberIds.length === 2 &&
          c.allowedMemberIds.includes(currentUserId)
        ) {
          const other = c.allowedMemberIds.find((id) => id !== currentUserId);
          if (other) existingPairs.add(other);
        }
      }
    }
    const todo = hraci.filter(
      (m) => m.userId !== currentUserId && !existingPairs.has(m.userId),
    );
    if (todo.length === 0) {
      toast.info('Každý hráč už 1:1 konverzaci má.');
      return;
    }
    setBulkBusy(true);
    let ok = 0;
    for (const m of todo) {
      try {
        await createChannel.mutateAsync({
          groupId,
          name: `1:1 — ${m.user!.username}`,
          accessMode: 'members',
          allowedMemberIds: [currentUserId, m.userId],
        });
        ok += 1;
      } catch {
        /* pokračuj dál — chybné přeskoč */
      }
    }
    setBulkBusy(false);
    toast.success(`Založeno ${ok} 1:1 konverzací.`);
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Nová konverzace"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Zrušit
          </Button>
          <Button
            onClick={submit}
            disabled={busy || !name.trim() || !groupId}
          >
            Vytvořit
          </Button>
        </>
      }
    >
      <div className={s.form}>
        <label className={s.field}>
          <span className={s.label}>Název konverzace</span>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="např. Evropani Herní"
            maxLength={64}
            autoFocus
          />
        </label>

        <label className={s.field}>
          <span className={s.label}>Kanál</span>
          <select
            className={s.select}
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
          >
            {groups.map(({ group }) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </label>

        <div className={s.field}>
          <span className={s.label}>Přístup</span>
          <div className={s.access}>
            {ACCESS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={
                  accessMode === opt.value ? s.accessOn : s.accessOff
                }
                onClick={() => setAccessMode(opt.value)}
              >
                <strong>{opt.label}</strong>
                <span>{opt.hint}</span>
              </button>
            ))}
          </div>
        </div>

        {accessMode === 'roles' && (
          <div className={s.field}>
            <span className={s.label}>Povolené role</span>
            <div className={s.checkList}>
              {ROLE_OPTIONS.map((r) => (
                <label key={r.value} className={s.check}>
                  <input
                    type="checkbox"
                    checked={roles.includes(r.value)}
                    onChange={() => setRoles((p) => toggle(p, r.value))}
                  />
                  {r.label}
                </label>
              ))}
            </div>
          </div>
        )}

        {accessMode === 'members' && (
          <div className={s.field}>
            <span className={s.label}>
              Členové ({memberIds.length})
            </span>
            <div className={s.checkListScroll}>
              {memberList.map((m) => (
                <label key={m.userId} className={s.check}>
                  <input
                    type="checkbox"
                    checked={memberIds.includes(m.userId)}
                    onChange={() =>
                      setMemberIds((p) => toggle(p, m.userId))
                    }
                  />
                  {m.user!.username}
                </label>
              ))}
              {memberList.length === 0 && (
                <p className={s.muted}>Načítám členy…</p>
              )}
            </div>
            <button
              type="button"
              className={s.bulkBtn}
              onClick={createOneToOneForAll}
              disabled={busy}
            >
              {bulkBusy
                ? 'Zakládám 1:1…'
                : '⚡ Hromadně: 1:1 konverzace se všemi hráči'}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
