import { type ReactNode } from 'react';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { getDiaryPreset } from './registry';
import { useDiarySkin } from './skins/useDiarySkin';
// 16.2c-F3 — token sady (8 skinů) musí být v bundlu i mimo deníkovou stránku
// (chat rail, taktická mapa, dice). Statický import = globální CSS.
import './styles/diary-skins.css';

/**
 * 16.2c-F3 — Lehký obal, který do EMBEDŮ deníku (chat rail, map token panel,
 * dice readout/log) vlije DENÍKOVÝ SKIN viewera přes `data-diary-system` +
 * `data-diary-skin`. Combat/bestie/dice CSS moduly pak dědí `--mx-*` tokeny
 * skinu (mají `var(--mx-x, <sci-fi>)` fallback → regrese-safe i bez skinu).
 *
 * NA ROZDÍL od `DiarySystemProvider` NEloaduje preset list-layout (matrix.css)
 * — embedům stačí token sady (`diary-skins.css`); strukturní layout řeší
 * samotné moduly. Skin = volba viewera (`useDiarySkin`), ne roller-a.
 */
export function DiarySkinScope({
  worldId,
  className,
  style,
  children,
}: {
  worldId: string;
  className?: string;
  /**
   * Pro layout-citlivé obaly (dice overlay/log) předej `{ display: 'contents' }`
   * — wrapper pak negeneruje box, ale `data-*` atributy i dědičnost `--mx-*`
   * (a selektory `[data-diary-system] .x`) drží přes DOM strom dál.
   */
  style?: React.CSSProperties;
  children: ReactNode;
}): React.ReactElement {
  const { world } = useWorldContext();
  const preset = getDiaryPreset(world?.system);
  const { skin } = useDiarySkin(worldId);
  return (
    <div data-diary-system={preset.id} data-diary-skin={skin} className={className} style={style}>
      {children}
    </div>
  );
}
