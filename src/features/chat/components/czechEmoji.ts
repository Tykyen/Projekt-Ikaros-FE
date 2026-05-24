/**
 * D-NEW-emoji-picker-czech — Lokální set ~120 nejčastěji používaných emoji
 * s českými klíčovými slovy pro fulltext search. Frimousse picker dál
 * funguje jako anglický fallback pro úplnou paletu.
 *
 * Search:
 *   - case-insensitive, NFD-stripped, contains-match na keywords
 *   - prefix match má vyšší prioritu (řadí výsledky)
 */
export interface CzechEmoji {
  /** Unicode glyph. */
  emoji: string;
  /** Slug pro deduplikaci. */
  id: string;
  /** Český název (display). */
  name: string;
  /** Klíčová slova pro search — vždy lowercase, bez diakritiky. */
  keywords: string[];
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

export const CZECH_EMOJI: CzechEmoji[] = [
  // Tváře — radost
  { id: 'grinning', emoji: '😀', name: 'usměv', keywords: ['usmev', 'smich', 'radost', 'stastny', 'happy'] },
  { id: 'joy', emoji: '😂', name: 'smích se slzami', keywords: ['smich', 'slzy', 'lol', 'haha', 'plac'] },
  { id: 'rofl', emoji: '🤣', name: 'leží smíchy', keywords: ['lezi', 'smich', 'rofl', 'lol'] },
  { id: 'wink', emoji: '😉', name: 'mrknutí', keywords: ['mrknuti', 'flirt', 'spiklenec'] },
  { id: 'smile-sweat', emoji: '😅', name: 'úsměv s potem', keywords: ['pot', 'rozpaky', 'usmev'] },
  { id: 'blush', emoji: '😊', name: 'červenající úsměv', keywords: ['cerve', 'usmev', 'stud', 'plachy'] },
  { id: 'innocent', emoji: '😇', name: 'svatouškovský', keywords: ['svaty', 'andel', 'nevin', 'aura'] },
  { id: 'love-eyes', emoji: '😍', name: 'oči srdíčka', keywords: ['srdce', 'laska', 'oci', 'zamilovany'] },
  { id: 'kiss', emoji: '😘', name: 'polibek', keywords: ['polibek', 'pusa', 'hubicka'] },
  { id: 'wow', emoji: '😲', name: 'údiv', keywords: ['udiv', 'sokovany', 'preknapeni'] },
  { id: 'sunglasses', emoji: '😎', name: 'frajírek', keywords: ['frajirek', 'brejle', 'cool', 'styl'] },
  { id: 'star-struck', emoji: '🤩', name: 'hvězdné oči', keywords: ['hvezda', 'wow', 'obdiv'] },

  // Tváře — smutek/zlost
  { id: 'cry', emoji: '😢', name: 'pláč', keywords: ['plac', 'slza', 'smutny'] },
  { id: 'sob', emoji: '😭', name: 'usedavý pláč', keywords: ['plac', 'usedavy', 'silne', 'wow'] },
  { id: 'angry', emoji: '😠', name: 'naštvaný', keywords: ['nastvany', 'zly', 'zlost'] },
  { id: 'rage', emoji: '😡', name: 'vztek', keywords: ['vztek', 'zurivost', 'ruda'] },
  { id: 'thinking', emoji: '🤔', name: 'přemýšlí', keywords: ['premysli', 'hmm', 'pochyby'] },
  { id: 'unamused', emoji: '😒', name: 'znechucený', keywords: ['znechuceny', 'rolling-eyes', 'nuda'] },
  { id: 'sleepy', emoji: '😴', name: 'spí', keywords: ['spi', 'spanek', 'unava'] },
  { id: 'sick', emoji: '🤢', name: 'nevolnost', keywords: ['nevolnost', 'bleju', 'znechuceny'] },
  { id: 'dizzy', emoji: '😵', name: 'omráčený', keywords: ['omraceny', 'zavrat', 'mdloba'] },
  { id: 'skull', emoji: '💀', name: 'lebka', keywords: ['lebka', 'smrt', 'mrtve'] },

  // Gesta
  { id: 'thumbs-up', emoji: '👍', name: 'palec nahoru', keywords: ['palec', 'nahoru', 'ok', 'souhlas', 'super'] },
  { id: 'thumbs-down', emoji: '👎', name: 'palec dolů', keywords: ['palec', 'dolu', 'ne', 'nesouhlas'] },
  { id: 'clap', emoji: '👏', name: 'tlesk', keywords: ['tlesk', 'potlesk', 'bravo'] },
  { id: 'pray', emoji: '🙏', name: 'modlitba', keywords: ['modlitba', 'diky', 'prosim'] },
  { id: 'wave', emoji: '👋', name: 'mávání', keywords: ['mavani', 'pozdrav', 'ahoj'] },
  { id: 'ok-hand', emoji: '👌', name: 'OK', keywords: ['ok', 'jasne', 'super'] },
  { id: 'victory', emoji: '✌️', name: 'mír', keywords: ['mir', 'vitezstvi', 'v'] },
  { id: 'fist', emoji: '👊', name: 'pěst', keywords: ['pest', 'box', 'sila'] },
  { id: 'muscle', emoji: '💪', name: 'biceps', keywords: ['biceps', 'sila', 'sval'] },
  { id: 'point-up', emoji: '☝️', name: 'ukazovák nahoru', keywords: ['ukazovak', 'jednicka', 'pozor'] },

  // Srdce + láska
  { id: 'red-heart', emoji: '❤️', name: 'srdce', keywords: ['srdce', 'laska', 'cervene'] },
  { id: 'orange-heart', emoji: '🧡', name: 'oranžové srdce', keywords: ['srdce', 'oranzove'] },
  { id: 'yellow-heart', emoji: '💛', name: 'žluté srdce', keywords: ['srdce', 'zlute', 'pratelstvi'] },
  { id: 'green-heart', emoji: '💚', name: 'zelené srdce', keywords: ['srdce', 'zelene'] },
  { id: 'blue-heart', emoji: '💙', name: 'modré srdce', keywords: ['srdce', 'modre'] },
  { id: 'purple-heart', emoji: '💜', name: 'fialové srdce', keywords: ['srdce', 'fialove'] },
  { id: 'black-heart', emoji: '🖤', name: 'černé srdce', keywords: ['srdce', 'cerne'] },
  { id: 'broken-heart', emoji: '💔', name: 'zlomené srdce', keywords: ['srdce', 'zlomene', 'smutek'] },
  { id: 'sparkling-heart', emoji: '💖', name: 'srdce s jiskrami', keywords: ['srdce', 'jiskry', 'laska'] },
  { id: 'two-hearts', emoji: '💕', name: 'dvě srdce', keywords: ['srdce', 'dve', 'laska'] },

  // Symboly
  { id: 'fire', emoji: '🔥', name: 'oheň', keywords: ['ohen', 'plamen', 'horak', 'cool'] },
  { id: 'sparkles', emoji: '✨', name: 'třpyt', keywords: ['trpyt', 'jiskry', 'magie', 'cista'] },
  { id: 'star', emoji: '⭐', name: 'hvězda', keywords: ['hvezda', 'oblibene', 'top'] },
  { id: 'star-glow', emoji: '🌟', name: 'zářící hvězda', keywords: ['hvezda', 'zaroceni'] },
  { id: 'rocket', emoji: '🚀', name: 'raketa', keywords: ['raketa', 'vesmir', 'rychlost', 'launch'] },
  { id: 'tada', emoji: '🎉', name: 'oslava', keywords: ['oslava', 'tada', 'party', 'gratulace'] },
  { id: 'confetti', emoji: '🎊', name: 'konfety', keywords: ['konfety', 'oslava', 'party'] },
  { id: 'check', emoji: '✅', name: 'fajfka', keywords: ['fajfka', 'ok', 'hotovo', 'checked'] },
  { id: 'cross', emoji: '❌', name: 'křížek', keywords: ['krizek', 'ne', 'spatne', 'cross'] },
  { id: 'warning', emoji: '⚠️', name: 'varování', keywords: ['varovani', 'pozor', 'warning'] },
  { id: 'question', emoji: '❓', name: 'otazník', keywords: ['otaznik', 'otazka'] },
  { id: 'exclaim', emoji: '❗', name: 'vykřičník', keywords: ['vykricnik', 'pozor'] },
  { id: 'bulb', emoji: '💡', name: 'nápad', keywords: ['napad', 'zarovka', 'idea'] },
  { id: 'lightning', emoji: '⚡', name: 'blesk', keywords: ['blesk', 'energie', 'rychlost'] },
  { id: 'rainbow', emoji: '🌈', name: 'duha', keywords: ['duha', 'barvy', 'lgbt'] },
  { id: 'sun', emoji: '☀️', name: 'slunce', keywords: ['slunce', 'svetlo', 'tepl'] },
  { id: 'moon', emoji: '🌙', name: 'měsíc', keywords: ['mesic', 'noc', 'spanek'] },
  { id: 'snowflake', emoji: '❄️', name: 'sněhová vločka', keywords: ['vlocka', 'snih', 'mraz'] },

  // RPG/hra (Ikaros specific)
  { id: 'dice', emoji: '🎲', name: 'kostka', keywords: ['kostka', 'hraci', 'rpg', 'sance'] },
  { id: 'sword', emoji: '⚔️', name: 'meče', keywords: ['mec', 'boj', 'rpg', 'zbran'] },
  { id: 'shield', emoji: '🛡️', name: 'štít', keywords: ['stit', 'obrana', 'rpg'] },
  { id: 'crown', emoji: '👑', name: 'koruna', keywords: ['koruna', 'kral', 'rpg'] },
  { id: 'mage', emoji: '🧙', name: 'mág', keywords: ['mag', 'kouzelnik', 'rpg', 'wizard'] },
  { id: 'fairy', emoji: '🧚', name: 'víla', keywords: ['vila', 'rpg', 'fantasy'] },
  { id: 'vampire', emoji: '🧛', name: 'upír', keywords: ['upir', 'rpg', 'horror'] },
  { id: 'zombie', emoji: '🧟', name: 'zombie', keywords: ['zombie', 'rpg', 'mrtve'] },
  { id: 'dragon', emoji: '🐉', name: 'drak', keywords: ['drak', 'rpg', 'fantasy'] },
  { id: 'ghost', emoji: '👻', name: 'duch', keywords: ['duch', 'strasidlo', 'horror'] },
  { id: 'devil', emoji: '😈', name: 'čert', keywords: ['cert', 'damon', 'palaci', 'zlobny'] },
  { id: 'alien', emoji: '👽', name: 'mimozemšťan', keywords: ['mimozemstan', 'alien', 'ufo'] },
  { id: 'robot', emoji: '🤖', name: 'robot', keywords: ['robot', 'ai', 'mechanicky'] },
  { id: 'gem', emoji: '💎', name: 'drahokam', keywords: ['drahokam', 'diamant', 'klenot'] },
  { id: 'gold-bag', emoji: '💰', name: 'měšec', keywords: ['mesec', 'penize', 'zlato'] },
  { id: 'coin', emoji: '🪙', name: 'mince', keywords: ['mince', 'penize', 'zlato'] },
  { id: 'key', emoji: '🔑', name: 'klíč', keywords: ['klic', 'zamknout', 'pristup'] },
  { id: 'scroll', emoji: '📜', name: 'svitek', keywords: ['svitek', 'rpg', 'lore'] },
  { id: 'crystal-ball', emoji: '🔮', name: 'krystalová koule', keywords: ['krystal', 'koule', 'mag', 'budoucnost'] },
  { id: 'potion', emoji: '🧪', name: 'lektvar', keywords: ['lektvar', 'chemie', 'rpg'] },
  { id: 'tornado', emoji: '🌪️', name: 'tornádo', keywords: ['tornado', 'vir', 'energie'] },

  // Příroda
  { id: 'tree', emoji: '🌳', name: 'strom', keywords: ['strom', 'priroda', 'les'] },
  { id: 'flower', emoji: '🌸', name: 'květ', keywords: ['kvet', 'sakura', 'jaro'] },
  { id: 'rose', emoji: '🌹', name: 'růže', keywords: ['ruze', 'kvet', 'laska'] },
  { id: 'cat', emoji: '🐱', name: 'kočka', keywords: ['kocka', 'zvire', 'mnau'] },
  { id: 'dog', emoji: '🐶', name: 'pes', keywords: ['pes', 'zvire', 'haf'] },
  { id: 'mouse', emoji: '🐭', name: 'myš', keywords: ['mys', 'zvire'] },
  { id: 'rabbit', emoji: '🐰', name: 'králík', keywords: ['kralik', 'zvire'] },
  { id: 'wolf', emoji: '🐺', name: 'vlk', keywords: ['vlk', 'zvire', 'predator'] },
  { id: 'fox', emoji: '🦊', name: 'liška', keywords: ['liska', 'zvire'] },
  { id: 'bear', emoji: '🐻', name: 'medvěd', keywords: ['medved', 'zvire'] },

  // Jídlo/pití
  { id: 'beer', emoji: '🍺', name: 'pivo', keywords: ['pivo', 'piti', 'hospoda', 'beer'] },
  { id: 'wine', emoji: '🍷', name: 'víno', keywords: ['vino', 'piti'] },
  { id: 'coffee', emoji: '☕', name: 'káva', keywords: ['kava', 'piti', 'rano'] },
  { id: 'pizza', emoji: '🍕', name: 'pizza', keywords: ['pizza', 'jidlo'] },
  { id: 'apple', emoji: '🍎', name: 'jablko', keywords: ['jablko', 'ovoce'] },
  { id: 'cake', emoji: '🎂', name: 'dort', keywords: ['dort', 'naroziny'] },

  // Obyčejné
  { id: 'speech-bubble', emoji: '💬', name: 'bublina', keywords: ['bublina', 'rec', 'chat'] },
  { id: 'speaker', emoji: '🔊', name: 'reproduktor', keywords: ['reproduktor', 'zvuk', 'hlas'] },
  { id: 'mute', emoji: '🔇', name: 'ticho', keywords: ['ticho', 'mute', 'umlcet'] },
  { id: 'bell', emoji: '🔔', name: 'zvonek', keywords: ['zvonek', 'notifikace', 'alert'] },
  { id: 'no-bell', emoji: '🔕', name: 'tichý zvonek', keywords: ['mute', 'tichy', 'zvonek'] },
  { id: 'eye', emoji: '👁️', name: 'oko', keywords: ['oko', 'videt'] },
  { id: 'eyes', emoji: '👀', name: 'oči', keywords: ['oci', 'koukam', 'sledovani'] },
];

/**
 * Vyhledá emoji podle českého fulltext query.
 * Prefix match má prioritu před contains match.
 */
export function searchCzechEmoji(query: string): CzechEmoji[] {
  if (!query.trim()) return [];
  const q = normalize(query);
  const prefixMatches: CzechEmoji[] = [];
  const containsMatches: CzechEmoji[] = [];
  for (const e of CZECH_EMOJI) {
    const nameNorm = normalize(e.name);
    if (nameNorm.startsWith(q) || e.keywords.some((k) => k.startsWith(q))) {
      prefixMatches.push(e);
      continue;
    }
    if (nameNorm.includes(q) || e.keywords.some((k) => k.includes(q))) {
      containsMatches.push(e);
    }
  }
  return [...prefixMatches, ...containsMatches];
}
