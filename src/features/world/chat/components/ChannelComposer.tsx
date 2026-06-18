import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import {
  Send,
  X,
  CornerUpLeft,
  Paperclip,
  Theater,
  Calendar,
  AtSign,
  FileText,
  Smile,
} from 'lucide-react';
import { DiceButton } from '../dice/components/DiceButton';
import { DicePickerPopover, type DiceRollResult } from '../dice/components/DicePickerPopover';
import { PoolPromptModal } from '../dice/components/PoolPromptModal';
import { SkinPickerPanel } from '../dice/components/SkinPickerPanel';
import { useDiceSkinMapping } from '../dice/api/useDiceSkinMapping';
import { useDiceRollOverlay } from '../dice/components/DiceRollOverlayProvider';
import { parseDicePayload } from '../dice/lib/dicePayload';
import clsx from 'clsx';
import { toast } from 'sonner';
import {
  ATTACHMENT_LIMITS,
  ACCEPT_ATTR,
  classifyFile,
  validatePick,
} from '@/features/chat/lib/attachments';
import type {
  ChatAttachment,
  ChatMessage,
} from '@/features/chat/lib/types';
import type { WorldMembership } from '@/shared/types';
import { worldMemberAvatar } from '@/features/world/lib/worldMemberAvatar';
import { extractMentionUsernames } from '../lib/parseMentions';
import { resolveDisplayName } from '../lib/resolveDisplayName';
import { useComposerSticky } from '../api/useComposerSticky';
import { useComposerDraftAttachments } from '../api/useComposerDraftAttachments';
import { useCoarsePointer } from '../lib/useCoarsePointer';
import { ChatEmotePickerPopover } from '../emotes/components/ChatEmotePickerPopover';
import { EmoteAutocomplete } from '../emotes/components/EmoteAutocomplete';
import { useWorldEmotes } from '../emotes/api/useWorldEmotes';
import { useGlobalEmotes } from '../emotes/api/useGlobalEmotes';
import type { WorldEmote } from '../emotes/lib/types';
import {
  MentionAutocomplete,
  type MentionCandidate,
} from './MentionAutocomplete';
import {
  NpcOverridePanel,
  type NpcOverrideState,
} from './NpcOverridePanel';
import { SoundBroadcastButton } from './SoundBroadcastButton';
import s from './ChannelComposer.module.css';

/**
 * Krok 6.2 — kompozitní composer světového chatu.
 *
 * Vrstvy (shora dolů):
 *   1. Reply card (volitelné — 6.2a)
 *   2. Attach preview lišta (volitelné — 6.2b)
 *   3. NPC pruh (volitelné, jen PJ+ — 6.2e)
 *   4. Toolbar — 5 razítek + RP chip + whisper select
 *   5. Textarea
 *   6. Signature line + Send + mode chips
 *
 * Optimistic insert + clientNonce drží `useOptimisticSend` (vyšší vrstva),
 * tento komponent jen volá `onSend` s kompletním payloadem.
 */

export interface ComposerSendPayload {
  content?: string;
  attachments?: ChatAttachment[];
  replyToId?: string;
  visibleTo?: string[];
  overrideName?: string;
  overrideAvatarUrl?: string;
  /** 6.2-followup — slug karty vybrané z adresáře (klikací jméno v chatu). */
  overridePageSlug?: string;
  rpDate?: string;
  /** Krok 6.3d — strukturovaná data hodu kostkou. */
  dicePayload?: Record<string, unknown>;
  /** Krok 6.3e — skin použitý odesílatelem pro tento hod. */
  diceSkin?: string;
}

