import { useAuthBootstrap } from '../../api/hooks/useAuth';

/**
 * Mountuj jednou v root stromu. Při startu hydratuje currentUserAtom z JWT
 * (pokud token v localStorage existuje, ale user atom je null) a smaže
 * tokeny, pokud je JWT expirovaný. Nic nerenderuje.
 */
export function AuthBootstrap() {
  useAuthBootstrap();
  return null;
}
