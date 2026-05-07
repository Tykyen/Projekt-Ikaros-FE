import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import s from './AuthLayout.module.css';
import { themeAtom } from '../../../themes/state';
import { getTheme } from '../../../themes/registry';

interface AuthLayoutProps { children?: ReactNode; }

export function AuthLayout({ children }: AuthLayoutProps) {
  const themeId = useAtomValue(themeAtom);
  const theme = getTheme(themeId);
  const bgStyle = theme.background
    ? { backgroundImage: `url(${theme.background})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' as const }
    : undefined;

  return (
    <div className={s.shell} data-theme={themeId} style={bgStyle}>
      <div className={s.card}>
        {children ?? <Outlet />}
      </div>
    </div>
  );
}
