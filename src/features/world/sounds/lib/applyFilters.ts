/**
 * 13.3 — Client-side filtrace zvuků (search + 7 metadat dimenzí).
 */
import type { Sound } from '../types';
import type { SoundFilters } from '../components/SoundFiltersBar';

export function applyFilters(list: Sound[], f: SoundFilters): Sound[] {
  const q = f.search.trim().toLowerCase();
  return list.filter((s) => {
    if (q) {
      const hay = `${s.name} ${s.notes} ${s.tags.join(' ')}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.mediaType && s.mediaType !== f.mediaType) return false;
    if (f.environment && s.environment !== f.environment) return false;
    if (f.emotionalTone && s.emotionalTone !== f.emotionalTone) return false;
    if (f.factionStyle && s.factionStyle !== f.factionStyle) return false;
    if (f.techLevel && s.techLevel !== f.techLevel) return false;
    if (f.magicLevel && s.magicLevel !== f.magicLevel) return false;
    if (f.intensity > 0 && s.intensity < f.intensity) return false;
    return true;
  });
}

/** True když je aktivní aspoň jeden metadatový filtr (mimo search). */
export function hasActiveFilters(f: SoundFilters): boolean {
  return Boolean(
    f.mediaType ||
      f.environment ||
      f.emotionalTone ||
      f.factionStyle ||
      f.techLevel ||
      f.magicLevel ||
      f.intensity > 0,
  );
}
