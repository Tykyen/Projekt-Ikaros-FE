import type { ReactNode } from 'react';
import s from '../HelpPage.module.css';

/** Číslovaný návod „jak na to" (1→N). Čísla v barevných kroužcích. */
export function StepList({ steps }: { steps: ReactNode[] }) {
  return (
    <ol className={s.stepList}>
      {steps.map((step, i) => (
        <li className={s.step} key={i}>
          <span className={s.stepNum} aria-hidden="true" />
          <div className={s.stepBody}>{step}</div>
        </li>
      ))}
    </ol>
  );
}
