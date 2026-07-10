import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Modal, Spinner } from '@/shared/ui';
import { useSearchMessages } from '../api/useWorldChat';
import type { GroupWithChannels } from '../lib/types';
import s from './ChatSearchModal.module.css';

interface ChatSearchModalProps {
  worldId: string;
  groups: GroupWithChannels[];
  onClose: () => void;
  /** Klik na výsledek → přepnout na konverzaci. */
  onSelectResult: (channelId: string) => void;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Modal hledání ve zprávách světa (krok 6.6) — celý svět + filtr konverzace. */
export function ChatSearchModal({
  worldId,
  groups,
  onClose,
  onSelectResult,
}: ChatSearchModalProps) {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [channelId, setChannelId] = useState('');

  // Debounce — hledá se 350 ms po dopsání.
  useEffect(() => {
    const t = setTimeout(() => setQuery(input), 350);
    return () => clearTimeout(t);
  }, [input]);

  const channels = useMemo(
    () => groups.flatMap((g) => g.channels),
    [groups],
  );
  const search = useSearchMessages(worldId, query, channelId || null);
  const results = search.data ?? [];
  const q = query.trim();

  return (
    <Modal open onClose={onClose} title="Hledání ve zprávách" size="lg">
      <div className={s.controls}>
        <div className={s.inputWrap}>
          <Search size={16} className={s.icon} aria-hidden="true" />
          {/* eslint-disable jsx-a11y/no-autofocus -- autofocus do hledání při otevření je záměr: modal trapuje fokus v hledacím poli */}
          <input
            className={s.input}
            value={input}
            autoFocus
            placeholder="Hledej slovo nebo část zprávy…"
            onChange={(e) => setInput(e.target.value)}
          />
          {/* eslint-enable jsx-a11y/no-autofocus */}
        </div>
        <select
          className={s.select}
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
          aria-label="Filtr konverzace"
        >
          <option value="">Všechny konverzace</option>
          {channels.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className={s.results}>
        {q.length < 2 && (
          <p className={s.hint}>Zadej alespoň 2 znaky.</p>
        )}
        {q.length >= 2 && search.isLoading && (
          <div className={s.state}>
            <Spinner />
          </div>
        )}
        {q.length >= 2 && !search.isLoading && results.length === 0 && (
          <p className={s.hint}>Nic nenalezeno.</p>
        )}
        {results.map((r) => (
          <button
            key={r.messageId}
            type="button"
            className={s.result}
            onClick={() => {
              onSelectResult(r.channelId);
              onClose();
            }}
          >
            <span className={s.resultHead}>
              <span className={s.resultChannel}>{r.channelName}</span>
              {/* D-040 — tombstone overlay v search results. */}
              <span
                className={s.resultSender}
                style={r.senderIsDeleted ? { fontStyle: 'italic', opacity: 0.6 } : undefined}
              >
                {r.senderIsDeleted ? 'Smazaný účet' : r.senderName}
              </span>
              <span className={s.resultTime}>
                {formatTime(r.createdAt)}
              </span>
            </span>
            <span className={s.resultContent}>{r.content}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
