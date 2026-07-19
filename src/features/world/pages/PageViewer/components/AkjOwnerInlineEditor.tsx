import { useState } from 'react';
import { toast } from 'sonner';
import { Save, X } from 'lucide-react';
import { Button } from '@/shared/ui';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { RichTextEditor } from '@/shared/ui/RichTextEditor';
import { HeroUploadCard } from '../../PageEditor/components/HeroUploadCard';
import { TablePanel } from '../../PageEditor/panels/TablePanel';
import { slugify } from '../../PageEditor/lib/slugify';
import { usePagesDirectory } from '../../api/usePagesDirectory';
import { useUpdatePage } from '../../api/useUpdatePage';
import type { AkjTab, Page, PageTable } from '../../api/pages.types';
import s from './AkjOwnerInlineEditor.module.css';

const EMPTY_TABLE: PageTable = {
  hasTable: false,
  title: '',
  headers: [],
  values: [],
};

interface Props {
  page: Page;
  tab: AkjTab;
  /** Rozeditováno / uloženo — PostavaLayout to napojuje na discard guard. */
  onDirtyChange: (dirty: boolean) => void;
  /** Úspěšně uloženo → zavřít editor. */
  onSaved: () => void;
  /** Klik na „Zrušit" — PostavaLayout rozhodne (guard při neuložených změnách). */
  onCancel: () => void;
}

/**
 * spec-akj-owner-editable-content §6 — inline editor OBSAHU jedné AKJ záložky
 * pro vlastníka postavy. Reuse editorových komponent (RichText / obrázek / boxy).
 * Ukládá jen `contentOverride` té záložky (PATCH s jediným akjTab); BE merge
 * podle `id` zachová ostatní (i skryté) záložky a přístupová pravidla — vlastník
 * je nemění. Prázdná pole se při renderu dědí ze základní stránky (resolveAkjTab).
 */
export function AkjOwnerInlineEditor({
  page,
  tab,
  onDirtyChange,
  onSaved,
  onCancel,
}: Props) {
  const { worldId, worldSlug } = useWorldContext();
  const { data: directory = [] } = usePagesDirectory(worldId);
  const update = useUpdatePage(worldId, worldSlug);

  const [content, setContent] = useState(tab.contentOverride?.content ?? '');
  const [imageUrl, setImageUrl] = useState(tab.contentOverride?.imageUrl ?? '');
  const [table, setTable] = useState<PageTable>(
    tab.contentOverride?.table ?? EMPTY_TABLE,
  );

  async function handleSave() {
    // Posílá JEN tuhle záložku; BE ji spáruje podle id s uloženou verzí
    // a přebírá pouze contentOverride (ostatní pole i cizí záložky z DB).
    const nextTab: AkjTab = {
      ...tab,
      contentOverride: { content, imageUrl, table },
    };
    try {
      await update.mutateAsync({
        id: page.id,
        input: { akjTabs: [nextTab], expectedUpdatedAt: page.updatedAt },
        previousSlug: page.slug,
      });
      onDirtyChange(false);
      toast.success('Záložka uložena');
      onSaved();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      if (status === 403)
        toast.error('Tuhle záložku nemáš právo upravit.');
      else if (status === 409)
        toast.error('Záložka byla mezitím upravena. Načti stránku znovu.');
      else toast.error('Uložení selhalo');
    }
  }

  return (
    <div className={s.editor}>
      <div className={s.field}>
        <span className={s.label}>Text</span>
        <RichTextEditor
          value={content}
          onChange={(html) => {
            setContent(html);
            onDirtyChange(true);
          }}
          placeholder="Text, který uvidíš jen ty (a PJ)…"
          linkDirectory={directory}
          linkMakeSlug={slugify}
        />
      </div>

      <div className={s.field}>
        <span className={s.label}>Obrázek</span>
        <p className={s.hint}>Prázdné = převezme obrázek základní stránky.</p>
        <div className={s.imageWrap}>
          <HeroUploadCard
            compact
            value={imageUrl}
            onChange={(url) => {
              setImageUrl(url);
              onDirtyChange(true);
            }}
          />
        </div>
      </div>

      <div className={s.field}>
        <span className={s.label}>Boxy (atributy)</span>
        <p className={s.hint}>Prázdné = převezme tabulku základní stránky.</p>
        <TablePanel
          table={table}
          onChange={(t) => {
            setTable(t);
            onDirtyChange(true);
          }}
        />
      </div>

      <div className={s.actions}>
        <Button variant="ghost" onClick={onCancel} disabled={update.isPending}>
          <X size={16} aria-hidden /> Zrušit
        </Button>
        <Button onClick={handleSave} disabled={update.isPending}>
          <Save size={16} aria-hidden />{' '}
          {update.isPending ? 'Ukládám…' : 'Uložit'}
        </Button>
      </div>
    </div>
  );
}
