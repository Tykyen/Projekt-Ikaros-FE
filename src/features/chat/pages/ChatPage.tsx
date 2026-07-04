import { Beer } from 'lucide-react';
import { useAtomValue } from 'jotai';
import { isAuthenticatedAtom } from '@/shared/store/authStore';
import { anonSessionAtom } from '../store/anonSession';
import { ChatRoom } from '../components/ChatRoom';
import { AnonChatGate } from '../components/AnonChatGate';

/** Stránka `/chat` — globální chat „Putyka" (krok 4.1). 15.8 — veřejná: host
 *  bez session vidí captcha bránu, pak chat v „host módu". */
export default function ChatPage() {
  const isAuth = useAtomValue(isAuthenticatedAtom);
  const anon = useAtomValue(anonSessionAtom);
  if (!isAuth && !anon) return <AnonChatGate />;
  return (
    <ChatRoom
      room="hospoda"
      roomName="Dimenzionální Putyka"
      icon={<Beer size={18} />}
    />
  );
}
