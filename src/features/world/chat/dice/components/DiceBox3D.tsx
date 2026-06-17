import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import DiceBox from '@drdreo/dice-box-threejs';
import { materialTextureDescriptor } from '../lib/dice3dThemes';
import type { Dice3dTheme } from '../lib/dice3dThemes';
import styles from './DiceBox3D.module.css';

/**
 * Zaregistruje vlastní materiálové textury — přepíše `DiceColors.getTexture`
 * tak, že pro známé id materiálu vrátí deskriptor (`source` webp v `public/`),
 * jinak deleguje na originál. Knihovna nemá veřejné API pro vlastní textury,
 * tohle je nejmenší zásah do interní `DiceColors`.
 */
function patchCustomTextures(box: unknown): void {
  const dc = (box as { DiceColors?: Record<string, unknown> }).DiceColors;
  if (!dc || typeof dc.getTexture !== 'function' || dc.__ikarosPatched) return;
  const orig = (dc.getTexture as (n: unknown) => unknown).bind(dc);
  dc.getTexture = (name: unknown) => {
    if (typeof name === 'string') {
      const desc = materialTextureDescriptor(name);
      if (desc) return desc;
    }
    return orig(name);
  };
  dc.__ikarosPatched = true;
}

/**
 * Krok 6.3-fix4 — React wrapper nad `@drdreo/dice-box-threejs`.
 *
 * Reálná fyzikální 3D kostka v transparentním fullscreen canvasu. Výsledek
 * je PŘEDURČENÝ (notace `1d20@13`) — kostka se realisticky kutálí, ale
 * dopadne na hodnotu z payloadu (WS shoda u všech hráčů).
 *
 * Instance se vytvoří JEDNOU (lazy přes `React.lazy` v overlay) a žije dál —
 * každý hod jen `clearDice()` + `roll()`. Knihovna nemá `destroy()`, takže
 * mount/unmount per hod by leakoval RAF/renderer; proto persistentní host.
 */
interface DiceBox3DProps {
  /** Notace s předurčením, např. `1d20@13`. */
  notation: string;
  theme: Dice3dTheme;
  /** Mění se s každým hodem (= roll.timestamp) → spustí nový hod. */
  nonce: number;
  /** Hod je aktivní (jinak host čeká skrytý). */
  active: boolean;
  /** Po dosednutí kostek. */
  onComplete: () => void;
  /** Init/roll selhal (např. WebGL) → overlay přepne na 2D fallback. */
  onError: () => void;
}

type DiceBoxInstance = InstanceType<typeof DiceBox>;

export default function DiceBox3D({
  notation,
  theme,
  nonce,
  active,
  onComplete,
  onError,
}: DiceBox3DProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<DiceBoxInstance | null>(null);
  const [ready, setReady] = useState(false);
  // Vždy nejnovější hodnoty (rollNow čte z refs, ne ze zastaralého closure).
  const latestRef = useRef({ notation, active, theme });
  latestRef.current = { notation, active, theme };
  const cbRef = useRef({ onComplete, onError });
  cbRef.current = { onComplete, onError };

  /** Spustí hod z aktuálního stavu — voláno po `ready` i při změně `nonce`. */
  const rollNow = useCallback(() => {
    const box = boxRef.current;
    const host = hostRef.current;
    const { notation, active, theme } = latestRef.current;
    if (!box || !active || !notation) return;
    try {
      // Dorovnat rozměry z reálného hostu — konstruktor je čte při vytvoření,
      // takže při prvním hodu (host se právě zobrazil) můžou být 0 → kostka by
      // padla mimo viewport. Tímto je scéna/svět vždy správně velká.
      if (host && host.clientWidth) {
        box.setDimensions(new THREE.Vector2(host.clientWidth, host.clientHeight));
      }
      box.clearDice();
      void box
        .updateConfig({
          theme_customColorset: theme.colorset,
          theme_material: theme.material,
        })
        .then(() => box.roll(notation))
        .catch(() => cbRef.current.onError());
    } catch {
      cbRef.current.onError();
    }
  }, []);

  // Init jednou.
  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;
    if (!host) return;

    const box = new DiceBox(host, {
      assetPath: '/dice-box/',
      theme_customColorset: theme.colorset,
      theme_material: theme.material,
      theme_texture: '',
      theme_surface: 'green-felt',
      // Bílé silnější světlo — výchozí krémové (0xefdfd5) kalí barvy materiálu.
      color_spotlight: 0xffffff,
      light_intensity: 1.2,
      shadows: true,
      sounds: false,
      gravity_multiplier: 400,
      baseScale: 100,
      strength: 1.3,
      onRollComplete: () => {
        if (!cancelled) cbRef.current.onComplete();
      },
    });

    // Vlastní materiálové textury PŘED initialize (loadTheme čte getTexture).
    patchCustomTextures(box);

    box
      .initialize()
      .then(() => {
        if (cancelled) return;
        boxRef.current = box;
        try {
          // Průhledné pozadí + ploché bílé ambientní světlo (zachová sytost).
          box.scene.background = null;
          box.scene.add(new THREE.AmbientLight(0xffffff, 1.4));
        } catch {
          /* defenzivní */
        }
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) cbRef.current.onError();
      });

    return () => {
      cancelled = true;
      try {
        boxRef.current?.clearDice();
      } catch {
        /* knihovna nemá destroy(); aspoň uvolni kostky */
      }
      if (host) host.innerHTML = '';
      boxRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hod: po dokončení initu (ready) i při každé změně nonce.
  useEffect(() => {
    if (!ready) return;
    rollNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, nonce]);

  // Po dokončení hodu (overlay schován → active=false) uklidit kostky.
  useEffect(() => {
    if (active || !ready) return;
    const box = boxRef.current;
    if (box) {
      try {
        box.clearDice();
      } catch {
        /* ignore */
      }
    }
  }, [active, ready]);

  return (
    <div
      ref={hostRef}
      className={styles.host}
      style={{ display: active ? 'block' : 'none' }}
      aria-hidden
    />
  );
}
