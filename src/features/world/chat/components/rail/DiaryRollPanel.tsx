import { useState } from 'react';
import { ArrowLeft, X, Pencil } from 'lucide-react';
import { DiaryTab } from '@/features/world/pages/CharacterDetailPage/components/DiaryTab';
import { useChatDiaryRoll, type RollAttribution } from './useChatDiaryRoll';
import s from './DiaryRollPanel.module.css';

interface Props {
  worldId: string;
  /** Aktivní konverzace — kam hod míří. `null` = žádná → onRoll no-op. */
  channelId: string | null;
  /** Slug postavy, jejíž deník se zobrazí (vlastní / hráče / NPC). */
  slug: string;
  /** Kdo „mluví" za hod (spec R1). */
  attribution: RollAttribution;
  /** Smí editovat deník (vlastník / PJ). */
  canEdit: boolean;
  /** Titulek panelu (např. „Můj deník" nebo jméno hráče). */
  title: string;
  /** PJ — zpět na panel Přítomní. */
  onBack?: () => void;
  /** Mobil — zavřít rail. */
  onClose?: () => void;
}

/**
 * 16.1a — deník postavy v railu světového chatu. Tenký wrapper kolem
 * `DiaryTab` (jediný zdroj pravdy deníku): view/edit toggle + napojení
 * `onRoll` schopností na chat (3D overlay → zpráva).
 *
 * V edit módu řídí Uložit/Zrušit sticky bar uvnitř `DiaryTab` (Zrušit =
 * `onExitEdit`); back/zavřít proto skrýváme, ať se neztratí rozeditované
 * změny.
 */
export function DiaryRollPanel({
  worldId,
  channelId,
  slug,
  attribution,
  canEdit,
  title,
  onBack,
  onClose,
}: Props) {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [, setDirty] = useState(false);

  const makeOnRoll = useChatDiaryRoll(worldId, channelId);
  const onRoll = makeOnRoll(attribution);

  return (
    <aside className={s.panel}>
      <div className={s.head}>
        {mode === 'view' && onBack && (
          <button
            type="button"
            className={s.iconBtn}
            onClick={onBack}
            aria-label="Zpět na Přítomní"
            title="Zpět na Přítomní"
          >
            <ArrowLeft size={16} />
          </button>
        )}
        <span className={s.title}>{mode === 'edit' ? `${title} — úpravy` : title}</span>
        {mode === 'view' && canEdit && (
          <button
            type="button"
            className={s.iconBtn}
            onClick={() => setMode('edit')}
            aria-label="Upravit deník"
            title="Upravit deník"
          >
            <Pencil size={15} />
          </button>
        )}
        {mode === 'view' && onClose && (
          <button
            type="button"
            className={s.iconBtn}
            onClick={onClose}
            aria-label="Zavřít"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className={s.scroll}>
        <DiaryTab
          slug={slug}
          mode={mode}
          onExitEdit={() => setMode('view')}
          onDirtyChange={setDirty}
          onRoll={onRoll}
        />
      </div>
    </aside>
  );
}
