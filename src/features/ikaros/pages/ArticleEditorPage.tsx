import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { ArrowLeft, Send, Save } from 'lucide-react';
import { toast } from 'sonner';
import { currentUserAtom } from '@/shared/store/authStore';
import { Spinner, Modal, ErrorState } from '@/shared/ui';
import { RichTextEditor, useDraftAutoSave } from '@/shared/ui/RichTextEditor';
import {
  useArticle,
  useCreateArticle,
  useUpdateArticle,
  useSubmitArticle,
} from '../api/useArticles';
import { useArticleCategories } from '../api/useArticleCategories';
import { useUploadImage } from '@/shared/api';
import type { ArticleCategory } from '@/shared/types';
import s from './ArticleEditorPage.module.css';

const DEFAULT_CATEGORY = 'ostatni';
const MAX_CONTENT = 50000;
const MAX_TITLE = 300;

export default function ArticleEditorPage() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const user = useAtomValue(currentUserAtom);
  const {
    data: article,
    isLoading: loadingArticle,
    isError: articleError,
    refetch: refetchArticle,
  } = useArticle(id);
  const { data: categories = [] } = useArticleCategories();
  const uploadImage = useUploadImage();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  const [restoreDismissed, setRestoreDismissed] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  const autoSaveKey = useMemo(
    () => (user ? `article-draft:${user.id}:${id ?? 'new'}` : undefined),
    [user, id],
  );

  // Hydrate from BE on edit mode — track which articleId jsme už hydratovali,
  // abychom nepřepsali user edits když se article reaktualizuje (cache invalidate).
  const hydratedIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!article) return;
    if (hydratedIdRef.current === article.id) return;
    hydratedIdRef.current = article.id;
    setTitle(article.title);
    setContent(article.content);
    setCategory(article.category || DEFAULT_CATEGORY);
  }, [article]);

  const { hasUnsavedLocal, restoreCandidate, clearLocalDraft } =
    useDraftAutoSave(autoSaveKey, content);

  // Restore modal je viditelný pokud kandidát existuje a uživatel ho ještě nedismissoval.
  const restoreOpen = !!restoreCandidate && !restoreDismissed;

  const create = useCreateArticle();
  const update = useUpdateArticle();
  const submit = useSubmitArticle();
  const isPending = create.isPending || update.isPending || submit.isPending;

  // Permission check pro edit mode
  if (isEdit && article && user && article.authorId !== user.id) {
    return <Navigate to={`/ikaros/clanky/${id}`} replace />;
  }
  if (
    isEdit &&
    article &&
    article.status !== 'Draft' &&
    article.status !== 'Rejected'
  ) {
    return <Navigate to={`/ikaros/clanky/${id}`} replace />;
  }

  if (isEdit && loadingArticle) return <Spinner center />;
  // Bez tohohle guardu spadl načtený článek na chybě do `article === undefined`
  // → hydratace (výše) neproběhla → editor prázdný → „Uložit koncept" by
  // `update.mutateAsync` přepsal reálný obsah prázdným. Zároveň lež autorovi
  // („článek zmizel"). Nic se neztratilo — jen ho teď neumíme otevřít.
  if (isEdit && articleError)
    return (
      <div className={s.page}>
        <ErrorState
          size="panel"
          title="Článek se nepodařilo načíst"
          description="Nic se neztratilo — jen ho teď nedokážeme otevřít k úpravě. Prázdný editor bychom pustit nechtěli, uložení by tvůj text přepsalo. Zkus to prosím znovu."
          onRetry={() => void refetchArticle()}
        />
      </div>
    );

  async function handleSaveDraft() {
    if (!title.trim()) {
      toast.error('Zadej název článku');
      return;
    }
    try {
      if (isEdit && id) {
        await update.mutateAsync({
          id,
          dto: { title, content, category },
        });
        setLastSavedAt(Date.now());
        clearLocalDraft();
        toast.success('Koncept uložen');
      } else {
        const created = await create.mutateAsync({
          title,
          content,
          category,
          submit: false,
        });
        setLastSavedAt(Date.now());
        clearLocalDraft();
        toast.success('Koncept uložen');
        navigate(`/ikaros/clanky/${created.id}/upravit`, { replace: true });
      }
    } catch {
      toast.error('Nepodařilo se uložit');
    }
  }

  async function handleSubmit() {
    if (!title.trim()) {
      toast.error('Zadej název článku');
      return;
    }
    if (!content.replace(/<[^>]*>/g, '').trim()) {
      toast.error('Napiš obsah článku');
      return;
    }
    try {
      if (isEdit && id) {
        await update.mutateAsync({ id, dto: { title, content, category } });
        await submit.mutateAsync(id);
      } else {
        await create.mutateAsync({
          title,
          content,
          category,
          submit: true,
        });
      }
      clearLocalDraft();
      toast.success('Článek odeslán ke schválení');
      navigate('/ikaros/clanky?tab=moje');
    } catch {
      toast.error('Nepodařilo se odeslat');
    }
  }

  return (
    <div className={s.page}>
      <header className={s.editorHeader}>
        <Link to="/ikaros/clanky" className={s.back}>
          <ArrowLeft size={14} /> Zpět
        </Link>
        <AutoSaveIndicator
          lastSavedAt={lastSavedAt}
          hasUnsaved={hasUnsavedLocal}
        />
      </header>

      <main className={s.editorMain}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Název článku"
          maxLength={MAX_TITLE}
          className={s.titleInput}
          aria-label="Název článku"
        />
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="Začni psát…"
          maxLength={MAX_CONTENT}
          onImageUpload={async (file) => (await uploadImage.mutateAsync(file)).url}
          className={s.editorContent}
        />
      </main>

      <footer className={s.stickyBar}>
        <CategoryPicker
          value={category}
          onChange={setCategory}
          categories={categories}
        />
        <div className={s.btns}>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isPending}
            className={s.btnSecondary}
          >
            <Save size={14} /> Uložit koncept
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className={s.btnPrimary}
          >
            <Send size={14} /> Odeslat ke schválení
          </button>
        </div>
      </footer>

      <RestoreDraftModal
        open={restoreOpen}
        candidate={restoreCandidate}
        onAccept={(html) => {
          setContent(html);
          setRestoreDismissed(true);
        }}
        onDiscard={() => {
          clearLocalDraft();
          setRestoreDismissed(true);
        }}
      />
    </div>
  );
}

