/**
 * 10.2d-prep-A C5 — formula evaluator (mini-parser).
 *
 * Bezpečný expression engine pro computed fields v SchemaField.formula.
 * NO eval, NO Function constructor — vlastní lexer + parser (~200 LOC).
 *
 * Grammar:
 *   expr   := term (('+' | '-') term)*
 *   term   := factor (('*' | '/') factor)*
 *   factor := number | identifier ('.' identifier)* | '(' expr ')' | func
 *   func   := name '(' args ')'
 *   args   := expr (',' expr)*
 *   name   := 'min' | 'max' | 'floor' | 'ceil' | 'abs' | 'round'
 *
 * Context: flat dot-path object (`{ 'health.max': 10, injury: 3 }`).
 * Identifier `health.max` → context['health.max']; non-existent → 0.
 *
 * Spec: docs/arch/phase-10/spec-10.2d-prep-A.md §3.3.
 * Plán: docs/arch/phase-10/plan-10.2d-prep-A.md C5.
 */

type Token =
  | { type: 'num'; value: number }
  | { type: 'ident'; value: string }
  | { type: 'op'; value: '+' | '-' | '*' | '/' }
  | { type: 'paren'; value: '(' | ')' }
  | { type: 'comma' };

const FUNCS: Record<string, (...args: number[]) => number> = {
  min: (...a) => Math.min(...a),
  max: (...a) => Math.max(...a),
  floor: (a) => Math.floor(a),
  ceil: (a) => Math.ceil(a),
  abs: (a) => Math.abs(a),
  round: (a) => Math.round(a),
};

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const c = input[i];
    if (c === ' ' || c === '\t' || c === '\n') {
      i++;
      continue;
    }
    if (c === '+' || c === '-' || c === '*' || c === '/') {
      tokens.push({ type: 'op', value: c });
      i++;
      continue;
    }
    if (c === '(' || c === ')') {
      tokens.push({ type: 'paren', value: c });
      i++;
      continue;
    }
    if (c === ',') {
      tokens.push({ type: 'comma' });
      i++;
      continue;
    }
    // Number
    if (/[0-9]/.test(c)) {
      let n = '';
      while (i < input.length && /[0-9.]/.test(input[i])) {
        n += input[i];
        i++;
      }
      const value = parseFloat(n);
      if (Number.isNaN(value)) throw new Error(`Invalid number: ${n}`);
      tokens.push({ type: 'num', value });
      continue;
    }
    // Identifier (může obsahovat tečky pro dot-path)
    if (/[a-zA-Z_]/.test(c)) {
      let ident = '';
      while (i < input.length && /[a-zA-Z0-9_.]/.test(input[i])) {
        ident += input[i];
        i++;
      }
      tokens.push({ type: 'ident', value: ident });
      continue;
    }
    throw new Error(`Unexpected character: ${c}`);
  }
  return tokens;
}

class Parser {
  private pos = 0;
  constructor(
    private readonly tokens: Token[],
    private readonly context: Record<string, unknown>,
  ) {}

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }
  private consume(): Token {
    const t = this.tokens[this.pos];
    if (!t) throw new Error('Unexpected end of formula');
    this.pos++;
    return t;
  }
  private expect(type: Token['type'], value?: string): Token {
    const t = this.consume();
    if (t.type !== type || (value !== undefined && (t as { value?: unknown }).value !== value)) {
      throw new Error(`Expected ${type}${value ? ` "${value}"` : ''}, got ${JSON.stringify(t)}`);
    }
    return t;
  }

  parseExpression(): number {
    let left = this.parseTerm();
    let next = this.peek();
    while (next && next.type === 'op' && (next.value === '+' || next.value === '-')) {
      const op = next.value;
      this.consume();
      const right = this.parseTerm();
      left = op === '+' ? left + right : left - right;
      next = this.peek();
    }
    return left;
  }

  parseTerm(): number {
    let left = this.parseFactor();
    let next = this.peek();
    while (next && next.type === 'op' && (next.value === '*' || next.value === '/')) {
      const op = next.value;
      this.consume();
      const right = this.parseFactor();
      left = op === '*' ? left * right : left / right;
      next = this.peek();
    }
    return left;
  }

  parseFactor(): number {
    const t = this.peek();
    if (!t) throw new Error('Unexpected end of formula');
    if (t.type === 'num') {
      this.consume();
      return t.value;
    }
    if (t.type === 'paren' && t.value === '(') {
      this.consume();
      const value = this.parseExpression();
      this.expect('paren', ')');
      return value;
    }
    if (t.type === 'op' && t.value === '-') {
      // Unary minus.
      this.consume();
      return -this.parseFactor();
    }
    if (t.type === 'ident') {
      const ident = t.value;
      this.consume();
      // Function call?
      const next = this.peek();
      if (next && next.type === 'paren' && next.value === '(') {
        this.consume();
        const args: number[] = [];
        const after = this.peek();
        if (!after || after.type !== 'paren' || after.value !== ')') {
          args.push(this.parseExpression());
          let sep = this.peek();
          while (sep && sep.type === 'comma') {
            this.consume();
            args.push(this.parseExpression());
            sep = this.peek();
          }
        }
        this.expect('paren', ')');
        const fn = FUNCS[ident];
        if (!fn) throw new Error(`Unknown function: ${ident}`);
        return fn(...args);
      }
      // Variable lookup. Flat dot-path: ctx['health.max'].
      const value = this.context[ident];
      if (typeof value === 'number') return value;
      if (typeof value === 'undefined') return 0;
      const coerced = Number(value);
      return Number.isNaN(coerced) ? 0 : coerced;
    }
    throw new Error(`Unexpected token: ${JSON.stringify(t)}`);
  }
}

/**
 * Vyhodnotí formula expression v dot-path context (flat object).
 * Při syntax error / unknown function → vrátí `null` + console.warn
 * (nikdy throw — UI fallback místo crash).
 */
export function evaluateFormula(
  formula: string,
  context: Record<string, unknown>,
): number | null {
  try {
    const tokens = tokenize(formula);
    const parser = new Parser(tokens, context);
    const result = parser.parseExpression();
    if (Number.isNaN(result) || !Number.isFinite(result)) return null;
    return result;
  } catch (err) {
    console.warn(
      `[formula] evaluation error for "${formula}":`,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}
