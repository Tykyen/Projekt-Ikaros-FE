/**
 * 10.2a — Page entry point pro taktickou mapu (`/svet/:worldSlug/takticka-mapa`).
 *
 * Wrapper kolem feature komponenty `TacticalMapView`. Route-level lazy load
 * je řešen v `app/router/routes.tsx` přes `React.lazy(() => import('...'))`,
 * takže PixiJS bundle se loaduje jen pro tuto stránku.
 *
 * Spec: docs/arch/phase-10/spec-10.2a.md §5.
 */
import { TacticalMapView } from '@/features/world/tactical-map';

export default function TacticalMapPage(): React.ReactElement {
  return <TacticalMapView />;
}
