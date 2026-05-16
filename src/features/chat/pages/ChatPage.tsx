import { Beer } from 'lucide-react';
import { ChatRoom } from '../components/ChatRoom';

/** Stránka `/chat` — globální chat „Hospoda" (krok 4.1). */
export default function ChatPage() {
  return (
    <ChatRoom
      room="hospoda"
      roomName="Interdimenzionální hospoda"
      icon={<Beer size={18} />}
    />
  );
}
