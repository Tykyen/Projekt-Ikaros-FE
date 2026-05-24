import type {
  CharacterTabId,
  CharacterTabVisibility,
  WorldSettings,
} from '@/shared/types';
import { CHARACTER_TAB_IDS } from '@/shared/types';

const PC_TYPE = 'Postava hráče';
const NPC_TYPE = 'NPC';

/**
 * Side-task character-tab-visibility — vrátí Set viditelných tab IDs pro
 * daný typ stránky (PostavaHrace / NPC). `profil` se v Setu nedrží — je
 * vždy viditelný.
 *
 * Defaultní chování (chybějící nastavení, jiný Page.type, žádný klíč):
 * vrací všechny IDs = vše viditelné.
 */
export function getVisibleTabs(
  pageType: string,
  settings: WorldSettings | undefined | null,
): Set<CharacterTabId> {
  const map = settings?.characterTabVisibility;
  if (!map) return new Set(CHARACTER_TAB_IDS);

  let key: keyof CharacterTabVisibility | null = null;
  if (pageType === PC_TYPE) key = 'PostavaHrace';
  else if (pageType === NPC_TYPE) key = 'NPC';

  if (!key) return new Set(CHARACTER_TAB_IDS);

  const list = map[key];
  return new Set(list ?? CHARACTER_TAB_IDS);
}

/** True když list pokrývá všechny tab IDs (= výchozí stav „vše zapnuto"). */
export function isAllVisible(list: CharacterTabId[] | undefined): boolean {
  if (!list) return true;
  return CHARACTER_TAB_IDS.every((id) => list.includes(id));
}

/** Default snapshot pro UI reset i pro počáteční local state. */
export function defaultCharacterTabVisibility(): CharacterTabVisibility {
  return {
    PostavaHrace: [...CHARACTER_TAB_IDS],
    NPC: [...CHARACTER_TAB_IDS],
  };
}
