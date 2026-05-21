import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Spinner } from '@/shared/ui';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldEmotes } from '@/features/world/chat/emotes/api/useWorldEmotes';
import { useDeleteEmote } from '@/features/world/chat/emotes/api/useDeleteEmote';
import { EmoteGrid } from '@/features/world/chat/emotes/components/EmoteGrid';
import { EmoteCounter } from '@/features/world/chat/emotes/components/EmoteCounter';
import { EmoteEmptyState } from '@/features/world/chat/emotes/components/EmoteEmptyState';
import { EmoteUploadDialog } from '@/features/world/chat/emotes/components/EmoteUploadDialog';
import { CopyEmoteDialog } from '@/features/world/chat/emotes/components/CopyEmoteDialog';
import {
  EMOTE_LIMIT_PER_WORLD,
  type WorldEmote,
} from '@/features/world/chat/emotes/lib/types';
import s from './WorldEmotesAdminPage.module.css';

/**
 * Krok 6.4c — PJ admin custom emotů světa.
 * Route: `/svet/:worldSlug/admin/emotes` (membership guard PomocnyPJ+).
 */
export default function WorldEmotesAdminPage() {
  const { worldId } = useWorldContext();
  const emotes = useWorldEmotes(worldId);
  const deleteEmote = useDeleteEmote(worldId);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<WorldEmote | null>(null);
  const [copyTarget, setCopyTarget] = useState<WorldEmote | null>(null);

  const handleDelete = (emote: WorldEmote) => {
    if (!confirm(`Opravdu smazat :${emote.shortcode}: ?`)) return;
    deleteEmote.mutate(emote.id);
  };

  const data = emotes.data ?? [];
  const isEmpty = !emotes.isLoading && data.length === 0;

  return (
    <div className={s.page}>
      <header className={s.header}>
        <h1 className={s.title}>Custom emoty světa</h1>
        <p className={s.subtitle}>
          Glyfy, které vaše komunita používá ve světovém chatu.
        </p>
        <span className={s.headerLine} aria-hidden="true" />
      </header>

      {emotes.isLoading && (
        <div className={s.state}>
          <Spinner />
        </div>
      )}

      {emotes.isError && (
        <div className={s.state}>Emoty se nepodařilo načíst.</div>
      )}

      {isEmpty && (
        <EmoteEmptyState
          variant="world"
          onUpload={() => setUploadOpen(true)}
        />
      )}

      {!emotes.isLoading && !emotes.isError && data.length > 0 && (
        <>
          <div className={s.controlsRow}>
            <EmoteCounter count={data.length} max={EMOTE_LIMIT_PER_WORLD} />
            <button
              type="button"
              className={s.primaryBtn}
              onClick={() => setUploadOpen(true)}
            >
              <Plus size={14} />
              Nový emote
            </button>
          </div>

          <EmoteGrid
            emotes={data}
            variant="world"
            onUpload={() => setUploadOpen(true)}
            onDelete={handleDelete}
            onEdit={(e) => setEditTarget(e)}
            onCopy={(e) => setCopyTarget(e)}
          />
        </>
      )}

      {uploadOpen && (
        <EmoteUploadDialog
          variant="world"
          worldId={worldId}
          onClose={() => setUploadOpen(false)}
        />
      )}
      {editTarget && (
        <EmoteUploadDialog
          variant="world"
          worldId={worldId}
          editEmote={editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}
      {copyTarget && (
        <CopyEmoteDialog
          sourceWorldId={worldId}
          emote={copyTarget}
          onClose={() => setCopyTarget(null)}
        />
      )}
    </div>
  );
}
