// 13.1 — zrcadlí BE interface (backend/src/modules/search/interfaces).
// Žádné DTO drift: tvar 1:1 s `SearchResult` / `SearchProviderInfo`.

export interface SearchResult {
  id: string;
  title: string;
  slug: string;
  score: number;
  providerKey: string;
  providerName: string;
}

export interface SearchProviderInfo {
  key: string;
  displayName: string;
}

/** Default provider — BE `getProviders` vrací `combined` jako první. */
export const DEFAULT_PROVIDER_KEY = 'combined';
