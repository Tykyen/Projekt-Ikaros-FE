import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Hash,
  Star,
  MessageSquare,
  Search,
  MoreHorizontal,
  Plus,
  ChevronDown,
  FileText,
  Upload,
  Download,
  Trash2,
  Pencil,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient, parseApiError } from '@/shared/api';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole } from '@/shared/types';
import { RoleStar } from '@/shared/ui';
import type { ChatMessage } from '@/features/chat/lib/types';
import { MessageList } from '@/features/chat/components/MessageList';
import { TypingIndicator } from '@/features/chat/components/TypingIndicator';
import { toChatItems } from '@/features/chat/lib/chatItems';
import { useSocket } from '@/features/chat/api/useSocket';
import { AdminChatComposer } from '../components/AdminChatComposer';
import {
  useAdminChatChannels,
  useAdminChatMessages,
  useAdminChatRealtime,
  useMarkAdminChatRead,
  useSendAdminMessage,
  useDeleteAdminMessage,
  useUploadAdminAttachment,
  useToggleAdminReaction,
  adminChatKeys,
} from '../api/useAdminChat';
import { ChannelModal } from '../components/ChannelModal';
import { InputModal } from '../components/InputModal';
import {
  useAdminDocuments,
  useUploadDocument,
  useRenameDocument,
  useDeleteDocument,
} from '../api/useAdminDocuments';
import {
  useAdminTasks,
  useAdminStaff,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
} from '../api/useAdminTasks';
import type { PlatformDocument, AdminTask, AdminChatChannel } from '../lib/types';
import s from './AdminChatPage.module.css';

// ── Helpery ───────────────────────────────────────────────────────────────
function ConvIcon({ type, size }: { type: string; size: number }) {
  const Icon =
    type === 'staff-vedeni' ? Star : type === 'staff-main' ? Hash : MessageSquare;
  return <Icon size={size} aria-hidden />;
}

const AVATAR_PALETTE = [
  '#e0a94a',
  '#5f86d8',
  '#4f9e78',
  '#c56b9a',
  '#8a7de0',
  '#4fa6b8',
];
function colorFromId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

/**
 * 20.5 — Interní chat správy platformy (`/admin/chat`, RoleGuard Sa/Admin).
 * Chat, dokumenty i úkoly jsou napojené na BE.
 */
