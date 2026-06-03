import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BookText, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Spinner, Button } from '@/shared/ui';
import { WorldRole } from '@/shared/types';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { usePage } from './api/usePage';
import { useCreatePage } from './api/useCreatePage';
import { PageViewer } from './PageViewer/PageViewer';
import s from './RulesPage.module.css';

/** 12.3 — Pravidla jsou wiki stránka s rezervovaným slugem. */
const RULES_SLUG = 'pravidla';

/**
 * 12.3 — „Pravidla světa" jako editovatelná wiki stránka (rezervovaný slug
 * `pravidla`). Existuje → render přes `PageViewer` (Upravit přes `e` / hlavičku,
 * PomocnyPJ+). Neexistuje → PomocnyPJ+ ji založí, ostatní vidí empty state.
 */
export default function RulesPage() {
  const navigate = useNavigate();
  const { worldId, worldSlug, userRole } = useWorldContext();
  const { data: page, isLoading, error } = usePage(worldId, RULES_SLUG);
  const createPage = useCreatePage(worldId, worldSlug);
  const canEdit = (userRole ?? -1) >= WorldRole.PomocnyPJ;

  if (isLoading) return <Spinner center />;

  if (page) return <PageViewer page={page} />;

  // Stránka neexistuje (404) nebo jiná chyba → empty / create state.
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  const isNotFound = !page && (status === 404 || status === undefined);

  async function handleCreate() {
    try {
      await createPage.mutateAsync({
        slug: RULES_SLUG,
        type: 'Ostatní',
        title: 'Pravidla světa',
        content: '',
      });
      navigate(`/svet/${worldSlug}/edit/${RULES_SLUG}`);
    } catch {
      toast.error('Pravidla se nepodařilo vytvořit.');
    }
  }

  return (
    <div className={s.empty}>
      <BookText size={40} className={s.icon} aria-hidden />
      <h1 className={s.title}>Pravidla světa</h1>
      {isNotFound ? (
        canEdit ? (
          <>
            <p className={s.text}>
              Pravidla zatím nejsou nastavena. Vytvoř je jako wiki stránku —
              poté je upravíš stejně jako kteroukoli jinou stránku.
            </p>
            <Button
              type="button"
              variant="primary"
              onClick={handleCreate}
              loading={createPage.isPending}
            >
              <Plus size={16} /> Vytvořit pravidla
            </Button>
          </>
        ) : (
          <p className={s.text}>Pravidla zatím nejsou nastavena.</p>
        )
      ) : (
        <p className={s.text}>Pravidla se nepodařilo načíst.</p>
      )}
    </div>
  );
}
