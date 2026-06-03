import { useState } from 'react';
import { toast } from 'sonner';
import { Database, FileText, Layers, Clock, RefreshCw, Hash } from 'lucide-react';
import { StatCard } from '../OverviewTab/StatCard';
import { Button, ConfirmDialog } from '@/shared/ui';
import {
  useSearchIndexStats,
  useRebuildSearchIndex,
} from '../../api/useSearchIndex';
import { parseApiError } from '@/shared/api/client';
import s from './SearchIndexTab.module.css';

/**
 * 13.1c — monitoring search indexu (Admin+). Stav indexace + rebuild.
 * BE: `GET /stats/search`, `POST /stats/search/rebuild`.
 */
export function SearchIndexTab() {
  const { data, isLoading, isError } = useSearchIndexStats();
  const rebuild = useRebuildSearchIndex();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleRebuild() {
    setConfirmOpen(false);
    rebuild.mutate(undefined, {
      onSuccess: (r) => toast.success(r.message ?? 'Rebuild zahájen.'),
      onError: (e) => toast.error(parseApiError(e)),
    });
  }

  const lastEmbedded = data?.lastEmbeddedAtUtc
    ? new Date(data.lastEmbeddedAtUtc).toLocaleString('cs-CZ')
    : '—';

  return (
    <div className={s.wrap}>
      <header className={s.header}>
        <div>
          <h2 className={s.heading}>Search index</h2>
          <p className={s.status}>
            Stav:{' '}
            <strong>{isError ? 'Nedostupný' : data?.status ?? '—'}</strong>
            {data?.provider && (
              <span className={s.provider}> · {data.provider}</span>
            )}
          </p>
        </div>
        <Button
          onClick={() => setConfirmOpen(true)}
          disabled={rebuild.isPending}
        >
          <RefreshCw size={16} className={rebuild.isPending ? s.spin : undefined} />
          {rebuild.isPending ? 'Probíhá…' : 'Přebudovat index'}
        </Button>
      </header>

      <div className={s.grid}>
        <StatCard
          label="Zaindexované stránky"
          value={data?.indexedCount ?? 0}
          icon={<FileText size={20} />}
          loading={isLoading}
          index={0}
        />
        <StatCard
          label="Vektory (embeddingy)"
          value={data?.vectorCount ?? 0}
          icon={<Hash size={20} />}
          loading={isLoading}
          index={1}
        />
        <StatCard
          label="Zpracováno / celkem"
          value={`${data?.processedPages ?? 0} / ${data?.totalPages ?? 0}`}
          icon={<Layers size={20} />}
          loading={isLoading}
          index={2}
        />
        <StatCard
          label="Čeká na zpracování"
          value={data?.pendingPages ?? 0}
          icon={<Database size={20} />}
          tone={data && data.pendingPages > 0 ? 'accent' : 'default'}
          loading={isLoading}
          index={3}
        />
      </div>

      <p className={s.meta}>
        <Clock size={14} /> Naposledy zaindexováno: {lastEmbedded}
        {data?.lastEmbeddedPageSlug && (
          <span className={s.metaSlug}> ({data.lastEmbeddedPageSlug})</span>
        )}
      </p>

      <ConfirmDialog
        open={confirmOpen}
        title="Přebudovat search index?"
        message="Smaže a znovu vytvoří celý index ze všech stránek. U embeddingů může trvat několik minut."
        confirmLabel="Přebudovat"
        onConfirm={handleRebuild}
        onClose={() => setConfirmOpen(false)}
        isPending={rebuild.isPending}
      />
    </div>
  );
}
