import { useState } from 'react';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import { Button, Spinner, EmptyState, ErrorState } from '@/shared/ui';
import {
  useBugReports,
  useResolveBugReport,
  type BugReportItem,
} from '../../api/useBugReports';
import s from './ChybyTab.module.css';

/** Kdo hlášení přijal (persona Vypravěče na dané ploše). */
const MLUVCI_JMENO: Record<BugReportItem['context']['speaker'], string> = {
  ikaros: 'Ishida',
  world: 'Joe',
  tm: 'Měďák',
};

/**
 * 25.1 — admin inbox hlášení chyb (kanál Vypravěč). Filtr nové/vyřešené,
 * tlačítko „Vyřešeno". Reporty se nemažou (audit).
 */
export function ChybyTab() {
  const [filtr, setFiltr] = useState<'new' | 'resolved'>('new');
  const { data, isLoading, isError, refetch } = useBugReports(filtr);
  const resolve = useResolveBugReport();
  const reports = data?.items ?? [];

  return (
    <div className={s.wrap}>
      <div className={s.filtr} role="tablist" aria-label="Filtr hlášení">
        <button
          type="button"
          role="tab"
          aria-selected={filtr === 'new'}
          className={filtr === 'new' ? s.filtrBtnAktivni : s.filtrBtn}
          onClick={() => setFiltr('new')}
        >
          Nové
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filtr === 'resolved'}
          className={filtr === 'resolved' ? s.filtrBtnAktivni : s.filtrBtn}
          onClick={() => setFiltr('resolved')}
        >
          Vyřešené
        </button>
      </div>

      {isLoading ? (
        <Spinner center />
      ) : isError ? (
        <ErrorState
          size="panel"
          title="Hlášení se nepodařilo načíst"
          description="Zkus to prosím znovu."
          onRetry={() => void refetch()}
        />
      ) : reports.length === 0 ? (
        <EmptyState
          size="panel"
          illustration="generic-empty"
          title={filtr === 'new' ? 'Žádná nová hlášení.' : 'Žádná vyřešená hlášení.'}
          description={
            filtr === 'new'
              ? 'Zatím je klid — nic nového nikdo nenahlásil.'
              : 'Sem se přesouvají hlášení označená jako vyřešená.'
          }
        />
      ) : (
        <ul className={s.list}>
          {reports.map((r) => (
            <li key={r.id} className={s.row}>
              <p className={s.text}>{r.text}</p>
              <div className={s.meta}>
                <span>{new Date(r.createdAtUtc).toLocaleString('cs-CZ')}</span>
                <span>·</span>
                <span>{r.reporterId ? 'přihlášený' : 'anonym'}</span>
                <span>·</span>
                <span>{MLUVCI_JMENO[r.context.speaker]}</span>
                {r.context.route && (
                  <>
                    <span>·</span>
                    <code className={s.route}>{r.context.route}</code>
                  </>
                )}
                {r.context.buildVersion && (
                  <>
                    <span>·</span>
                    <span>v{r.context.buildVersion}</span>
                  </>
                )}
                {r.email && (
                  <>
                    <span>·</span>
                    <a href={`mailto:${r.email}`}>{r.email}</a>
                  </>
                )}
              </div>
              {r.context.userAgent && (
                <p className={s.ua} title={r.context.userAgent}>
                  {r.context.userAgent}
                </p>
              )}
              {filtr === 'new' && (
                <div className={s.akce}>
                  <Button
                    variant="secondary"
                    disabled={resolve.isPending}
                    onClick={async () => {
                      try {
                        await resolve.mutateAsync(r.id);
                        toast.success('Označeno jako vyřešené.');
                      } catch {
                        /* toast řeší onError v useResolveBugReport */
                      }
                    }}
                  >
                    <Check size={16} aria-hidden /> Vyřešeno
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
