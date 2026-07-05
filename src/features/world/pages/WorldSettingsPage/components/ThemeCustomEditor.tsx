import { NamedColorPalette } from '@/shared/ui';
import { getTheme } from '@/themes/registry';
import {
  THEME_TOKENS,
  parseColor,
  toCssColor,
  TOKEN_TEXT,
  TOKEN_SURFACE,
} from '../lib/themeTokens';
import { contrastRatio, AA_THRESHOLD } from '../lib/contrastGuard';
import s from './ThemeCustomEditor.module.css';

interface Props {
  themeId: string;
  overrides: Record<string, string>;
  onChange: (overrides: Record<string, string>) => void;
}

/**
 * 5.3f — editor barevných tokenů světa. Hodnota každého tokenu = override
 * nebo hodnota presetu. Kontrast guard hlídá čitelnost textu na panelu.
 */
export function ThemeCustomEditor({ themeId, overrides, onChange }: Props) {
  const preset = getTheme(themeId);

  function tokenValue(key: string): string {
    return overrides[key] ?? preset.vars[key] ?? '#888888'; // lint-colors-ignore
  }

  function setToken(key: string, css: string) {
    onChange({ ...overrides, [key]: css });
  }

  const textHex = parseColor(tokenValue(TOKEN_TEXT)).hex;
  const surfaceHex = parseColor(tokenValue(TOKEN_SURFACE)).hex;
  const ratio = contrastRatio(textHex, surfaceHex);
  const contrastOk = ratio >= AA_THRESHOLD;

  return (
    <div className={s.editor}>
      <div className={s.tokens}>
        {THEME_TOKENS.map((token) => {
          const { hex, alpha } = parseColor(tokenValue(token.key));
          return (
            <div key={token.key} className={s.rowWrap}>
              <div className={s.row}>
                <span className={s.label}>{token.label}</span>
                <input
                  type="color"
                  className={s.color}
                  value={hex}
                  aria-label={token.label}
                  onChange={(e) =>
                    setToken(
                      token.key,
                      toCssColor(e.target.value, alpha, token.kind),
                    )
                  }
                />
                {token.kind === 'alpha' && (
                  <input
                    type="range"
                    className={s.alpha}
                    min={0}
                    max={100}
                    value={Math.round(alpha * 100)}
                    aria-label={`${token.label} — průhlednost`}
                    onChange={(e) =>
                      setToken(
                        token.key,
                        toCssColor(hex, Number(e.target.value) / 100, token.kind),
                      )
                    }
                  />
                )}
              </div>
              <NamedColorPalette
                value={hex}
                onPick={(picked) =>
                  setToken(token.key, toCssColor(picked, alpha, token.kind))
                }
                label={`Pojmenované barvy — ${token.label}`}
              />
            </div>
          );
        })}
      </div>

      <p
        className={contrastOk ? s.contrastOk : s.contrastWarn}
        role="status"
      >
        {contrastOk
          ? `✓ Kontrast textu a panelu je dostatečný (${ratio.toFixed(1)}:1).`
          : `⚠ Text může být na panelu špatně čitelný (poměr ${ratio.toFixed(1)}:1, doporučeno ≥ 4.5:1).`}
      </p>
    </div>
  );
}
