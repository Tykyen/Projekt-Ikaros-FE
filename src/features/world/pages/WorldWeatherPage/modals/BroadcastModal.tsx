/**
 * 9.4-I — Broadcast modal (spec §3.4).
 *
 * Cíl: chat (channel selector) nebo mapa (placeholder, 10.2). Pro chat user
 * vybere konkrétní `ChatChannel`, volitelně doplní zprávu nad weather block.
 *
 * Mapa zatím disabled (BE flag akceptuje, FE rendering až v 10.2).
 */
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { MapPin, MessageSquare } from 'lucide-react';
import { Modal, Button, Spinner } from '@/shared/ui';
import { useBroadcastWeather } from '@/features/world/api/useWeatherGenerators';
import { useChatGroups } from '@/features/world/chat/api/useWorldChat';
import type { WeatherGenerator } from '@/shared/types';
import type { ChatChannel } from '@/features/world/chat/lib/types';
import s from './BroadcastModal.module.css';

type Target = 'chat' | 'map';

interface Props {
  open: boolean;
  onClose: () => void;
  worldId: string;
  generator: WeatherGenerator;
}

interface FlatChannel {
  groupName: string;
  channel: ChatChannel;
}

export function BroadcastModal({ open, onClose, worldId, generator }: Props) {
  const [target, setTarget] = useState<Target>('chat');
  const [channelId, setChannelId] = useState<string>('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useBroadcastWeather(worldId);
  const { data: groups, isLoading: groupsLoading } = useChatGroups(worldId);

  // Flatten channels do plochého seznamu „Skupina / Konverzace".
  const channels = useMemo<FlatChannel[]>(() => {
    if (!groups) return [];
    const result: FlatChannel[] = [];
    for (const g of groups) {
      for (const c of g.channels) {
        result.push({ groupName: g.group.name, channel: c });
      }
    }
    return result;
  }, [groups]);

  // Default první kanál po načtení channels (sync z async fetched data, ne anti-pattern).
  // Re-init form fields není potřeba — parent dělá conditional render.
  useEffect(() => {
    if (!channelId && channels.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync z async fetched data
      setChannelId(channels[0].channel.id);
    }
  }, [channels, channelId]);

  async function handleSubmit() {
    setError(null);
    if (target === 'chat' && !channelId) {
      setError('Vyber konverzaci.');
      return;
    }
    try {
      await mutation.mutateAsync({
        id: generator.id,
        target,
        channelId: target === 'chat' ? channelId : undefined,
        message: message.trim() || undefined,
      });
      toast.success(
        target === 'chat'
          ? 'Počasí odesláno do chatu.'
          : 'Počasí označeno pro mapu.',
      );
      onClose();
    } catch {
      toast.error('Odeslání selhalo.');
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Broadcast — ${generator.name}`}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Zrušit
          </Button>
          <Button onClick={handleSubmit} loading={mutation.isPending}>
            Odeslat
          </Button>
        </>
      }
    >
      <div className={s.form}>
        {/* Target — radio karty */}
        <div className={s.field}>
          <span className={s.label}>Cíl</span>
          <div className={s.targetGroup} role="radiogroup">
            <label
              className={`${s.targetCard} ${target === 'chat' ? s.targetCardActive : ''}`}
            >
              <input
                type="radio"
                name="broadcastTarget"
                value="chat"
                checked={target === 'chat'}
                onChange={() => setTarget('chat')}
                className={s.hiddenRadio}
              />
              <MessageSquare size={20} aria-hidden />
              <span className={s.targetName}>Chat</span>
              <span className={s.targetDesc}>
                Pošli weather block do vybrané konverzace
              </span>
            </label>

            <label
              className={`${s.targetCard} ${target === 'map' ? s.targetCardActive : ''} ${s.targetCardDisabled}`}
              title="Mapová integrace přijde v 10.2"
            >
              <input
                type="radio"
                name="broadcastTarget"
                value="map"
                checked={target === 'map'}
                onChange={() => setTarget('map')}
                disabled
                className={s.hiddenRadio}
              />
              <MapPin size={20} aria-hidden />
              <span className={s.targetName}>Mapa</span>
              <span className={s.targetDesc}>
                Připravujeme pro 10.2 (jen BE flag)
              </span>
            </label>
          </div>
        </div>

        {/* Channel selector */}
        {target === 'chat' && (
          <div className={s.field}>
            <label className={s.label} htmlFor="bm-channel">
              Konverzace
            </label>
            {groupsLoading ? (
              <div className={s.loadingRow}>
                <Spinner /> Načítám konverzace…
              </div>
            ) : channels.length === 0 ? (
              <p className={s.hint}>
                Tento svět nemá žádné konverzace. Nejdřív založ chat v sekci
                Chat.
              </p>
            ) : (
              <select
                id="bm-channel"
                className={s.select}
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
              >
                {channels.map(({ groupName, channel }) => (
                  <option key={channel.id} value={channel.id}>
                    {groupName} / {channel.name}
                  </option>
                ))}
              </select>
            )}
            {error && <p className={s.error}>{error}</p>}
          </div>
        )}

        {/* Volitelná zpráva */}
        <div className={s.field}>
          <label className={s.label} htmlFor="bm-message">
            Volitelná zpráva (nad weather block)
          </label>
          <textarea
            id="bm-message"
            className={s.textarea}
            rows={3}
            maxLength={500}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="„Slunce láme přes mlhu nad městem…"
          />
        </div>
      </div>
    </Modal>
  );
}
