import { ErrorState, FullPageState } from '@/shared/ui/StatePlaceholder';

export default function ForbiddenPage() {
  return (
    <FullPageState>
      <ErrorState size="hero" status={403} action={{ label: 'Zpět domů', to: '/' }} />
    </FullPageState>
  );
}
