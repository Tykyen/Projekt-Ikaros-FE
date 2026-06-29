/**
 * 10.2c-edit-9h — registr per-systém kompaktních bojových panelů.
 *
 * Oddělený od `TokenSystemSheet` (komponenta), ať jde registr sdílet i mimo
 * mapu (světový chat 16.1 ho renderuje 1:1 jako mapa) bez fast-refresh
 * warningu „file only exports components".
 *
 * Panely čtou/zapisují deník přímo přes `token.characterSlug` (sceneId
 * nepoužit) — proto je lze renderovat i bez reálného tokenu/scény.
 */
import type { ComponentType } from 'react';
import type { SystemSheetProps } from '@/features/world/pages/CharacterDetailPage/diary-systems/types';
import type { MapToken } from '../../types';
import { MatrixCombatPanel } from './system-panels/MatrixCombatPanel';
import { PiCombatPanel } from './system-panels/PiCombatPanel';
import { DndCombatPanel } from './system-panels/DndCombatPanel';
import { JadCombatPanel } from './system-panels/JadCombatPanel';
import { CocCombatPanel } from './system-panels/CocCombatPanel';
import { Drd2CombatPanel } from './system-panels/Drd2CombatPanel';
import { Drd16CombatPanel } from './system-panels/Drd16CombatPanel';
import { DrdPlusCombatPanel } from './system-panels/DrdPlusCombatPanel';
import { FateCombatPanel } from './system-panels/FateCombatPanel';
import { GurpsCombatPanel } from './system-panels/GurpsCombatPanel';

export interface CombatPanelProps {
  token: MapToken;
  sceneId: string;
  worldId: string;
  canEdit: boolean;
  // Sdílený tvar s deníkovými sheety (`SystemSheetProps`), ať registry sedí
  // všem panelům (CoC používá d100, modifier volitelný).
  onRoll?: SystemSheetProps['onRoll'];
}

/** Per-system kompaktní combat panel registry. Klíč = `world.system`. */
export const COMBAT_PANELS: Record<string, ComponentType<CombatPanelProps>> = {
  matrix: MatrixCombatPanel,
  pi: PiCombatPanel,
  dnd5e: DndCombatPanel,
  jad: JadCombatPanel,
  coc: CocCombatPanel,
  drd2: Drd2CombatPanel,
  drd16: Drd16CombatPanel,
  drdplus: DrdPlusCombatPanel,
  fate: FateCombatPanel,
  gurps: GurpsCombatPanel,
};
