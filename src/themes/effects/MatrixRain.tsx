import { useEffect, useRef } from 'react';
import s from './MatrixRain.module.css';

/**
 * Krok 5.7a — fialový „Matrix rain" efekt skinu `ikaros`.
 *
 * `<canvas>` vrstva nad pozadím a pod obsahem. Padající katakana glyphy,
 * hustší u krajů / slabší uprostřed (čitelnost obsahu). Trail mizí přes
 * `destination-out`, takže canvas zůstává průhledný a synthwave pozadí
 * prosvítá. Respektuje `prefers-reduced-motion`, pauzuje při skrytém tabu.
 */

/** Katakana (U+30A0–U+30FF) + číslice — glyphy padajícího kódu. */
const GLYPHS = (() => {
  let g = '0123456789';
  for (let c = 0x30a0; c <= 0x30ff; c++) g += String.fromCharCode(c);
  return g;
})();

const FONT_SIZE = 16;
const FRAME_MS = 1000 / 24;

export function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduce =
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
    if (reduce) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let columns: number[] = [];
    let raf = 0;
    let lastTime = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${FONT_SIZE}px "Courier New", monospace`;
      const count = Math.ceil(width / FONT_SIZE);
      columns = Array.from({ length: count }, () => Math.random() * -height);
    };
    resize();

    // Hustší u krajů, slabší uprostřed — alpha podle vzdálenosti od středu.
    const columnAlpha = (x: number) => {
      const dist = Math.abs(x - width / 2) / (width / 2);
      return 0.22 + dist * 0.7;
    };

    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (t - lastTime < FRAME_MS) return;
      lastTime = t;

      // Trail fade — ubírá alfa, canvas zůstává průhledný (pozadí prosvítá).
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'source-over';

      for (let i = 0; i < columns.length; i++) {
        const x = i * FONT_SIZE;
        const y = columns[i];
        const a = columnAlpha(x);
        const glyph = GLYPHS[(Math.random() * GLYPHS.length) | 0];
        // Čelní glyph — ledová jiskra; ocas — neon fialová.
        ctx.fillStyle = `rgba(216, 204, 255, ${a})`;
        ctx.fillText(glyph, x, y);
        ctx.fillStyle = `rgba(169, 108, 255, ${a * 0.65})`;
        ctx.fillText(glyph, x, y - FONT_SIZE);
        columns[i] =
          y > height + Math.random() * 360 ? 0 : y + FONT_SIZE;
      }
    };
    raf = requestAnimationFrame(draw);

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) {
        lastTime = 0;
        raf = requestAnimationFrame(draw);
      }
    };
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className={s.canvas} aria-hidden="true" />;
}
