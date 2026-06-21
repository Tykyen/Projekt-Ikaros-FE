import { ErrorState, FullPageState } from '@/shared/ui/StatePlaceholder';

export default function NotFoundPage() {
  return (
    <FullPageState>
      <ErrorState size="hero" status={404} action={{ label: 'Zpět domů', to: '/' }} />
    </FullPageState>
  );
}
