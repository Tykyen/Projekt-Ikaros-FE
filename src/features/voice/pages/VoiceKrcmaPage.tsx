import { Navigate } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { isAuthenticatedAtom } from '@/shared/store/authStore';
import { VoiceKrcmaRoom } from '../components/VoiceKrcmaRoom';

/**
 * Stránka `/chat/voice` — Voice krčma (17.6). Jen registrovaní: host nemá
 * v sidebaru položku (anonHidden) a přímý přístup na URL ho vrátí do Putyky.
 * BE navíc gatuje WS i REST (guest → 403).
 */
export default function VoiceKrcmaPage() {
  const isAuth = useAtomValue(isAuthenticatedAtom);
  if (!isAuth) return <Navigate to="/chat" replace />;
  return <VoiceKrcmaRoom />;
}
