import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAtomValue, useSetAtom } from 'jotai';
import { Newspaper, Plus } from 'lucide-react';
import {
  isAuthenticatedAtom,
  loginModalOpenAtom,
  registerModalOpenAtom,
  forgotPasswordModalOpenAtom,
} from '@/shared/store/authStore';
import { IkarosCard } from '@/shared/ui';
import s from './DashboardPage.module.css';

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const setLoginModalOpen = useSetAtom(loginModalOpenAtom);
  const setRegisterModalOpen = useSetAtom(registerModalOpenAtom);
  const setForgotPasswordModalOpen = useSetAtom(forgotPasswordModalOpenAtom);

  useEffect(() => {
    if (isAuthenticated) return;
    const wantsLogin = searchParams.get('openLogin') === '1';
    const wantsRegister = searchParams.get('openRegister') === '1';
    const wantsForgot = searchParams.get('openForgotPassword') === '1';
    if (wantsLogin) setLoginModalOpen(true);
    else if (wantsRegister) setRegisterModalOpen(true);
    else if (wantsForgot) setForgotPasswordModalOpen(true);

    if (wantsLogin || wantsRegister || wantsForgot) {
      const next = new URLSearchParams(searchParams);
      next.delete('openLogin');
      next.delete('openRegister');
      next.delete('openForgotPassword');
      setSearchParams(next, { replace: true });
    }
  }, [
    searchParams,
    setSearchParams,
    isAuthenticated,
    setLoginModalOpen,
    setRegisterModalOpen,
    setForgotPasswordModalOpen,
  ]);

  return (
    <div className={s.page}>
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

        <p className={s.signature}>
          Příjemnou zábavu přeje administrátor.
        </p>
      </IkarosCard>

      <IkarosCard
        variant="news"
        header={
          <>
            <h3 className={s.novinkyTitle}>
              <Newspaper size={20} aria-hidden="true" />
              <span>Novinky</span>
            </h3>
            {isAuthenticated && (
              <button type="button" className={s.addBtn}>
                <Plus size={16} aria-hidden="true" />
                <span>Přidat novinku</span>
              </button>
            )}
          </>
        }
      >
        <p className={s.empty}>Zatím žádné novinky.</p>
      </IkarosCard>
    </div>
  );
}
