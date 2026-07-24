import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { toast } from 'sonner';
import { api, parseApiError } from '@/shared/api/client';
import { accessTokenAtom } from '@/shared/store/authStore';

/** 25.1 — hlášení chyby (admin pohled). Zrcadlí BE entitu `bug_reports`. */
export interface BugReportItem {
  id: string;
  text: string;
  email?: string;
  context: {
    route?: string;
    url: string;
    scope: 'ikaros' | 'world';
    speaker: 'ikaros' | 'world' | 'tm';
    worldId?: string;
    buildVersion?: string;
    userAgent?: string;
  };
  reporterId?: string;
  status: 'new' | 'resolved';
  createdAtUtc: string;
  resolvedByUserId?: string;
  resolvedAtUtc?: string;
}

interface BugReportsPage {
  items: BugReportItem[];
  total: number;
}

/** Admin inbox hlášení (`GET /bug-reports?status=`). Jen Sa/Admin (gate na BE). */
export function useBugReports(status: 'new' | 'resolved') {
  const token = useAtomValue(accessTokenAtom);
  return useQuery({
    queryKey: ['bug-reports', status],
    queryFn: () => api.get<BugReportsPage>('/bug-reports', { status }),
    enabled: !!token,
    staleTime: 15_000,
  });
}

/** Označit hlášení vyřešeným (`POST /bug-reports/:id/resolve`). */
export function useResolveBugReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ ok: true }>(`/bug-reports/${id}/resolve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bug-reports'] });
    },
    onError: (err) => toast.error(parseApiError(err)),
  });
}
