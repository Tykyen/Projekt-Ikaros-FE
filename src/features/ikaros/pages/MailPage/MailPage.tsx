import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { Mail } from 'lucide-react';
import { Button } from '@/shared/ui';
import { currentUserAtom } from '@/shared/store/authStore';
import { MailList } from './MailList';
import { MailDetail } from './MailDetail';
import { ComposeModal } from './ComposeModal';
import type { IkarosMessage, MailFolder } from '@/shared/types';
import s from './MailPage.module.css';

export default function MailPage() {
  const user = useAtomValue(currentUserAtom);
  const [params, setParams] = useSearchParams();
  const folder: MailFolder =
    params.get('slozka') === 'odeslane' ? 'odeslane' : 'dorucene';

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compose, setCompose] = useState<{
    open: boolean;
    replyTo: IkarosMessage | null;
  }>({ open: false, replyTo: null });

  const meId = user?.id ?? '';

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
          onClick={() => setCompose({ open: true, replyTo: null })}
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
          onReply={(m) => setCompose({ open: true, replyTo: m })}
          onDeletedHead={() => setSelectedId(null)}
        />
      </div>

      <ComposeModal
        key={compose.open ? (compose.replyTo?.id ?? 'new') : 'closed'}
        open={compose.open}
        meId={meId}
        replyTo={compose.replyTo}
        onClose={() => setCompose({ open: false, replyTo: null })}
      />
    </div>
  );
}
