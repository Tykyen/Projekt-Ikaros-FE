import { useMemo, useState } from 'react';
import { ArrowLeft, X, Pencil } from 'lucide-react';
import { DiaryTab } from '@/features/world/pages/CharacterDetailPage/components/DiaryTab';
import { usePersonaDirectory } from '@/features/world/pages/api/usePersonaDirectory';
import { useChatDiaryRoll, type RollAttribution } from './useChatDiaryRoll';
import s from './railShell.module.css';

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
  /** Fallback titulek, než se z adresáře dotáhne jméno postavy. */
  title: string;
  /** PJ — zpět na panel Přítomní. */
  onBack?: () => void;
  /** Mobil — zavřít rail. */
  onClose?: () => void;
}

/**
 * 16.1 — deník postavy v railu světového chatu. Vizuál „pro hru" (jako
 * taktická mapa): identity hlavička s portrétem + jménem, pod ní deník.
 * Tenký wrapper kolem `DiaryTab` (jediný zdroj pravdy deníku): view/edit
 * toggle + napojení `onRoll` schopností na chat (3D overlay → zpráva).
 *
 * Portrét + jméno bere z adresáře postav (`usePersonaDirectory`) podle slug —
 * `Character` sám `imageUrl` nedrží (je na Page/adresáři).
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

  const directory = usePersonaDirectory(worldId);
  const entry = useMemo(
    () => (directory.data ?? []).find((e) => e.slug === slug),
    [directory.data, slug],
  );
  const name = entry?.title ?? title;
  const imageUrl = entry?.imageUrl;

  const makeOnRoll = useChatDiaryRoll(worldId, channelId);
  const onRoll = makeOnRoll(attribution);

  return (
    <aside className={s.panel}>
      <div className={s.controls}>
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
        <div className={s.spacer} />
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

      <div className={s.identity}>
        <div className={s.avatar}>
          {imageUrl ? (
            <img src={imageUrl} alt={name} />
          ) : (
            <div className={s.avatarFallback}>
              {name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <h2 className={s.name}>{mode === 'edit' ? `${name} — úpravy` : name}</h2>
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
