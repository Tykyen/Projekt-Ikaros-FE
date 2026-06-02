import { useReducer, useCallback } from 'react';
import type {
  AccessRequirement,
  AkjTab,
  GalleryImage,
  InstructionalVideo,
  MenuItem,
  Page,
  PageSection,
  PageTable,
  PageType,
} from '../../api/pages.types';

/**
 * 7.2 — Centralized form state. Zrcadlí Page entity bez derived polí
 * (id/worldId/slug/createdAt/updatedAt/plainText spravuje BE).
 *
 * `expectedUpdatedAt` se nese pro optimistic concurrency check (7.2k) —
 * BE PATCH ho porovná a vrátí 409 pokud došlo k mezitím update.
 */
export interface PageEditorFormState {
  title: string;
  type: PageType;
  content: string;
  imageUrl: string;
  bigImage: boolean;
  isWoodWide: boolean;
  order: number;
  sections: PageSection[];
  table: PageTable;
  galleryImages: GalleryImage[];
  videos: InstructionalVideo[];
  menu: MenuItem[];
  customData: Record<string, string>;
  accessRequirements: AccessRequirement[];
  /** 7.2k — token pro optimistic concurrency check; null v new mode. */
  expectedUpdatedAt: string | null;
  // 9.1 — pro typ PostavaHrace / NPC. Pro ostatní typy zůstávají prázdné.
  ownerUserId: string;
  /** AKJ chráněné záložky (spec-akj-protected-tabs). */
  akjTabs: AkjTab[];
}

export const INITIAL_PAGE_STATE: PageEditorFormState = {
  title: '',
  type: 'Ostatní',
  content: '',
  imageUrl: '',
  bigImage: false,
  isWoodWide: false,
  order: 0,
  sections: [],
  table: { hasTable: false, title: '', headers: [], values: [] },
  galleryImages: [],
  videos: [],
  menu: [],
  customData: {},
  accessRequirements: [],
  expectedUpdatedAt: null,
  ownerUserId: '',
  akjTabs: [],
};

export function pageToFormState(page: Page): PageEditorFormState {
  return {
    title: page.title,
    type: page.type,
    content: page.content,
    imageUrl: page.imageUrl ?? '',
    bigImage: page.bigImage ?? false,
    isWoodWide: page.isWoodWide,
    order: page.order,
    sections: page.sections,
    table: page.table ?? {
      hasTable: false,
      title: '',
      headers: [],
      values: [],
    },
    galleryImages: page.galleryImages,
    videos: page.videos,
    menu: page.menu,
    customData: page.customData ?? {},
    accessRequirements: page.accessRequirements,
    expectedUpdatedAt: page.updatedAt,
    ownerUserId: page.ownerUserId ?? '',
    akjTabs: page.akjTabs ?? [],
  };
}

type Action =
  | { type: 'SET_FIELD'; field: keyof PageEditorFormState; value: unknown }
  | { type: 'PATCH'; patch: Partial<PageEditorFormState> }
  | { type: 'RESET'; state: PageEditorFormState };

function reducer(
  state: PageEditorFormState,
  action: Action,
): PageEditorFormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'PATCH':
      return { ...state, ...action.patch };
    case 'RESET':
      return action.state;
  }
}

export function usePageEditorState(initial: PageEditorFormState = INITIAL_PAGE_STATE) {
  const [state, dispatch] = useReducer(reducer, initial);

  const setField = useCallback(
    <K extends keyof PageEditorFormState>(field: K, value: PageEditorFormState[K]) =>
      dispatch({ type: 'SET_FIELD', field, value }),
    [],
  );
  const patch = useCallback(
    (next: Partial<PageEditorFormState>) => dispatch({ type: 'PATCH', patch: next }),
    [],
  );
  const reset = useCallback(
    (next: PageEditorFormState) => dispatch({ type: 'RESET', state: next }),
    [],
  );

  return { state, setField, patch, reset };
}