export default function AdminChatPage() {
  const user = useAtomValue(currentUserAtom);
  const isSuperadmin = user?.role === UserRole.Superadmin;
  const qc = useQueryClient();

  const { data: channels } = useAdminChatChannels();
  // Avatar z osobní karty: nové zprávy nesou `senderAvatarUrl` (BE), historické
  // dopočítáme ze seznamu správců podle senderId (obdoba resolveAccountAvatar).
  const { data: staff } = useAdminStaff();
  const staffById = useMemo(
    () => new Map((staff ?? []).map((m) => [m.id, m])),
    [staff],
  );
  // userId → username pro `MessageItem` (recovery ObjectID senderName).
  const usersById = useMemo(
    () => new Map((staff ?? []).map((m) => [m.id, m.username])),
    [staff],
  );
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [view, setView] = useState<'chat' | 'docs'>('chat');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [surfaceColor, setSurfaceColor] = useState('#12151d');

  useEffect(() => {
    if (!activeConvId && channels && channels.length > 0) {
      setActiveConvId(channels[0].id);
    }
  }, [channels, activeConvId]);

  const activeConv = channels?.find((c) => c.id === activeConvId) ?? null;
  const { data: messages } = useAdminChatMessages(
    view === 'chat' ? activeConvId : null,
  );
  const { typingNames } = useAdminChatRealtime(activeConvId);
  const markRead = useMarkAdminChatRead();

  // 20.5b — otevřená konverzace = přečtená. Běží při vstupu do ní i při
  // příchozí nové zprávě (změna počtu), aby badge „Chat správy" pro právě
  // sledovanou konverzaci nerostl. `markRead` je stabilní (mutace).
  const msgCount = view === 'chat' ? (messages?.length ?? 0) : 0;
  useEffect(() => {
    if (view === 'chat' && activeConvId && msgCount > 0) {
      markRead.mutate(activeConvId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConvId, view, msgCount]);
  const socket = useSocket();
  const sendMut = useSendAdminMessage(activeConvId ?? '');
  const deleteMut = useDeleteAdminMessage(activeConvId ?? '');
  const uploadMut = useUploadAdminAttachment(activeConvId ?? '');
  const reactionMut = useToggleAdminReaction(activeConvId ?? '');
  const [channelModal, setChannelModal] = useState<{
    open: boolean;
    channel: AdminChatChannel | null;
  }>({ open: false, channel: null });

  const items = useMemo(() => toChatItems(messages ?? []), [messages]);

  // Barva pozadí panelu pro kontrast guard textu zpráv (čteno z DOM po mountu).
  const centerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!centerRef.current) return;
    const bg = getComputedStyle(centerRef.current).backgroundColor;
    if (bg) setSurfaceColor(bg);
  }, []);

  const resolveAccountAvatar = useCallback(
    (senderId: string) => staffById.get(senderId)?.avatarUrl,
    [staffById],
  );

  // RoleStar vedle jména odesílatele (dle globální role z members). Aditivní
  // prop `MessageItem` — world/global chat ho nepředává.
  const renderSenderBadge = useCallback(
    (m: ChatMessage) => {
      const sm = staffById.get(m.senderId);
      return sm ? <RoleStar role={sm.role as UserRole} size="sm" /> : null;
    },
    [staffById],
  );

  const emitTyping = useCallback(
    (isTyping: boolean) => {
      if (!activeConvId) return;
      socket.emit('platform-chat:typing', { channelId: activeConvId, isTyping });
    },
    [socket, activeConvId],
  );

  const openChat = () => {
    setView('chat');
  };

  const handleSend = (payload: {
    content?: string;
    attachments?: ChatMessage['attachments'];
    replyToId?: string;
  }) => {
    if (!activeConvId) return;
    sendMut.mutate(payload, {
      onSuccess: (msg) => {
        qc.setQueryData<ChatMessage[]>(
          adminChatKeys.messages(activeConvId),
          (old) => {
            if (!old) return [msg];
            if (old.some((m) => m.id === msg.id)) return old;
            return [...old, msg];
          },
        );
      },
    });
  };

  const handleNewChannel = () =>
    setChannelModal({ open: true, channel: null });
  const handleEditChannel = () => {
    if (activeConv) setChannelModal({ open: true, channel: activeConv });
  };

  const convSubtitle = activeConv
    ? activeConv.accessMode === 'all'
      ? 'Všichni správci'
      : `${activeConv.allowedMemberIds.length} členů`
    : '';

  return (
    <div className={s.page}>
      <div className={s.shell}>
        {/* LEVÝ — konverzace */}
        <aside className={s.sidebar}>
          <div className={s.colhead}>
            <Link to="/admin" className={s.back}>
              <ArrowLeft size={14} aria-hidden /> Administrace
            </Link>
            <span className={s.colTitle}>Chat týmu</span>
          </div>
          <div className={s.groupLabel}>Konverzace</div>
          <nav className={s.navlist}>
            {(channels ?? []).map((c) => {
              const active = c.id === activeConvId && view === 'chat';
              return (
                <button
                  key={c.id}
                  type="button"
                  className={active ? `${s.navitem} ${s.navactive}` : s.navitem}
                  onClick={() => {
                    // Přepnutí konverzace ruší rozepsanou odpověď (patřila jiné).
                    if (c.id !== activeConvId) setReplyTo(null);
                    setActiveConvId(c.id);
                    openChat();
                  }}
                >
                  <span className={s.navicon}>
                    <ConvIcon type={c.type} size={16} />
                  </span>
                  <span className={s.navmeta}>
                    <span className={s.navtitle}>{c.name}</span>
                    {c.lastMessagePreview && (
                      <span className={s.navsub}>{c.lastMessagePreview}</span>
                    )}
                  </span>
                </button>
              );
            })}
          </nav>
          {isSuperadmin && (
            <button type="button" className={s.newbtn} onClick={handleNewChannel}>
              <Plus size={15} aria-hidden /> Nová konverzace
            </button>
          )}
        </aside>

        {/* STŘED — chat / dokumenty */}
        <section className={s.center} ref={centerRef}>
          {view === 'chat' ? (
            <div className={s.chat}>
              <div className={s.chhead}>
                <span className={s.chAvatar}>
                  {activeConv ? (
                    <ConvIcon type={activeConv.type} size={18} />
                  ) : (
                    <MessageSquare size={18} aria-hidden />
                  )}
                </span>
                <div className={s.chHeadMeta}>
                  <div className={s.chTitle}>{activeConv?.name ?? 'Chat'}</div>
                  <div className={s.chSub}>{convSubtitle}</div>
                </div>
                <div className={s.spacer} />
                <button
                  type="button"
                  className={s.docbtn}
                  onClick={() => setView('docs')}
                >
                  <FileText size={15} aria-hidden /> Dokumenty
                </button>
                <button type="button" className={s.iconbtn} title="Hledat ve zprávách">
                  <Search size={16} aria-hidden />
                </button>
                {isSuperadmin && (
                  <button
                    type="button"
                    className={s.iconbtn}
                    title="Spravovat konverzaci a členy"
                    onClick={handleEditChannel}
                  >
                    <MoreHorizontal size={16} aria-hidden />
                  </button>
                )}
              </div>

              <MessageList
                items={items}
                currentUserId={user?.id ?? ''}
                surfaceColor={surfaceColor}
                canDelete={isSuperadmin}
                usersById={usersById}
                allowReactions
                onDelete={(id) => deleteMut.mutate(id)}
                onReply={setReplyTo}
                onToggleReaction={(messageId, emoji) =>
                  reactionMut.mutate({ messageId, emoji })
                }
                resolveAccountAvatar={resolveAccountAvatar}
                renderSenderBadge={renderSenderBadge}
                emptyText="Zatím žádné zprávy — napiš první."
              />

              <div className={s.typingRow}>
                <TypingIndicator names={typingNames} />
              </div>

              <AdminChatComposer
                disabled={!activeConvId}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                onUploadAttachment={(f) => uploadMut.mutateAsync(f)}
                onSend={handleSend}
                onTypingStart={() => emitTyping(true)}
                onTypingStop={() => emitTyping(false)}
                placeholder={
                  activeConv
                    ? `Napiš zprávu do „${activeConv.name}"…`
                    : 'Vyber konverzaci…'
                }
              />
            </div>
          ) : (
            <DocumentsView
              onBackToChat={openChat}
              currentUserId={user?.id}
              isSuperadmin={isSuperadmin}
            />
          )}
        </section>

        {/* PRAVÝ — úkoly týmu */}
        <TasksPanel currentUserId={user?.id} isSuperadmin={isSuperadmin} />
      </div>

      <ChannelModal
        open={channelModal.open}
        channel={channelModal.channel}
        currentUserId={user?.id}
        onClose={() => setChannelModal({ open: false, channel: null })}
        onSaved={(id) => {
          if (id) setActiveConvId(id);
        }}
      />
    </div>
  );
}

