// Sada bloků nápovědy. Generické bloky byly povýšeny do @/shared/ui/help (13.6),
// aby je mohla použít i in-situ nápověda ve světě. ScreenshotSlot/IllustrationSlot
// a PermissionTable zůstávají zde (vázané na registr obrázků media.ts / matici .matrix*).
export {
  HelpAccordion,
  HelpSubAccordion,
  InfoCard,
  InfoGrid,
  TagChip,
  TermGrid,
  CalloutBox,
  StepList,
  type TagKind,
  type TermItem,
  type CalloutVariant,
  type HelpAccent,
} from '@/shared/ui/help';
export {
  PermissionTable,
  type PermissionColumn,
  type PermissionRow,
} from './PermissionTable';
export { ScreenshotSlot } from './ScreenshotSlot';
export { IllustrationSlot } from './IllustrationSlot';
