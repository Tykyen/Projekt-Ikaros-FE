/**
 * Výchozí barva chatu — bílá. Není to designový token, ale perzistovaná
 * uživatelská hodnota: ukládá se na BE jako `user.chatColor` a color picker
 * (`<HexColorPicker>`) potřebuje konkrétní hex, ne CSS proměnnou. Proto hex
 * literál + `lint-colors-ignore` (legitimní výjimka z lint:colors).
 */
export const DEFAULT_CHAT_COLOR = '#FFFFFF'; // lint-colors-ignore
