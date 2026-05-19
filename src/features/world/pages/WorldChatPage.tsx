import '../chat/chatSkin.css';
import { WorldChatRoom } from '../chat/components/WorldChatRoom';

/** Světový chat — `/svet/:worldSlug/chat` (krok 6.1). */
export default function WorldChatPage() {
  return <WorldChatRoom />;
}
