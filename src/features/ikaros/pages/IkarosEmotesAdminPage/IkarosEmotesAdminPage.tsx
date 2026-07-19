import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Spinner, ErrorState } from '@/shared/ui';
import { useGlobalEmotes } from '@/features/world/chat/emotes/api/useGlobalEmotes';
import { useDeleteGlobalEmote } from '@/features/world/chat/emotes/api/useDeleteGlobalEmote';
import { EmoteGrid } from '@/features/world/chat/emotes/components/EmoteGrid';
import { EmoteCounter } from '@/features/world/chat/emotes/components/EmoteCounter';
import { EmoteEmptyState } from '@/features/world/chat/emotes/components/EmoteEmptyState';
import { EmoteUploadDialog } from '@/features/world/chat/emotes/components/EmoteUploadDialog';
import {
  EMOTE_LIMIT_GLOBAL,
  type WorldEmote,
} from '@/features/world/chat/emotes/lib/types';
import s from './IkarosEmotesAdminPage.module.css';

/**
 * Krok 6.4d — Admin (platforma) správa globálních custom emotů.
 * Route: `/ikaros/admin/emotes` (RoleGuard Superadmin/Admin).
 */
export default function IkarosEmotesAdminPage() {
  const emotes = useGlobalEmotes();
  const deleteEmote = useDeleteGlobalEmote();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<WorldEmote | null>(null);

  const handleDelete = (emote: WorldEmote) => {
    if (!confirm(`Opravdu smazat globální :${emote.shortcode}: ?`)) return;
    deleteEmote.mutate(emote.id);
  };

  const data = emotes.data ?? [];
  const isEmpty = !emotes.isLoading && data.length === 0;

  return (
    <div className={s.page}>
      <header className={s.header}>
        <h1 className={s.title}>Globální emoty platformy</h1>
        <p className={s.subtitle}>
          Glyfy dostupné napříč všemi světy Ikarosu. Sprav s rozvahou —
          změny vidí všichni uživatelé.
        </p>
        <span className={s.headerLine} aria-hidden="true" />
      </header>

      {emotes.isLoading && (
        <div className={s.state}>
          <Spinner />
        </div>
      )}

      {emotes.isError && (
        <ErrorState
          size="panel"
          title="Globální emoty se nepodařilo načíst"
          description="Zkus to prosím znovu."
          onRetry={() => void emotes.refetch()}
        />
      )}

      {isEmpty && (
        <EmoteEmptyState
          variant="global"
          onUpload={() => setUploadOpen(true)}
        />
      )}

      {!emotes.isLoading && !emotes.isError && data.length > 0 && (
        <>
          <div className={s.controlsRow}>
            <EmoteCounter count={data.length} max={EMOTE_LIMIT_GLOBAL} />
            <button
              type="button"
              className={s.primaryBtn}
              onClick={() => setUploadOpen(true)}
            >
              <Plus size={14} />
              Nový globální emote
            </button>
          </div>

          <EmoteGrid
            emotes={data}
            variant="global"
            onUpload={() => setUploadOpen(true)}
            onDelete={handleDelete}
            onEdit={(e) => setEditTarget(e)}
          />
        </>
      )}

      {uploadOpen && (
        <EmoteUploadDialog
          variant="global"
          onClose={() => setUploadOpen(false)}
        />
      )}
      {editTarget && (
        <EmoteUploadDialog
          variant="global"
          editEmote={editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}
