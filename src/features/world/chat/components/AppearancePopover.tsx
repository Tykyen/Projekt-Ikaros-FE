import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { HexColorPicker } from 'react-colorful';
import { X, Undo2 } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { guardChatColor } from '@/features/chat/lib/chatColorGuard';
import {
  CHAT_FONTS,
  CHAT_FONT_SIZES,
  READABLE_FONTS,
  getFontStack,
  getFontSize,
  type ChatFontCategory,
} from '../lib/chatFonts';
import {
  useMembershipAppearance,
  useUpdateAppearance,
  appearanceKey,
  type MembershipAppearance,
  type UpdateAppearancePayload,
} from '../api/useMembershipAppearance';
import { useChatSkin } from '../skins/useChatSkin';
import { CHAT_SKINS } from '../skins/registry';
import s from './AppearancePopover.module.css';

/**
 * Krok 6.2f — popover „Vzhled mé zprávy v tomto světě".
 *
 * Per-svět color + font + velikost v `WorldMembership.chatColor/chatFont/chatFontSize`.
 * Reset (Undo2) uloží `null` → BE bere fallback z globálního profilu / system font / 1×.
 *
 * Náhled je živý — color/font/size pickery mění mock chat-bubble okamžitě, save
 * commitne do BE až tlačítkem „Uložit podpis".
 */

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

interface Props {
  worldId: string;
  surfaceColor: string;
  onClose: () => void;
  /**
   * Směr otevření na desktopu:
   *  - 'up' (default) — kotva dole (composer toolbar), popover nahoru.
   *  - 'down' — kotva nahoře (hlavička konverzace), popover dolů + vpravo.
   * Na mobilu je v obou případech spodní sheet (řeší CSS media query).
   */
  placement?: 'up' | 'down';
}

const PREVIEW_TEXT =
  'Tvá zpráva by vypadala takto. Jakou stopu chceš v tomto světě nechat?';

const CATEGORY_ORDER: readonly ChatFontCategory[] = [
  'Systémové',
  'Knižní a typografie',
  'Středověké a epické',
  'Rukopisy a poznámky',
  'Stroje a terminály',
  'Futuristické a cyber',
];