// ── Úkoly týmu (napojené na BE) ───────────────────────────────────────────
function TasksPanel({
  currentUserId,
  isSuperadmin,
}: {
  currentUserId?: string;
  isSuperadmin: boolean;
}) {
  const { data: tasks } = useAdminTasks();
  const { data: staff } = useAdminStaff();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [newText, setNewText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const groups = useMemo(() => {
    const byOwner = new Map<string, AdminTask[]>();
    for (const t of tasks ?? []) {
      const arr = byOwner.get(t.ownerId) ?? [];
      arr.push(t);
      byOwner.set(t.ownerId, arr);
    }
    // Základ = všichni admini (i bez úkolů). Fallback na ownery z úkolů,
    // dokud se seznam členů nenačte.
    const members =
      staff && staff.length > 0
        ? staff.map((m) => ({
            ownerId: m.id,
            ownerName: m.username,
            avatarUrl: m.avatarUrl as string | undefined,
            role: m.role as UserRole | undefined,
            tasks: byOwner.get(m.id) ?? [],
          }))
        : Array.from(byOwner.entries()).map(([id, ts]) => ({
            ownerId: id,
            ownerName: ts[0]?.ownerName ?? '?',
            avatarUrl: undefined as string | undefined,
            role: undefined as UserRole | undefined,
            tasks: ts,
          }));
    members.sort((a, b) => {
      if (a.ownerId === currentUserId) return -1;
      if (b.ownerId === currentUserId) return 1;
      return a.ownerName.localeCompare(b.ownerName, 'cs');
    });
    return members;
  }, [tasks, staff, currentUserId]);

  const togglePerson = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submitNew = (ownerId: string) => {
    const text = newText.trim();
    setAddingFor(null);
    setNewText('');
    if (text) {
      createTask.mutate({
        text,
        ...(ownerId !== currentUserId ? { ownerId } : {}),
      });
    }
  };

  const submitEdit = (id: string) => {
    const text = editText.trim();
    setEditingId(null);
    setEditText('');
    if (text) updateTask.mutate({ id, text });
  };

  return (
    <aside className={s.tasks}>
      <div className={s.colhead}>
        <span className={s.colTitle}>Úkoly týmu</span>
      </div>
      <div className={s.tasksBody}>
        {groups.map((g) => {
          const isMe = g.ownerId === currentUserId;
          const open = !collapsed.has(g.ownerId);
          const doneCount = g.tasks.filter((t) => t.done).length;
          const canEdit = isMe || isSuperadmin;
          return (
            <div key={g.ownerId} className={s.person}>
              <button
                type="button"
                className={s.phead}
                onClick={() => togglePerson(g.ownerId)}
              >
                {g.avatarUrl ? (
                  <img
                    className={s.pav}
                    src={g.avatarUrl}
                    alt={g.ownerName}
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <span
                    className={s.pav}
                    style={{ background: colorFromId(g.ownerId) }}
                  >
                    {(g.ownerName[0] ?? '?').toUpperCase()}
                  </span>
                )}
                <span className={s.pname}>
                  {g.ownerName}
                  {isMe && <span className={s.pme}> · ty</span>}
                </span>
                {g.role != null && <RoleStar role={g.role} size="sm" />}
                <span className={s.pcount}>
                  {doneCount}/{g.tasks.length}
                </span>
                <ChevronDown
                  size={13}
                  className={open ? s.chev : `${s.chev} ${s.chevClosed}`}
                  aria-hidden
                />
              </button>
              {open && (
                <div className={s.ptasks}>
                  {g.tasks.map((t) => (
                    <div
                      key={t.id}
                      className={t.done ? `${s.task} ${s.taskDone}` : s.task}
                    >
                      <button
                        type="button"
                        className={t.done ? `${s.chk} ${s.chkDone}` : s.chk}
                        disabled={!canEdit}
                        onClick={() =>
                          canEdit &&
                          updateTask.mutate({ id: t.id, done: !t.done })
                        }
                        aria-label={t.done ? 'Zrušit hotovo' : 'Označit hotovo'}
                      >
                        {t.done && <Check size={12} />}
                      </button>
                      {editingId === t.id ? (
                        <input
                          className={s.taskEditInput}
                          value={editText}
                          autoFocus
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') submitEdit(t.id);
                            if (e.key === 'Escape') {
                              setEditingId(null);
                              setEditText('');
                            }
                          }}
                          onBlur={() => submitEdit(t.id)}
                        />
                      ) : (
                        <span className={s.tasktext}>{t.text}</span>
                      )}
                      {canEdit && editingId !== t.id && (
                        <span className={s.taskActions}>
                          <button
                            type="button"
                            className={s.taskedit}
                            title="Upravit"
                            onClick={() => {
                              setEditingId(t.id);
                              setEditText(t.text);
                            }}
                          >
                            <Pencil size={12} aria-hidden />
                          </button>
                          <button
                            type="button"
                            className={s.taskedit}
                            title="Smazat"
                            onClick={() => {
                              if (window.confirm('Smazat úkol?'))
                                deleteTask.mutate(t.id);
                            }}
                          >
                            <Trash2 size={12} aria-hidden />
                          </button>
                        </span>
                      )}
                    </div>
                  ))}
                  {canEdit &&
                    (addingFor === g.ownerId ? (
                      <input
                        className={s.taskEditInput}
                        value={newText}
                        autoFocus
                        placeholder="Nový úkol…"
                        onChange={(e) => setNewText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') submitNew(g.ownerId);
                          if (e.key === 'Escape') {
                            setAddingFor(null);
                            setNewText('');
                          }
                        }}
                        onBlur={() => submitNew(g.ownerId)}
                      />
                    ) : (
                      <button
                        type="button"
                        className={s.addtask}
                        onClick={() => {
                          setAddingFor(g.ownerId);
                          setNewText('');
                        }}
                      >
                        <Plus size={13} aria-hidden /> přidat úkol
                      </button>
                    ))}
                </div>
              )}
            </div>
          );
        })}
        {groups.length === 0 && (
          <div className={s.emptyMsg}>Zatím žádné úkoly.</div>
        )}
      </div>
    </aside>
  );
}

