import { useEffect, useRef, useState } from 'react';
import { slugify } from '../lib/slugify';

interface Result {
  slug: string;
  setSlug: (next: string) => void;
  /** True pokud user slug ručně editoval (auto-gen zamrzlý). */
  manuallyEdited: boolean;
  /** Reset auto-gen — používáme když user explicitly chce zase auto-update. */
  resetAutoGen: () => void;
}

/**
 * 7.2b — Auto-gen slug z title v new mode. Po ručním edit user-slug
 * zamrzne (nepřepisuje se z title změn).
 *
 * Edit mode (`isEdit=true`): slug se NIKDY neautoaktualizuje, jen ručně.
 */
export function useSlugAutoGen(title: string, isEdit: boolean, initialSlug = ''): Result {
  const [slug, setSlugInternal] = useState(initialSlug);
  const manuallyEditedRef = useRef(isEdit);
  const [manuallyEdited, setManuallyEdited] = useState(isEdit);

  // Sync z title pokud user ještě nepřepsal slug (jen new mode)
  useEffect(() => {
    if (isEdit) return;
    if (manuallyEditedRef.current) return;
    setSlugInternal(slugify(title));
  }, [title, isEdit]);

  // Init initial slug do internal (edit mode hydrate, initialSlug může dorazit async).
  // R19 adjustment-during-render (initialSlug je primitivní string).
  const [prevInitialSlug, setPrevInitialSlug] = useState(initialSlug);
  if (initialSlug !== prevInitialSlug) {
    setPrevInitialSlug(initialSlug);
    if (initialSlug && !slug) {
      setSlugInternal(initialSlug);
    }
  }

  return {
    slug,
    setSlug: (next: string) => {
      setSlugInternal(next);
      if (!manuallyEditedRef.current) {
        manuallyEditedRef.current = true;
        setManuallyEdited(true);
      }
    },
    manuallyEdited,
    resetAutoGen: () => {
      manuallyEditedRef.current = false;
      setManuallyEdited(false);
      setSlugInternal(slugify(title));
    },
  };
}
