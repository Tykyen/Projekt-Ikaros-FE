import { Fragment, type ReactNode } from 'react';
import s from '../HelpPage.module.css';

export type TermItem = { term: ReactNode; desc: ReactNode };

/** Dvousloupcová mřížka pojem → popis (výčty polí/parametrů). */
export function TermGrid({ items }: { items: TermItem[] }) {
  return (
    <dl className={s.termGrid}>
      {items.map((it, i) => (
        <Fragment key={i}>
          <dt className={s.termGridTerm}>{it.term}</dt>
          <dd className={s.termGridDesc}>{it.desc}</dd>
        </Fragment>
      ))}
    </dl>
  );
}
