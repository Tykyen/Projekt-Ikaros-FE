import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { Mail } from 'lucide-react';
import { Button } from '@/shared/ui';
import { currentUserAtom } from '@/shared/store/authStore';
import { MailList } from './MailList';
import { MailDetail } from './MailDetail';
import { ComposeModal } from './ComposeModal';
import type { UserLookupItem } from '@/features/ikaros/api/useUserLookup';
import type { IkarosMessage, MailFolder } from '@/shared/types';
import s from './MailPage.module.css';

export default function MailPage() {
  const user = useAtomValue(currentUserAtom);
  const [params, setParams] = useSearchParams();
  const folder: MailFolder =
    params.get('slozka') === 'odeslane' ? 'odeslane' : 'dorucene';

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Deep-link „Napsat zprávu" z profilu: ?komu=<id>&komuJmeno=<jméno>.
  // Compose se otevře už při prvním renderu (lazy initializer z URL — žádný
  // setState v effectu), parametry pak effect jednorázově vyčistí, aby
  // refresh/zavření modal znovu neotvíral.
  const composeTo = params.get('komu');
  const composeToName = params.get('komuJmeno');
  const [compose, setCompose] = useState<{
    open: boolean;
    replyTo: IkarosMessage | null;
    prefill: UserLookupItem | null;
  }>(() =>
    composeTo && composeToName
      ? {
          open: true,
          replyTo: null,
          prefill: { id: composeTo, username: composeToName },
        }
      : { open: false, replyTo: null, prefill: null },
  );

  const meId = user?.id ?? '';

  useEffect(() => {
    if (!composeTo && !composeToName) return;
    setParams(
      (p) => {
        p.delete('komu');
        p.delete('komuJmeno');
        return p;
      },
      { replace: true },
    );
    // Mount-only úklid URL parametrů; compose už je otevřený z initializeru.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setFolder(f: MailFolder) {
    setParams(
      (p) => {
        p.set('slozka', f);
        return p;
      },
      { replace: true },
    );
    setSelectedId(null);
  }

  return (
    <div className={s.page}>
      <div className={s.topbar}>
        <h1 className={s.title}>Pošta</h1>
        <Button
          variant="primary"
          onClick={() =>
            setCompose({ open: true, replyTo: null, prefill: null })
          }
        >
          <Mail size={16} /> Nová zpráva
        </Button>
      </div>

      <div className={s.split} data-view={selectedId ? 'detail' : 'list'}>
        <MailList
          folder={folder}
          selectedId={selectedId}
          onFolderChange={setFolder}
          onSelect={setSelectedId}
        />
        <MailDetail
          messageId={selectedId}
          meId={meId}
          onBack={() => setSelectedId(null)}
          onReply={(m) =>
            setCompose({ open: true, replyTo: m, prefill: null })
          }
          onDeletedHead={() => setSelectedId(null)}
        />
      </div>

      <ComposeModal
        key={
          compose.open
            ? (compose.replyTo?.id ?? compose.prefill?.id ?? 'new')
            : 'closed'
        }
        open={compose.open}
        meId={meId}
        replyTo={compose.replyTo}
        prefillRecipient={compose.prefill}
        onClose={() =>
          setCompose({ open: false, replyTo: null, prefill: null })
        }
      />
    </div>
  );
}
