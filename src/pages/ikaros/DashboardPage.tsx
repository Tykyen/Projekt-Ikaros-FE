import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAtomValue, useSetAtom } from 'jotai';
import { apiClient } from '../../api/client';
import {
  isAuthenticatedAtom,
  loginModalOpenAtom,
} from '../../store/authStore';

async function fetchHealth() {
  const res = await apiClient.get('/health');
  return res.data;
}

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const setLoginModalOpen = useSetAtom(loginModalOpenAtom);

  // Auto-otevřít login modal pokud nás sem requireAuth shodil přes ?openLogin=1
  useEffect(() => {
    if (searchParams.get('openLogin') === '1' && !isAuthenticated) {
      setLoginModalOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('openLogin');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, isAuthenticated, setLoginModalOpen]);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    enabled: false,
  });

  return (
    <section style={{ padding: '2rem' }}>
      <h2>[stub] Dashboard</h2>
      <div style={{ marginTop: '1rem' }}>
        <button type="button" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? 'Pingám BE...' : 'Ping BE /health'}
        </button>
        {isLoading && <p>Načítám…</p>}
        {isError && <p style={{ color: 'var(--danger)' }}>Chyba: {String(error)}</p>}
        {data !== undefined && (
          <pre style={{ background: 'var(--bg-secondary)', padding: '1rem', marginTop: '0.5rem', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </section>
  );
}
