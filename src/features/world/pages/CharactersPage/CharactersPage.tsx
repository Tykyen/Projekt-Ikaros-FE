import { Spinner } from '@/shared/ui';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { CharacterDirectory } from './CharacterDirectory';

/**
 * 8.2e — Entry adresáře postav. Routa `/svet/:worldSlug/postavy` (memberOnly).
 * Tenká routing vrstva — světový kontext (worldId/slug/role) přepošle prezenteru.
 */
export default function CharactersPage() {
  const { worldId, worldSlug, userRole, loading } = useWorldContext();
  if (loading) return <Spinner center />;
  return (
    <CharacterDirectory
      worldId={worldId}
      worldSlug={worldSlug}
      userRole={userRole}
    />
  );
}
