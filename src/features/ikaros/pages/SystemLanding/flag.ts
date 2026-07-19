/**
 * R3 25.8 — Ohraničení systémových slibů. Do rozhodnutí držitelů práv
 * (licence Dračí Doupě 1.6 / Dračí Doupě II / Jeskyně a Draci…) NEvystavujeme
 * veřejné landing stránky konkrétních systémů — veřejný slib bez licence.
 * Kód i obsah zůstává, skrývá se jen veřejný claim (spec-25.8).
 *
 * Samostatný tiny modul: router/nav importují JEN flag, ne datový registr
 * `systemLandings.ts` (ten by jinak přitekl do main bundle → bundle budget).
 *
 * Zpětné zapnutí (po licencích, Etapa IV) = 3 kroky:
 *  1. tady `true`
 *  2. BE `modules/seo/seo.service.ts` — vrátit 4 STATIC_ROUTES záznamy
 *     `/ikaros/systemy*` (viz komentář tam)
 *  3. FE `default.conf.template` — odkomentovat prerender řádek
 *     `~^/ikaros/systemy(/[^/]+)?/?$`
 */
export const SYSTEM_LANDINGS_PUBLIC = false;
