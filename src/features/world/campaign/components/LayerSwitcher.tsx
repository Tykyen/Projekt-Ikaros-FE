import { playerLabel } from '../labels';
import type { CampaignPlayer } from '../types';
import s from './campaign.module.css';

/**
 * Přepínač vrstev (jen PJ+). „Moje vrstva" = editovatelná; hráč = read-only
 * náhled jeho Pavučiny. Hráč sám tuto komponentu nevidí (CampaignView ji
 * renderuje jen pro PJ).
 */
export function LayerSwitcher({
  layer,
  onChange,
  players,
}: {
  layer: string;
  onChange: (layer: string) => void;
  players: CampaignPlayer[];
}) {
  return (
    <label className={s.layerSwitch}>
      <span className={s.layerLabel}>Vrstva</span>
      <select
        className={s.select}
        value={layer}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Přepnout vrstvu Pavučiny"
      >
        <option value="mine">Moje vrstva</option>
        {players.map((p) => (
          <option key={p.userId} value={p.userId}>
            {playerLabel(p.characterPath, p.userId)}
          </option>
        ))}
      </select>
    </label>
  );
}
