/**
 * Krok 6.2f — whitelist klíčů per-svět chat fontů.
 *
 * BE jen validuje klíč (`backend/src/modules/chat/constants/chat-fonts.ts`);
 * CSS font-family stack drží FE. Fonty jsou předloadovány v `index.html`
 * (Google Fonts, latin-ext subset, `font-display: swap`).
 *
 * Sada navazuje na starý Matrix (`Matrix/frontend/src/components/Chat/ChatArea.tsx`
 * font picker — Knihy / Rukopisy / Stroje) + rozšíření o žánrová písma pro
 * 12 ikarosských skinů.
 */

export type ChatFontCategory =
  | 'Systémové'
  | 'Knižní a typografie'
  | 'Středověké a epické'
  | 'Rukopisy a poznámky'
  | 'Stroje a terminály'
  | 'Futuristické a cyber';

export interface ChatFont {
  /** Klíč pro DB i API (`@IsIn` na BE). */
  key: string;
  /** Český label do UI. */
  label: string;
  /** CSS `font-family` stack — vždy s fallback rodinou. */
  stack: string;
  /** Krátká neutrální ukázka pro radio listu („Aaa Bbb Ccc"). */
  sample: string;
  /** Skupina v AppearancePopover. */
  category: ChatFontCategory;
}

