import { useState, useEffect } from 'react';
import { Modal } from '@/shared/ui/Modal/Modal';
import { useAdminStaff } from '../api/useAdminTasks';
import {
  useCreateAdminChannel,
  useUpdateAdminChannel,
  useDeleteAdminChannel,
} from '../api/useAdminChat';
import { isSeedChannel, type AdminChatChannel } from '../lib/types';
import s from './modals.module.css';

/**
 * 20.5 — modal pro založení / úpravu konverzace admin chatu. Volba členství:
 * „Všichni správci" (accessMode 'all') nebo „Jen vybraní" (checkbox seznam
 * adminů). Seed konverzace (Hlavní/Vedení) = jen přejmenování (členství zamčené,
 * nelze smazat). Jen pro superadmina (gate na tlačítkách + BE).
 */
export function ChannelModal({
  open,
  onClose,
  channel,
  currentUserId,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  /** null/undefined = nová konverzace; jinak úprava existující. */
  channel?: AdminChatChannel | null;
  currentUserId?: string;
  onSaved?: (id: string) => void;
}) {
  const { data: staff } = useAdminStaff();
  const createMut = useCreateAdminChannel();
  const updateMut = useUpdateAdminChannel();
  const deleteMut = useDeleteAdminChannel();
  const isEdit = !!channel;
  const seed = channel ? isSeedChannel(channel) : false;

  const [name, setName] = useState('');
  const [allMembers, setAllMembers] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!open) return;
    setName(channel?.name ?? '');
    setAllMembers(channel ? channel.accessMode === 'all' : true);
    setSelected(
      new Set(
        channel?.allowedMemberIds ?? (currentUserId ? [currentUserId] : []),
      ),
    );
  }, [open, channel, currentUserId]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const pending =
    createMut.isPending || updateMut.isPending || deleteMut.isPending;

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const memberIds = Array.from(selected);
    if (isEdit && channel) {
      updateMut.mutate(
        { channelId: channel.id, name: trimmed, allMembers, memberIds },
        {
          onSuccess: () => {
            onSaved?.(channel.id);
            onClose();
          },
        },
      );
    } else {
      createMut.mutate(
        { name: trimmed, allMembers, memberIds },
        {
          onSuccess: (ch) => {
            onSaved?.(ch.id);
            onClose();
          },
        },
      );
    }
  };

  const remove = () => {
    if (channel) deleteMut.mutate(channel.id, { onSuccess: onClose });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Upravit konverzaci' : 'Nová konverzace'}
      size="sm"
      footer={
        <div className={s.footer}>
          {isEdit && !seed && (
            <button
              type="button"
              className={s.btnDanger}
              style={{ marginRight: 'auto' }}
              onClick={remove}
              disabled={pending}
            >
              Smazat
            </button>
          )}
          <button type="button" className={s.btnGhost} onClick={onClose}>
            Zrušit
          </button>
          <button
            type="button"
            className={s.btnPrimary}
            onClick={save}
            disabled={!name.trim() || pending}
          >
            {isEdit ? 'Uložit' : 'Vytvořit'}
          </button>
        </div>
      }
    >
      <div className={s.field}>
        <label className={s.label}>Název</label>
        <input
          className={s.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Název konverzace…"
          maxLength={80}
          autoFocus
        />
      </div>

      {!seed && (
        <>
          <div className={s.field}>
            <label className={s.label}>Kdo v ní bude</label>
            <label className={s.radio}>
              <input
                type="radio"
                name="channel-members"
                checked={allMembers}
                onChange={() => setAllMembers(true)}
              />
              Všichni správci
            </label>
            <label className={s.radio}>
              <input
                type="radio"
                name="channel-members"
                checked={!allMembers}
                onChange={() => setAllMembers(false)}
              />
              Jen vybraní
            </label>
          </div>

          {!allMembers && (
            <div className={s.field}>
              <div className={s.memberList}>
                {(staff ?? []).map((m) => {
                  const isMe = m.id === currentUserId;
                  return (
                    <label key={m.id} className={s.member}>
                      <input
                        type="checkbox"
                        checked={selected.has(m.id)}
                        disabled={isMe && !isEdit}
                        onChange={() => toggle(m.id)}
                      />
                      <span>
                        {m.username}
                        {isMe && ' · ty'}
                      </span>
                    </label>
                  );
                })}
                {staff && staff.length === 0 && (
                  <div className={s.empty}>Žádní další správci.</div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
