/**
 * 17.6 — implementace `VoiceProvider` nad Jitsi IFrame API.
 *
 * Náš rám (ovladače, roster, pop-out) je venku; Jitsi kreslí jen video mřížku
 * uvnitř iframe. Jitsiho vlastní toolbar skrýváme (`TOOLBAR_BUTTONS: []`) a
 * ovládáme přes `executeCommand`. Audio/WebRTC/signaling běží uvnitř iframe pod
 * CSP Jitsi — naše CSP řídí jen načtení skriptu + rámce (viz spec-17.6 §3.4).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { loadJitsiApi } from './loadJitsiApi';
import { JITSI_DOMAIN } from '../config';
import type {
  VoiceProvider,
  VoiceJoinOptions,
  VoiceProviderCallbacks,
  VoiceLocalState,
} from './types';

export class JitsiVoiceProvider implements VoiceProvider {
  private api: any = null;
  private readonly cb: VoiceProviderCallbacks;
  private local: VoiceLocalState = { muted: false, cam: false, screen: false };

  constructor(cb: VoiceProviderCallbacks = {}) {
    this.cb = cb;
  }

  async join(container: HTMLElement, opts: VoiceJoinOptions): Promise<void> {
    const JitsiMeetExternalAPI = await loadJitsiApi();
    this.local = {
      muted: !!opts.startWithAudioMuted,
      cam: !opts.startWithVideoMuted,
      screen: false,
    };
    this.api = new JitsiMeetExternalAPI(JITSI_DOMAIN, {
      roomName: opts.roomName,
      parentNode: container,
      width: '100%',
      height: '100%',
      userInfo: opts.displayName ? { displayName: opts.displayName } : undefined,
      configOverwrite: {
        startWithAudioMuted: opts.startWithAudioMuted ?? false,
        startWithVideoMuted: opts.startWithVideoMuted ?? true,
        // Prejoin obrazovku vypínáme — připojí rovnou. `prejoinPageEnabled` je
        // starý klíč (meet.jit.si ho ignoruje), `prejoinConfig.enabled` je nový.
        prejoinPageEnabled: false,
        prejoinConfig: { enabled: false },
        disableDeepLinking: true,
        disableInviteFunctions: true,
      },
      interfaceConfigOverwrite: {
        // Ovládáme vlastními tlačítky (Řezbářská lišta) → Jitsiho toolbar pryč.
        TOOLBAR_BUTTONS: [],
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        HIDE_DEEP_LINKING_LOGO: true,
        DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
        MOBILE_APP_PROMO: false,
      },
    });

    this.api.addListener('videoConferenceJoined', () => this.cb.onJoined?.());
    this.api.addListener('participantJoined', () => this.emitCount());
    this.api.addListener('participantLeft', () => this.emitCount());
    this.api.addListener('dominantSpeakerChanged', (e: any) =>
      this.cb.onDominantSpeaker?.(e?.id ?? null),
    );
    this.api.addListener('audioMuteStatusChanged', (e: any) => {
      this.local = { ...this.local, muted: !!e?.muted };
      this.cb.onLocalStateChanged?.(this.local);
    });
    this.api.addListener('videoMuteStatusChanged', (e: any) => {
      this.local = { ...this.local, cam: !e?.muted };
      this.cb.onLocalStateChanged?.(this.local);
    });
    this.api.addListener('screenSharingStatusChanged', (e: any) => {
      this.local = { ...this.local, screen: !!e?.on };
      this.cb.onLocalStateChanged?.(this.local);
    });
    this.api.addListener('readyToClose', () => this.cb.onReadyToClose?.());
  }

  private emitCount(): void {
    try {
      const n = this.api?.getNumberOfParticipants?.() ?? 0;
      this.cb.onParticipantsChanged?.(n);
    } catch {
      /* ignore */
    }
  }

  toggleMic(): void {
    this.api?.executeCommand('toggleAudio');
  }
  toggleCam(): void {
    this.api?.executeCommand('toggleVideo');
  }
  toggleScreen(): void {
    this.api?.executeCommand('toggleShareScreen');
  }
  hangup(): void {
    this.api?.executeCommand('hangup');
  }
  dispose(): void {
    try {
      this.api?.dispose();
    } catch {
      /* ignore */
    }
    this.api = null;
  }
}