// ─── Auto-save indicator ────────────────────────────────────────────────

function AutoSaveIndicator({
  lastSavedAt,
  hasUnsaved,
}: {
  lastSavedAt: number | null;
  hasUnsaved: boolean;
}) {
  if (hasUnsaved) {
    return <span className={s.autoSaveDirty}>✎ neuložené změny</span>;
  }
  if (!lastSavedAt) return null;
  const time = new Date(lastSavedAt).toLocaleTimeString('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return <span className={s.autoSaveClean}>✦ uloženo · {time}</span>;
}

// ─── Category picker (vertical pill chips) ──────────────────────────────

function CategoryPicker({
  value,
  onChange,
  categories,
}: {
  value: string;
  onChange: (key: string) => void;
  categories: ArticleCategory[];
}) {
  return (
    <div className={s.catPicker} role="radiogroup" aria-label="Kategorie">
      {categories.map((cat) => (
        <button
          key={cat.key}
          type="button"
          role="radio"
          aria-checked={value === cat.key}
          onClick={() => onChange(cat.key)}
          className={value === cat.key ? s.chipActive : s.chip}
          style={{ ['--cat-current' as never]: cat.color }}
        >
          <span className={s.waxSeal} />
          {cat.label}
        </button>
      ))}
    </div>
  );
}

// ─── Restore draft modal ────────────────────────────────────────────────

function RestoreDraftModal({
  open,
  candidate,
  onAccept,
  onDiscard,
}: {
  open: boolean;
  candidate: string | null;
  onAccept: (html: string) => void;
  onDiscard: () => void;
}) {
  if (!candidate) return null;
  return (
    <Modal
      open={open}
      onClose={onDiscard}
      title="Máš rozpracovaný draft"
      size="md"
    >
      <p className={s.restoreText}>
        V prohlížeči jsme našli rozpracovaný draft tohoto článku, který nebyl
        uložen na server. Chceš pokračovat s ním, nebo ho zahodit?
      </p>
      <div className={s.restoreActions}>
        <button
          type="button"
          onClick={onDiscard}
          className={s.btnSecondary}
        >
          Zahodit
        </button>
        <button
          type="button"
          onClick={() => onAccept(candidate)}
          className={s.btnPrimary}
        >
          Pokračovat s draftem
        </button>
      </div>
    </Modal>
  );
}
