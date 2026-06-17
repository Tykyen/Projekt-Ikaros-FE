import { useEffect, useRef } from 'react';
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
  const readyRef = useRef(false);
  // Drž nejnovější callbacky bez re-init efektu.
  const cbRef = useRef({ onComplete, onError });
  cbRef.current = { onComplete, onError };

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
      // Bílé, silnější světlo — výchozí krémové (0xefdfd5) + nízká intenzita
      // kalí barvy materiálu. Bílé světlo = živé pravé barvy.
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
        readyRef.current = true;
        // Průhledné pozadí scény — vidět má být jen kostka + stín.
        try {
          box.scene.background = null;
          // Ploché bílé ambientní světlo → rovnoměrně nasvítí všechny stěny a
          // zachová sytost barev materiálu (bodové světlo barvy desaturuje).
          box.scene.add(new THREE.AmbientLight(0xffffff, 1.4));
        } catch {
          /* defenzivní */
        }
        // Pokud byl hod zadán dřív, než engine doběhl init — spusť teď.
        if (active && notation) void box.roll(notation);
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
      readyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Nový hod při změně nonce.
  useEffect(() => {
    const box = boxRef.current;
    if (!box || !readyRef.current || !active || !notation) return;
    try {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce]);

  // Po dokončení hodu (overlay schován → active=false) uklidit kostky,
  // ať nezůstanou viset do dalšího hodu.
  useEffect(() => {
    if (active) return;
    const box = boxRef.current;
    if (box && readyRef.current) {
      try {
        box.clearDice();
      } catch {
        /* ignore */
      }
    }
  }, [active]);

  return (
    <div
      ref={hostRef}
      className={styles.host}
      style={{ display: active ? 'block' : 'none' }}
      aria-hidden
    />
  );
}