// ── Dokumenty (napojené na BE) ────────────────────────────────────────────
function DocumentsView({
  onBackToChat,
  currentUserId,
  isSuperadmin,
}: {
  onBackToChat: () => void;
  currentUserId?: string;
  isSuperadmin: boolean;
}) {
  const { data: docs } = useAdminDocuments();
  const uploadMut = useUploadDocument();
  const renameMut = useRenameDocument();
  const deleteMut = useDeleteDocument();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f)
      uploadMut.mutate(f, {
        // Ukázat skutečný důvod selhání (BE teď vrací konkrétní Cloudinary hlášku
        // místo mlhavého 502) — jinak by uživatel viděl chybu jen v konzoli.
        onError: (err) => toast.error(parseApiError(err)),
      });
    e.target.value = '';
  };

  // 20.5 — Cloudinary drží PDF jako `raw` (bez `.pdf`, hlavička nutí stažení) →
  // přímé otevření URL by soubor jen stáhlo bez přípony. Čteme přes BE „view"
  // endpoint, který přebalí na `application/pdf` + `inline` → prohlížeč otevře
  // čtečku. Okno otevřeme hned (user-gesture, obejde popup blocker), obsah
  // doplníme po dotažení blobu (auth přes apiClient interceptor).
  const openDoc = async (d: PlatformDocument) => {
    // 'noopener' by vrátilo null (nešel by nastavit obsah) → handle bereme bez
    // něj a `opener` nulujeme ručně (stejná ochrana proti manipulaci ze záložky).
    const w = window.open('', '_blank');
    if (w) w.opener = null;
    try {
      const res = await apiClient.get(`/admin-chat/documents/${d.id}/view`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data as Blob);
      if (w) w.location.href = url;
      else window.open(url, '_blank', 'noopener,noreferrer');
      // Blob URL musí přežít, než ho karta načte; po chvíli uvolníme paměť.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      w?.close();
      toast.error('Dokument se nepodařilo otevřít.');
    }
  };

  // Stažení přes stejný BE endpoint: blob je same-origin → `a.download` s názvem
  // funguje (u přímé Cloudinary URL je cross-origin a název se ignoruje).
  const downloadDoc = async (d: PlatformDocument) => {
    try {
      const res = await apiClient.get(`/admin-chat/documents/${d.id}/view`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${d.filename.replace(/\.pdf$/i, '')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Stažení se nepodařilo.');
    }
  };

  const [renameTarget, setRenameTarget] = useState<PlatformDocument | null>(
    null,
  );
  const renameDoc = (d: PlatformDocument) => setRenameTarget(d);

  return (
    <div className={s.docs}>
      <div className={s.chhead}>
        <button type="button" className={s.backbtn} onClick={onBackToChat}>
          <ArrowLeft size={15} aria-hidden /> Zpět na chat
        </button>
        <div className={s.chHeadMeta}>
          <div className={s.chTitle}>Sdílené dokumenty</div>
          <div className={s.chSub}>
            PDF dostupné všem adminům · klikni na dokument pro otevření
          </div>
        </div>
        <div className={s.spacer} />
        <input
          type="file"
          accept="application/pdf"
          ref={fileRef}
          style={{ display: 'none' }}
          onChange={handleFile}
        />
        <button
          type="button"
          className={s.docbtn}
          onClick={() => fileRef.current?.click()}
          disabled={uploadMut.isPending}
        >
          <Upload size={15} aria-hidden />
          {uploadMut.isPending ? ' Nahrávám…' : ' Nahrát PDF'}
        </button>
      </div>
      <div className={s.doctable}>
        {(docs ?? []).map((d) => {
          const canManage = isSuperadmin || d.uploaderId === currentUserId;
          return (
            <div
              key={d.id}
              className={s.docrow}
              onClick={() => openDoc(d)}
              role="button"
              tabIndex={0}
              title={d.filename}
            >
              <span className={s.docname}>
                <span className={s.docPdf}>PDF</span>
                <span className={s.docNm}>{d.filename}</span>
              </span>
              <span className={s.docact}>
                {canManage && (
                  <button
                    type="button"
                    className={s.miniAct}
                    title="Přejmenovat"
                    onClick={(e) => {
                      e.stopPropagation();
                      renameDoc(d);
                    }}
                  >
                    <Pencil size={14} aria-hidden />
                  </button>
                )}
                <button
                  type="button"
                  className={s.miniAct}
                  title="Stáhnout"
                  onClick={(e) => {
                    e.stopPropagation();
                    void downloadDoc(d);
                  }}
                >
                  <Download size={14} aria-hidden />
                </button>
                {canManage && (
                  <button
                    type="button"
                    className={s.miniAct}
                    title="Smazat"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Smazat „${d.filename}"?`)) {
                        deleteMut.mutate(d.id);
                      }
                    }}
                  >
                    <Trash2 size={14} aria-hidden />
                  </button>
                )}
              </span>
            </div>
          );
        })}
        {docs && docs.length === 0 && (
          <div className={s.emptyMsg}>
            Zatím žádné dokumenty — nahraj první PDF.
          </div>
        )}
      </div>
      <InputModal
        open={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        title="Přejmenovat dokument"
        label="Nový název"
        initialValue={renameTarget?.filename}
        onConfirm={(name) => {
          if (renameTarget && name !== renameTarget.filename)
            renameMut.mutate({ id: renameTarget.id, filename: name });
        }}
      />
    </div>
  );
}
