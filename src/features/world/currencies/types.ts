/**
 * Krok 11.4 — Měny a převodník (FE types).
 *
 * Sjednoceno s BE `world-currencies` modulem
 * (`backend/src/modules/world-currencies/interfaces/world-currencies.interface.ts`,
 *  `dto/update-world-currencies.dto.ts`, `dto/convert-currency.dto.ts`).
 *
 * Pravidlo: první item v `items` je BÁZE (rate = 1.0). FE to vynucuje
 * v UI; BE rate validuje jen jako `>= 0.0001`.
 */

export interface WorldCurrencyItem {
  /** UUID — BE generuje při PUT pokud chybí. */
  id?: string;
  /** Krátký kód, A-Z 0-9, 1–8 znaků, unique v rámci světa. */
  code: string;
  /** Lidský název, max 40 znaků. */
  name: string;
  /** Symbol (volitelný), max 8 znaků. Fallback v UI = `code`. */
  symbol: string;
  /** Kurz relativně k základní měně (= 1.0). BE vyžaduje `>= 0.0001`. */
  rate: number;
}

export interface WorldCurrenciesPayload {
  /** Vždy vrácený BE shape; FE může mít `items: []` pro nezaplněný svět. */
  id?: string;
  worldId: string;
  items: WorldCurrencyItem[];
  updatedAt?: string | Date;
}

/** Body pro `PUT /worlds/:worldId/currencies` — BE přepisuje celý array. */
export interface UpdateCurrenciesPayload {
  items: WorldCurrencyItem[];
  /**
   * Optimistic lock (D-NEW-INV-DATA-SYNC) — `updatedAt` z posledního GET.
   * Při souběžné změně vrátí BE 409 `CURRENCY_CONFLICT`. Hook
   * `useUpdateCurrencies` doplňuje automaticky z cache; ručně netřeba.
   */
  expectedUpdatedAt?: string;
}

/** Body pro `POST /worlds/:worldId/currencies/convert`. */
export interface ConvertCurrencyRequest {
  amount: number;
  from: string;
  to: string;
}

export interface ConvertCurrencyResult {
  amount: number;
  from: string;
  to: string;
  result: number;
}