export function AppearancePopover({
  worldId,
  surfaceColor,
  onClose,
  placement = 'up',
}: Props) {
  const appearance = useMembershipAppearance(worldId);
  const update = useUpdateAppearance(worldId);
  const qc = useQueryClient();
  // 16.1d — skin chatu (motiv světa); přepíná instantně, mimo commit „podpisu".
  const chatSkin = useChatSkin(worldId);
  const rootRef = useRef<HTMLDivElement>(null);

  // 16.1f — „Jak čtu ostatní" (čtenářský font override). Instant, mimo commit
  // „podpisu" (stejně jako skin) → optimistický flip cache + PATCH; `onSuccess`
  // mutace přepíše autoritativními daty serveru.
  const readerOverride = appearance.data?.readerFontOverride ?? false;
  const readerFont = appearance.data?.readerFont ?? 'system';
  const readerSize = appearance.data?.readerFontSize ?? 'normal';
  function patchReader(partial: UpdateAppearancePayload) {
    qc.setQueryData<MembershipAppearance>(appearanceKey(worldId), (prev) =>
      prev ? { ...prev, ...partial } : prev,
    );
    update.mutate(partial);
  }

  // Lokální nepotvrzený stav (živý preview); na uložení se commit do BE.
  const [color, setColor] = useState<string | null>(null);
  const [font, setFont] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Seed lokálního stavu z odpovědi BE — jen jednou. R19 render-phase setState;
  // podmínka `!initialized` je self-limiting (po seedu už nespustí → žádná smyčka).
  if (!initialized && appearance.data) {
    setColor(appearance.data.chatColor ?? '#FFFFFF');
    setFont(appearance.data.chatFont ?? 'system');
    setFontSize(appearance.data.chatFontSize ?? 'normal');
    setInitialized(true);
  }

  // Outside click → close.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [onClose]);

  // Esc → close.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const validHex = !!color && HEX_RE.test(color);
  const guarded = useMemo(
    () => (validHex ? guardChatColor(color, surfaceColor) : undefined),
    [color, surfaceColor, validHex],
  );
  const contrastWarn =
    validHex && guarded !== color && guarded !== `var(--theme-text)`;

  // Grupování fontů podle kategorie.
  const fontsByCategory = useMemo(() => {
    const map = new Map<ChatFontCategory, typeof CHAT_FONTS>();
    for (const f of CHAT_FONTS) {
      const arr = map.get(f.category);
      if (arr) (arr as ChatFont[]).push(f);
      else map.set(f.category, [f] as never);
    }
    return map;
  }, []);
  type ChatFont = (typeof CHAT_FONTS)[number];

  function handleSave() {
    update.mutate(
      {
        chatColor: validHex ? color : null,
        chatFont: font,
        chatFontSize: fontSize,
      },
      {
        onSuccess: () => {
          toast.success('Vzhled mé zprávy uložen');
          onClose();
        },
        onError: () => {
          toast.error('Uložení vzhledu selhalo');
        },
      },
    );
  }

  function handleReset() {
    update.mutate(
      { chatColor: null, chatFont: null, chatFontSize: null },
      {
        onSuccess: () => {
          toast.success('Vzhled resetován na výchozí');
          onClose();
        },
      },
    );
  }

  function handleHexInput(raw: string) {
    let v = raw;
    if (!v.startsWith('#')) v = '#' + v.replace(/^#/, '');
    if (!/^#[0-9A-Fa-f]{0,6}$/.test(v)) return;
    setColor(v.toUpperCase());
  }

  const previewColor = validHex ? (guarded ?? color!) : 'inherit';
  const previewFont = font ? getFontStack(font) : getFontStack(null);
  const previewSize = fontSize ? getFontSize(fontSize) : undefined;

  return (
    <div
      ref={rootRef}
      className={clsx(s.popover, placement === 'down' && s.down)}
      role="dialog"
      aria-label="Vzhled mé zprávy v tomto světě"
    >
      <header className={s.head}>
        <span className={s.title}>Vzhled mé zprávy v tomto světě</span>
        <button
          type="button"
          className={s.close}
          onClick={onClose}
          aria-label="Zavřít"
        >
          <X size={16} />
        </button>
      </header>

      {/* 16.1d — Vzhled chatu (motiv světa). Default „Automaticky" dědí motiv
          PJ; volba zde ho přebije jen pro můj chat v tomto světě. Instant. */}
      <section className={s.section}>
        <h3 className={s.sectionTitle}>Vzhled chatu</h3>
        <div className={s.skinGrid}>
          <button
            type="button"
            className={clsx(
              s.skinBtn,
              s.skinAuto,
              !chatSkin.isExplicit && s.skinBtnActive,
            )}
            onClick={() => chatSkin.setSkin(null)}
            disabled={chatSkin.isPending}
          >
            <span className={s.skinEmoji}>🌍</span>
            <span className={s.skinLabel}>Automaticky (dle světa)</span>
          </button>
          {CHAT_SKINS.map((sk) => (
            <button
              key={sk.id}
              type="button"
              className={clsx(
                s.skinBtn,
                chatSkin.isExplicit &&
                  chatSkin.skin === sk.id &&
                  s.skinBtnActive,
              )}
              onClick={() => chatSkin.setSkin(sk.id)}
              disabled={chatSkin.isPending}
            >
              <span className={s.skinEmoji}>{sk.emoji}</span>
              <span className={s.skinLabel}>{sk.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Náhled */}
      <div className={s.previewWrap} aria-label="Náhled zprávy">
        <div className={s.previewMeta}>Tvé jméno · 14:32</div>
        <div
          className={s.previewMsg}
          style={{
            color: previewColor,
            fontFamily: previewFont,
            fontSize: previewSize,
          }}
        >
          {PREVIEW_TEXT}
        </div>
      </div>

      {/* Barva */}
      <section className={s.section}>
        <h3 className={s.sectionTitle}>Barva</h3>
        <HexColorPicker
          color={validHex ? color : '#FFFFFF'}
          onChange={(c) => setColor(c.toUpperCase())}
          className={s.picker}
        />
        <div className={s.hexRow}>
          <span
            className={s.swatch}
            style={{ backgroundColor: validHex ? color! : 'transparent' }}
            aria-hidden="true"
          />
          <input
            type="text"
            className={s.hex}
            value={color ?? ''}
            maxLength={7}
            onChange={(e) => handleHexInput(e.target.value)}
            aria-invalid={!validHex}
            placeholder="#RRGGBB"
          />
          <button
            type="button"
            className={s.miniReset}
            onClick={() => setColor('#FFFFFF')}
            title="Vrátit na bílou"
          >
            <Undo2 size={13} />
          </button>
        </div>
        {contrastWarn && (
          <p className={s.warn}>
            ⚠ Tato barva je málo čitelná na pozadí konverzace — bude lehce
            upravena pro kontrast.
          </p>
        )}
      </section>

      {/* Velikost písma */}
      <section className={s.section}>
        <h3 className={s.sectionTitle}>Velikost</h3>
        <div className={s.sizeRow} role="radiogroup" aria-label="Velikost písma">
          {CHAT_FONT_SIZES.map((sz) => {
            const checked = fontSize === sz.key;
            return (
              <label
                key={sz.key}
                className={checked ? `${s.sizeBtn} ${s.sizeBtnActive}` : s.sizeBtn}
                style={{ fontSize: sz.value }}
                title={sz.label}
              >
                <input
                  type="radio"
                  name="chat-font-size"
                  value={sz.key}
                  checked={checked}
                  onChange={() => setFontSize(sz.key)}
                  className={s.sizeRadio}
                />
                <span>Aa</span>
              </label>
            );
          })}
        </div>
        <div className={s.sizeLabel}>
          {CHAT_FONT_SIZES.find((sz) => sz.key === fontSize)?.label ??
            'Normální (1×)'}
        </div>
      </section>

      {/* Font — kategorizovaný */}
      <section className={s.section}>
        <h3 className={s.sectionTitle}>Písmo</h3>
        <div className={s.fontList} role="radiogroup" aria-label="Písmo zprávy">
          {CATEGORY_ORDER.map((cat) => {
            const fonts = fontsByCategory.get(cat);
            if (!fonts || fonts.length === 0) return null;
            return (
              <div key={cat} className={s.fontGroup}>
                <div className={s.fontGroupTitle}>{cat}</div>
                {fonts.map((f) => {
                  const checked = font === f.key;
                  return (
                    <label
                      key={f.key}
                      className={
                        checked
                          ? `${s.fontRow} ${s.fontRowActive}`
                          : s.fontRow
                      }
                    >
                      <input
                        type="radio"
                        name="chat-font"
                        value={f.key}
                        checked={checked}
                        onChange={() => setFont(f.key)}
                        className={s.fontRadio}
                      />
                      <span className={s.fontLabel}>{f.label}</span>
                      <span
                        className={s.fontSample}
                        style={{ fontFamily: f.stack }}
                      >
                        {f.sample}
                      </span>
                    </label>
                  );
                })}
              </div>
            );
          })}
        </div>
      </section>

      {/* 16.1f — Jak čtu ostatní (čtenářský font override). Instant, mimo
          „podpis". Týká se JEN toho, jak vidím zprávy já; ostatním se nic
          nemění. Rychlý přepínač je i v hlavičce konverzace (ikona brýlí). */}
      <section className={s.section}>
        <h3 className={s.sectionTitle}>Jak čtu ostatní</h3>
        <label className={s.readerToggle}>
          <input
            type="checkbox"
            checked={readerOverride}
            onChange={(e) =>
              patchReader({ readerFontOverride: e.target.checked })
            }
          />
          <span>Číst všechny zprávy svým písmem</span>
        </label>
        <p className={s.readerHint}>
          Cizí ozdobné písmo uvidíš ve svém čitelném písmu a velikosti. Ostatním
          se nic nezmění. Stejný přepínač najdeš v hlavičce konverzace (👓).
        </p>

        <div className={s.readerSubTitle}>Mé písmo pro čtení</div>
        <div className={s.fontList} role="radiogroup" aria-label="Písmo pro čtení">
          {READABLE_FONTS.map((f) => {
            const checked = readerFont === f.key;
            return (
              <label
                key={f.key}
                className={
                  checked ? `${s.fontRow} ${s.fontRowActive}` : s.fontRow
                }
              >
                <input
                  type="radio"
                  name="reader-font"
                  value={f.key}
                  checked={checked}
                  onChange={() => patchReader({ readerFont: f.key })}
                  className={s.fontRadio}
                />
                <span className={s.fontLabel}>{f.label}</span>
                <span
                  className={s.fontSample}
                  style={{ fontFamily: f.stack }}
                >
                  {f.sample}
                </span>
              </label>
            );
          })}
        </div>

        <div className={s.readerSubTitle}>Velikost pro čtení</div>
        <div
          className={s.sizeRow}
          role="radiogroup"
          aria-label="Velikost pro čtení"
        >
          {CHAT_FONT_SIZES.map((sz) => {
            const checked = readerSize === sz.key;
            return (
              <label
                key={sz.key}
                className={
                  checked ? `${s.sizeBtn} ${s.sizeBtnActive}` : s.sizeBtn
                }
                style={{ fontSize: sz.value }}
                title={sz.label}
              >
                <input
                  type="radio"
                  name="reader-font-size"
                  value={sz.key}
                  checked={checked}
                  onChange={() => patchReader({ readerFontSize: sz.key })}
                  className={s.sizeRadio}
                />
                <span>Aa</span>
              </label>
            );
          })}
        </div>
      </section>

      {/* Akce */}
      <footer className={s.foot}>
        <button
          type="button"
          className={s.reset}
          onClick={handleReset}
          disabled={update.isPending}
        >
          <Undo2 size={13} />
          <span>Použít výchozí</span>
        </button>
        <div className={s.footRight}>
          <button
            type="button"
            className={s.cancel}
            onClick={onClose}
            disabled={update.isPending}
          >
            Zrušit
          </button>
          <button
            type="button"
            className={s.saveBtn}
            onClick={handleSave}
            disabled={update.isPending || !validHex}
          >
            {update.isPending ? 'Ukládám…' : 'Uložit podpis'}
          </button>
        </div>
      </footer>
    </div>
  );
}
