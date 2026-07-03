import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import {
  ArrowLeft,
  Hash,
  Star,
  Scale,
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
  Pencil,
  Check,
} from 'lucide-react';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole } from '@/shared/types';
import s from './AdminChatPage.module.css';

// ── Mock data (blok A). Nahradí API v bloku B/C. ──────────────────────────
type Role = 'super' | 'admin';
type ConvIconKey = 'hash' | 'star' | 'scale';

interface Conv {
  id: string;
  name: string;
  icon: ConvIconKey;
  sub: string;
  unread?: number;
}
interface Msg {
  id: string;
  author: string;
  role: Role;
  time: string;
  text: string;
  color: string;
  att?: { name: string; size: string };
}
interface Doc {
  id: string;
  name: string;
  desc: string;
  size: string;
  by: string;
  byColor: string;
  date: string;
}
interface Task {
  id: string;
  text: string;
  done: boolean;
}
interface Person {
  id: string;
  name: string;
  initial: string;
  color: string;
  online: boolean;
  isMe: boolean;
  tasks: Task[];
}

const CONVERSATIONS: Conv[] = [
  { id: 'main', name: 'Hlavní', icon: 'hash', sub: 'Anna: hotovo, nahrála jsem to…', unread: 3 },
  { id: 'vedeni', name: 'Vedení', icon: 'star', sub: 'Admini + superadmini' },
  { id: 'pravni', name: 'Právní rámec', icon: 'scale', sub: 'Ty: pošlu draft do pátku' },
];

const MESSAGES: Msg[] = [
  {
    id: 'm1',
    author: 'Tyky',
    role: 'super',
    time: '9:41',
    color: '#e0a94a',
    text: 'Ahoj, nahrál jsem do dokumentů aktuální právní rešerši. Mrkněte prosím na část III, ať to můžeme před spuštěním zavřít.',
  },
  {
    id: 'm2',
    author: 'PJ',
    role: 'admin',
    time: '9:44',
    color: '#5f86d8',
    text: 'Dík. Projedu to dnes odpoledne a hodím poznámky do úkolů.',
  },
  {
    id: 'm3',
    author: 'Anna',
    role: 'admin',
    time: '10:02',
    color: '#4f9e78',
    text: 'Doplnila jsem komunitní strategii, ať to máme pohromadě.',
    att: { name: 'komunitni-strategie-v1.pdf', size: '3,2 MB' },
  },
];

const DOCUMENTS: Doc[] = [
  { id: 'd1', name: 'pravni-ramec-v1.0.pdf', desc: 'Právní rešerše · Část III', size: '4,8 MB', by: 'Tyky', byColor: '#e0a94a', date: '3. 7.' },
  { id: 'd2', name: 'komunitni-strategie-v1.pdf', desc: 'Komunitní kniha', size: '3,2 MB', by: 'Anna', byColor: '#4f9e78', date: '3. 7.' },
  { id: 'd3', name: 'vize-cast-I.pdf', desc: 'Vizní dokument', size: '6,1 MB', by: 'PJ', byColor: '#5f86d8', date: '1. 7.' },
  { id: 'd4', name: 'provozni-rad.pdf', desc: 'Interní', size: '1,1 MB', by: 'Tyky', byColor: '#e0a94a', date: '28. 6.' },
];

const PEOPLE: Person[] = [
  {
    id: 'p1', name: 'Tyky', initial: 'T', color: '#e0a94a', online: true, isMe: true,
    tasks: [
      { id: 't1', text: 'Nahrát právní rešerši do dokumentů', done: true },
      { id: 't2', text: 'Projít připomínky k části III', done: false },
      { id: 't3', text: 'Připravit spuštění pro testery', done: false },
    ],
  },
  {
    id: 'p2', name: 'PJ', initial: 'P', color: '#5f86d8', online: true, isMe: false,
    tasks: [
      { id: 't4', text: 'Revize právní části III', done: false },
      { id: 't5', text: 'Otestovat reset hesla přes e-mail', done: false },
    ],
  },
  {
    id: 'p3', name: 'Anna', initial: 'A', color: '#4f9e78', online: false, isMe: false,
    tasks: [{ id: 't6', text: 'Doplnit komunitní strategii', done: true }],
  },
];

const CONV_ICON: Record<ConvIconKey, typeof Hash> = { hash: Hash, star: Star, scale: Scale };

function ConvIcon({ icon, size }: { icon: ConvIconKey; size: number }) {
  const Icon = CONV_ICON[icon];
  return <Icon size={size} aria-hidden />;
}

