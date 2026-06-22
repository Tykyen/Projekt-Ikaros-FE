import { useAtomValue, useSetAtom } from 'jotai';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Compass } from 'lucide-react';
import { IkarosCard, Button } from '@/shared/ui';
import {
  isAuthenticatedAtom,
  registerModalOpenAtom,
} from '@/shared/store/authStore';
import s from './WelcomeSection.module.css';

// Uvítací karta úvodní stránky. Zobrazuje se VŠEM (anon i přihlášeným) —
// generický pozdrav. Spec 15.7 — anonimovi navíc dvojice CTA tlačítek
// (registrace + prozkoumat veřejné světy); přihlášený je nevidí.
export function WelcomeSection() {
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const setRegisterOpen = useSetAtom(registerModalOpenAtom);
  const navigate = useNavigate();
  return (
    <IkarosCard
      variant="welcome"
      medallion={<div className={s.medallion} data-andel-medallion aria-hidden="true" />}
    >
      <h2 className={s.welcomeTitle}>
        Vítej v <span className={s.titleAccent}>Projektu Ikaros.</span>
      </h2>

      <p className={s.paragraph}>
        Projekt Ikaros je místo pro všechny, které baví RPG světy, společné příběhy
        a tvorba vlastních dobrodružství. Vytvoř si vlastní svět, hraj jej se svými
        přáteli a využij nástroje, které ti pomohou ulehčit hru i správu jeho obsahu.
      </p>

      <p className={s.paragraph}>
        Zároveň je to prostor pro setkávání lidí podobného smýšlení, kteří chtějí sdílet
        své nápady, inspirovat se navzájem a objevovat nové světy i možnosti hraní.
      </p>

      {!isAuthenticated && (
        <div className={s.ctaRow}>
          <Button
            variant="primary"
            size="lg"
            onClick={() => setRegisterOpen(true)}
          >
            <Sparkles size={18} aria-hidden="true" />
            Vytvořit svět zdarma
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/ikaros/vesmiry')}
          >
            <Compass size={18} aria-hidden="true" />
            Prozkoumat světy
          </Button>
        </div>
      )}

      <p className={s.signature}>Příjemnou zábavu přeje administrátor.</p>
    </IkarosCard>
  );
}
