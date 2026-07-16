import { Link } from 'react-router-dom';
import { UserAvatar } from '@/shared/ui';
import {
  useApproveAccessRequest,
  useRejectAccessRequest,
} from '@/features/world/api/useWorldJoin';
import {
  useApproveProposal,
  useRejectProposal,
} from '@/features/world/api/useWorldPageReview';
import type { WorldPendingActionItem } from '@/features/world/api/useWorldPendingActions';
import s from './RequestsList.module.css';

interface Props {
  worldId: string;
  /** Slug světa — pro odkaz na náhled navržené stránky (page-review). */
  worldSlug?: string;
  items: WorldPendingActionItem[];
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'právě teď';
  if (min < 60) return `před ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `před ${h} h`;
  const d = Math.floor(h / 24);
  return `před ${d} d`;
}

/** Řádek žádosti o vstup (vč. „Chci hrát" s postavou). */
function AccessRow({
  worldId,
  it,
}: {
  worldId: string;
  it: WorldPendingActionItem;
}) {
  const approve = useApproveAccessRequest();
  const reject = useRejectAccessRequest();
  const busy = approve.isPending || reject.isPending;
  return (
    <li className={s.row}>
      <UserAvatar src={it.avatarUrl} size="md" alt={it.displayName} />
      <div className={s.body}>
        <span className={s.name}>{it.displayName}</span>
        <span className={s.meta}>
          {it.characterName ? `Chce hrát jako ${it.characterName}` : 'Žádá o vstup'}{' '}
          · {timeAgo(it.createdAt)}
        </span>
      </div>
      <div className={s.actions}>
        <button
          type="button"
          className={s.approve}
          disabled={busy}
          onClick={() => approve.mutate({ worldId, requestId: it.id })}
        >
          Přijmout
        </button>
        <button
          type="button"
          className={s.reject}
          disabled={busy}
          onClick={() => reject.mutate({ worldId, requestId: it.id })}
        >
          Odmítnout
        </button>
      </div>
    </li>
  );
}

/** Řádek návrhu obsahu hráče (15.11) — Schválit / Vrátit / Zahodit. */
function PageReviewRow({
  worldId,
  worldSlug,
  it,
}: {
  worldId: string;
  worldSlug?: string;
  it: WorldPendingActionItem;
}) {
  const approve = useApproveProposal(worldId);
  const reject = useRejectProposal(worldId);
  const busy = approve.isPending || reject.isPending;
  const name = it.pageTitle ?? it.pageSlug ?? 'návrh';
  return (
    <li className={s.row}>
      <UserAvatar src={it.avatarUrl} size="md" alt={it.displayName} />
      <div className={s.body}>
        <span className={s.name}>
          {worldSlug && it.pageSlug ? (
            <Link
              to={`/svet/${worldSlug}/${it.pageSlug}`}
              className={s.pageLink}
              title="Otevřít / upravit návrh"
            >
              {name}
            </Link>
          ) : (
            name
          )}
        </span>
        <span className={s.meta}>
          {it.displayName} navrhl {it.pageType ?? 'stránku'} ·{' '}
          {timeAgo(it.createdAt)}
        </span>
      </div>
      <div className={s.actions}>
        <button
          type="button"
          className={s.approve}
          disabled={busy}
          onClick={() => approve.mutate(it.id)}
        >
          Schválit
        </button>
        <button
          type="button"
          className={s.reject}
          disabled={busy}
          onClick={() => reject.mutate({ slug: it.id, mode: 'rework' })}
          title="Vrátit hráči k přepracování"
        >
          Vrátit
        </button>
        <button
          type="button"
          className={s.discard}
          disabled={busy}
          onClick={() => {
            if (window.confirm(`Zahodit návrh „${name}"? Stránka se smaže.`)) {
              reject.mutate({ slug: it.id, mode: 'discard' });
            }
          }}
          title="Zahodit (smazat návrh)"
        >
          Zahodit
        </button>
      </div>
    </li>
  );
}

/**
 * 15.10 — seznam podnětů „ke zpracování" pro daný svět. Sdílený stránkou Hráči
 * i drawerem. Multi-typ: `access-request` (žádost o vstup / „Chci hrát") +
 * `page-review` (15.11 — návrh obsahu hráče ke schválení).
 */
export function RequestsList({ worldId, worldSlug, items }: Props) {
  if (items.length === 0) {
    return <p className={s.empty}>Nic ke zpracování.</p>;
  }
  return (
    <ul className={s.list}>
      {items.map((it) =>
        it.type === 'page-review' ? (
          <PageReviewRow
            key={`${it.type}:${it.id}`}
            worldId={worldId}
            worldSlug={worldSlug}
            it={it}
          />
        ) : (
          <AccessRow key={`${it.type}:${it.id}`} worldId={worldId} it={it} />
        ),
      )}
    </ul>
  );
}
