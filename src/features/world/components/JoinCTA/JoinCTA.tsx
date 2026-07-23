import { useState } from 'react';
import { toast } from 'sonner';
import { useAtomValue, useSetAtom } from 'jotai';
import { useLocation } from 'react-router-dom';
import type { World } from '@/shared/types';
import { Button } from '@/shared/ui';
import {
  useJoinWorld,
  useRequestAccess,
} from '@/features/world/api/useWorldJoin';
import {
  currentUserAtom,
  openLoginModalAtom,
} from '@/shared/store/authStore';
import { saveLoginIntent } from '@/shared/lib/loginIntent';
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
  // 15.10 fáze C — „Chci hrát": mini-formulář návrhu postavy k žádosti.
  const [charMode, setCharMode] = useState(false);
  const [charName, setCharName] = useState('');
  const [charNote, setCharNote] = useState('');
  // D-063 — anon vidí public/open svět, ale akce (vstup/žádost) vyžadují login.
  const currentUser = useAtomValue(currentUserAtom);
  const openLogin = useSetAtom(openLoginModalAtom);
  const location = useLocation();
  const isAnon = !currentUser;

  const promptLogin = () => {
    saveLoginIntent(location.pathname + location.search);
    // openLoginModalAtom je write-only akce (žádné argumenty) — zavře ostatní modaly + otevře login.
    openLogin();
  };

  if (world.accessMode === 'closed') {
    return (
      <div className={s.card} data-elev="panel">
        <h3 className={s.title}>Uzavřený svět</h3>
        <p className={s.description}>
          Svět je momentálně uzavřený. Nové vstupy nejsou povoleny.
        </p>
      </div>
    );
  }

  if (world.accessMode === 'public') {
    return (
      <div className={s.card} data-elev="panel">
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
          onClick={() => {
            if (isAnon) {
              promptLogin();
              return;
            }
            join.mutate({ worldId: world.id, worldSlug: world.slug }, {
              onSuccess: () => {
                toast.success(`Vstoupil jsi do světa ${world.name}.`);
              },
              onError: () => {
                toast.error('Vstup se nezdařil. Zkus to znovu.');
              },
            });
          }}
        >
          {isAnon ? 'Přihlásit se a vstoupit' : 'Vstoupit do světa'}
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

  const submitReadOnly = () => {
    if (isAnon) {
      promptLogin();
      return;
    }
    requestAccess.mutate(
      { worldId: world.id, worldSlug: world.slug },
      {
        onSuccess: () => toast.success('Žádost o vstup byla odeslána.'),
        onError: () => toast.error('Žádost se nezdařila. Zkus to znovu.'),
      },
    );
  };

  return (
    <div className={s.card} data-elev="panel" data-vypravec="dashboard-join">
      <h3 className={s.title}>{accessLabel}</h3>
      <p className={s.description}>{description}</p>

      {!charMode ? (
        <div className={s.actions}>
          <Button
            variant="primary"
            size="lg"
            className={s.cta}
            disabled={isPending}
            onClick={() => {
              if (isAnon) {
                promptLogin();
                return;
              }
              setCharMode(true);
            }}
          >
            {isAnon ? 'Přihlásit se a hrát' : 'Chci hrát (vytvořit postavu)'}
          </Button>
          <Button
            variant="ghost"
            size="md"
            loading={isPending}
            onClick={submitReadOnly}
          >
            Jen číst (bez postavy)
          </Button>
        </div>
      ) : (
        <form
          className={s.form}
          onSubmit={(e) => {
            e.preventDefault();
            const name = charName.trim();
            if (!name) return;
            requestAccess.mutate(
              {
                worldId: world.id,
                worldSlug: world.slug,
                characterDraft: { name, note: charNote.trim() || undefined },
              },
              {
                onSuccess: () => {
                  toast.success(
                    'Přihláška s postavou odeslána. Počkej na schválení PJ.',
                  );
                  setCharMode(false);
                  setCharName('');
                  setCharNote('');
                },
                onError: () =>
                  toast.error('Odeslání se nezdařilo. Zkus to znovu.'),
              },
            );
          }}
        >
          <label className={s.field}>
            <span className={s.fieldLabel}>Jméno postavy</span>
            <input
              className={s.input}
              value={charName}
              onChange={(e) => setCharName(e.target.value)}
              maxLength={120}
              placeholder="např. Vlkodav z Černého lesa"
              required
            />
          </label>
          <label className={s.field}>
            <span className={s.fieldLabel}>Krátce o postavě (pro PJ)</span>
            <textarea
              className={s.textarea}
              value={charNote}
              onChange={(e) => setCharNote(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Koncept, zaměření, čím chce být…"
            />
          </label>
          <div className={s.actions}>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isPending}
              disabled={!charName.trim()}
            >
              Odeslat přihlášku
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setCharMode(false)}
            >
              Zpět
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
