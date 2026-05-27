/**
 * 10.2-prep-3 — public API map-systems registry.
 *
 * Konzumenti v 10.2 importují odtud:
 * ```ts
 * import { getMapSystemPlugin } from 'src/features/world/map-systems';
 * const plugin = getMapSystemPlugin(world.system);
 * <plugin.NpcEditModal ... />
 * ```
 */
export {
  getMapSystemPlugin,
  listMapSystems,
} from './registry';
export type {
  MapSystemPlugin,
  MapNpcEditModalProps,
  MapNpcStatBlockProps,
  MapRollResult,
  DieTypeId,
  SystemId,
} from './types';
