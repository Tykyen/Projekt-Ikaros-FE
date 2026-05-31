/**
 * 13.3 — Sdílený skrytý YouTube přehrávač.
 *
 * Obaluje YT IFrame API do imperativního API (`play`/`stop`/`setVolume`).
 * Player je 1×1 px, mimo viewport — slyšitelný, neviditelný. Playlist =
 * řetěz video ID (YT přehraje za sebou; `loop` opakuje celý seznam).
 *
 * ⚠️ Autoplay: skutečné spuštění závisí na gestu uživatele (viz
 * `soundActivation`). Hook sám gesto neřeší — volá `play()` až když to
 * konzument povolí.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { loadYoutubeApi } from './youtubeApi';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface YoutubePlayerHandle {
  /** Spustí playlist (pole 11znakových video ID). Prázdné pole = stop. */
  play: (videoIds: string[], opts?: { loop?: boolean }) => void;
  stop: () => void;
  setVolume: (vol: number) => void;
  isPlaying: boolean;
}

export function useYoutubePlayer(): YoutubePlayerHandle {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const readyRef = useRef(false);
  /** Příkaz čekající na ready player (race: play() voláno před initem). */
  const pendingRef = useRef<{ ids: string[]; loop: boolean } | null>(null);
  const volumeRef = useRef(60);
  const [isPlaying, setIsPlaying] = useState(false);

  // Mount skrytého kontejneru + init playeru jednou.
  useEffect(() => {
    const container = document.createElement('div');
    container.style.cssText =
      'position:fixed;width:1px;height:1px;left:-9999px;top:-9999px;pointer-events:none;';
    const el = document.createElement('div');
    container.appendChild(el);
    document.body.appendChild(container);
    containerRef.current = container;

    let cancelled = false;
    loadYoutubeApi().then((YT) => {
      if (cancelled) return;
      playerRef.current = new YT.Player(el, {
        height: '1',
        width: '1',
        playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0 },
        events: {
          onReady: () => {
            readyRef.current = true;
            playerRef.current?.setVolume(volumeRef.current);
            const pending = pendingRef.current;
            if (pending) {
              pendingRef.current = null;
              startPlaylist(pending.ids, pending.loop);
            }
          },
          onStateChange: (e: any) => {
            // 1 = playing, 0 = ended, 2 = paused.
            setIsPlaying(e.data === 1);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy();
      } catch {
        /* ignore */
      }
      container.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startPlaylist = (videoIds: string[], loop: boolean) => {
    const player = playerRef.current;
    if (!player) return;
    if (videoIds.length === 0) {
      player.stopVideo();
      setIsPlaying(false);
      return;
    }
    player.loadPlaylist({ playlist: videoIds });
    player.setLoop(loop);
    player.setVolume(volumeRef.current);
    player.playVideo();
  };

  const play = useCallback(
    (videoIds: string[], opts?: { loop?: boolean }) => {
      const loop = opts?.loop ?? true;
      if (!readyRef.current) {
        pendingRef.current = { ids: videoIds, loop };
        return;
      }
      startPlaylist(videoIds, loop);
    },
    [],
  );

  const stop = useCallback(() => {
    pendingRef.current = null;
    try {
      playerRef.current?.stopVideo();
    } catch {
      /* ignore */
    }
    setIsPlaying(false);
  }, []);

  const setVolume = useCallback((vol: number) => {
    volumeRef.current = vol;
    try {
      playerRef.current?.setVolume(vol);
    } catch {
      /* ignore */
    }
  }, []);

  return { play, stop, setVolume, isPlaying };
}
