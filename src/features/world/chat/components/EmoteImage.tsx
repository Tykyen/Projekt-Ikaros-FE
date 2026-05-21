import { useEffect, useRef, useState } from 'react';

interface Props {
  src: string;
  alt: string;
  className?: string;
}

const TRANSPARENT_PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/**
 * D-NEW-emote-gif-perf (2026-05-21) — Performance wrapper kolem `<img>` pro
 * custom emoty. Detekuje animované GIF a pauzuje je mimo viewport přes
 * IntersectionObserver — když emote vyjede ze scroll obrazu, src se nahradí
 * 1x1 transparent pixelem, browser zastaví GIF dekódování. Když znovu vstoupí,
 * src se vrátí.
 *
 * Pro statické emoty (PNG/JPG/WebP) IntersectionObserver nepoužíváme —
 * jen `loading="lazy"`. Cloudinary transformace `f_auto` může převést GIF
 * na WebP nebo MP4 (nepoznáme z URL), takže fallback heuristikou na
 * `.gif` suffix; pokud konverze proběhla, zbytečné Observer overhead, ale
 * žádný funkční problem (statické WebP/MP4 se prostě nezmění při swap).
 */
export function EmoteImage({ src, alt, className }: Props) {
  const isAnimated = /\.gif($|\?|#)/i.test(src);
  const ref = useRef<HTMLImageElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!isAnimated) return;
    if (!ref.current) return;
    if (typeof IntersectionObserver === 'undefined') return;
    const el = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: '100px' /* fade-in/out trochu mimo viewport */ },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isAnimated]);

  if (!isAnimated) {
    return <img src={src} alt={alt} className={className} loading="lazy" />;
  }

  return (
    <img
      ref={ref}
      src={visible ? src : TRANSPARENT_PIXEL}
      data-src={src}
      alt={alt}
      className={className}
      loading="lazy"
    />
  );
}
