import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Spinner } from '@/shared/ui';
import { RichTextEditor } from '@/shared/ui/RichTextEditor';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useCharacterNotes } from '../../api/useCharacterSubdocs';
import { useUpdateCharacterNotes } from '../../api/useCharacterMutations';
import { SubdocErrorState } from './SubdocErrorState';
import s from './notes.module.css';

interface Props {
  /** Slug postavy. */
  slug: string;
  /** `view`/`edit` zachovány pro API kompatibilitu, ale notes vždy umí inline edit (D-NEW-notes-inline). */
  mode: 'view' | 'edit';
  /** Zachováno pro API kompatibilitu; inline tab nemá explicit exit. */
  onExitEdit?: () => void;
  /** Pro dirty discard guard při navigaci. */
  onDirtyChange: (dirty: boolean) => void;
}

const AUTOSAVE_DEBOUNCE_MS = 800;

/**
 * 8.1e — Poznámky postavy. Vizuálně **jako zápisník/deník psaný tužkou**:
 * linkovaný papír, vintage sépiový tón, handwriting font (Caveat). Inline
 * edit — žádné edit režimy, jen klikneš a píšeš. Auto-save debounced 800 ms
 * po každé změně.
 *
 * Permission gating řeší `PostavaLayout` (canSeePrivate = PJ/PomocnyPJ/vlastník).
 */
export function NotesTab({ slug, onDirtyChange }: Props) {
  const { worldId } = useWorldContext();
  const { data, isLoading, isError, error, refetch } = useCharacterNotes(
    worldId,
    slug,
  );

  if (isLoading) return <Spinner center />;
  if (isError) {
    return (
      <SubdocErrorState
        error={error}
        resourceLabel="poznámky"
        onRetry={() => refetch()}
      />
    );
  }
  if (!data) return <Spinner center />;

  return (
    <NotesTabInline
      initialContent={data.content}
      worldId={worldId}
      slug={slug}
      onDirtyChange={onDirtyChange}
    />
  );
}

interface InlineProps {
  initialContent: string;
  worldId: string;
  slug: string;
  onDirtyChange: (dirty: boolean) => void;
}

function NotesTabInline({
  initialContent,
  worldId,
  slug,
  onDirtyChange,
}: InlineProps) {
  const mutation = useUpdateCharacterNotes(worldId, slug);
  const [content, setContent] = useState(initialContent);
  const [savedContent, setSavedContent] = useState(initialContent);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dirty = content !== savedContent;

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);

  // Auto-save: debounce, pak fire mutation.
  useEffect(() => {
    if (!dirty) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setStatus('saving');
      mutation.mutate(
        { content },
        {
          onSuccess: () => {
            setSavedContent(content);
            setStatus('saved');
            setTimeout(() => setStatus('idle'), 1500);
          },
          onError: () => {
            setStatus('idle');
            toast.error('Uložení poznámek selhalo');
          },
        },
      );
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, dirty]);

  return (
    <div className={s.notebookShell}>
      <header className={s.notebookHeader}>
        <h2 className={s.notebookTitle}>Poznámky</h2>
        <StatusIndicator status={status} dirty={dirty} />
      </header>
      <div className={s.paper}>
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="Klikni a začni psát…"
        />
      </div>
    </div>
  );
}

function StatusIndicator({
  status,
  dirty,
}: {
  status: 'idle' | 'saving' | 'saved';
  dirty: boolean;
}) {
  if (status === 'saving') return <span className={s.status}>Ukládám…</span>;
  if (status === 'saved')
    return <span className={`${s.status} ${s.statusSaved}`}>Uloženo ✓</span>;
  if (dirty) return <span className={s.status}>Nezapsáno…</span>;
  return null;
}
