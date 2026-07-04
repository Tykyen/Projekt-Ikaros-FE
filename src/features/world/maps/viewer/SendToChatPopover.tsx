import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Search, Send, MessageSquare, Check } from 'lucide-react';
import { api } from '@/shared/api/client';
import { useChatGroups } from '@/features/world/chat/api/useWorldChat';
import type { WorldMapEntry } from '../types';
import s from './viewer.module.css';

interface Props {
  worldId: string;
  map: WorldMapEntry;
  anchorRect: DOMRect;
  onClose: () => void;
}

interface Conv {
  channelId: string;
  groupName: string;
  channelName: string;
}

/**
 * 16.5c — poslat mapu do chatu. Vyhledávací výběr konverzace (i mezi desítkami)
 * + volitelná zpráva → zpráva s přílohou `mapRef`. Render v chatu = klikací
 * karta (`MapRefCard`).
 */
export function SendToChatPopover({ worldId, map, anchorRect, onClose }: Props) {
  const { data: groups = [] } = useChatGroups(worldId);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const convs = useMemo<Conv[]>(
    () =>
      groups.flatMap((g) =>
        g.channels.map((c) => ({
          channelId: c.id,
          groupName: g.group.name,
          channelName: c.name,
        })),
      ),
    [groups],
  );
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return convs;
    return convs.filter((c) =>
      `${c.groupName} ${c.channelName}`.toLowerCase().includes(query),
    );
  }, [convs, q]);

  const send = useMutation({
    mutationFn: (channelId: string) =>
      api.post(`/worlds/${worldId}/chat/channels/${channelId}/messages`, {
        content: msg.trim() || undefined,
        mapRef: { worldMapId: map.id, worldId, title: map.title },
      }),
    onSuccess: () => {
      toast.success('Mapa odeslána do chatu.');
      onClose();
    },
    onError: () => toast.error('Odeslání selhalo.'),
  });

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [onClose]);

  const width = 268;
  const left = Math.max(
    8,
    Math.min(anchorRect.left, window.innerWidth - width - 8),
  );

  // Skupinové labely v seznamu.
  let lastGroup = '';

  return (
    <div
      ref={ref}
      className={s.popover}
      style={{ left, top: anchorRect.bottom + 6 }}
    >
      <div className={s.popHead}>Poslat mapu do chatu</div>
      <div className={s.field} style={{ marginBottom: 8 }}>
        <div
          className={s.input}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Search size={14} aria-hidden style={{ opacity: 0.6 }} />
          <input
            type="text"
            value={q}
            placeholder="Hledej konverzaci…"
            onChange={(e) => setQ(e.target.value)}
            style={{
              flex: 1,
              border: 0,
              background: 'transparent',
              color: 'inherit',
              font: 'inherit',
              outline: 'none',
            }}
          />
        </div>
      </div>
      <div className={s.popResults}>
        {filtered.length === 0 ? (
          <p className={s.listEmpty}>Nic neodpovídá.</p>
        ) : (
          filtered.map((c) => {
            const showGroup = c.groupName !== lastGroup;
            lastGroup = c.groupName;
            return (
              <div key={c.channelId}>
                {showGroup && (
                  <div className={s.popGroup}>
                    <MessageSquare size={12} aria-hidden /> {c.groupName}
                  </div>
                )}
                <button
                  type="button"
                  className={`${s.listItem} ${sel === c.channelId ? s.listItemSel : ''}`}
                  onClick={() => setSel(c.channelId)}
                >
                  <span className={s.listItemLabel}>{c.channelName}</span>
                  {sel === c.channelId && (
                    <Check size={14} aria-hidden style={{ flex: 'none' }} />
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
      <div className={s.field}>
        <textarea
          className={s.textarea}
          value={msg}
          placeholder="Napiš pár slov k mapě… (volitelné)"
          maxLength={4000}
          onChange={(e) => setMsg(e.target.value)}
        />
      </div>
      <button
        type="button"
        className={`${s.btn} ${s.btnPrimary}`}
        style={{ width: '100%', justifyContent: 'center' }}
        disabled={!sel || send.isPending}
        onClick={() => sel && send.mutate(sel)}
      >
        <Send size={14} aria-hidden /> {sel ? 'Odeslat mapu' : 'Vyber konverzaci'}
      </button>
    </div>
  );
}
