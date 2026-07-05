/**
 * 17.6 — abstrakce nad poskytovatelem hlasu/videa.
 *
 * UI (voice-bar, ovladače, pop-out) závisí jen na tomto rozhraní, ne na Jitsi.
 * Výměna za LiveKit = nová implementace `VoiceProvider`, nula změn v UI.
 */

export interface VoiceJoinOptions {
  /** Název místnosti na straně poskytovatele (Jitsi room / LiveKit room). */
  roomName: string;
  displayName?: string;
  startWithAudioMuted?: boolean;
  startWithVideoMuted?: boolean;
}

export interface VoiceLocalState {
  muted: boolean;
  cam: boolean;
  screen: boolean;
}

export interface VoiceProviderCallbacks {
  onParticipantsChanged?: (count: number) => void;
  onDominantSpeaker?: (participantId: string | null) => void;
  onLocalStateChanged?: (state: VoiceLocalState) => void;
  onJoined?: () => void;
  /** Poskytovatel signalizuje konec hovoru (hangup uvnitř, kick, chyba). */
  onReadyToClose?: () => void;
}

export interface VoiceProvider {
  /** Připojí hovor a vykreslí ho do daného DOM kontejneru. */
  join(container: HTMLElement, opts: VoiceJoinOptions): Promise<void>;
  toggleMic(): void;
  toggleCam(): void;
  toggleScreen(): void;
  hangup(): void;
  dispose(): void;
}
