import type { PageEditorFormState } from './usePageEditorState';
import type { PageType } from '../../api/pages.types';

/**
 * 7.2i — Detekuje data, která se po přepnutí `type` přestanou zobrazovat
 * ve vieweru (i když zůstanou v BE). Vrací uživatelsky čitelné labely
 * jako podklad pro `TypeSwitchWarningModal`.
 *
 * Strategie:
 *  • Galerie type → galleryImages se ne-renderuje ve většině jiných typů
 *    (jen typ Galerie má grid)
 *  • Obrazovka type → videos se ne-renderuje jinde
 *  • Seznam type → menu se ne-renderuje jinde
 *  • Noviny type → customData (Stát/Vydavatel/Datum) se ne-renderuje jinde
 *
 * Pozn.: data zůstávají v BE (jen neviditelná), takže přepnutí zpátky je
 * lossless. Warning je informativní, ne blokující.
 */
export interface LostDataDescriptor {
  feature: string;
  count?: number;
}

export function detectLostData(
  currentType: PageType,
  nextType: PageType,
  state: PageEditorFormState,
): LostDataDescriptor[] {
  if (currentType === nextType) return [];
  const lost: LostDataDescriptor[] = [];

  const galleryWillRender = nextType === 'Galerie';
  const videosWillRender = nextType === 'Obrazovka';
  const menuWillRender = nextType === 'Seznam';
  const customDataNewsWillRender = nextType === 'Noviny';

  if (!galleryWillRender && state.galleryImages.length > 0) {
    lost.push({
      feature: 'obrázky v galerii',
      count: state.galleryImages.length,
    });
  }
  if (!videosWillRender && state.videos.length > 0) {
    lost.push({ feature: 'videa', count: state.videos.length });
  }
  if (!menuWillRender && state.menu.length > 0) {
    lost.push({ feature: 'položky v menu', count: state.menu.length });
  }
  if (!customDataNewsWillRender) {
    const newsKeys = ['Stát', 'Vydavatel', 'Datum'].filter(
      (k) => state.customData[k],
    );
    if (newsKeys.length > 0 && currentType === 'Noviny') {
      lost.push({
        feature: `novinová metadata (${newsKeys.join(', ')})`,
      });
    }
  }
  // 17.7 — přepnutí z Rodokmenu skryje strom (data v BE zůstanou).
  if (nextType !== 'Rodokmen' && state.familyTree.people.length > 0) {
    lost.push({
      feature: 'osoby v rodokmenu',
      count: state.familyTree.people.length,
    });
  }

  return lost;
}
