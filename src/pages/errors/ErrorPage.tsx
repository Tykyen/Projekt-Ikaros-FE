import { useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { ErrorState, FullPageState } from '@/shared/ui/StatePlaceholder';

export default function ErrorPage() {
  const error = useRouteError();
  const status = isRouteErrorResponse(error) ? error.status : undefined;
  const mapped = status === 403 || status === 404 || status === 500 ? status : undefined;

  return (
    <FullPageState>
      <ErrorState
        size="hero"
        status={mapped}
        action={{ label: 'Zpět domů', to: '/' }}
        secondaryAction={{
          label: 'Obnovit stránku',
          onClick: () => window.location.reload(),
        }}
      />
    </FullPageState>
  );
}