export const CHAT_FONTS: readonly ChatFont[] = [
  // ── Systémové ────────────────────────────────────────────────────────
  {
    key: 'system',
    label: 'Systémový',
    stack:
      "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    sample: 'Aaa Bbb Ccc',
    category: 'Systémové',
  },
  {
    key: 'inter',
    label: 'Moderní (Inter)',
    stack: "'Inter Tight', system-ui, sans-serif",
    sample: 'Aaa Bbb Ccc',
    category: 'Systémové',
  },

  // ── Knižní a typografie ─────────────────────────────────────────────
  {
    key: 'cormorant',
    label: 'Knižní elegance (Cormorant)',
    stack: "'Cormorant Garamond', Garamond, serif",
    sample: 'Aaa Bbb Ccc',
    category: 'Knižní a typografie',
  },
  {
    key: 'lora',
    label: 'Literární (Lora)',
    stack: "'Lora', Georgia, serif",
    sample: 'Aaa Bbb Ccc',
    category: 'Knižní a typografie',
  },
  {
    key: 'playfair',
    label: 'Noviny (Playfair Display)',
    stack: "'Playfair Display', 'Times New Roman', serif",
    sample: 'Aaa Bbb Ccc',
    category: 'Knižní a typografie',
  },
  {
    key: 'crimson',
    label: 'Tradiční román (Crimson Text)',
    stack: "'Crimson Text', Georgia, serif",
    sample: 'Aaa Bbb Ccc',
    category: 'Knižní a typografie',
  },
  {
    key: 'spectral',
    label: 'Spektrální (Spectral)',
    stack: "'Spectral', Georgia, serif",
    sample: 'Aaa Bbb Ccc',
    category: 'Knižní a typografie',
  },
  {
    key: 'ebgaramond',
    label: 'Pergamen (EB Garamond)',
    stack: "'EB Garamond', Garamond, serif",
    sample: 'Aaa Bbb Ccc',
    category: 'Knižní a typografie',
  },
  {
    key: 'cardo',
    label: 'Renesanční (Cardo)',
    stack: "'Cardo', Garamond, serif",
    sample: 'Aaa Bbb Ccc',
    category: 'Knižní a typografie',
  },
  {
    key: 'eczar',
    label: 'Egyptský (Eczar)',
    stack: "'Eczar', Georgia, serif",
    sample: 'Aaa Bbb Ccc',
    category: 'Knižní a typografie',
  },

  // ── Středověké a epické ─────────────────────────────────────────────
  {
    key: 'cinzel',
    label: 'Epický (Cinzel)',
    stack: "'Cinzel', 'Trajan Pro', serif",
    sample: 'Aaa Bbb Ccc',
    category: 'Středověké a epické',
  },
  {
    key: 'cinzeldecorative',
    label: 'Epický s ornamenty (Cinzel Decorative)',
    stack: "'Cinzel Decorative', 'Cinzel', serif",
    sample: 'Aaa Bbb Ccc',
    category: 'Středověké a epické',
  },
  {
    key: 'medievalsharp',
    label: 'Středověký (MedievalSharp)',
    stack: "'MedievalSharp', 'Cinzel', serif",
    sample: 'Aaa Bbb Ccc',
    category: 'Středověké a epické',
  },
  {
    key: 'unifraktur',
    label: 'Blackletter (UnifrakturMaguntia)',
    stack: "'UnifrakturMaguntia', 'Cinzel', serif",
    sample: 'Aaa Bbb Ccc',
    category: 'Středověké a epické',
  },
  {
    key: 'newrocker',
    label: 'Dark fantasy (New Rocker)',
    stack: "'New Rocker', 'MedievalSharp', serif",
    sample: 'Aaa Bbb Ccc',
    category: 'Středověké a epické',
  },
  {
    key: 'pirata',
    label: 'Krčmářský (Pirata One)',
    stack: "'Pirata One', 'MedievalSharp', serif",
    sample: 'Aaa Bbb Ccc',
    category: 'Středověké a epické',
  },

  // ── Rukopisy a poznámky ─────────────────────────────────────────────
  {
    key: 'caveat',
    label: 'Rychlý rukopis (Caveat)',
    stack: "'Caveat', 'Comic Sans MS', cursive",
    sample: 'Aaa Bbb Ccc',
    category: 'Rukopisy a poznámky',
  },
  {
    key: 'greatvibes',
    label: 'Okrasné dopisy (Great Vibes)',
    stack: "'Great Vibes', 'Brush Script MT', cursive",
    sample: 'Aaa Bbb Ccc',
    category: 'Rukopisy a poznámky',
  },
  {
    key: 'tangerine',
    label: 'Jemný italský (Tangerine)',
    stack: "'Tangerine', 'Brush Script MT', cursive",
    sample: 'Aaa Bbb Ccc',
    category: 'Rukopisy a poznámky',
  },
  {
    key: 'italianno',
    label: 'Krev a inkoust (Italianno)',
    stack: "'Italianno', cursive",
    sample: 'Aaa Bbb Ccc',
    category: 'Rukopisy a poznámky',
  },
  {
    key: 'meaculpa',
    label: 'Éterický (Mea Culpa)',
    stack: "'Mea Culpa', cursive",
    sample: 'Aaa Bbb Ccc',
    category: 'Rukopisy a poznámky',
  },
  {
    key: 'pinyon',
    label: 'Copperplate (Pinyon Script)',
    stack: "'Pinyon Script', cursive",
    sample: 'Aaa Bbb Ccc',
    category: 'Rukopisy a poznámky',
  },
  {
    key: 'imperialscript',
    label: 'Imperiální (Imperial Script)',
    stack: "'Imperial Script', cursive",
    sample: 'Aaa Bbb Ccc',
    category: 'Rukopisy a poznámky',
  },
  {
    key: 'allura',
    label: 'Měkký script (Allura)',
    stack: "'Allura', cursive",
    sample: 'Aaa Bbb Ccc',
    category: 'Rukopisy a poznámky',
  },
  {
    key: 'sail',
    label: 'Latinský (Sail)',
    stack: "'Sail', cursive",
    sample: 'Aaa Bbb Ccc',
    category: 'Rukopisy a poznámky',
  },
  {
    key: 'macondo',
    label: 'Magický (Macondo)',
    stack: "'Macondo', cursive",
    sample: 'Aaa Bbb Ccc',
    category: 'Rukopisy a poznámky',
  },

  // ── Stroje a terminály ──────────────────────────────────────────────
  {
    key: 'mono',
    label: 'IBM Plex (IBM Plex Mono)',
    stack: "'IBM Plex Mono', 'Courier New', monospace",
    sample: 'Aaa Bbb Ccc',
    category: 'Stroje a terminály',
  },
  {
    key: 'jbmono',
    label: 'Kód (JetBrains Mono)',
    stack: "'JetBrains Mono', 'Consolas', monospace",
    sample: 'Aaa Bbb Ccc',
    category: 'Stroje a terminály',
  },
  {
    key: 'sharetech',
    label: 'CRT terminál (Share Tech Mono)',
    stack: "'Share Tech Mono', 'Courier New', monospace",
    sample: 'Aaa Bbb Ccc',
    category: 'Stroje a terminály',
  },
  {
    key: 'specialelite',
    label: 'Psací stroj (Special Elite)',
    stack: "'Special Elite', 'Courier New', monospace",
    sample: 'Aaa Bbb Ccc',
    category: 'Stroje a terminály',
  },

  // ── Futuristické a cyber ────────────────────────────────────────────
  {
    key: 'orbitron',
    label: 'Futuristický (Orbitron)',
    stack: "'Orbitron', 'Eurostile', sans-serif",
    sample: 'Aaa Bbb Ccc',
    category: 'Futuristické a cyber',
  },
  {
    key: 'audiowide',
    label: 'Neon arcade (Audiowide)',
    stack: "'Audiowide', 'Orbitron', sans-serif",
    sample: 'Aaa Bbb Ccc',
    category: 'Futuristické a cyber',
  },
  {
    key: 'rajdhani',
    label: 'Sci-fi (Rajdhani)',
    stack: "'Rajdhani', 'Orbitron', sans-serif",
    sample: 'Aaa Bbb Ccc',
    category: 'Futuristické a cyber',
  },
  {
    key: 'chakrapetch',
    label: 'Mecha (Chakra Petch)',
    stack: "'Chakra Petch', 'Rajdhani', sans-serif",
    sample: 'Aaa Bbb Ccc',
    category: 'Futuristické a cyber',
  },
  {
    key: 'blackops',
    label: 'Vojenský stencil (Black Ops One)',
    stack: "'Black Ops One', 'Impact', sans-serif",
    sample: 'Aaa Bbb Ccc',
    category: 'Futuristické a cyber',
  },
  {
    key: 'bigshoulders',
    label: 'Industriální stencil (Big Shoulders)',
    stack: "'Big Shoulders Stencil Display', 'Impact', sans-serif",
    sample: 'Aaa Bbb Ccc',
    category: 'Futuristické a cyber',
  },
  {
    key: 'bebas',
    label: 'Graffiti poster (Bebas Neue)',
    stack: "'Bebas Neue', 'Impact', sans-serif",
    sample: 'Aaa Bbb Ccc',
    category: 'Futuristické a cyber',
  },
  {
    key: 'wallpoet',
    label: 'Dystopický (Wallpoet)',
    stack: "'Wallpoet', 'Special Elite', monospace",
    sample: 'Aaa Bbb Ccc',
    category: 'Futuristické a cyber',
  },
] as const;

