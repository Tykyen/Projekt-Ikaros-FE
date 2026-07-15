import { Link } from 'react-router-dom';
import { MapPinned } from 'lucide-react';
import { useSceneCuratorActions } from '../hooks/useSceneCatalog';
import type { SceneTemplateReviewListItem } from '@/shared/types';
import s from './SceneTemplateReviewRenderer.module.css';

interface ActionsHelpers {
  onResolve: () => void;
  isLoading: boolean;
}

/**
 * 22.5 — renderer fronty „Sdílené scény ke schválení" (Zpracovat tab).
 * Kurátor schválí (→ do katalogu) nebo zamítne publikovanou šablonu scény.
 */

export function SceneTemplateReviewLeft({
  item,
}: {
  item: SceneTemplateReviewListItem;
}) {
  return (
    <div className={s.left}>
      {item.imageUrl ? (
        <img src={item.imageUrl} alt="" className={s.thumb} loading="lazy" />
      ) : (
        <span className={s.thumbFallback} aria-hidden="true">
          <MapPinned size={20} />
        </span>
      )}
    </div>
  );
}

export function SceneTemplateReviewMid({
  item,
}: {
  item: SceneTemplateReviewListItem;
}) {
  return (
    <div className={s.mid}>
      <span className={s.title}>{item.name}</span>
      <div className={s.meta}>
        {item.authorId ? (
          <Link to={`/ikaros/uzivatel/${item.authorId}`} className={s.author}>
            {item.publicAuthorName}
          </Link>
        ) : (
          <span className={s.author}>{item.publicAuthorName}</span>
        )}
      </div>
    </div>
  );
}

export function SceneTemplateReviewActions({
  item,
  helpers,
}: {
  item: SceneTemplateReviewListItem;
  helpers: ActionsHelpers;
}) {
  const { approve, reject } = useSceneCuratorActions();
  const isLoading = helpers.isLoading || approve.isPending || reject.isPending;

  return (
    <>
      <button
        type="button"
        className={s.btnApprove}
        disabled={isLoading}
        onClick={() =>
          approve.mutate(item.templateId, { onSuccess: helpers.onResolve })
        }
      >
        Schválit
      </button>
      <button
        type="button"
        className={s.btnReject}
        disabled={isLoading}
        onClick={() =>
          reject.mutate(item.templateId, { onSuccess: helpers.onResolve })
        }
      >
        Zamítnout
      </button>
    </>
  );
}
