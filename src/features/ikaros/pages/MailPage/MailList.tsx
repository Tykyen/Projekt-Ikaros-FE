import clsx from 'clsx';
import { Button, Spinner, EmptyState } from '@/shared/ui';
import { useMailFolder } from '@/features/ikaros/api/useMail';
import { MailListItem } from './MailListItem';
import type { MailFolder } from '@/shared/types';
import s from './MailPage.module.css';

interface Props {
  folder: MailFolder;
  selectedId: string | null;
  onFolderChange: (f: MailFolder) => void;
  onSelect: (id: string) => void;
}

export function MailList({
  folder,
  selectedId,
  onFolderChange,
  onSelect,
}: Props) {
  const q = useMailFolder(folder === 'dorucene' ? 'inbox' : 'sent');
  const messages = q.data?.pages.flat() ?? [];

  return (
    <div className={s.listPane}>
      <div className={s.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={folder === 'dorucene'}
          className={clsx(s.tab, folder === 'dorucene' && s.tabActive)}
          onClick={() => onFolderChange('dorucene')}
        >
          Doručené
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={folder === 'odeslane'}
          className={clsx(s.tab, folder === 'odeslane' && s.tabActive)}
          onClick={() => onFolderChange('odeslane')}
        >
          Odeslané
        </button>
      </div>

      {q.isLoading ? (
        <div className={s.stateBox}>
          <Spinner />
        </div>
      ) : messages.length === 0 ? (
        <EmptyState
          size="panel"
          illustration="messages"
          title={folder === 'dorucene' ? 'Schránka je prázdná' : 'Nic odeslaného'}
          description={
            folder === 'dorucene'
              ? 'Nemáš žádné doručené zprávy.'
              : 'Zatím jsi neodeslal žádnou zprávu.'
          }
        />
      ) : (
        <>
          <ul className={s.items}>
            {messages.map((m) => (
              <MailListItem
                key={m.id}
                message={m}
                folder={folder}
                selected={m.id === selectedId}
                onClick={() => onSelect(m.id)}
              />
            ))}
          </ul>
          {q.hasNextPage && (
            <div className={s.loadMore}>
              <Button
                variant="ghost"
                size="sm"
                loading={q.isFetchingNextPage}
                onClick={() => void q.fetchNextPage()}
              >
                Načíst starší
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
