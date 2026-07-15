import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  approveSceneTemplate,
  getSceneCatalogEntry,
  listSceneCatalog,
  rejectSceneTemplate,
  type SceneCatalogResponse,
  type SceneCatalogEntry,
} from '../api/sceneCatalogApi';

const CATALOG_KEY = ['scene-catalog'] as const;

/** 22.5 — list veřejného katalogu scén. */
export function useSceneCatalog(systemId?: string) {
  return useQuery<SceneCatalogResponse>({
    queryKey: [...CATALOG_KEY, { systemId: systemId ?? null }],
    queryFn: () => listSceneCatalog({ systemId }),
    staleTime: 60_000,
  });
}

/** 22.5 — detail katalogové scény. */
export function useSceneCatalogEntry(id: string | undefined) {
  return useQuery<SceneCatalogEntry>({
    queryKey: [...CATALOG_KEY, 'detail', id],
    queryFn: () => getSceneCatalogEntry(id as string),
    enabled: !!id,
  });
}

/** 22.5 — kurátorské schválení / zamítnutí publikace. */
export function useSceneCuratorActions() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: CATALOG_KEY });
    qc.invalidateQueries({ queryKey: ['pending-actions'] });
  };
  const approve = useMutation({
    mutationFn: (id: string) => approveSceneTemplate(id),
    onSuccess: () => {
      invalidate();
      toast.success('Scéna schválena — je v katalogu.');
    },
    onError: () => toast.error('Schválení selhalo.'),
  });
  const reject = useMutation({
    mutationFn: (id: string) => rejectSceneTemplate(id),
    onSuccess: () => {
      invalidate();
      toast.success('Scéna zamítnuta.');
    },
    onError: () => toast.error('Zamítnutí selhalo.'),
  });
  return { approve, reject };
}
