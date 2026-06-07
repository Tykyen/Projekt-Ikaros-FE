import {
  MAGIC_TRADITIONS,
  MAGIC_TRADITION_DESCRIPTIONS,
} from '../constants/magicTraditions';
import { PillChips } from './PillChips';
import { SectionCard } from './SectionCard';
import s from './sections.module.css';

interface Props {
  traditions: string[];
  onChange: (v: string[]) => void;
}

/**
 * 2.3e — výběr tradic (typů) magie světa. Zatržené tradice se při založení
 * vypíšou na stránku Magický systém, kde je PJ dál upravuje. Po založení se
 * nenastavuje v Nastavení světa.
 */
export function MagicSection({ traditions, onChange }: Props) {
  return (
    <SectionCard
      index={7}
      title="Magie"
      description="Jaké typy magie se ve světě vyskytují. Zatrhni tradice — vypíšou se na stránku Magický systém, kde je doladíš. Tady se nastavuje jen při tvorbě."
    >
      <div className={s.field}>
        <PillChips
          options={MAGIC_TRADITIONS}
          value={traditions}
          onChange={onChange}
          ariaLabel="Tradice magie"
          descriptions={MAGIC_TRADITION_DESCRIPTIONS}
        />
      </div>
    </SectionCard>
  );
}
