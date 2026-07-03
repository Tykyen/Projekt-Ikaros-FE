import { useState, useEffect, useRef, useMemo } from 'react';
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
  Paperclip,
  Send,
  Plus,
  ChevronDown,
  FileText,
  Upload,
  Download,
  Maximize2,
  Trash2,
  Pencil,
  Check,
} from 'lucide-react';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole } from '@/shared/types';
import type { ChatMessage } from '@/features/chat/lib/types';
import {
  useAdminChatChannels,
  useAdminChatMessages,
  useAdminChatRealtime,
  useSendAdminMessage,
  useCreateAdminChannel,
  adminChatKeys,
} from '../api/useAdminChat';
import {
  useAdminDocuments,
  useUploadDocument,
  useDeleteDocument,
} from '../api/useAdminDocuments';
import {
  useAdminTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
} from '../api/useAdminTasks';
import type { PlatformDocument, AdminTask } from '../lib/types';
import s from './AdminChatPage.module.css';

// ── Helpery ───────────────────────────────────────────────────────────────
function ConvIcon({ type, size }: { type: string; size: number }) {
  const Icon =
    type === 'staff-vedeni' ? Star : type === 'staff-main' ? Hash : MessageSquare;
  return <Icon size={size} aria-hidden />;
}

function fmtTime(iso: string | Date): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' });
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
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [view, setView] = useState<'chat' | 'docs'>('chat');
  const [readingDoc, setReadingDoc] = useState<PlatformDocument | null>(null);
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    if (!activeConvId && channels && channels.length > 0) {
      setActiveConvId(channels[0].id);
    }
  }, [channels, activeConvId]);

  const activeConv = channels?.find((c) => c.id === activeConvId) ?? null;
  const { data: messages } = useAdminChatMessages(
    view === 'chat' ? activeConvId : null,
  );
  useAdminChatRealtime(activeConvId);
  const sendMut = useSendAdminMessage(activeConvId ?? '');
  const createChannel = useCreateAdminChannel();

  const msgsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = msgsRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const openChat = () => {
    setView('chat');
    setReadingDoc(null);
  };

  const handleSend = () => {
    const text = messageText.trim();
    if (!text || !activeConvId) return;
    setMessageText('');
    sendMut.mutate(text, {
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

  const handleNewChannel = () => {
    const name = window.prompt('Název nové konverzace:')?.trim();
    if (name) {
      createChannel.mutate(
        { name },
        { onSuccess: (ch) => setActiveConvId(ch.id) },
      );
    }
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
        <section className={s.center}>
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
                  >
                    <MoreHorizontal size={16} aria-hidden />
                  </button>
                )}
              </div>

              <div className={s.msgs} ref={msgsRef}>
                {(messages ?? []).map((m) => (
                  <div key={m.id} className={s.msg}>
                    <span
                      className={s.mav}
                      style={{ background: colorFromId(m.senderId) }}
                    >
                      {(m.senderName?.[0] ?? '?').toUpperCase()}
                    </span>
                    <div className={s.mbody}>
                      <div className={s.mtop}>
                        <span className={s.mname}>{m.senderName}</span>
                        <span className={s.mtime}>{fmtTime(m.createdAt)}</span>
                      </div>
                      <div className={s.mtext}>{m.content}</div>
                    </div>
                  </div>
                ))}
                {messages && messages.length === 0 && (
                  <div className={s.emptyMsg}>
                    Zatím žádné zprávy — napiš první.
                  </div>
                )}
              </div>

              <form
                className={s.composer}
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
              >
                <div className={s.cbox}>
                  <button
                    type="button"
                    className={s.iconbtn}
                    title="Přiložit PDF (připravuje se)"
                    disabled
                  >
                    <Paperclip size={16} aria-hidden />
                  </button>
                  <input
                    className={s.input}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={
                      activeConv
                        ? `Napiš zprávu do „${activeConv.name}"…`
                        : 'Vyber konverzaci…'
                    }
                    disabled={!activeConvId}
                  />
                  <button
                    type="submit"
                    className={s.sendbtn}
                    title="Odeslat"
                    disabled={!activeConvId || !messageText.trim()}
                  >
                    <Send size={16} aria-hidden />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <DocumentsView
              readingDoc={readingDoc}
              onOpen={setReadingDoc}
              onBackToList={() => setReadingDoc(null)}
              onBackToChat={openChat}
              currentUserId={user?.id}
              isSuperadmin={isSuperadmin}
            />
          )}
        </section>

        {/* PRAVÝ — úkoly týmu */}
        <TasksPanel currentUserId={user?.id} isSuperadmin={isSuperadmin} />
      </div>
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
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [newText, setNewText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const groups = useMemo(() => {
    const map = new Map<
      string,
      { ownerId: string; ownerName: string; tasks: AdminTask[] }
    >();
    for (const t of tasks ?? []) {
      const g = map.get(t.ownerId) ?? {
        ownerId: t.ownerId,
        ownerName: t.ownerName,
        tasks: [],
      };
      g.tasks.push(t);
      map.set(t.ownerId, g);
    }
    // Vlastní skupina vždy (i prázdná) — ať si můžu přidat úkol.
    if (currentUserId && !map.has(currentUserId)) {
      map.set(currentUserId, {
        ownerId: currentUserId,
        ownerName: 'Ty',
        tasks: [],
      });
    }
    const arr = Array.from(map.values());
    arr.sort((a, b) => {
      if (a.ownerId === currentUserId) return -1;
      if (b.ownerId === currentUserId) return 1;
      return a.ownerName.localeCompare(b.ownerName, 'cs');
    });
    return arr;
  }, [tasks, currentUserId]);

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
                <span
                  className={s.pav}
                  style={{ background: colorFromId(g.ownerId) }}
                >
                  {(g.ownerName[0] ?? '?').toUpperCase()}
                </span>
                <span className={s.pname}>
                  {g.ownerName}
                  {isMe && <span className={s.pme}> · ty</span>}
                </span>
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
  readingDoc,
  onOpen,
  onBackToList,
  onBackToChat,
  currentUserId,
  isSuperadmin,
}: {
  readingDoc: PlatformDocument | null;
  onOpen: (d: PlatformDocument) => void;
  onBackToList: () => void;
  onBackToChat: () => void;
  currentUserId?: string;
  isSuperadmin: boolean;
}) {
  const { data: docs } = useAdminDocuments();
  const uploadMut = useUploadDocument();
  const deleteMut = useDeleteDocument();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) uploadMut.mutate(f);
    e.target.value = '';
  };

  if (readingDoc) {
    return (
      <div className={s.docs}>
        <div className={s.chhead}>
          <button type="button" className={s.backbtn} onClick={onBackToList}>
            <ArrowLeft size={15} aria-hidden /> Zpět na dokumenty
          </button>
          <div className={s.chHeadMeta}>
            <div className={s.chTitle}>{readingDoc.filename}</div>
            <div className={s.chSub}>
              {fmtSize(readingDoc.sizeBytes)} · nahrál {readingDoc.uploaderName}
            </div>
          </div>
          <div className={s.spacer} />
          <a
            className={s.docbtn}
            href={readingDoc.url}
            target="_blank"
            rel="noreferrer"
            download
          >
            <Download size={15} aria-hidden /> Stáhnout
          </a>
        </div>
        <div className={s.readerBody}>
          <iframe
            className={s.pdfFrame}
            src={readingDoc.url}
            title={readingDoc.filename}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={s.docs}>
      <div className={s.chhead}>
        <button type="button" className={s.backbtn} onClick={onBackToChat}>
          <ArrowLeft size={15} aria-hidden /> Zpět na chat
        </button>
        <div className={s.chHeadMeta}>
          <div className={s.chTitle}>Sdílené dokumenty</div>
          <div className={s.chSub}>
            PDF dostupné všem adminům · klikni na dokument pro čtení
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
        <div className={`${s.docrow} ${s.docrowHead}`}>
          <span>Název</span>
          <span>Velikost</span>
          <span>Nahrál</span>
          <span className={s.right}>Akce</span>
        </div>
        {(docs ?? []).map((d) => {
          const canDelete = isSuperadmin || d.uploaderId === currentUserId;
          return (
            <div
              key={d.id}
              className={s.docrow}
              onClick={() => onOpen(d)}
              role="button"
              tabIndex={0}
            >
              <span className={s.docname}>
                <span className={s.docPdf}>PDF</span>
                <span className={s.docNm}>{d.filename}</span>
              </span>
              <span className={s.docmeta}>{fmtSize(d.sizeBytes)}</span>
              <span className={s.docby}>
                {d.uploaderName} · {fmtDate(d.createdAt)}
              </span>
              <span className={s.docact}>
                <button
                  type="button"
                  className={s.miniAct}
                  title="Přečíst"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen(d);
                  }}
                >
                  <Maximize2 size={14} aria-hidden />
                </button>
                <a
                  className={s.miniAct}
                  href={d.url}
                  target="_blank"
                  rel="noreferrer"
                  download
                  title="Stáhnout"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download size={14} aria-hidden />
                </a>
                {canDelete && (
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
    </div>
  );
}
