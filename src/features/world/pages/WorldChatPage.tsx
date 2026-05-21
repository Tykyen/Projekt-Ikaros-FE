import '../chat/chatSkin.css';
import { WorldChatRoom } from '../chat/components/WorldChatRoom';
import { DiceRollOverlayProvider } from '../chat/dice/components/DiceRollOverlayProvider';

/** Světový chat — `/svet/:worldSlug/chat` (krok 6.1). */
export default function WorldChatPage() {
  return (
    <DiceRollOverlayProvider>
      <WorldChatRoom />
    </DiceRollOverlayProvider>
  );
}
