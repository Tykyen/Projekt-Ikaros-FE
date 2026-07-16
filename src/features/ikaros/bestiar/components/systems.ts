/**
 * 16.2b-2 — nabídka herních systémů pro tvorbu community bytosti / návrh statů.
 *
 * 19.3b — zdroj pravdy přesunut do `shared/rpg/systems.ts` (`PLATFORM_SYSTEMS`),
 * aby nábory nevyrobily třetí kopii nabídky. Tady zůstává jen re-export pod
 * původními jmény; chování beze změny.
 */
export {
  PLATFORM_SYSTEMS as BESTIE_SYSTEMS,
  systemLabel,
} from '@/shared/rpg/systems';
