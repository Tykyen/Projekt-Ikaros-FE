import { useAtomValue } from 'jotai';
import { useNavigate } from 'react-router-dom';
import { isAuthenticatedAtom } from '@/shared/store/authStore';
import { saveLoginIntent } from '@/shared/lib/loginIntent';
import { ErrorState } from '@/shared/ui';

/**
 * Spec 2.4 / 15.6 — fallback při 404 z `GET /worlds/:id`.
 *
 * BE vrací 404 i pro private svět bez přístupu (leak policy — neprozradí
 * existenci). Proto NErozlišujeme „neexistuje" vs „nemáš přístup" pro
 * přihlášeného. ALE: když uživatel **není přihlášen vůbec**, je to skoro jistě
 * jen vypršelá session — místo matoucího „svět neexistuje" mu nabídneme login
 * (leak-safe: anonym dostane „přihlas se" na každé chráněné URL stejně, takže
 * to neprozradí existenci konkrétního světa). Po loginu ho loginIntent vrátí zpět.
 */
export function WorldNotFound() {
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <ErrorState
        size="hero"
        status={401}
        action={{
          label: 'Přihlásit se',
          onClick: () => {
            saveLoginIntent(window.location.pathname + window.location.search);
            void navigate('/?openLogin=1');
          },
        }}
      />
    );
  }

  return (
    <ErrorState
      size="hero"
      status={404}
      title="Tento svět nenajdeme"
      description="Buď neexistuje, nebo k němu nemáš přístup. Pokud jsi sem dostal odkaz, požádej vypravěče o nové pozvání."
      action={{ label: 'Zpět na úvod', to: '/' }}
    />
  );
}