export const CHAT_FONT_KEYS = CHAT_FONTS.map((f) => f.key);

const STACK_BY_KEY = new Map(CHAT_FONTS.map((f) => [f.key, f.stack]));

/** CSS font-family stack pro klíč; null/neznámý → systémový fallback. */
export function getFontStack(key: string | null | undefined): string {
  if (!key) return CHAT_FONTS[0].stack;
  return STACK_BY_KEY.get(key) ?? CHAT_FONTS[0].stack;
}

/**
 * Krok 6.2f — velikost písma zpráv.
 *
 * Hodnoty se aplikují jako inline `font-size` na `.content` v `MessageItem`.
 * Whitelist je explicitní (nikoli volný `em`/`rem` text), aby BE mohl validovat.
 */
export interface ChatFontSize {
  key: string;
  label: string;
  /** Absolutní hodnota (CSS), např. „0.9rem". */
  value: string;
}

export const CHAT_FONT_SIZES: readonly ChatFontSize[] = [
  { key: 'xs',     label: 'Mini (0.8×)',       value: '0.8rem' },
  { key: 'sm',     label: 'Malé (0.9×)',       value: '0.9rem' },
  { key: 'normal', label: 'Normální (1×)',     value: '1rem' },
  { key: 'lg',     label: 'Větší (1.1×)',      value: '1.1rem' },
  { key: 'xl',     label: 'Velké (1.2×)',      value: '1.2rem' },
  { key: 'xxl',    label: 'Obrovské (1.5×)',   value: '1.5rem' },
] as const;

export const CHAT_FONT_SIZE_KEYS = CHAT_FONT_SIZES.map((s) => s.key);

const SIZE_BY_KEY = new Map(CHAT_FONT_SIZES.map((s) => [s.key, s.value]));

/** CSS hodnota pro klíč; null/neznámý → undefined (zdědí styl rodiče). */
export function getFontSize(key: string | null | undefined): string | undefined {
  if (!key) return undefined;
  return SIZE_BY_KEY.get(key);
}
