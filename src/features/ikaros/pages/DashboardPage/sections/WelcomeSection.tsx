import { IkarosCard } from '@/shared/ui';
import s from './WelcomeSection.module.css';

// Uvítací karta úvodní stránky. Zobrazuje se VŠEM (anon i přihlášeným) —
// generický pozdrav. Personalizovaná varianta pro přihlášené = roadmap2 15.7.
export function WelcomeSection() {
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

      <p className={s.signature}>Příjemnou zábavu přeje administrátor.</p>
    </IkarosCard>
  );
}
