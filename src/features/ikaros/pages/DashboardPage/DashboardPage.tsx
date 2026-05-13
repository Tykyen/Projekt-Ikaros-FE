import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  isAuthenticatedAtom,
  loginModalOpenAtom,
  registerModalOpenAtom,
  forgotPasswordModalOpenAtom,
} from '@/shared/store/authStore';
import { AnonWelcomeSection } from './sections/AnonWelcomeSection';
import { WorldsSection } from './sections/WorldsSection';
import { UpcomingEventsSection } from './sections/UpcomingEventsSection';
import { PlatformNewsSection } from './sections/PlatformNewsSection';
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
      {!isAuthenticated && <AnonWelcomeSection />}
      {isAuthenticated && <WorldsSection />}
      {isAuthenticated && <UpcomingEventsSection />}
      <PlatformNewsSection />
    </div>
  );
}
