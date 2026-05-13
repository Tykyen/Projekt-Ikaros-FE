import type { ReactNode } from 'react';
import s from './SectionHeader.module.css';

interface SectionHeaderProps {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function SectionHeader({ title, icon, action }: SectionHeaderProps) {
  return (
    <>
      <h3 className={s.title}>
        {icon}
        <span>{title}</span>
      </h3>
      {action && <div className={s.action}>{action}</div>}
    </>
  );
}
