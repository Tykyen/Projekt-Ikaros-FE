/* eslint-disable react-refresh/only-export-components -- kompatibilní re-export dat z registru (D-080a), žádná komponenta */
/**
 * D-080a (07-migrace-napovedy §3) — data přesunuta do registru Vypravěče
 * (`@/shared/vypravec/registry/toolbox`). Tento soubor zůstává jen jako
 * re-export pro zpětnou kompatibilitu importů (index.ts, ChatHelp,
 * TacticalMapHelp…). Nové kódy importují přímo z registru.
 */
export {
  TOOLBOX_ITEMS,
  toolboxItemsFor,
  type HelpAudience,
  type ToolboxItem,
} from '@/shared/vypravec/registry/toolbox';