interface Props {
  disabled: boolean;
  /** Barva kanálu — vstup pro nit kanálu (--ch-accent). */
  accentColor: string;
  /** Současný user (potřeba pro filtr mention list-u). */
  currentUserId: string;
  /** Členové konverzace — whisper picker + mention autocomplete. */
  members: WorldMembership[];
  /** PJ+ → razítko NPC viditelné. */
  canManage: boolean;
  worldId: string;
  /** Krok 6.3a — `World.dice` whitelist (typy kostek dovolené v tomto světě). */
  worldDice: string[];
  /** Krok 6.3a — slug světa pro CTA „Otevřít nastavení světa". */
  worldSlug: string;
  /** Klíč konverzace — sticky stav (RP datum, NPC) per (world × channel). */
  channelId: string;
  /** Reply state z `ChannelView`. */
  replyTo: ChatMessage | null;
  onCancelReply: () => void;
  /** Upload jedné přílohy (`useUploadWorldAttachment`). */
  onUploadAttachment: (file: File) => Promise<ChatAttachment>;
  /** Finální send — payload + clientNonce drží optimisticSend. */
  onSend: (payload: ComposerSendPayload) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
}

const TYPING_IDLE_MS = 3000;

export function ChannelComposer({
  disabled,
  accentColor,
  currentUserId,
  members,
  canManage,
  worldId,
  worldDice,
  worldSlug,
  channelId,
  replyTo,
  onCancelReply,
  onUploadAttachment,
  onSend,
  onTypingStart,
  onTypingStop,
}: Props) {
  const [picked, setPicked] = useComposerDraftAttachments(worldId, channelId);
  const [uploading, setUploading] = useState(false);
  const [whisperTo, setWhisperTo] = useState<string>('');
  const [rpPopOpen, setRpPopOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  // Krok 6.3a/c/e — dice picker popover + pool modal + skin picker stav.
  const [dicePickerOpen, setDicePickerOpen] = useState(false);
  const [poolPrompt, setPoolPrompt] = useState<'pool' | 'mixed' | null>(null);
  const [skinPickerOpen, setSkinPickerOpen] = useState(false);
  const [skinPickerJail, setSkinPickerJail] = useState(false);
  const diceBtnRef = useRef<HTMLButtonElement>(null);
  const { getSkin } = useDiceSkinMapping(worldId);
  const diceOverlay = useDiceRollOverlay();
  // Mobil (dotyk): Enter dělá odstavec, ne odeslání — viz onKeyDown níž.
  const isCoarsePointer = useCoarsePointer();

  // 6.2d + 6.2e — sticky stav per (worldId × channelId) přes localStorage:
  // RP datum + NPC mód přežívají odeslání, přepnutí konverzace i refresh.
  const [sticky, setSticky] = useComposerSticky(worldId, channelId);
  const rpDate = sticky.rpDate;
  const npcActive = sticky.npcActive;
  const npcState: NpcOverrideState = {
    name: sticky.npcName,
    avatarUrl: sticky.npcAvatarUrl,
    slug: sticky.npcSlug || undefined,
  };
  // Rozepsaná zpráva (draft) jako sticky pole — text přežije přepnutí
  // konverzace i refresh. Wrapper podporuje hodnotu i updater funkci `(t)=>…`.
  const text = sticky.draft;
  const setText = (v: string | ((prev: string) => string)) =>
    setSticky((p) => ({
      ...p,
      draft: typeof v === 'function' ? v(p.draft) : v,
    }));
  const setRpDate = (v: string) => setSticky((p) => ({ ...p, rpDate: v }));
  const setNpcActive = (next: boolean | ((prev: boolean) => boolean)) =>
    setSticky((p) => ({
      ...p,
      npcActive: typeof next === 'function' ? next(p.npcActive) : next,
    }));
  const setNpcState = (next: NpcOverrideState) =>
    setSticky((p) => ({
      ...p,
      npcName: next.name,
      npcAvatarUrl: next.avatarUrl,
      npcSlug: next.slug ?? '',
    }));
  // Atomic clear — vypne NPC a vyprázdní jméno/avatar/slug jedním setSticky callem.
  const clearNpc = () =>
    setSticky((p) => ({
      ...p,
      npcActive: false,
      npcName: '',
      npcAvatarUrl: '',
      npcSlug: '',
    }));
  const [mentionState, setMentionState] = useState<{
    open: boolean;
    query: string;
    /** Offset textu, kde začíná `@<query>` segment. */
    anchor: number;
  }>({ open: false, query: '', anchor: 0 });

  // D-NEW-emote-autocomplete — `:smi` dropdown
  const [emoteState, setEmoteState] = useState<{
    open: boolean;
    query: string;
    /** Offset textu, kde začíná `:<query>` segment (na pozici `:`). */
    anchor: number;
  }>({ open: false, query: '', anchor: 0 });

  const worldEmotesAcQ = useWorldEmotes(worldId);
  const globalEmotesAcQ = useGlobalEmotes();
  const allEmotesForAc = useMemo(() => {
    const w = worldEmotesAcQ.data ?? [];
    const g = globalEmotesAcQ.data ?? [];
    // Per-svět má prioritu — pokud kolize, world přebije global ve výsledné mapě.
    // Pro autocomplete picker zachováme oba (oddělené, ale unikátní per shortcode).
    const seen = new Set(w.map((e) => e.shortcode.toLowerCase()));
    return [...w, ...g.filter((e) => !seen.has(e.shortcode.toLowerCase()))];
  }, [worldEmotesAcQ.data, globalEmotesAcQ.data]);

  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiBtnRef = useRef<HTMLButtonElement>(null);
  const typing = useRef(false);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idCounter = useRef(0);

  const stopTyping = () => {
    if (stopTimer.current) clearTimeout(stopTimer.current);
    if (typing.current) {
      typing.current = false;
      onTypingStop();
    }
  };

  // Auto-grow textarea (1–5 řádků).
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [text]);

  // Cleanup pri unmount — jen typing stop. Blob náhledy příloh ZÁMĚRNĚ
  // nerevokujeme: draft příloh přežívá přepnutí konverzace (in-memory store),
  // revoke řeší až odebrání (removePicked) / odeslání (clearPicked).
  useEffect(
    () => () => {
      stopTyping();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Whisper target degraduje, pokud cílový člen z konverzace zmizí.
  const effectiveWhisper =
    whisperTo && members.some((m) => m.userId === whisperTo) ? whisperTo : '';

  // Mention kandidáti — bez aktuálního usera.
  const mentionCandidates = useMemo<MentionCandidate[]>(
    () =>
      members
        .filter((m) => m.userId !== currentUserId)
        .map((m) => ({
          userId: m.userId,
          username: m.user?.username ?? m.characterPath ?? m.userId.slice(0, 6),
          characterPath: m.characterPath,
          avatarUrl: worldMemberAvatar(m),
        })),
    [members, currentUserId],
  );

  /** Detekce `@` na pozici kurzoru — otevře/zavře mention picker. */
  const detectMention = (value: string, caret: number) => {
    const upToCaret = value.slice(0, caret);
    const match = /(?:^|\s)@(\w*)$/.exec(upToCaret);
    if (match) {
      setMentionState({
        open: true,
        query: match[1],
        anchor: caret - match[1].length - 1,
      });
    } else {
      setMentionState((s2) => (s2.open ? { ...s2, open: false } : s2));
    }
  };

  /** D-NEW-emote-autocomplete — detekce `:smi` na pozici kurzoru. */
  const detectEmote = (value: string, caret: number) => {
    const upToCaret = value.slice(0, caret);
    // `:` na začátku slova, 1+ znaků shortcode, NE ukončené dvojtečkou
    // (uzavřené `:smile:` už není autocomplete kandidát).
    const match = /(?:^|\s):([a-z0-9_]{1,})$/i.exec(upToCaret);
    if (match) {
      setEmoteState({
        open: true,
        query: match[1].toLowerCase(),
        anchor: caret - match[1].length - 1,
      });
    } else {
      setEmoteState((s2) => (s2.open ? { ...s2, open: false } : s2));
    }
  };

  const handleChange = (v: string, caret: number) => {
    setText(v);
    if (v.trim() && !typing.current) {
      typing.current = true;
      onTypingStart();
    }
    if (stopTimer.current) clearTimeout(stopTimer.current);
    stopTimer.current = setTimeout(stopTyping, TYPING_IDLE_MS);
    detectMention(v, caret);
    detectEmote(v, caret);
  };

  /** Vloží libovolný text na aktuální pozici kurzoru v textarea. */
  const insertAtCursor = (insertion: string) => {
    const ta = taRef.current;
    if (!ta) {
      setText((t) => t + insertion);
      return;
    }
    const start = ta.selectionStart ?? text.length;
    const end = ta.selectionEnd ?? text.length;
    const next = text.slice(0, start) + insertion + text.slice(end);
    setText(next);
    queueMicrotask(() => {
      ta.focus();
      const pos = start + insertion.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  /** D-NEW-emote-autocomplete — vlož `:shortcode: ` na pozici `:`. */
  const insertEmote = (emote: WorldEmote) => {
    const ta = taRef.current;
    if (!ta) return;
    const before = text.slice(0, emoteState.anchor);
    const queryEnd = emoteState.anchor + 1 + emoteState.query.length;
    const after = text.slice(queryEnd);
    const insertion = `:${emote.shortcode}: `;
    const next = before + insertion + after;
    setText(next);
    setEmoteState({ open: false, query: '', anchor: 0 });
    queueMicrotask(() => {
      const pos = before.length + insertion.length;
      ta.focus();
      ta.setSelectionRange(pos, pos);
    });
  };

  /** Po výběru z mention picker-u vlož `@<token> ` do textu na pozici @.
   *  D-NEW-chat-mention-character — pokud byl member matchnut přes
   *  `characterPath` (slug postavy), vloží se ten místo username. BE chat
   *  service oba tokeny resolve na userId. */
  const insertMention = (member: MentionCandidate) => {
    const ta = taRef.current;
    if (!ta) return;
    const before = text.slice(0, mentionState.anchor);
    // skip přes původní @ + query → kurzor
    const queryEnd = mentionState.anchor + 1 + mentionState.query.length;
    const after = text.slice(queryEnd);
    const token =
      member.matchedAs === 'character' && member.characterPath
        ? member.characterPath
        : member.username;
    const insertion = `@${token} `;
    const next = before + insertion + after;
    setText(next);
    setMentionState({ open: false, query: '', anchor: 0 });
    // Caret za vložením, asynchronně po flushu DOMu.
    queueMicrotask(() => {
      const pos = before.length + insertion.length;
      ta.focus();
      ta.setSelectionRange(pos, pos);
    });
  };

  // ── Attach handling ──────────────────────────────────────────────────
  /**
   * Sdílená vrstva — používá `onPickFiles` (input change) i `handlePaste`
   * (Ctrl+V z clipboardu). Vrací počet úspěšně přidaných položek.
   */
  const addFiles = (files: File[]): number => {
    let added = 0;
    setPicked((prev) => {
      const next = [...prev];
      for (const file of files) {
        const err = validatePick(
          next.map((p) => p.file),
          file,
        );
        if (err) {
          toast.error(err);
          continue;
        }
        const kind = classifyFile(file) as 'image' | 'document';
        next.push({
          id: `att-${idCounter.current++}`,
          file,
          kind,
          previewUrl: kind === 'image' ? URL.createObjectURL(file) : null,
        });
        added++;
      }
      return next;
    });
    return added;
  };

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    addFiles(files);
  };

  /**
   * Ctrl+V — vložení z clipboardu. Pokrývá:
   *   • screenshot z prtsc / cropping tool → `clipboardData.items` typu image,
   *   • soubor zkopírovaný z file manageru (Win Explorer / Finder) →
   *     `clipboardData.files` (FileList obrázků i dokumentů),
   *   • drag-paste z prohlížeče (obrázek zkopírovaný pravým klikem) →
   *     items s `image/*` MIME.
   * Pokud něco vložíme jako přílohu, `preventDefault` zabrání paste textu
   * (HTML data URL apod.); jinak necháme prohlížeč paste textu jako normálně.
   */
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const cd = e.clipboardData;
    if (!cd) return;
    const collected: File[] = [];

    // 1) Přímé soubory (Win Explorer copy → paste). Funguje pro PDF i obrázky.
    if (cd.files && cd.files.length > 0) {
      collected.push(...Array.from(cd.files));
    }

    // 2) Items (screenshot / web image copy). Filtr na to, co `.files` už nemá.
    if (collected.length === 0 && cd.items) {
      for (const item of Array.from(cd.items)) {
        if (item.kind !== 'file') continue;
        const f = item.getAsFile();
        if (f) collected.push(f);
      }
    }

    if (collected.length === 0) return; // nic relevantního → necháme paste textu
    const added = addFiles(collected);
    if (added > 0) {
      e.preventDefault();
      // Drobný feedback, ať uživatel ví že se akce stala (paste je
      // neviditelná operace, bez toastu by mohl být zmatený).
      toast.success(
        added === 1
          ? 'Příloha vložena ze schránky'
          : `${added} příloh vloženo ze schránky`,
      );
    }
  };

  const removePicked = (id: string) => {
    setPicked((prev) => {
      const it = prev.find((p) => p.id === id);
      if (it?.previewUrl) URL.revokeObjectURL(it.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const clearPicked = () => {
    picked.forEach((p) => p.previewUrl && URL.revokeObjectURL(p.previewUrl));
    setPicked([]);
  };

  // ── Send ─────────────────────────────────────────────────────────────
  const send = async () => {
    const t = text.trim();
    if (disabled || uploading) return;
    if (!t && picked.length === 0) return;

    // Validace mentions není potřeba — BE ignoruje neexistující.
    void extractMentionUsernames(t);

    let attachments: ChatAttachment[] = [];
    if (picked.length > 0) {
      setUploading(true);
      try {
        attachments = await Promise.all(
          picked.map((p) => onUploadAttachment(p.file)),
        );
      } catch {
        toast.error('Nahrání přílohy selhalo, zkus to znovu');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const payload: ComposerSendPayload = {
      content: t || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      replyToId: replyTo?.id,
      visibleTo: effectiveWhisper ? [effectiveWhisper] : undefined,
      rpDate: rpDate || undefined,
    };

    if (npcActive && (npcState.name || npcState.avatarUrl)) {
      if (npcState.name) payload.overrideName = npcState.name;
      if (npcState.avatarUrl) payload.overrideAvatarUrl = npcState.avatarUrl;
      // Vazba na kartu jen pod jménem (BE ji stejně bez overrideName zahodí).
      if (npcState.name && npcState.slug) {
        payload.overridePageSlug = npcState.slug;
      }
    }

    onSend(payload);
    setText('');
    clearPicked();
    // RP datum a NPC mód jsou sticky (přežívají odeslání i přepnutí
    // konverzace) — uživatel je ruší explicitně přes × na chipu / × OFF.
    // Whisper se vrací na „všem" — adresát byl konkrétní volba pro tuto zprávu.
    setWhisperTo('');
    if (replyTo) onCancelReply();
    stopTyping();
  };

  /**
   * Krok 6.3 — odeslání hodu kostkou. Dice roll je samostatná akce —
   * generuje vlastní content + dicePayload, nemíchá se s textem v textarea.
   * NPC override / RP datum / reply / whisper se na hod nepoužívají
   * (kostka je „mechanická událost" sebe sama, ne RP zpráva).
   *
   * Plus fullscreen overlay (port Matrix DiceOverlay) — kostky vletí
   * ze stran, tumblují, dopadnou doprostřed a ukáží výsledek 3.5 s.
   * Reálný send do chatu se odehraje AŽ PO skončení overlay — uživatel
   * tak nevidí dual rendering (3D overlay + 2D snapshot v chatu).
   */
  const sendDiceRoll = (result: DiceRollResult) => {
    if (disabled) return;

    // Jméno hráče pro readout — postava ve světě > username > id zkratka.
    const me = members.find((m) => m.userId === currentUserId);
    const rollerName =
      me?.characterPath ??
      me?.user?.username ??
      currentUserId.slice(0, 8);

    const doSend = () => {
      onSend({
        content: result.content,
        dicePayload: result.dicePayload as unknown as Record<string, unknown>,
        diceSkin: result.diceSkin ?? undefined,
      });
    };

    const payload = parseDicePayload(result.dicePayload);
    if (payload) {
      // Send odložen na callback po doběhnutí overlay (4.9 s).
      diceOverlay.trigger(
        payload,
        result.diceSkin ?? null,
        rollerName,
        doSend,
      );
    } else {
      // Defensive — bez payload nelze rolovat, pošli rovnou.
      doSend();
    }
  };

  // ── Aktivní mody (signature line + chips) ────────────────────────────
  const activeModes: Array<{ key: string; label: string; onClear: () => void }> =
    [];
  if (replyTo) {
    activeModes.push({
      key: 'reply',
      label: `↩ ${resolveDisplayName(replyTo, members)}`,
      onClear: onCancelReply,
    });
  }
  if (effectiveWhisper) {
    const target = members.find((m) => m.userId === effectiveWhisper);
    activeModes.push({
      key: 'whisper',
      label: `→ ${target?.user?.username ?? 'šepot'}`,
      onClear: () => setWhisperTo(''),
    });
  }
  if (npcActive && npcState.name) {
    activeModes.push({
      key: 'npc',
      label: `🎭 ${npcState.name}`,
      onClear: () => {
        clearNpc();
      },
    });
  }
  if (rpDate) {
    activeModes.push({
      key: 'rp',
      label: `📅 ${rpDate}`,
      onClear: () => setRpDate(''),
    });
  }

  const isAnyModeActive = activeModes.length > 0;

  // ── Counts pro attach limit chip ─────────────────────────────────────
  const imgCount = picked.filter((p) => p.kind === 'image').length;
  const docCount = picked.filter((p) => p.kind === 'document').length;

  return (
    <div
      className={s.composer}
      onPaste={handlePaste}
      style={
        {
          '--composer-accent': accentColor,
          '--ch-accent': accentColor,
        } as CSSProperties
      }
    >
      {/* 6.2a — reply card */}
      {replyTo && (
        <div className={s.replyCard}>
          <CornerUpLeft size={13} className={s.replyIcon} />
          <span className={s.replyName}>
            {resolveDisplayName(replyTo, members)}
          </span>
          <span className={s.replyExcerpt}>{replyTo.content}</span>
          <button
            type="button"
            className={s.replyCancel}
            onClick={onCancelReply}
            aria-label="Zrušit odpověď"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 6.2b — attach preview lišta */}
      {picked.length > 0 && (
        <div className={s.attachBar}>
          {picked.map((p) => (
            <div key={p.id} className={s.attachItem}>
              {p.kind === 'image' && p.previewUrl ? (
                <img
                  src={p.previewUrl}
                  alt={p.file.name}
                  className={s.attachThumb}
                />
              ) : (
                <span className={s.attachDoc}>
                  <FileText size={20} />
                  <span className={s.attachDocName}>{p.file.name}</span>
                </span>
              )}
              <button
                type="button"
                className={s.attachRemove}
                onClick={() => removePicked(p.id)}
                aria-label={`Odebrat ${p.file.name}`}
              >
                <X size={10} />
              </button>
            </div>
          ))}
          <span className={s.attachLimit}>
            {imgCount}/{ATTACHMENT_LIMITS.maxImages} obr · {docCount}/
            {ATTACHMENT_LIMITS.maxDocs} doc
          </span>
        </div>
      )}

      {/* 6.2e — NPC pruh */}
      {npcActive && canManage && (
        <NpcOverridePanel
          state={npcState}
          worldId={worldId}
          onChange={setNpcState}
          onTurnOff={clearNpc}
        />
      )}

      {/* Toolbar — razítka + whisper select */}
      <div className={s.toolbar}>
        <button
          type="button"
          className={clsx(s.stamp, picked.length > 0 && s.stampActive)}
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          title="Připojit přílohu"
          aria-label="Připojit přílohu"
        >
          <Paperclip size={18} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPT_ATTR}
          className={s.fileInput}
          onChange={onPickFiles}
        />

        {/* 6.3a — dice picker popover anchored on this button */}
        <div className={s.toolbarPosition}>
          <DiceButton
            ref={diceBtnRef}
            active={dicePickerOpen}
            disabled={disabled}
            onClick={() => setDicePickerOpen((v) => !v)}
          />
          <DicePickerPopover
            anchorRef={diceBtnRef}
            open={dicePickerOpen}
            onClose={() => setDicePickerOpen(false)}
            worldDice={worldDice}
            worldSlug={worldSlug}
            canManageWorld={canManage}
            getSkin={getSkin}
            onOpenSkinPicker={() => {
              setSkinPickerJail(false);
              setSkinPickerOpen(true);
            }}
            onOpenJail={() => {
              setSkinPickerJail(true);
              setSkinPickerOpen(true);
            }}
            onOpenPoolPrompt={(kind) => setPoolPrompt(kind)}
            onRoll={sendDiceRoll}
          />
        </div>

        {canManage && (
          <button
            type="button"
            className={clsx(s.stamp, npcActive && s.stampActive)}
            onClick={() => setNpcActive((v) => !v)}
            title="Maska postavy (NPC)"
            aria-label="Maska postavy (NPC)"
          >
            <Theater size={18} />
          </button>
        )}

        {/* 13.3 — PJ pustí zvuk všem v konverzaci (jen PJ+). */}
        {canManage && (
          <SoundBroadcastButton
            worldId={worldId}
            channelId={channelId}
            currentUserId={currentUserId}
          />
        )}

        <div className={s.toolbarPosition}>
          <button
            type="button"
            className={clsx(s.stamp, rpDate && s.stampActive)}
            onClick={() => setRpPopOpen((v) => !v)}
            title="Datum ve hře"
            aria-label="Datum ve hře"
          >
            <Calendar size={18} />
          </button>
          {rpPopOpen && (
            <div className={s.datePopover}>
              <input
                type="date"
                value={rpDate}
                onChange={(e) => setRpDate(e.target.value)}
              />
              <button
                type="button"
                className={s.datePopoverClear}
                onClick={() => {
                  setRpDate('');
                  setRpPopOpen(false);
                }}
              >
                Zrušit
              </button>
              <button
                type="button"
                className={s.datePopoverClear}
                onClick={() => setRpPopOpen(false)}
              >
                Hotovo
              </button>
            </div>
          )}
        </div>

        {/* 6.2f-followup — paletka „Vzhled mé zprávy" přesunuta do hlavičky
            konverzace (ChannelView header). Toolbar composeru ji už nedrží. */}

        {/* 6.2 — emoji picker do textu zprávy. */}
        <div className={s.toolbarPosition}>
          <button
            ref={emojiBtnRef}
            type="button"
            className={clsx(s.stamp, emojiOpen && s.stampActive)}
            onClick={() => setEmojiOpen((v) => !v)}
            title="Vložit emoji"
            aria-label="Vložit emoji"
          >
            <Smile size={18} />
          </button>
          {emojiOpen && (
            <ChatEmotePickerPopover
              worldId={worldId}
              anchorRef={emojiBtnRef}
              onInsert={(token) => {
                insertAtCursor(token);
                setEmojiOpen(false);
              }}
              onClose={() => setEmojiOpen(false)}
            />
          )}
        </div>

        <button
          type="button"
          className={s.stamp}
          onClick={() => {
            const ta = taRef.current;
            if (!ta) return;
            const v = text + (text && !text.endsWith(' ') ? ' @' : '@');
            setText(v);
            queueMicrotask(() => {
              ta.focus();
              const pos = v.length;
              ta.setSelectionRange(pos, pos);
              detectMention(v, pos);
            });
          }}
          title="Zmínit hráče"
          aria-label="Zmínit hráče"
        >
          <AtSign size={18} />
        </button>

        {rpDate && (
          <span className={s.rpChip}>
            <Calendar size={11} />
            {rpDate}
            <button
              type="button"
              className={s.rpChipClear}
              onClick={() => setRpDate('')}
              aria-label="Zrušit RP datum"
            >
              <X size={12} />
            </button>
          </span>
        )}

        <select
          className={clsx(
            s.whisperSelect,
            effectiveWhisper && s.whisperSelectActive,
          )}
          value={effectiveWhisper}
          onChange={(e) => setWhisperTo(e.target.value)}
          disabled={disabled}
          aria-label="Komu napsat"
        >
          <option value="">Všem v konverzaci</option>
          {members
            .filter((m) => m.userId !== currentUserId)
            .map((m) => (
              <option key={m.userId} value={m.userId}>
                → {m.user?.username ?? m.characterPath ?? m.userId.slice(0, 6)}
              </option>
            ))}
        </select>
      </div>

      {/* Textarea + mention popover */}
      <div className={s.inputWrap}>
        <textarea
          ref={taRef}
          className={s.input}
          value={text}
          rows={1}
          disabled={disabled || uploading}
          placeholder={
            disabled
              ? 'Vyber konverzaci…'
              : effectiveWhisper
                ? 'Šeptaná zpráva…'
                : 'Napiš depeši…'
          }
          onChange={(e) =>
            handleChange(e.target.value, e.target.selectionStart ?? 0)
          }
          onKeyUp={(e) => {
            const t = e.currentTarget;
            detectMention(t.value, t.selectionStart ?? 0);
          }}
          onClick={(e) => {
            const t = e.currentTarget;
            detectMention(t.value, t.selectionStart ?? 0);
          }}
          onBlur={() => stopTyping()}
          onKeyDown={(e) => {
            // Desktop: Enter odešle, Shift+Enter = nový řádek.
            // Mobil (dotyk): Enter = nový řádek (odstavec) — telefon nemá Shift,
            // odeslání jde výhradně přes tlačítko Odeslat.
            if (
              e.key === 'Enter' &&
              !e.shiftKey &&
              !isCoarsePointer &&
              !mentionState.open &&
              !emoteState.open
            ) {
              e.preventDefault();
              void send();
            }
          }}
        />
        {mentionState.open && (
          <MentionAutocomplete
            query={mentionState.query}
            members={mentionCandidates}
            onSelect={insertMention}
            onClose={() =>
              setMentionState({ open: false, query: '', anchor: 0 })
            }
          />
        )}
        {emoteState.open && !mentionState.open && (
          <EmoteAutocomplete
            query={emoteState.query}
            emotes={allEmotesForAc}
            onSelect={insertEmote}
            onClose={() =>
              setEmoteState({ open: false, query: '', anchor: 0 })
            }
          />
        )}
      </div>

      {/* Signature line + Send */}
      <div className={s.signatureRow}>
        <div
          className={clsx(s.signature, isAnyModeActive && s.signatureActive)}
          aria-hidden="true"
        />
        <button
          type="button"
          className={s.send}
          onClick={() => void send()}
          disabled={
            disabled ||
            uploading ||
            (!text.trim() && picked.length === 0)
          }
          aria-label="Odeslat"
        >
          <Send size={14} />
          <span>Odeslat</span>
        </button>
      </div>

      {/* Mode chips bar */}
      {isAnyModeActive && (
        <div className={s.modesBar}>
          {activeModes.map((m) => (
            <button
              key={m.key}
              type="button"
              className={s.modeChip}
              onClick={m.onClear}
              title={`Zrušit ${m.label}`}
            >
              {m.label}
              <X size={10} />
            </button>
          ))}
        </div>
      )}

      {/* 6.3c — pool / mixed prompt modal */}
      {poolPrompt && (
        <PoolPromptModal
          open
          kind={poolPrompt}
          onClose={() => setPoolPrompt(null)}
          worldDice={worldDice}
          getSkin={getSkin}
          onRoll={sendDiceRoll}
        />
      )}

      {/* 6.3e — skin picker modal */}
      <SkinPickerPanel
        open={skinPickerOpen}
        onClose={() => setSkinPickerOpen(false)}
        worldId={worldId}
        initialJail={skinPickerJail}
      />
    </div>
  );
}
