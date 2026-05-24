/**
 * D-DIARY-3 formula — safe parser pro computed diary blocks.
 *
 * Vstupní výraz může obsahovat:
 *   - čísla (10, 3.5)
 *   - identifikátory bloků (HP_current, level)
 *   - operátory +, -, *, /
 *   - závorky ( )
 *   - whitespace
 *
 * Žádný arbitrary JS eval. Vlastní recursive-descent parser → AST → eval.
 *
 * Použití:
 *   const result = evalFormula('HP_current / HP_max * 100', { HP_current: 60, HP_max: 100 });
 *   // → 60
 *
 * Pokud výraz není validní nebo proměnná chybí, vrátí `null`.
 */

type Token =
  | { type: 'num'; value: number }
  | { type: 'id'; value: string }
  | { type: 'op'; value: '+' | '-' | '*' | '/' }
  | { type: 'lp' }
  | { type: 'rp' };

function tokenize(expr: string): Token[] | null {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const c = expr[i];
    if (c === ' ' || c === '\t' || c === '\n') {
      i++;
      continue;
    }
    if (c === '(' || c === ')') {
      tokens.push(c === '(' ? { type: 'lp' } : { type: 'rp' });
      i++;
      continue;
    }
    if (c === '+' || c === '-' || c === '*' || c === '/') {
      tokens.push({ type: 'op', value: c });
      i++;
      continue;
    }
    if (/[0-9.]/.test(c)) {
      let num = '';
      while (i < expr.length && /[0-9.]/.test(expr[i])) {
        num += expr[i];
        i++;
      }
      const v = Number(num);
      if (Number.isNaN(v)) return null;
      tokens.push({ type: 'num', value: v });
      continue;
    }
    if (/[a-zA-Z_]/.test(c)) {
      let id = '';
      while (i < expr.length && /[a-zA-Z_0-9]/.test(expr[i])) {
        id += expr[i];
        i++;
      }
      tokens.push({ type: 'id', value: id });
      continue;
    }
    // Neznámý znak — bezpečný odmítnutí.
    return null;
  }
  return tokens;
}

interface ParserState {
  tokens: Token[];
  pos: number;
}

function peek(s: ParserState): Token | null {
  return s.tokens[s.pos] ?? null;
}
function consume(s: ParserState): Token | null {
  return s.tokens[s.pos++] ?? null;
}

/**
 * Grammar (precedence):
 *   expr   := term (('+'|'-') term)*
 *   term   := factor (('*'|'/') factor)*
 *   factor := num | id | '(' expr ')' | '-' factor
 */
function parseExpr(
  s: ParserState,
  vars: Record<string, number>,
): number | null {
  let lhs = parseTerm(s, vars);
  if (lhs === null) return null;
  while (true) {
    const t = peek(s);
    if (t?.type !== 'op' || (t.value !== '+' && t.value !== '-')) break;
    consume(s);
    const rhs = parseTerm(s, vars);
    if (rhs === null) return null;
    lhs = t.value === '+' ? lhs + rhs : lhs - rhs;
  }
  return lhs;
}

function parseTerm(
  s: ParserState,
  vars: Record<string, number>,
): number | null {
  let lhs = parseFactor(s, vars);
  if (lhs === null) return null;
  while (true) {
    const t = peek(s);
    if (t?.type !== 'op' || (t.value !== '*' && t.value !== '/')) break;
    consume(s);
    const rhs = parseFactor(s, vars);
    if (rhs === null) return null;
    if (t.value === '/' && rhs === 0) return null; // div by zero
    lhs = t.value === '*' ? lhs * rhs : lhs / rhs;
  }
  return lhs;
}

function parseFactor(
  s: ParserState,
  vars: Record<string, number>,
): number | null {
  const t = peek(s);
  if (!t) return null;
  if (t.type === 'op' && t.value === '-') {
    consume(s);
    const inner = parseFactor(s, vars);
    return inner === null ? null : -inner;
  }
  if (t.type === 'num') {
    consume(s);
    return t.value;
  }
  if (t.type === 'id') {
    consume(s);
    const v = vars[t.value];
    if (typeof v !== 'number' || Number.isNaN(v)) return null;
    return v;
  }
  if (t.type === 'lp') {
    consume(s);
    const inner = parseExpr(s, vars);
    if (inner === null) return null;
    const close = consume(s);
    if (close?.type !== 'rp') return null;
    return inner;
  }
  return null;
}

/**
 * Vyhodnotí výraz proti slovníku proměnných. Vrátí číslo, nebo null
 * při syntax/eval chybě.
 */
export function evalFormula(
  expr: string,
  vars: Record<string, number>,
): number | null {
  const tokens = tokenize(expr);
  if (!tokens || tokens.length === 0) return null;
  const state: ParserState = { tokens, pos: 0 };
  const result = parseExpr(state, vars);
  if (result === null) return null;
  if (state.pos !== tokens.length) return null; // unconsumed tokens = syntax error
  return result;
}