/**
 * 20.5 — Interní chat správy platformy. Samostatná route `/admin/chat`
 * (RoleGuard Superadmin/Admin na route). Blok A = layout + statická data;
 * napojení na BE (konverzace/dokumenty/úkoly) přijde v blocích B/C.
 */
export default function AdminChatPage() {
  const user = useAtomValue(currentUserAtom);
  const isSuperadmin = user?.role === UserRole.Superadmin;

  const [activeConvId, setActiveConvId] = useState('main');
  const [view, setView] = useState<'chat' | 'docs'>('chat');
  const [readingDoc, setReadingDoc] = useState<Doc | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set(['p3']));

  const activeConv = CONVERSATIONS.find((c) => c.id === activeConvId) ?? CONVERSATIONS[0];

  const togglePerson = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const openChat = () => {
    setView('chat');
    setReadingDoc(null);
  };

  return (
    <div className={s.page}>
      <header className={s.head}>
        <Link to="/admin" className={s.back}>
          <ArrowLeft size={16} aria-hidden /> Administrace
        </Link>
        <h1 className={s.title}>Chat</h1>
        <p className={s.sub}>
          Interní chat platformy — samostatná stránka pro superadminy &amp; adminy
        </p>
      </header>

      <div className={s.shell}>
        {/* LEVÝ — konverzace */}
        <aside className={s.sidebar}>
          <div className={s.colhead}>
            <span className={s.colTitle}>Chat týmu</span>
          </div>
          <div className={s.groupLabel}>Konverzace</div>
          <nav className={s.navlist}>
            {CONVERSATIONS.map((c) => {
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
                    <ConvIcon icon={c.icon} size={16} />
                  </span>
                  <span className={s.navmeta}>
                    <span className={s.navtitle}>{c.name}</span>
                    <span className={s.navsub}>{c.sub}</span>
                  </span>
                  {c.unread ? <span className={s.badge}>{c.unread}</span> : null}
                </button>
              );
            })}
          </nav>
          {isSuperadmin && (
            <button type="button" className={s.newbtn}>
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
                  <ConvIcon icon={activeConv.icon} size={18} />
                </span>
                <div className={s.chHeadMeta}>
                  <div className={s.chTitle}>{activeConv.name}</div>
                  <div className={s.chSub}>Obecná diskuze · 5 členů · 3 online</div>
                </div>
                <div className={s.spacer} />
                <button type="button" className={s.docbtn} onClick={() => setView('docs')}>
                  <FileText size={15} aria-hidden /> Dokumenty
                </button>
                <button type="button" className={s.iconbtn} title="Hledat ve zprávách">
                  <Search size={16} aria-hidden />
                </button>
                <button
                  type="button"
                  className={s.iconbtn}
                  title={isSuperadmin ? 'Spravovat konverzaci a členy' : 'Konverzace'}
                >
                  <MoreHorizontal size={16} aria-hidden />
                </button>
              </div>

              <div className={s.msgs}>
                <div className={s.daysep}>Dnes</div>
                {MESSAGES.map((m) => (
                  <div key={m.id} className={s.msg}>
                    <span className={s.mav} style={{ background: m.color }}>
                      {m.author[0]}
                    </span>
                    <div className={s.mbody}>
                      <div className={s.mtop}>
                        <span className={s.mname}>{m.author}</span>
                        <span
                          className={
                            m.role === 'super' ? `${s.chip} ${s.chipSuper}` : `${s.chip} ${s.chipAdmin}`
                          }
                        >
                          {m.role === 'super' ? 'Superadmin' : 'Admin'}
                        </span>
                        <span className={s.mtime}>{m.time}</span>
                      </div>
                      <div className={s.mtext}>
                        {m.text}
                        {m.att && (
                          <span className={s.att}>
                            <span className={s.attPdf}>PDF</span> {m.att.name} · {m.att.size}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className={s.composer}>
                <div className={s.cbox}>
                  <button type="button" className={s.iconbtn} title="Přiložit PDF">
                    <Paperclip size={16} aria-hidden />
                  </button>
                  <input
                    className={s.input}
                    placeholder={`Napiš zprávu do „${activeConv.name}"…`}
                  />
                  <button type="button" className={s.sendbtn} title="Odeslat">
                    <Send size={16} aria-hidden />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <DocumentsView
              readingDoc={readingDoc}
              onOpen={setReadingDoc}
              onBackToList={() => setReadingDoc(null)}
              onBackToChat={openChat}
              canUpload={isSuperadmin || true /* každý admin smí nahrát */}
            />
          )}
        </section>

        {/* PRAVÝ — úkoly týmu */}
        <aside className={s.tasks}>
          <div className={s.colhead}>
            <span className={s.colTitle}>Úkoly týmu</span>
          </div>
          <div className={s.tasksBody}>
            {PEOPLE.map((p) => {
              const open = !collapsed.has(p.id);
              const doneCount = p.tasks.filter((t) => t.done).length;
              const canEdit = p.isMe || isSuperadmin;
              return (
                <div key={p.id} className={s.person}>
                  <button type="button" className={s.phead} onClick={() => togglePerson(p.id)}>
                    <span className={s.pav} style={{ background: p.color }}>
                      {p.initial}
                    </span>
                    {p.online && <span className={s.online} aria-label="online" />}
                    <span className={s.pname}>
                      {p.name}
                      {p.isMe && <span className={s.pme}> · ty</span>}
                    </span>
                    <span className={s.pcount}>
                      {doneCount}/{p.tasks.length}
                    </span>
                    <ChevronDown
                      size={13}
                      className={open ? s.chev : `${s.chev} ${s.chevClosed}`}
                      aria-hidden
                    />
                  </button>
                  {open && (
                    <div className={s.ptasks}>
                      {p.tasks.map((t) => (
                        <div key={t.id} className={t.done ? `${s.task} ${s.taskDone}` : s.task}>
                          <span
                            className={t.done ? `${s.chk} ${s.chkDone}` : s.chk}
                            aria-hidden
                          >
                            {t.done && <Check size={12} />}
                          </span>
                          <span className={s.tasktext}>{t.text}</span>
                          {canEdit && (
                            <button
                              type="button"
                              className={s.taskedit}
                              title={p.isMe ? 'Upravit' : 'Upravit (superadmin)'}
                            >
                              <Pencil size={12} aria-hidden />
                            </button>
                          )}
                        </div>
                      ))}
                      {p.isMe && (
                        <button type="button" className={s.addtask}>
                          <Plus size={13} aria-hidden /> přidat úkol
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Dokumenty (přepínač prostředního panelu) ──────────────────────────────
function DocumentsView({
  readingDoc,
  onOpen,
  onBackToList,
  onBackToChat,
  canUpload,
}: {
  readingDoc: Doc | null;
  onOpen: (d: Doc) => void;
  onBackToList: () => void;
  onBackToChat: () => void;
  canUpload: boolean;
}) {
  if (readingDoc) {
    return (
      <div className={s.docs}>
        <div className={s.chhead}>
          <button type="button" className={s.backbtn} onClick={onBackToList}>
            <ArrowLeft size={15} aria-hidden /> Zpět na dokumenty
          </button>
          <div className={s.chHeadMeta}>
            <div className={s.chTitle}>{readingDoc.name}</div>
            <div className={s.chSub}>{readingDoc.desc}</div>
          </div>
          <div className={s.spacer} />
          <button type="button" className={s.docbtn}>
            <Download size={15} aria-hidden /> Stáhnout
          </button>
        </div>
        <div className={s.readerBody}>
          {/* B2: nativní náhled (iframe src=blob/url). Zatím zástupný list. */}
          <div className={s.paper}>
            <h2 className={s.paperH}>{readingDoc.desc}</h2>
            <p className={s.paperNote}>
              Náhled PDF „{readingDoc.name}" — nativní čtečka se doplní v bloku B2.
            </p>
          </div>
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
          <div className={s.chSub}>PDF dostupné všem adminům · klikni na dokument pro čtení</div>
        </div>
        <div className={s.spacer} />
        {canUpload && (
          <button type="button" className={s.docbtn}>
            <Upload size={15} aria-hidden /> Nahrát PDF
          </button>
        )}
      </div>
      <div className={s.doctable}>
        <div className={`${s.docrow} ${s.docrowHead}`}>
          <span>Název</span>
          <span>Velikost</span>
          <span>Nahrál</span>
          <span className={s.right}>Akce</span>
        </div>
        {DOCUMENTS.map((d) => (
          <button key={d.id} type="button" className={s.docrow} onClick={() => onOpen(d)}>
            <span className={s.docname}>
              <span className={s.docPdf}>PDF</span>
              <span className={s.docNm}>
                {d.name}
                <small>{d.desc}</small>
              </span>
            </span>
            <span className={s.docmeta}>{d.size}</span>
            <span className={s.docby}>
              <span className={s.dot} style={{ background: d.byColor }}>
                {d.by[0]}
              </span>{' '}
              {d.by} · {d.date}
            </span>
            <span className={s.docact}>
              <span className={s.miniAct} title="Přečíst">
                <Maximize2 size={14} aria-hidden />
              </span>
              <span className={s.miniAct} title="Stáhnout">
                <Download size={14} aria-hidden />
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
