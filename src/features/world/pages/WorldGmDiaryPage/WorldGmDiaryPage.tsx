/**
 * 10.2l — `/svet/:worldSlug/denik-pj` — deník PJ mimo taktickou mapu.
 * Jeden world-level poznámkový blok per PJ (sdílí data s tlačítkem „Deník" na
 * taktické mapě, endpoint `/worlds/:worldId/gm-notes`). Plná stránka, papír
 * uprostřed; autosave + papír sdílené přes `useNotebookAutosave`/`NotebookPaper`.
 *
 * Role gating řeší routa (`WorldMembershipGuard minWorldRole=PomocnyPJ`).
 */
import { Spinner } from '@/shared/ui';
import { useWorldContext } from '@/features/world/context/WorldContext';
import {
  NotebookPaper,
  NotebookStatus,
} from '@/features/world/components/notebook/NotebookPaper';
import { useNotebookAutosave } from '@/features/world/components/notebook/useNotebookAutosave';
import { useGmNotes, useUpdateGmNotes } from '@/features/world/tactical-map/api/useGmNotes';
import s from './WorldGmDiaryPage.module.css';

export function WorldGmDiaryPage(): React.ReactElement {
  const { worldId, world } = useWorldContext();
  const { data, isLoading } = useGmNotes(worldId, true);
  const mutation = useUpdateGmNotes(worldId);

  if (isLoading || !data) return <Spinner center />;

  return <DiaryInner initialContent={data.content} worldName={world?.name} mutate={mutation.mutateAsync} />;
}

function DiaryInner({
  initialContent,
  worldName,
  mutate,
}: {
  initialContent: string;
  worldName?: string;
  mutate: (content: string) => Promise<unknown>;
}): React.ReactElement {
  const { content, setContent, status, dirty } = useNotebookAutosave(
    initialContent,
    mutate,
  );

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.titleWrap}>
          <h1 className={s.title}>Deník PJ</h1>
          {worldName && <span className={s.subtitle}>{worldName}</span>}
        </div>
        <NotebookStatus status={status} dirty={dirty} />
      </header>
      <div className={s.sheet}>
        <NotebookPaper value={content} onChange={setContent} />
      </div>
    </div>
  );
}
