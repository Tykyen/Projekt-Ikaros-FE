import { useId, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Modal, Button, Input } from '@/shared/ui';
import { parseApiError } from '@/shared/api/client';
import { WorldRole } from '@/shared/types';
import { useWorldMembers } from '@/features/world/api/useWorldMembers';
import { useUploadImage } from '@/shared/api';
import {
  useCreateChannel,
  useUpdateChannel,
  useDeleteChannel,
} from '../api/useChannelMutations';
import type {
  ChannelAccessMode,
  ChatChannel,
  GroupWithChannels,
} from '../lib/types';
import s from './CreateDialogs.module.css';

type Mode = 'create' | 'edit';

interface ChannelDialogProps {
  worldId: string;
  mode: Mode;
  initial?: ChatChannel;
  groups: GroupWithChannels[];
  defaultGroupId: string | null;
  currentUserId: string;
  onClose: () => void;
}

const ACCESS_OPTIONS: {
  value: ChannelAccessMode;
  label: string;
  hint: string;
}[] = [
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

/** Dialog konverzace (`ChatChannel`) — create + edit + smazat + hromadné 1:1 (PJ). */
export function ChannelDialog({
  worldId,
  mode,
  initial,
  groups,
  defaultGroupId,
  currentUserId,
  onClose,
}: ChannelDialogProps) {
  const isEdit = mode === 'edit' && !!initial;
  const uid = useId();

  const [name, setName] = useState(initial?.name ?? '');
  const [groupId, setGroupId] = useState(
    () =>
      initial?.groupId ?? defaultGroupId ?? groups[0]?.group.id ?? '',
  );
  const [accessMode, setAccessMode] = useState<ChannelAccessMode>(
    initial?.accessMode ?? 'all',
  );
  const [roles, setRoles] = useState<WorldRole[]>(
    (initial?.allowedRoles ?? []) as WorldRole[],
  );
  const [memberIds, setMemberIds] = useState<string[]>(
    initial?.allowedMemberIds ?? [],
  );
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    initial?.imageUrl ?? null,
  );
  const [removeImage, setRemoveImage] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const members = useWorldMembers(worldId);
  const createChannel = useCreateChannel(worldId);
  const updateChannel = useUpdateChannel(worldId);
  const deleteChannel = useDeleteChannel(worldId);
  const uploadImage = useUploadImage();
  const busy =
    createChannel.isPending ||
    updateChannel.isPending ||
    deleteChannel.isPending ||
    uploadImage.isPending ||
    bulkBusy;

  const memberList = useMemo(
    () => (members.data ?? []).filter((m) => m.user),
    [members.data],
  );

  const toggle = <T,>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const pickedFile = (f: File | null) => {
    setFile(f);
    setRemoveImage(false);
    setPreview(f ? URL.createObjectURL(f) : (initial?.imageUrl ?? null));
  };

  const removeCurrent = () => {
    setFile(null);
    setPreview(null);
    setRemoveImage(true);
  };

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed || !groupId || busy) return;
    try {
      let uploadedUrl: string | undefined;
      if (file) uploadedUrl = (await uploadImage.mutateAsync(file)).url;

      if (mode === 'create') {
        await createChannel.mutateAsync({
          groupId,
          name: trimmed,
          accessMode,
          allowedRoles: accessMode === 'roles' ? roles : undefined,
          allowedMemberIds:
            accessMode === 'members' ? memberIds : undefined,
          imageUrl: uploadedUrl,
        });
        toast.success('Konverzace vytvořena');
      } else if (initial) {
        const dto: {
          channelId: string;
          name?: string;
          accessMode?: ChannelAccessMode;
          allowedRoles?: number[];
          allowedMemberIds?: string[];
          imageUrl?: string;
          groupId?: string;
        } = { channelId: initial.id };
        if (trimmed !== initial.name) dto.name = trimmed;
        if (groupId !== initial.groupId) dto.groupId = groupId;
        if (accessMode !== initial.accessMode) dto.accessMode = accessMode;
        if (accessMode === 'roles') dto.allowedRoles = roles;
        if (accessMode === 'members') dto.allowedMemberIds = memberIds;
        if (uploadedUrl) dto.imageUrl = uploadedUrl;
        else if (removeImage) dto.imageUrl = '';
        await updateChannel.mutateAsync(dto);
        toast.success('Konverzace uložena');
      }
      onClose();
    } catch (err) {
      toast.error(
        `${mode === 'create' ? 'Vytvoření' : 'Uložení'} selhalo: ${parseApiError(err)}`,
      );
    }
  };

  const handleDelete = async () => {
    if (!initial || busy) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    try {
      await deleteChannel.mutateAsync(initial.id);
      toast.success('Konverzace smazána');
      onClose();
    } catch (err) {
      toast.error(`Smazání selhalo: ${parseApiError(err)}`);
    }
  };

  /** Hromadná akce — pro každého Hráče bez 1:1 konverzace ji založí. */
  const createOneToOneForAll = async () => {
    if (!groupId || busy) return;
    const hraci = memberList.filter((m) => m.role >= WorldRole.Hrac);
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
      onClose={busy ? () => {} : onClose}
      title={isEdit ? 'Upravit konverzaci' : 'Nová konverzace'}
      footer={
        <div className={s.footer}>
          {isEdit && (
            <Button
              variant="ghost"
              onClick={handleDelete}
              disabled={busy}
              className={
                confirmingDelete ? s.deleteConfirm : s.deleteAction
              }
            >
              <Trash2 size={14} />
              {confirmingDelete ? 'Opravdu smazat?' : 'Smazat konverzaci'}
            </Button>
          )}
          <div className={s.footerRight}>
            <Button variant="ghost" onClick={onClose} disabled={busy}>
              Zrušit
            </Button>
            <Button
              onClick={submit}
              disabled={busy || !name.trim() || !groupId}
            >
              {isEdit ? 'Uložit' : 'Vytvořit'}
            </Button>
          </div>
        </div>
      }
    >
      <div className={s.form}>
        <label htmlFor={`${uid}-name`} className={s.field}>
          <span className={s.label}>Název konverzace</span>
          {/* eslint-disable jsx-a11y/no-autofocus -- autofocus na první pole je záměr: modal trapuje fokus, uživatel čeká kurzor v poli názvu */}
          <Input
            id={`${uid}-name`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="např. Evropani Herní"
            maxLength={64}
            autoFocus
          />
          {/* eslint-enable jsx-a11y/no-autofocus */}
        </label>

        <label className={s.field}>
          <span className={s.label}>
            {isEdit ? 'Kanál (přesun)' : 'Kanál'}
          </span>
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
          <span className={s.label}>Obrázek konverzace (volitelné)</span>
          <div className={s.imageRow}>
            {preview && (
              <img className={s.imagePreview} src={preview} alt="" />
            )}
            <Button
              variant="ghost"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
            >
              {preview ? 'Změnit obrázek' : 'Nahrát obrázek'}
            </Button>
            {preview && (
              <Button
                variant="ghost"
                onClick={removeCurrent}
                disabled={busy}
              >
                Odebrat
              </Button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => pickedFile(e.target.files?.[0] ?? null)}
          />
        </div>

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
            {!isEdit && (
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
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
