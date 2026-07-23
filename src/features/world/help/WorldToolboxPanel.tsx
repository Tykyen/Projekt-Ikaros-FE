import { Link } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';
import { WorldRole } from '@/shared/types';
import { HelpAccordion, InfoCard, InfoGrid } from '@/shared/ui/help';
import { useWorldContext } from '../context/WorldContext';
import { toolboxItemsFor } from '@/shared/vypravec/registry/toolbox';
import s from './WorldHelp.module.css';

/**
 * Dashboard panel „Co máš po ruce" — role-aware rozcestník nástrojů světa.
 * PJ (PomocnyPJ+) vidí svoje i sdílené nástroje, hráč jen svou podmnožinu.
 */
export function WorldToolboxPanel() {
  const { worldSlug, userRole } = useWorldContext();
  const isPJ = userRole !== null && userRole >= WorldRole.PomocnyPJ;
  const items = toolboxItemsFor(isPJ);
  const title = isPJ ? 'Co máš jako PJ po ruce' : 'Co můžeš ve světě dělat';

  return (
    <HelpAccordion
      icon={<LayoutGrid size={20} />}
      title={title}
      accent={isPJ ? 'pj' : 'player'}
      defaultOpen
      persistKey={`ikaros:world-toolbox-open:${worldSlug}`}
    >
      <p className={s.intro}>
        Rychlý rozcestník nástrojů světa — klikni na dlaždici a skoč rovnou tam.
        Podrobný návod ke každému najdeš v{' '}
        <Link to="/ikaros/napoveda?sekce=svet" className={s.fullLink} target="_blank" rel="noreferrer">
          plné nápovědě
        </Link>
        .
      </p>
      <InfoGrid>
        {items.map((it) =>
          it.to ? (
            <Link key={it.key} to={`/svet/${worldSlug}/${it.to}`}>
              <InfoCard icon={it.icon} title={it.title} accent={it.accent} interactive>
                {it.desc}
              </InfoCard>
            </Link>
          ) : (
            <InfoCard key={it.key} icon={it.icon} title={it.title} accent={it.accent}>
              {it.desc}
            </InfoCard>
          ),
        )}
      </InfoGrid>
    </HelpAccordion>
  );
}
