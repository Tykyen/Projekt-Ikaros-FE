import { toast } from 'sonner';
import type { World } from '@/shared/types';
import { Button } from '@/shared/ui';
import {
  useJoinWorld,
  useRequestAccess,
} from '@/features/world/api/useWorldJoin';
import s from './JoinCTA.module.css';

interface Props {
  world: World;
}

/**
 * Spec 2.4 — CTA blok pro non-membery. Varianty podle `accessMode`:
 *  - `public`  → „Vstoupit do světa" → useJoinWorld (membership Čtenář)
 *  - `open`    → „Požádat o vstup" → useRequestAccess (pending AR)
 *  - `private` → „Požádat o vstup" → useRequestAccess (pending AR)
 *  - `closed`  → bez tlačítka, info „Svět je uzavřený"
 */
export function JoinCTA({ world }: Props) {
  const join = useJoinWorld();
  const requestAccess = useRequestAccess();
  const isPending = join.isPending || requestAccess.isPending;

  if (world.accessMode === 'closed') {
    return (
      <div className={s.card}>
        <h3 className={s.title}>Uzavřený svět</h3>
        <p className={s.description}>
          Svět je momentálně uzavřený. Nové vstupy nejsou povoleny.
        </p>
      </div>
    );
  }

  if (world.accessMode === 'public') {
    return (
      <div className={s.card}>
        <h3 className={s.title}>Otevřený svět</h3>
        <p className={s.description}>
          Vstupem se staneš <strong>čtenářem</strong> světa. Uvidíš stránky,
          mapu, diskuze a postavy. Hráčem se staneš později (vytvořením
          postavy nebo na pozvání PJ).
        </p>
        <Button
          variant="primary"
          size="lg"
          className={s.cta}
          loading={isPending}
          onClick={() =>
            join.mutate(world.id, {
              onSuccess: () => {
                toast.success(`Vstoupil jsi do světa ${world.name}.`);
              },
              onError: () => {
                toast.error('Vstup se nezdařil. Zkus to znovu.');
              },
            })
          }
        >
          Vstoupit do světa
        </Button>
      </div>
    );
  }

  // open / private
  const accessLabel =
    world.accessMode === 'open' ? 'Veřejný se schválením' : 'Soukromý svět';
  const description =
    world.accessMode === 'open'
      ? 'Tento svět vyžaduje souhlas PJ. Po odeslání žádosti počkej na rozhodnutí.'
      : 'Soukromý svět. Pokud jsi sem dostal odkaz, můžeš požádat o vstup. Rozhoduje PJ.';

  return (
    <div className={s.card}>
      <h3 className={s.title}>{accessLabel}</h3>
      <p className={s.description}>{description}</p>
      <Button
        variant="primary"
        size="lg"
        className={s.cta}
        loading={isPending}
        onClick={() =>
          requestAccess.mutate(world.id, {
            onSuccess: () => {
              toast.success('Žádost o vstup byla odeslána.');
            },
            onError: () => {
              toast.error('Žádost se nezdařila. Zkus to znovu.');
            },
          })
        }
      >
        Požádat o vstup
      </Button>
    </div>
  );
}
